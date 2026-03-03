import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where clause
    const whereClause: any = {
      isVisible: true,
      isEjected: false,
    };

    if (query) {
      whereClause.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { longDescription: { contains: query, mode: 'insensitive' } },
        { authorHandle: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    if (type) {
      whereClause.type = type;
    }

    const [listings, total] = await Promise.all([
      db.listing.findMany({
        where: whereClause,
        select: {
          authorHandle: true,
          slug: true,
          name: true,
          description: true,
          category: true,
          type: true,
          tags: true,
          version: true,
          totalInstalls: true,
          voteCount: true,
          githubStars: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: [
          { totalInstalls: 'desc' },
          { voteCount: 'desc' },
          { createdAt: 'desc' }
        ],
        take: limit,
        skip: offset,
      }),
      db.listing.count({ where: whereClause })
    ]);

    const results = listings.map(listing => ({
      id: `${listing.authorHandle}_${listing.slug}`,
      author: listing.authorHandle,
      slug: listing.slug,
      name: listing.name,
      description: listing.description,
      category: listing.category,
      type: listing.type,
      tags: listing.tags || [],
      version: listing.version || "1.0.0",
      install_count: listing.totalInstalls,
      vote_count: listing.voteCount,
      github_stars: listing.githubStars,
      created_at: listing.createdAt,
      updated_at: listing.updatedAt,
    }));

    return NextResponse.json({
      results,
      pagination: {
        total,
        limit,
        offset,
        has_more: total > offset + limit
      }
    });

  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}