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
- POST `/api/votes` - Upvote/downvote listings
- POST `/api/submissions` - Submit new listings
- GET `/api/submissions/me` - Current user's submissions
- Admin endpoints under `/api/admin/*` for content management
- GitHub sync endpoints for automated data updates

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