import { Suspense } from "react";
import HeroSection from "@/components/hero-section";
import HeroSearch from "@/components/hero-search";
import SearchFilters from "@/components/search-filters";
import ListingGrid from "@/components/listing-grid";
import { SearchResultsArea } from "@/components/search-results-area";

export default function Home() {
  return (
    <main className="min-h-screen bg-bg-base pb-20">
      {/* Orange block encompassing hero and search bar */}
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
        {/* SearchFilters reads useSearchParams internally */}
        <Suspense
          fallback={
            <div className="h-8 bg-border/20 animate-pulse rounded w-full" />
          }
        >
          <SearchFilters />
        </Suspense>

        {/* ListingGrid is a TanStack Query client component — owns its own
            loading state via keepPreviousData + isFetching opacity fade.
            The Suspense boundary is required because the component calls
            useSearchParams() which needs a client boundary in App Router. */}
        <SearchResultsArea>
          <Suspense>
            <ListingGrid />
          </Suspense>
        </SearchResultsArea>
      </div>
    </main>
  );
}
