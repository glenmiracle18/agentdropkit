import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { slug } = await request.json();

    if (!slug) {
      return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
    }

    // Update install counts
    await db.listing.update({
      where: { slug },
      data: {
        weeklyInstalls: { increment: 1 },
        totalInstalls: { increment: 1 },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to track install:', error);
    return NextResponse.json({ error: 'Failed to track install' }, { status: 500 });
  }
}