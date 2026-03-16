"use client";

import { useRouter } from "next/navigation";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  pageNumbers: (number | "…")[];
  hasPrev: boolean;
  hasNext: boolean;
  prevUrl: string;
  nextUrl: string;
  pageUrls: Record<number, string>;
}

export default function PaginationControls({
  currentPage,
  totalPages,
  pageNumbers,
  hasPrev,
  hasNext,
  prevUrl,
  nextUrl,
  pageUrls,
}: PaginationControlsProps) {
  const router = useRouter();

  // TanStack Query (useListings) owns the loading/fetching state.
  // Updating the URL param is enough — the grid refetches automatically
  // and shows keepPreviousData + opacity fade during the transition.
  // scroll: false keeps the viewport from jumping to the top on each page.
  function navigate(url: string) {
    router.push(url, { scroll: false });
  }

  return (
    <div className="flex items-center justify-center gap-1 pt-4 font-mono text-xs font-bold uppercase tracking-widest select-none">
      {/* Prev */}
      {hasPrev ? (
        <button
          onClick={() => navigate(prevUrl)}
          className="px-3 py-2 border-2 border-border text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
        >
          ← Prev
        </button>
      ) : (
        <span className="px-3 py-2 border-2 border-border text-text-muted opacity-30 cursor-not-allowed">
          ← Prev
        </span>
      )}

      {/* Page numbers */}
      {pageNumbers.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-2 py-2 text-text-muted">
            …
          </span>
        ) : p === currentPage ? (
          <span
            key={p}
            className="px-3 py-2 border-2 border-text-primary bg-text-primary text-bg-base"
          >
            {p}
          </span>
        ) : (
          <button
            key={p}
            onClick={() => navigate(pageUrls[p])}
            className="px-3 py-2 border-2 border-border text-text-muted hover:text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
          >
            {p}
          </button>
        )
      )}

      {/* Next */}
      {hasNext ? (
        <button
          onClick={() => navigate(nextUrl)}
          className="px-3 py-2 border-2 border-border text-text-primary hover:bg-bg-card transition-colors cursor-pointer"
        >
          Next →
        </button>
      ) : (
        <span className="px-3 py-2 border-2 border-border text-text-muted opacity-30 cursor-not-allowed">
          Next →
        </span>
      )}
    </div>
  );
}
