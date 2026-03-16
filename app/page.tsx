import { Suspense } from "react";
import HeroSection from "@/components/hero-section";
import HeroSearch from "@/components/hero-search";
import SearchFilters from "@/components/search-filters";
import ListingGrid from "@/components/listing-grid";
import { SearchStateProvider } from "@/components/search-state-provider";
import { SearchResultsArea } from "@/components/search-results-area";
import SkeletonCard from "@/components/skeleton-card";

interface HomeProps {
  searchParams: Promise<{
    search?: string;
    category?: string;
    type?: string;
    sort?: string;
    official_only?: string;
  }>;
}

export default function Home({ searchParams }: HomeProps) {
  const skeletonFallback = (
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

  return (
    <SearchStateProvider>
      <main className="min-h-screen bg-bg-base pb-20">
        {/* Orange Block encompassing hero and search bar */}
        <div className="bg-accent py-12 md:py-16 px-4 md:px-8 border-b-2 border-border w-full">
          <div className="max-w-6xl mx-auto">
            <HeroSection />

            <Suspense
              fallback={
                <div className="h-16 md:h-20 w-full max-w-3xl bg-bg-card border-2 border-border" />
              }
            >
              <HeroSearch />
            </Suspense>
          </div>
        </div>

        <div className="mx-auto max-w-7xl space-y-8 px-6 pt-10">
          <Suspense
            fallback={
              <div className="h-8 bg-border/20 animate-pulse rounded w-full" />
            }
          >
            <SearchFilters />
          </Suspense>

          <SearchResultsArea>
            <Suspense fallback={skeletonFallback}>
              <ListingGrid searchParams={searchParams} />
            </Suspense>
          </SearchResultsArea>
        </div>
      </main>
    </SearchStateProvider>
  );
}
