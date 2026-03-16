"use client";

import { useSearchState } from "./search-state-provider";
import SkeletonCard from "./skeleton-card";

export function SearchResultsArea({ children }: { children: React.ReactNode }) {
  const { isPending } = useSearchState();

  if (isPending) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-border rounded w-32 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 12 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
