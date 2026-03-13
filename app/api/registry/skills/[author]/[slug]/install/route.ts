import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ author: string; slug: string }> }
) {
  try {
    const { author, slug } = await params;
    const body = await request.json();
    
    // Validate request body
    const { cli_version, installation_mode, user_agent } = body;
    
    if (!cli_version || !installation_mode) {
      return NextResponse.json(
        { error: 'Missing required fields: cli_version, installation_mode' },
        { status: 400 }
      );
    }

    // Primary lookup: by exact slug (repo name)
    let listing = await db.listing.findFirst({
      where: { authorHandle: author, slug: slug, isVisible: true, isEjected: false },
    });

    // Fallback: install command uses slugified skill name, not repo slug
    if (!listing) {
      const candidates = await db.listing.findMany({
        where: { authorHandle: author, isVisible: true, isEjected: false },
      });
      listing = candidates.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, '-') === slug
      ) ?? null;
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Increment install counters
    await db.listing.update({
      where: { id: listing.id },
      data: {
        totalInstalls: { increment: 1 },
        weeklyInstalls: { increment: 1 }
      }
    });

    // Track installation (you might want to create a separate InstallEvent table)
    // For now, we'll just update the counters and return success
    
    return NextResponse.json({
      success: true,
      install_count: listing.totalInstalls + 1,
      message: `Successfully tracked installation of ${author}/${slug}`
    });

  } catch (error) {
    console.error('Install tracking error:', error);
    return NextResponse.json(
      { error: 'Failed to track installation' },
      { status: 500 }
    );
  }
}