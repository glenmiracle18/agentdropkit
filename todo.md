# Tech Debt / Pattern Violations

> Patterns enforced in this codebase (see CLAUDE.md):
> 1. No `any` types — use Prisma types, explicit interfaces, or `unknown`
> 2. All client-side data fetching via TanStack Query hooks from `lib/queries/`
> 3. No raw `fetch`, `useQuery`, or `useMutation` in component files
> 4. No `useEffect` + fetch for data loading

---

## 1. `any` Types

### Components
- [ ] `components/file-preview.tsx:8` — `files: any` (JSON from Prisma, needs proper type)
- [ ] `components/navigation.tsx:149` — `(session.user as any)?.role` (use Better Auth session type or extend it)
- [ ] `components/submission-form.tsx:84` — `useState<Record<string, any>>` for detected skills
- [ ] `components/submission-form.tsx:273` — `catch (error: any)` (use `unknown` + narrow)
- [ ] `components/submission-form.tsx:484` — `([skillPath, skill]: [string, any])` (type the skill shape)
- [ ] `components/skills-management.tsx:69` — `(listing: any)` in map (use Prisma `Listing` type)
- [ ] `app/[author]/[slug]/skill-detail-client.tsx:8` — `skill: any` prop interface
- [ ] `app/[author]/[slug]/skill-detail-client.tsx:189` — `(file: any)` in map

### API Routes
- [ ] `app/api/sync-github/route.ts:34` — `listing: any` and `Partial<any>` return type
- [ ] `app/api/sync-github/route.ts:77` — `(day: any)` in reduce
- [x] `app/api/admin/skills/route.ts:105` — `updateData: any` (fixed to `Prisma.ListingUpdateInput`)
- [ ] `app/api/listings/route.ts:59` — `as any` cast on enum map lookup
- [x] `app/api/analyze-repo/route.ts` — fully rewritten, all `any` removed
- [ ] `app/api/registry/search/route.ts:14` — `whereClause: any` (use `Prisma.ListingWhereInput`)
- [ ] `app/api/registry/skills/[author]/[slug]/route.ts:35` — `skillFiles: any[]`
- [ ] `app/api/registry/skills/[author]/[slug]/route.ts:39` — `(file: any)` in map
- [ ] `app/[author]/[slug]/page.tsx:113` — `skillFiles: any[]`
- [ ] `app/[author]/[slug]/page.tsx:117` — `(file: any)` in map

### Lib
- [ ] `lib/skill-parser.ts:7` — `[key: string]: any` in `SkillMetadata` interface
- [ ] `lib/skill-parser.ts:23` — `fileStructure: Record<string, any>`
- [ ] `lib/skill-parser.ts:121-122` — `Record<string, any>` in `buildFileStructure`

---

## 2. Raw `fetch` in Client Components (move to `lib/queries/`)

- [ ] `components/submission-form.tsx` — `fetch("/api/analyze-repo")` (POST) → `lib/queries/repo.ts`
- [ ] `components/submission-form.tsx` — `fetch("/api/submissions")` (POST mutation) → `lib/queries/submissions.ts`
- [x] `components/admin-dashboard.tsx` — `fetch("/api/admin/submissions")` → `lib/queries/admin.ts`
- [x] `components/skills-management.tsx` — `fetch("/api/admin/skills")` (GET + mutations) → `lib/queries/admin.ts`
- [ ] `hooks/use-votes.ts` — `fetch("/api/votes")` (POST mutation) → migrate to `useMutation` in `lib/queries/votes.ts`

---

## 3. `useEffect` + Fetch (replace with `useQuery`)

- [x] `components/skills-management.tsx:58-104` — `useEffect(() => { fetchSkills() }, [])` pattern, replace with `useQuery` hook from `lib/queries/admin.ts`
