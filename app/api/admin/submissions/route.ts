import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';
import { z } from 'zod';
import { Prisma } from '@prisma/client';
import { SkillParser, type ParsedSkillSnapshot } from '@/lib/skill-parser';
import { collectSkillFiles } from '@/lib/github';

// H-3: Validate the PATCH body at runtime with Zod — never trust a cast alone.
const patchBodySchema = z.object({
  submissionId: z.string().min(1),
  action: z.enum(['approve', 'reject', 'requeue']),
});

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === 'admin' ? session : null;
}

/**
 * Narrow an unknown JSON value (from Submission.parsedSkillData) to a
 * ParsedSkillSnapshot (SkillSubmissionRef). Checks the minimum required
 * shape; any malformed or null value returns false so approval degrades
 * gracefully without creating SkillFile records.
 */
function isSkillSubmissionRef(v: unknown): v is ParsedSkillSnapshot {
  if (!v || typeof v !== 'object') return false;
  const obj = v as Record<string, unknown>;
  return (
    typeof obj.commitSha === 'string' &&
    typeof obj.skillPath === 'string' &&
    typeof obj.metadata === 'object' &&
    obj.metadata !== null
  );
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const submissions = await db.submission.findMany({
    include: {
      user: { select: { name: true, email: true, githubUsername: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });

  return NextResponse.json(submissions);
}

export async function PATCH(request: NextRequest) {
  const session = await requireAdmin();
  if (!session) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let submissionId: string;
  let action: 'approve' | 'reject' | 'requeue';
  try {
    ({ submissionId, action } = patchBodySchema.parse(await request.json()));
  } catch {
    return NextResponse.json(
      { error: 'Invalid request body. Provide submissionId and action (approve|reject|requeue).' },
      { status: 400 },
    );
  }

  const submission = await db.submission.findUnique({
    where: { id: submissionId },
    include: {
      user: { select: { githubUsername: true, name: true, email: true } },
    },
  });

  if (!submission) {
    return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
  }

  // ── Approve ──────────────────────────────────────────────────────────────
  if (action === 'approve') {
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission has already been processed' },
        { status: 400 },
      );
    }

    // Derive author and slug from repo URL (owner/repo)
    const repoMatch = submission.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    const repoOwner = repoMatch ? repoMatch[1] : submission.authorHandle;
    const repoName = repoMatch ? repoMatch[2].replace(/\.git$/, '') : null;

    // Priority: skill metadata name → submission.name → repo name
    // This ensures the slug (and URL) reflects the skill's display name
    // (e.g. "DOCX" → "docx") rather than the raw GitHub repo name
    // (e.g. "claude-skills" → "skills-2").
    const skillMetaName = isSkillSubmissionRef(submission.parsedSkillData)
      ? (submission.parsedSkillData.metadata as { name?: string }).name ?? null
      : null;

    const rawSlugSource =
      skillMetaName ||
      submission.name ||
      repoName ||
      'skill';

    const baseSlug = rawSlugSource
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();

    let slug = baseSlug;
    let counter = 1;
    while (await db.listing.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // ── Pre-fetch skill files OUTSIDE the transaction ─────────────────────
    //
    // GitHub API calls are expensive and must not run inside a Prisma
    // interactive transaction (which has a short timeout). We fetch all
    // files here first, then pass the result into the transaction which
    // only does DB work.
    //
    // The stored commitSha pins the fetch to the exact version the admin
    // reviewed — even if the upstream repo has changed since submission.
    // Falls back to HEAD if commitSha is empty (old submissions).
    let parsedSkillForApproval: ReturnType<typeof SkillParser.parseSkill> | null = null;

    if (
      submission.type === 'skill' &&
      repoName &&
      isSkillSubmissionRef(submission.parsedSkillData)
    ) {
      const ref = submission.parsedSkillData;
      const pinRef = ref.commitSha || undefined; // empty string → fetch HEAD

      try {
        const skillFiles = await collectSkillFiles(
          repoOwner,
          repoName,
          ref.skillPath,
          pinRef,
        );

        const skillMdFile = skillFiles.find(
          (f) => f.fileName.toLowerCase() === 'skill.md',
        );

        if (skillMdFile) {
          parsedSkillForApproval = SkillParser.parseSkill(
            skillMdFile.fileContent,
            skillFiles,
          );
        } else {
          console.warn(
            `Approval ${submissionId}: SKILL.md not found at path "${ref.skillPath}" @ ${pinRef ?? 'HEAD'}`,
          );
        }
      } catch (err) {
        // Non-fatal — listing is still created; SkillFile records just won't
        // exist. Admin can re-queue to retry once the repo issue is resolved.
        console.error(
          `Approval ${submissionId}: failed to fetch skill files from GitHub:`,
          err,
        );
      }
    }

    // ── Transaction: DB-only work ─────────────────────────────────────────
    try {
      await db.$transaction(async (tx) => {
        // Optimistic lock: updateMany on (id + status='pending') ensures only
        // one concurrent approve request wins.
        const { count } = await tx.submission.updateMany({
          where: { id: submissionId, status: 'pending' },
          data: { status: 'approved' },
        });

        if (count === 0) {
          throw new Error('ALREADY_PROCESSED');
        }

        // Step 1: Create the Listing
        const listing = await tx.listing.create({
          data: {
            slug,
            name: submission.name,
            type: submission.type,
            description: submission.description,
            longDescription: submission.longDescription,
            authorHandle: repoOwner,
            repoUrl: submission.repoUrl,
            repoPath: submission.repoPath,
            installCommand: submission.installCommand,
            category: submission.category,
            tags: submission.tags,
            compatibleAgents: submission.compatibleAgents,
            triggerWords: submission.triggerWords,
            isOpenSource: submission.isOpenSource,
            license: submission.license,
            documentation: submission.documentation,
            overview: submission.overview,
            isOfficial: false,
            isSafe: false,
            healthScore: 50,
            githubStars: 0,
            weeklyInstalls: 0,
            totalInstalls: 0,
            voteCount: 0,
            files: '[]',
            agentsInstalledOn: '{}',
          },
        });

        // Step 2: Create Skill + SkillFile records if we have parsed data.
        // Degrades gracefully if the GitHub fetch above failed.
        if (parsedSkillForApproval) {
          const parsed = parsedSkillForApproval;

          const skill = await tx.skill.create({
            data: {
              listingId: listing.id,
              name: String(parsed.metadata.name),
              description: String(parsed.metadata.description),
              instructions: parsed.instructions,
              fileStructure: parsed.fileStructure as Prisma.InputJsonValue,
              triggerKeywords: parsed.triggerKeywords,
            },
          });

          if (parsed.files.length > 0) {
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
        }
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'ALREADY_PROCESSED') {
        return NextResponse.json(
          { error: 'Submission has already been processed' },
          { status: 400 },
        );
      }
      // L-3: Distinguish which unique constraint fired so the message is accurate.
      if (
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === 'P2002'
      ) {
        const target = Array.isArray(err.meta?.target)
          ? (err.meta.target as string[]).join(', ')
          : String(err.meta?.target ?? '');
        const message = target.includes('slug')
          ? 'A listing with this repository slug already exists.'
          : 'A skill with this name already exists in the directory.';
        return NextResponse.json({ error: message }, { status: 409 });
      }
      throw err;
    }

    return NextResponse.json({
      message: 'Submission approved and listing created',
      slug,
    });
  }

  // ── Reject ───────────────────────────────────────────────────────────────
  if (action === 'reject') {
    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission has already been processed' },
        { status: 400 },
      );
    }
    await db.submission.update({
      where: { id: submissionId },
      data: { status: 'rejected' },
    });
    return NextResponse.json({ message: 'Submission rejected' });
  }

  // ── Requeue ──────────────────────────────────────────────────────────────
  if (action === 'requeue') {
    // If previously approved, delete the associated listing.
    // Skill and SkillFile records cascade-delete from the Listing automatically.
    if (submission.status === 'approved') {
      await db.listing.deleteMany({
        where: {
          repoUrl: submission.repoUrl,
          repoPath: submission.repoPath ?? undefined,
        },
      });
    }
    await db.submission.update({
      where: { id: submissionId },
      data: { status: 'pending' },
    });
    return NextResponse.json({ message: 'Submission sent back to review' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
