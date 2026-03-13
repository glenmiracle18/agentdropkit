import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { SkillParser, type ParsedSkillSnapshot } from "@/lib/skill-parser";
import { getRepoCommitSha, fetchSkillMd } from "@/lib/github";
import { generateInstallCommand } from "@/lib/install-command";

// ---------------------------------------------------------------------------
// URL helpers
// ---------------------------------------------------------------------------

/**
 * Strictly parse a GitHub HTTPS URL.
 * Returns null for anything that isn't exactly https://github.com/<owner>/<repo>.
 * Prevents SSRF via subdomain spoofing (github.com.evil.com) or other schemes.
 */
function parseGitHubUrl(
  rawUrl: string,
): { owner: string; repo: string; normalized: string } | null {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "https:" || url.hostname !== "github.com") return null;

  const parts = url.pathname.replace(/^\//, "").split("/");
  const owner = parts[0];
  const repoRaw = parts[1];
  if (!owner || !repoRaw) return null;

  const repo = repoRaw.replace(/\.git$/, "");
  // Only allow characters GitHub permits in owner/repo names
  const validSegment = /^[a-zA-Z0-9_.-]+$/;
  if (!validSegment.test(owner) || !validSegment.test(repo)) return null;

  return {
    owner,
    repo,
    // Canonical form — used for the duplicate check so variants like
    // ".git" suffix or trailing slashes don't create duplicate submissions.
    normalized: `https://github.com/${owner}/${repo}`,
  };
}

/** Validate a repo-relative path: no ".." segments, safe characters only. */
const SAFE_PATH_RE = /^[a-zA-Z0-9/_.-]*$/;
function isSafePath(p: string): boolean {
  return SAFE_PATH_RE.test(p) && !p.includes("..");
}

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const submissionSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(1000, "Description must be less than 1000 characters"),
  longDescription: z
    .string()
    .min(10, "Long description is required")
    .max(10_000, "Long description must be less than 10,000 characters"),
  type: z.enum(["skill", "mcp", "tool"]),
  category: z.string().min(1, "Category is required"),
  repoUrl: z.string().url("Must be a valid URL"),
  // L-2: repoPath validated below after parsing
  repoPath: z.string().optional(),
  tags: z
    .array(z.string().max(50))
    .max(20, "Too many tags")
    .default([]),
  authorHandle: z.string().optional().default(""),
  compatibleAgents: z
    .array(z.string())
    .min(1, "At least one compatible agent is required"),
  triggerWords: z
    .array(z.string().max(100))
    .max(30, "Too many trigger phrases")
    .default([]),
  isOpenSource: z.boolean().default(true),
  license: z.string().min(1, "License is required"),
  documentation: z
    .string()
    .url("Must be a valid URL")
    .optional()
    .or(z.literal("")),
  overview: z.string().optional(),
  selectedSkillPath: z.string().optional(),
});

// ---------------------------------------------------------------------------
// POST /api/submissions
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validatedData = submissionSchema.parse(body);

    // C-3: Strictly validate that repoUrl is exactly https://github.com/<owner>/<repo>
    const repoUrlParsed = parseGitHubUrl(validatedData.repoUrl);
    if (!repoUrlParsed) {
      return NextResponse.json(
        {
          error:
            "Repository URL must be a valid public GitHub URL (https://github.com/owner/repo)",
        },
        { status: 400 },
      );
    }
    const { owner, repo: repoName, normalized: normalizedRepoUrl } = repoUrlParsed;

    // L-2: Validate repoPath against path traversal
    if (validatedData.repoPath && !isSafePath(validatedData.repoPath)) {
      return NextResponse.json(
        { error: "Invalid repository path" },
        { status: 400 },
      );
    }
    if (
      validatedData.selectedSkillPath &&
      validatedData.selectedSkillPath !== "root" &&
      !isSafePath(validatedData.selectedSkillPath)
    ) {
      return NextResponse.json(
        { error: "Invalid skill path" },
        { status: 400 },
      );
    }

    // authorHandle is always the repo owner — never the submitter's account
    const authorHandle = owner;

    // Generate install command
    const installCommand = generateInstallCommand({
      repoUrl: normalizedRepoUrl,
      authorHandle,
      skillName: validatedData.name,
    });

    // M-2: Use normalized URL for the duplicate check so ".git" suffix variants
    // and other equivalent forms are treated as the same submission.
    const existingSubmission = await db.submission.findFirst({
      where: {
        repoUrl: normalizedRepoUrl,
        repoPath: validatedData.repoPath ?? null,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        {
          error:
            "A submission with this repository URL and path already exists",
        },
        { status: 409 },
      );
    }

    // Build a lean SkillSubmissionRef for skill-type submissions.
    //
    // We only make two GitHub API calls:
    //   1. getRepoCommitSha — pins the exact commit being submitted
    //   2. fetchSkillMd    — validates SKILL.md exists + extracts metadata
    //
    // NO file contents are stored here. The full file tree is fetched from
    // GitHub at approval time (using the stored commitSha) and written into
    // SkillFile records. This keeps Submission rows small regardless of how
    // many scripts/files a skill contains.
    let parsedSkillData: ParsedSkillSnapshot | null = null;
    let skillDataWarning: string | null = null;

    if (validatedData.type === "skill") {
      const skillPath =
        !validatedData.selectedSkillPath ||
        validatedData.selectedSkillPath === "root"
          ? ""
          : validatedData.selectedSkillPath;

      try {
        // Run both calls concurrently — independent of each other
        const [commitSha, skillMdContent] = await Promise.all([
          getRepoCommitSha(owner, repoName),
          fetchSkillMd(owner, repoName, skillPath),
        ]);

        if (skillMdContent) {
          const { metadata } = SkillParser.parseSkillMarkdown(skillMdContent);
          const triggerKeywords = SkillParser.extractTriggerKeywords(
            metadata.description,
          );

          parsedSkillData = {
            commitSha: commitSha ?? "",
            skillPath,
            metadata: {
              name: String(metadata.name),
              description: String(metadata.description),
              triggerKeywords,
            },
          };
        } else {
          skillDataWarning =
            "No SKILL.md found at the selected path — skill files will not appear after approval.";
        }
      } catch (err) {
        console.warn("Failed to validate SKILL.md during submission:", err);
        skillDataWarning =
          "Could not reach GitHub to validate SKILL.md. Files will be fetched at approval time.";
      }
    }

    const submission = await db.submission.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        longDescription: validatedData.longDescription,
        type: validatedData.type,
        category: validatedData.category,
        repoUrl: normalizedRepoUrl,
        repoPath: validatedData.repoPath ?? null,
        installCommand,
        tags: validatedData.tags,
        authorHandle,
        compatibleAgents: validatedData.compatibleAgents,
        triggerWords: validatedData.triggerWords,
        isOpenSource: validatedData.isOpenSource,
        license: validatedData.license,
        documentation: validatedData.documentation ?? null,
        overview: validatedData.overview ?? null,
        status: "pending",
        userId: session.user.id,
        parsedSkillData:
          (parsedSkillData as unknown as Prisma.InputJsonValue) ??
          Prisma.DbNull,
      },
    });

    return NextResponse.json(
      {
        id: submission.id,
        message: "Submission created successfully",
        ...(skillDataWarning ? { skillDataWarning } : {}),
      },
      { status: 201 },
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.issues },
        { status: 400 },
      );
    }

    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
