"use client";

import { useSearchParams } from "next/navigation";
import SkillCard from "./skill-card";
import SkeletonCard from "./skeleton-card";
import PaginationControls from "./pagination-controls";
import { useListings } from "@/lib/queries/listings";

const PAGE_SIZE = 12;

/** Build a URL string for a specific page while preserving all other params */
function pageUrl(base: URLSearchParams, page: number): string {
  const qs = new URLSearchParams(base.toString());
  if (page > 1) {
    qs.set("page", String(page));
  } else {
    qs.delete("page");
  }
  const str = qs.toString();
  return str ? `/?${str}` : "/";
}

/** Page-number list (current ±2, clamped, with "…" gaps) */
function buildPageNumbers(currentPage: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
  const pages: (number | "…")[] = [1];
  const left = Math.max(2, currentPage - 2);
  const right = Math.min(totalPages - 1, currentPage + 2);
  if (left > 2) pages.push("…");
  for (let i = left; i <= right; i++) pages.push(i);
  if (right < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

const SKELETON_GRID = (
  <div className="space-y-6">
    <div className="h-4 bg-border rounded w-32 animate-pulse" />
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: PAGE_SIZE }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  </div>
);

export default function ListingGrid() {
  const searchParams = useSearchParams();

  const search = searchParams.get("search") ?? undefined;
  const category = searchParams.get("category") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const sort = searchParams.get("sort") ?? "ranked";
  const official_only = searchParams.get("official_only") ?? undefined;
  const currentPage = Math.max(1, parseInt(searchParams.get("page") || "1", 10));

  const { data, isLoading, isFetching } = useListings({
    search,
    category,
    type,
    sort,
    official_only,
    page: currentPage,
    limit: PAGE_SIZE,
  });

  // First load — no data yet, show full skeleton
  if (isLoading) return SKELETON_GRID;

  const listings = data?.listings ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageNumbers = buildPageNumbers(currentPage, totalPages);
  const hasPrev = currentPage > 1;
  const hasNext = currentPage < totalPages;
  const qs = new URLSearchParams(searchParams.toString());

  return (
    // Dim grid slightly while fetching a new page / new filter so the user
    // sees immediate feedback without a blank flash (keepPreviousData keeps
    // the old rows visible during the transition).
    <div
      className="space-y-6 transition-opacity duration-200"
      style={{ opacity: isFetching ? 0.55 : 1 }}
    >
      {/* Results count */}
      <div className="flex items-center justify-between">
        <p className="text-text-muted font-bold tracking-widest uppercase text-xs">
          {total} {total === 1 ? "skill" : "skills"}
          {totalPages > 1 && (
            <span className="ml-2 text-text-muted/60">
              — page {currentPage} of {totalPages}
            </span>
          )}
        </p>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {listings.map((listing, index) => (
          <SkillCard key={listing.id} listing={listing} index={index} />
        ))}
      </div>

      {listings.length === 0 && !isFetching && (
        <div className="text-center py-16">
          <p className="text-text-primary font-bold text-lg">
            No skills found matching your criteria.
          </p>
          <p className="text-text-muted mt-2">
            Try adjusting your filters or search terms.
          </p>
        </div>
      )}

      {/* Pagination — only visible when there is more than one page */}
      {totalPages > 1 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageNumbers={pageNumbers}
          hasPrev={hasPrev}
          hasNext={hasNext}
          prevUrl={pageUrl(qs, currentPage - 1)}
          nextUrl={pageUrl(qs, currentPage + 1)}
          pageUrls={Object.fromEntries(
            pageNumbers
              .filter((p): p is number => p !== "…")
              .map((p) => [p, pageUrl(qs, p)])
          )}
        />
      )}
    </div>
  );
}
