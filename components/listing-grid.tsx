import { db } from '@/lib/db';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import type { Prisma } from '@prisma/client';
import SkillCard from './skill-card';
import PaginationControls from './pagination-controls';

const PAGE_SIZE = 12;

interface ListingGridProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    type?: string;
    sort?: string;
    official_only?: string;
    page?: string;
  }>;
}

/** Build a URL string for a specific page, preserving all other search params */
function pageUrl(params: Record<string, string | undefined>, page: number): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v && k !== 'page') qs.set(k, v);
  }
  if (page > 1) qs.set('page', String(page));
  const str = qs.toString();
  return str ? `/?${str}` : '/';
}

export default async function ListingGrid({ searchParams }: ListingGridProps) {
  const params = await searchParams;
  const search = params.search;
  const category = params.category;
  const type = params.type;
  const sort = params.sort || 'trending';
  const officialOnly = params.official_only === 'true';
  const currentPage = Math.max(1, parseInt(params.page || '1', 10));
  const skip = (currentPage - 1) * PAGE_SIZE;

  // Build where conditions
  const where: Prisma.ListingWhereInput = {};
  const conditions: Prisma.ListingWhereInput[] = [];

  // Always hide ejected/invisible skills from public directory
  conditions.push({
    isVisible: true,
    isEjected: false,
  });

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
      type: typeMap[type] as Prisma.EnumListingTypeFilter['equals'],
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

  // Parallel fetch: results + total count
  const [results, total] = await Promise.all([
    db.listing.findMany({
      where,
      orderBy,
      take: PAGE_SIZE,
      skip,
    }),
    db.listing.count({ where }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

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

  // Build page numbers to show (current ±2, clamped, with ellipsis)
  function getPageNumbers(): (number | '…')[] {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages: (number | '…')[] = [1];
    const left = Math.max(2, currentPage - 2);
    const right = Math.min(totalPages - 1, currentPage + 2);
    if (left > 2) pages.push('…');
    for (let i = left; i <= right; i++) pages.push(i);
    if (right < totalPages - 1) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  const pageNumbers = getPageNumbers();
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;

  return (
    <div className="space-y-6">
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-text-muted font-bold tracking-widest uppercase text-xs">
          {total} {total === 1 ? 'skill' : 'skills'}
          {totalPages > 1 && (
            <span className="ml-2 text-text-muted/60">
              — page {currentPage} of {totalPages}
            </span>
          )}
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

      {/* Pagination */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          hasPrev={hasPrev}
          hasNext={hasNext}
          prevUrl={pageUrl(params, currentPage - 1)}
          nextUrl={pageUrl(params, currentPage + 1)}
          pageUrls={Object.fromEntries(
            pageNumbers
              .filter((p): p is number => p !== '…')
              .map((p) => [p, pageUrl(params, p)])
          )}
        />
      )}
    </div>
  );
}
