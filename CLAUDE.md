# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Database Commands
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema changes to database (development)
- `npm run db:migrate` - Create and run database migrations
- `npm run db:studio` - Open Prisma Studio for database exploration
- `npm run db:seed` - Seed database with sample data

### Build & Development
- `npm run dev` - Start Next.js development server on localhost:3000
- `npm run build` - Build production version
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Setup
Copy `.env..example` to `.env.local` and configure:
- `DATABASE_URL` - NeonDB PostgreSQL connection string
- `BETTER_AUTH_SECRET` - Auth encryption secret
- `GITHUB_CLIENT_ID`/`GITHUB_CLIENT_SECRET` - GitHub OAuth credentials
- `GITHUB_TOKEN` - GitHub API token for repo analysis
- `CRON_SECRET` - Security token for cron endpoints

## Architecture Overview

### Tech Stack
- **Framework**: Next.js 16+ with App Router
- **Database**: NeonDB (PostgreSQL) with Prisma ORM
- **Authentication**: Better Auth with GitHub OAuth
- **Styling**: Tailwind CSS v4 with brutal/neubrutalism design system
- **Typography**: JetBrains Mono monospace font

### Core Domain Models

**Listing** - Central entity for skills, MCP servers, and tools:
- Contains metadata (name, description, tags, categories)
- Tracks GitHub repo info, install commands, and stats
- Supports voting system and visibility controls
- Links to detailed Skill records for skill-type listings

**User** - Authentication and authorization:
- GitHub OAuth integration via Better Auth
- Role-based access (user/admin)
- Tracks votes and submissions

**Skill** - Detailed skill information:
- Stores SKILL.md instructions and file structure
- Has many SkillFile records for individual files
- Extracted trigger keywords for search

**Submission** - User-submitted content pending approval:
- Admin workflow for reviewing new listings
- Auto-generates install commands from repo URLs

### App Router Structure
- `/` - Homepage with hero, search, filters, and listing grid
- `/[author]/[slug]` - Individual listing detail pages
- `/submit` - Submission form for new listings
- `/admin` - Admin dashboard for managing submissions and skills
- `/api/*` - REST endpoints for listings, votes, submissions, GitHub sync

### Key Components
- `ListingGrid` - Main grid display with search/filter integration
- `SkillCard` - Individual listing cards with voting
- `InstallCommand` - Copy-to-clipboard install commands
- `SubmissionForm` - Multi-step submission workflow
- `AdminDashboard` - Admin interface for content management

### Authentication Flow
Uses Better Auth with GitHub OAuth. Session management includes:
- 7-day session expiration with 1-day update intervals
- Cookie caching for performance
- User profile syncing from GitHub (username, avatar)

### Database Patterns
- Uses CUID2 for primary keys
- Soft deletes via `isVisible` flags
- JSON fields for flexible data (files, agent compatibility)
- Prisma schema includes comprehensive relationships and indexes

### API Design
RESTful endpoints under `/api/`:
- GET `/api/listings` - Paginated listings with search/filter
- GET `/api/listings/[author]/[slug]` - Single listing detail with files and user vote
- POST `/api/votes` - Upvote/downvote listings
- POST `/api/submissions` - Submit new listings
- GET `/api/submissions/me` - Current user's submissions
- Admin endpoints under `/api/admin/*` for content management
- GET/POST `/api/sync-github` - GitHub star sync (GET is called by Vercel Cron)

### Listing Identity Convention (author/slug)
**The `authorHandle` and `slug` are always derived from the GitHub repo URL — never from the submitting user's session.**

- `authorHandle` = repo owner from `repoUrl` (e.g. `github.com/anthropic/pdf` → `anthropic`)
- `slug` = repo name from `repoUrl` (e.g. `github.com/anthropic/pdf` → `pdf`)
- Resulting URL: `/anthropic/pdf`

This applies at every layer:
1. **Submission form** (`components/submission-form.tsx`) — `authorHandle` is read-only, auto-extracted from `repoUrl` on input
2. **Submission API** (`app/api/submissions/route.ts`) — always overrides `authorHandle` with the repo owner extracted from `repoUrl` server-side
3. **Approval** (`app/api/admin/submissions/route.ts`) — extracts `repoOwner`/`repoName` from `submission.repoUrl` to set the listing's `authorHandle` and `slug`

The submitter's GitHub username has no bearing on `authorHandle`.

### Install Command Convention
The install command is **`npx agentdropkit add authorHandle/skillName`** where:
- `authorHandle` = repo owner (extracted from `repoUrl`)
- `skillName` = the skill's display name from SKILL.md, slugified (lowercased, spaces → hyphens)

Example: repo `github.com/anthropic/claude-skills`, skill name `"PDF"` → `npx agentdropkit add anthropic/pdf`

**The command is generated from the skill's metadata name, not the raw repo name.** It only appears in the submission form after a skill has been selected from the detected skills list — never on URL entry alone.

Generated by `generateInstallCommand` in `lib/install-command.ts`. Priority for identifier: `skillName` → `slug` → `repoUrl` → fallback.

### Skill File Pipeline
Skills can contain many files (SKILL.md, scripts, configs, etc.). File contents are **never stored in the Submission table**. The pipeline is split into two phases:

**Phase 1 — Submission time (lean, 2 GitHub API calls):**
- `getRepoCommitSha` — pins the exact commit SHA being submitted
- `fetchSkillMd` — fetches only SKILL.md to validate it exists and extract metadata
- `Submission.parsedSkillData` stores a `SkillSubmissionRef` (< 300 bytes): `{ commitSha, skillPath, metadata }`
- No file contents in the database; the Submission row stays tiny regardless of skill complexity

**Phase 2 — Approval time (full fetch, outside the transaction):**
- `collectSkillFiles` (from `lib/github.ts`) fetches all files using the stored `commitSha` as the Git ref
- The commit SHA ensures the approved version is deterministic even if the repo changed after submission
- `SkillParser.parseSkill` processes the files into structured records
- `Skill` + `SkillFile` records are created inside the DB transaction (DB-only work, no network calls in the transaction)
- Falls back gracefully if the GitHub fetch fails — listing is still created, admin can re-queue to retry

All GitHub API helpers (`getRepoCommitSha`, `fetchSkillMd`, `collectSkillFiles`) live in **`lib/github.ts`** — never duplicated in route files.

### GitHub Stars Sync
Stars are never fetched live on page load. Instead they are kept up to date via a scheduled cron job:

- **Vercel Cron** (`vercel.json`) fires `GET /api/sync-github` every 6 hours (`0 */6 * * *`)
- The route is protected by `Authorization: Bearer ${CRON_SECRET}`
- Each run syncs up to 50 listings ordered by `updatedAt asc` (oldest-updated first), rotating through all listings over time
- GitHub star count is written back to `Listing.githubStars` in the database
- The POST method is also available for manual admin triggers

### TypeScript
- **No `any` types** — ever. Use Prisma-generated types (e.g. `import type { Submission } from "@prisma/client"`), define explicit interfaces, or use `unknown` with narrowing.
- Prefer `import type` for type-only imports.

### Data Fetching Standard
**TanStack Query (`@tanstack/react-query`) is the standard for all client-side data fetching.**

- `QueryProvider` wraps the app in `app/layout.tsx`
- Use `useQuery` for reads, `useMutation` for writes in all client components
- Never fetch data directly in client components with `useEffect` + `fetch`
- Server components may still query the DB directly (e.g. for auth-gated redirects)
- Default `staleTime` is 60 seconds; override per-query as needed
- Query keys follow `[resource, identifier?]` convention, e.g. `["submissions", "me"]`

**All query logic lives in `lib/queries/`** — one file per resource (e.g. `lib/queries/submissions.ts`).
Each file owns: the fetch function, the query key, and the exported `use*` hook.
Components only import and call the hook — no raw `fetch`, `useQuery`, or query keys in component files.