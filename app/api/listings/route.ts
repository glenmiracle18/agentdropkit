import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import type { Prisma } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const category = searchParams.get('category');
    const type = searchParams.get('type');
    const sort = searchParams.get('sort') || 'ranked';
    const officialOnly = searchParams.get('official_only') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build where conditions
    const where: Prisma.ListingWhereInput = {};
    // Always hide ejected/invisible listings from the public API
    const conditions: Prisma.ListingWhereInput[] = [
      { isVisible: true, isEjected: false },
    ];

    // Apply filters
    if (search) {
      conditions.push({
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
          { tags: { has: search.toLowerCase() } },
        ],
      });
    }

    if (category && category !== 'All') {
      conditions.push({
        category: category.toLowerCase().replace(' ', '-'),
      });
    }

    if (type && type !== 'All') {
      const typeMap: Record<string, string> = {
        'Skills': 'skill',
        'MCPs': 'mcp', 
        'Tools': 'tool'
      };
      const mappedType = typeMap[type];
      if (mappedType) {
        conditions.push({
          type: mappedType as Prisma.EnumListingTypeFilter["equals"],
        });
      }
    }

    if (officialOnly) {
      conditions.push({
        isOfficial: true,
      });
    }

    if (conditions.length > 0) {
      where.AND = conditions;
    }

    // Apply sorting
    let orderBy: Prisma.ListingOrderByWithRelationInput[] = [];
    switch (sort) {
      case 'stars':
        orderBy = [{ githubStars: 'desc' }];
        break;
      case 'installs':
        orderBy = [{ totalInstalls: 'desc' }];
        break;
      case 'newest':
        orderBy = [{ createdAt: 'desc' }];
        break;
      case 'votes':
        orderBy = [{ voteCount: 'desc' }];
        break;
      case 'trending':
        orderBy = [
          { weeklyInstalls: 'desc' },
          { totalInstalls: 'desc' },
          { voteCount: 'desc' }
        ];
        break;
      case 'ranked':
      default:
        orderBy = [{ rankScore: 'desc' }];
        break;
    }

    const [results, total] = await Promise.all([
      db.listing.findMany({
        where,
        orderBy,
        take: limit,
        skip: offset,
      }),
      db.listing.count({ where }),
    ]);

    return NextResponse.json({
      listings: results,
      total,
      hasMore: offset + results.length < total
    });
  } catch (error) {
    console.error('Failed to fetch listings:', error);
    return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 });
  }
}