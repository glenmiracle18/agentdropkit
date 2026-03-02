import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { Prisma } from '@prisma/client';
import SkillCard from './skill-card';

interface ListingGridProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    type?: string;
    sort?: string;
    official_only?: string;
  }>;
}

export default async function ListingGrid({ searchParams }: ListingGridProps) {
  const params = await searchParams;
  const search = params.search;
  const category = params.category;
  const type = params.type;
  const sort = params.sort || 'trending';
  const officialOnly = params.official_only === 'true';

  // Build where conditions
  const where: Prisma.ListingWhereInput = {};
  const conditions: Prisma.ListingWhereInput[] = [];

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
    conditions.push({
      type: typeMap[type] as any,
    });
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
    default:
      orderBy = [
        { weeklyInstalls: 'desc' },
        { totalInstalls: 'desc' },
        { voteCount: 'desc' }
      ];
      break;
  }

  const results = await db.listing.findMany({
    where,
    orderBy,
    take: 20,
  });

  // Get user session and their votes
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const userVotes = session?.user
    ? await db.vote.findMany({
      where: {
        userId: session.user.id,
        listingId: { in: results.map(r => r.id) },
      },
      select: { listingId: true, value: true },
    })
    : [];

  // Create a map of listing ID to user vote
  const userVoteMap = new Map(
    userVotes.map(vote => [vote.listingId, vote.value > 0 ? "up" : "down"])
  );

  // Attach user votes to listings
  const listingsWithVotes = results.map(listing => ({
    ...listing,
    userVote: userVoteMap.get(listing.id) as "up" | "down" | undefined,
  }));

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-text-muted font-bold tracking-widest uppercase">
          Showing {listingsWithVotes.length} {listingsWithVotes.length === 1 ? 'skill' : 'skills'}
        </p>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listingsWithVotes.map((listing, index) => (
          <SkillCard
            key={listing.id}
            listing={listing}
            index={index}
          />
        ))}
      </div>

      {listingsWithVotes.length === 0 && (
        <div className="text-center py-16">
          <p className="text-text-primary font-bold text-lg">No skills found matching your criteria.</p>
          <p className="text-text-muted mt-2">Try adjusting your filters or search terms.</p>
        </div>
      )}
    </div>
  );
}