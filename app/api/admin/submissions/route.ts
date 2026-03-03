import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function PATCH(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user has admin role
    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true }
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json(
        { error: 'Forbidden: Admin access required' },
        { status: 403 }
      );
    }

    // Parse request body
    const { submissionId, action } = await request.json();

    if (!submissionId || !action) {
      return NextResponse.json(
        { error: 'Missing submissionId or action' },
        { status: 400 }
      );
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be "approve" or "reject"' },
        { status: 400 }
      );
    }

    // Find the submission
    const submission = await db.submission.findUnique({
      where: { id: submissionId },
      include: {
        user: {
          select: { githubUsername: true, name: true, email: true }
        }
      }
    });

    if (!submission) {
      return NextResponse.json(
        { error: 'Submission not found' },
        { status: 404 }
      );
    }

    if (submission.status !== 'pending') {
      return NextResponse.json(
        { error: 'Submission has already been processed' },
        { status: 400 }
      );
    }

    if (action === 'approve') {
      // Create slug for the listing
      const baseSlug = submission.name.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();

      // Ensure slug is unique
      let slug = baseSlug;
      let counter = 1;
      while (await db.listing.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }

      // Create the listing from the submission
      await db.listing.create({
        data: {
          slug,
          name: submission.name,
          type: submission.type,
          description: submission.description,
          longDescription: submission.longDescription,
          authorHandle: submission.user.githubUsername || submission.user.name || submission.user.email.split('@')[0],
          repoUrl: submission.repoUrl,
          repoPath: submission.repoPath,
          category: submission.category,
          tags: submission.tags,
          compatibleAgents: submission.compatibleAgents,
          triggerWords: submission.triggerWords,
          isOpenSource: submission.isOpenSource,
          license: submission.license,
          documentation: submission.documentation,
          overview: submission.overview,
          isOfficial: false, // Submissions are never official
          isSafe: false, // Require manual safety review
          healthScore: 50, // Default health score
          githubStars: 0,
          weeklyInstalls: 0,
          totalInstalls: 0,
          voteCount: 0,
          files: "[]", // Will be populated later if needed
          agentsInstalledOn: "{}"
        }
      });

      // Update submission status
      await db.submission.update({
        where: { id: submissionId },
        data: { status: 'approved' }
      });

      return NextResponse.json({
        message: 'Submission approved and listing created successfully',
        slug
      });
    } else {
      // Reject the submission
      await db.submission.update({
        where: { id: submissionId },
        data: { status: 'rejected' }
      });

      return NextResponse.json({
        message: 'Submission rejected successfully'
      });
    }

  } catch (error) {
    console.error('Admin submission action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}