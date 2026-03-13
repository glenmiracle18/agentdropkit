# Skill File Pipeline

This document explains how AgentDropkit fetches, validates, and stores skill files during the submission and approval workflow. It covers the architecture decisions, data flow, database models, and the code responsible for each phase.

---

## Overview

A skill is not just a `SKILL.md` file. It can include scripts, configuration files, templates, and other supporting assets — anything required for Claude Code to execute the skill. Storing all of that content at submission time would be wasteful and dangerous (most submissions get rejected; rejected ones pay the full I/O cost for nothing, and the Submission table would bloat with potentially hundreds of KB per row).

The pipeline is deliberately split into **two phases** that each do the minimum work required at that moment.

```
User submits form
      │
      ▼
┌─────────────────────────────────────────┐
│  Phase 1 — Submission time              │
│  2 GitHub API calls (parallel)          │
│  • getRepoCommitSha  → pin version      │
│  • fetchSkillMd      → validate + meta  │
│                                         │
│  Stored in Submission.parsedSkillData:  │
│  { commitSha, skillPath, metadata }     │
│  ← ~ 300 bytes, no file contents →     │
└─────────────────┬───────────────────────┘
                  │  Submission sits in
                  │  "pending" queue
                  ▼
           Admin reviews
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Phase 2 — Approval time               │
│  collectSkillFiles (outside tx)         │
│  • Uses stored commitSha as Git ref     │
│  • Fetches every file in skill dir      │
│  • Parses into structured records       │
│                                         │
│  DB transaction (fast, no network):     │
│  • Create Listing                       │
│  • Create Skill                         │
│  • Create SkillFile × N                 │
└─────────────────────────────────────────┘
```

---

## Why Not Fetch Everything at Submission?

| Concern | Impact |
|---|---|
| **Payload size** | A skill with 20 files at 5 KB each = 100 KB JSON blob per Submission row |
| **Rejected submissions** | The majority of submissions are rejected. Paying the full GitHub API cost and storing all content for rejected work is wasteful. |
| **Transaction safety** | Network calls inside a Prisma interactive transaction risk hitting the timeout. File fetching must stay outside. |
| **Single source of truth** | `SkillFile` records are the authoritative store. Pre-storing content in a JSON blob creates a duplicate that must be cleaned up. |

---

## Phase 1 — Submission Time

**Route:** `POST /api/submissions`
**File:** `app/api/submissions/route.ts`

When a skill-type listing is submitted, the server makes exactly two GitHub API calls in parallel:

```typescript
const [commitSha, skillMdContent] = await Promise.all([
  getRepoCommitSha(owner, repo),
  fetchSkillMd(owner, repo, skillPath),
]);
```

### `getRepoCommitSha(owner, repo)`

Fetches the SHA of the most recent commit on the default branch. This is the version "pin" — it lets the approval phase fetch files at exactly the same version the admin reviewed, even if the upstream repo has been updated since.

```
GET /repos/{owner}/{repo}/commits?per_page=1
→ commits[0].sha  (40-char hex)
```

### `fetchSkillMd(owner, repo, skillPath, ref?)`

Fetches only `SKILL.md` at the skill's path within the repo. Used to:
- Confirm the file exists before accepting the submission
- Parse the YAML frontmatter (name, description) without asking the submitter to re-type it
- Extract trigger keywords from the description for search indexing

```
GET /repos/{owner}/{repo}/contents/{skillPath}/SKILL.md
→ base64-decoded text content
```

### What gets stored

The result is a `SkillSubmissionRef` — a tiny typed object stored in `Submission.parsedSkillData`:

```typescript
interface SkillSubmissionRef {
  commitSha: string;   // e.g. "a3f9c12d..."
  skillPath: string;   // e.g. "" (root) or "skills/pdf"
  metadata: {
    name: string;            // from SKILL.md frontmatter
    description: string;     // from SKILL.md frontmatter
    triggerKeywords: string[]; // auto-extracted from description
  };
}
```

**No file contents. No scripts. No configs.** The entire blob is typically under 300 bytes.

### Failure handling

Both GitHub calls are best-effort. If `SKILL.md` cannot be fetched (private repo, rate limit, bad URL), the submission still succeeds and the response includes a `skillDataWarning` field. The admin will see the warning and can re-queue after the issue is resolved.

---

## Phase 2 — Approval Time

**Route:** `PATCH /api/admin/submissions`
**File:** `app/api/admin/submissions/route.ts`

When an admin approves a submission, the full file fetch happens **before** the database transaction opens.

### Step 1: Fetch all files (outside the transaction)

```typescript
const skillFiles = await collectSkillFiles(
  repoOwner,
  repoName,
  ref.skillPath,
  ref.commitSha || undefined, // empty string → fall back to HEAD
);
```

`collectSkillFiles` recursively walks the skill directory on GitHub, fetching every file's content. The `commitSha` is passed as the `ref` parameter to each Octokit call, pinning the fetch to the exact version submitted.

For a skill with this structure:

```
skills/pdf/
├── SKILL.md
├── convert.py
├── requirements.txt
└── examples/
    └── sample.md
```

`collectSkillFiles` makes individual `GET /repos/.../contents/...` calls for each file, assembling an array of `SkillFile` objects with full content.

### Step 2: Parse into structured records

```typescript
const skillMdFile = skillFiles.find(
  (f) => f.fileName.toLowerCase() === 'skill.md',
);

if (skillMdFile) {
  parsedSkillForApproval = SkillParser.parseSkill(
    skillMdFile.fileContent,
    skillFiles,
  );
}
```

`SkillParser.parseSkill` returns a `ParsedSkill` with:
- `metadata` — name, description from frontmatter
- `instructions` — the body of `SKILL.md` (below frontmatter)
- `files` — all `SkillFile` objects with content, type, size, executability
- `fileStructure` — nested JSON map of the directory tree (no content, for display)
- `fileTree` — ASCII tree string array for rendering
- `triggerKeywords` — extracted from description for search

### Step 3: DB-only transaction

The transaction does no network work — only inserts:

```typescript
await db.$transaction(async (tx) => {
  // Optimistic lock: only one concurrent approval wins
  const { count } = await tx.submission.updateMany({
    where: { id: submissionId, status: 'pending' },
    data: { status: 'approved' },
  });
  if (count === 0) throw new Error('ALREADY_PROCESSED');

  // Create the public Listing
  const listing = await tx.listing.create({ data: { ... } });

  // Create Skill + SkillFile records (if GitHub fetch succeeded)
  if (parsedSkillForApproval) {
    const skill = await tx.skill.create({
      data: {
        listingId: listing.id,
        name: parsed.metadata.name,
        instructions: parsed.instructions,
        fileStructure: parsed.fileStructure,
        triggerKeywords: parsed.triggerKeywords,
      },
    });

    await tx.skillFile.createMany({
      data: parsed.files.map((f) => ({
        skillId: skill.id,
        filePath: f.filePath,
        fileName: f.fileName,
        fileContent: f.fileContent,
        fileType: f.fileType,
        isExecutable: f.isExecutable,
        fileSize: f.fileSize,
      })),
      skipDuplicates: true,
    });
  }
});
```

The `skipDuplicates: true` on `createMany` guards against the `@@unique([skillId, filePath])` constraint if approval is somehow retried.

### Failure handling at approval time

If the GitHub fetch fails (repo deleted, token expired, etc.):
- The Listing is still created and goes live
- No `Skill` or `SkillFile` records are created
- The admin can re-queue the submission (`action: "requeue"`) to retry — cascade-deleting the existing Listing automatically — then re-approve once the issue is fixed

---

## Database Models

```prisma
model Submission {
  id              String  @id
  // ... listing metadata fields ...
  parsedSkillData Json?   // SkillSubmissionRef — lean, no file content
}

model Skill {
  id              String      @id
  listingId       String      @unique
  name            String      @unique
  description     String
  instructions    String      // SKILL.md body text
  fileStructure   Json        // nested directory map (no content)
  triggerKeywords String[]
  files           SkillFile[]
  listing         Listing     @relation(onDelete: Cascade)
}

model SkillFile {
  id           String  @id
  skillId      String
  filePath     String  // relative path within skill dir
  fileName     String
  fileContent  String  // full text content
  fileType     String  // "markdown" | "script" | "resource" | "template"
  isExecutable Boolean
  fileSize     Int     // bytes
  skill        Skill   @relation(onDelete: Cascade)

  @@unique([skillId, filePath])
}
```

**Cascade chain:** `Listing → Skill → SkillFile[]`. Deleting a Listing removes everything downstream automatically.

---

## Shared GitHub Helpers

All GitHub API calls live in **`lib/github.ts`**. No route file constructs its own Octokit calls for skill file collection.

| Function | When used | Description |
|---|---|---|
| `getRepoCommitSha(owner, repo)` | Submission | Gets HEAD commit SHA for version pinning |
| `fetchSkillMd(owner, repo, path, ref?)` | Submission | Fetches SKILL.md content only |
| `collectSkillFiles(owner, repo, dir, ref?, cursor?)` | Approval | Recursively fetches all files in a skill directory |

All three accept an optional `ref` parameter (commit SHA) for pinned fetches. `collectSkillFiles` passes `ref` down to every recursive call so the entire tree is fetched at the same commit.

---

## File Type Classification

`SkillParser.determineFileType` assigns one of four types to each file:

| Type | Extensions |
|---|---|
| `markdown` | `.md` |
| `script` | `.py`, `.js`, `.ts`, `.sh`, `.bat`, `.ps1`, `.rb`, `.go`, `.java` |
| `template` | `.json`, `.yaml`, `.yml`, `.xml`, `.toml`, `.ini`, `.env`, `Dockerfile`, `Makefile`, `requirements.txt` |
| `resource` | everything else |

`isExecutable` is `true` for files with script extensions (`.py`, `.js`, `.ts`, `.sh`, `.bat`, `.ps1`, `.rb`, `.go`).

---

## Install Command Convention

The install command shown in the listing detail and generated in the submission form follows the pattern:

```
npx agentdropkit add authorHandle/skill-name
```

Where:
- `authorHandle` = GitHub repo owner (extracted from `repoUrl`, never the submitting user's username)
- `skill-name` = the skill's display name from `SKILL.md` frontmatter, slugified (lowercased, spaces → hyphens)

The command is generated by `generateInstallCommand` in `lib/install-command.ts`. **It only appears in the submission form after a skill has been selected from the detected skills list** — never immediately on URL entry.

Example:
```
Repo:    github.com/anthropic/claude-agent-tools
Skill:   "PDF Converter"  (from SKILL.md name field)
Command: npx agentdropkit add anthropic/pdf-converter
```

---

## Adding a Skill to a Repository

For a skill to be detected and processed correctly, the repository must contain a `SKILL.md` file with valid YAML frontmatter:

```markdown
---
name: pdf-converter
description: Converts documents to and from PDF format using native tooling.
---

## Instructions

When the user asks to convert a file to PDF...
```

**Requirements:**
- `name` — lowercase letters, numbers, and hyphens only; max 64 characters
- `description` — plain text; max 1024 characters
- Both fields are required; the parser throws if either is missing

Supporting files (scripts, configs, etc.) can live alongside `SKILL.md` in the same directory or in subdirectories. They are all fetched at approval time.

---

## Troubleshooting

### Skill files missing after approval
The GitHub fetch at approval time silently fails if:
- The repository has been deleted or made private since submission
- The `GITHUB_TOKEN` environment variable is missing or expired
- The stored `commitSha` no longer exists (force-pushed history rewrite)

**Fix:** Re-queue the submission (admin panel → Requeue), resolve the repo issue, then re-approve.

### SKILL.md warning on submission
If the submission response includes `skillDataWarning`, the validation fetch for `SKILL.md` failed. The submission is still accepted. Common causes:
- The GitHub token lacks read access to a private repo
- The selected skill path doesn't match the actual directory structure
- GitHub API rate limit hit

**Fix:** The admin sees the warning in the submission list. Re-queue after the cause is resolved.

### `parsedSkillData` is null on an old submission
Submissions created before `parsedSkillData` was added to the schema will have `null` in that column. The approval flow handles this gracefully — it skips the `Skill` / `SkillFile` creation block — so the listing is still created. Re-queue to re-run the full pipeline.
