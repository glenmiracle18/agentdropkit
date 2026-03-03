import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { headers } from 'next/headers';

export async function GET(request: NextRequest) {
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

    // Fetch all published skills/listings
    const skills = await db.listing.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        skill: {
          include: {
            files: true
          }
        }
      }
    });

    return NextResponse.json({ skills });

  } catch (error) {
    console.error('Admin skills fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

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
    const { skillId, action } = await request.json();

    if (!skillId || !action) {
      return NextResponse.json(
        { error: 'Missing skillId or action' },
        { status: 400 }
      );
    }

    // Find the skill/listing
    const listing = await db.listing.findUnique({
      where: { id: skillId }
    });

    if (!listing) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    let updateData: any = {};
    let message = '';

    switch (action) {
      case 'eject':
        // Hide the skill from public view instead of deleting
        updateData = { 
          isVisible: false, 
          isEjected: true, 
          ejectedAt: new Date(),
          ejectedBy: session.user.id
        };
        message = 'Skill ejected successfully';
        break;

      case 'restore':
        // Restore ejected skill to public view
        updateData = { 
          isVisible: true, 
          isEjected: false, 
          ejectedAt: null,
          ejectedBy: null
        };
        message = 'Skill restored successfully';
        break;

      case 'delete':
        // Permanently delete the listing and cascade will handle related records
        await db.listing.delete({
          where: { id: skillId }
        });
        message = 'Skill permanently deleted';
        break;

      case 'toggle-safe':
        updateData = { isSafe: !listing.isSafe };
        message = `Skill marked as ${listing.isSafe ? 'unsafe' : 'safe'}`;
        break;

      case 'toggle-official':
        updateData = { isOfficial: !listing.isOfficial };
        message = `Skill marked as ${listing.isOfficial ? 'unofficial' : 'official'}`;
        break;

      case 'update-health':
        const { healthScore } = await request.json();
        if (typeof healthScore !== 'number' || healthScore < 0 || healthScore > 100) {
          return NextResponse.json(
            { error: 'Invalid health score. Must be between 0 and 100.' },
            { status: 400 }
          );
        }
        updateData = { healthScore };
        message = `Health score updated to ${healthScore}`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Perform the update (unless it's delete which already deleted)
    if (action !== 'delete') {
      await db.listing.update({
        where: { id: skillId },
        data: updateData
      });
    }

    return NextResponse.json({ message });

  } catch (error) {
    console.error('Admin skill action error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}