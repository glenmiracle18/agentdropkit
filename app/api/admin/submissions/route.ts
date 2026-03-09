import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

async function requireAdmin() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) return null;
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  return user?.role === "admin" ? session : null;
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

  const { submissionId, action } = await request.json() as {
    submissionId: string;
    action: string;
  };

  if (!submissionId || !action) {
    return NextResponse.json({ error: 'Missing submissionId or action' }, { status: 400 });
  }

  if (!['approve', 'reject', 'requeue'].includes(action)) {
    return NextResponse.json(
      { error: 'Invalid action. Must be "approve", "reject", or "requeue"' },
      { status: 400 }
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
      return NextResponse.json({ error: 'Submission has already been processed' }, { status: 400 });
    }

    const baseSlug = submission.name
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

    // Use interactive transaction with optimistic lock: updateMany on (id + status='pending')
    // ensures only one concurrent request can win the race — if another request already
    // approved this submission, count will be 0 and we bail out before creating the listing.
    try {
      await db.$transaction(async (tx) => {
        const { count } = await tx.submission.updateMany({
          where: { id: submissionId, status: 'pending' },
          data: { status: 'approved' },
        });

        if (count === 0) {
          throw new Error('ALREADY_PROCESSED');
        }

        await tx.listing.create({
          data: {
            slug,
            name: submission.name,
            type: submission.type,
            description: submission.description,
            longDescription: submission.longDescription,
            authorHandle: submission.authorHandle,
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
      });
    } catch (err) {
      if (err instanceof Error && err.message === 'ALREADY_PROCESSED') {
        return NextResponse.json({ error: 'Submission has already been processed' }, { status: 400 });
      }
      throw err;
    }

    return NextResponse.json({ message: 'Submission approved and listing created', slug });
  }

  // ── Reject ───────────────────────────────────────────────────────────────
  if (action === 'reject') {
    if (submission.status !== 'pending') {
      return NextResponse.json({ error: 'Submission has already been processed' }, { status: 400 });
    }
    await db.submission.update({ where: { id: submissionId }, data: { status: 'rejected' } });
    return NextResponse.json({ message: 'Submission rejected' });
  }

  // ── Requeue ──────────────────────────────────────────────────────────────
  if (action === 'requeue') {
    // If previously approved, delete the associated listing first
    if (submission.status === 'approved') {
      await db.listing.deleteMany({
        where: {
          repoUrl: submission.repoUrl,
          repoPath: submission.repoPath ?? undefined,
        },
      });
    }
    await db.submission.update({ where: { id: submissionId }, data: { status: 'pending' } });
    return NextResponse.json({ message: 'Submission sent back to review' });
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}
