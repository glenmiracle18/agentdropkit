import { Suspense } from "react";
import HeroSection from "@/components/hero-section";
import HeroSearch from "@/components/hero-search";
import SearchFilters from "@/components/search-filters";
import ListingGrid from "@/components/listing-grid";

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
  return (
    <main className="min-h-screen bg-bg-base pb-20">

      {/* Orange Block encompassing hero and search bar */}
      <div className="bg-accent py-12 md:py-20 px-4 md:px-8 border-b-2 border-border w-full">
        <div className="max-w-6xl mx-auto">
          <HeroSection />

          <Suspense fallback={<div className="h-16 md:h-20 w-full max-w-3xl bg-bg-card border-2 border-border"></div>}>
            <HeroSearch />
          </Suspense>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-8 px-6 pt-16">
        <Suspense fallback={<div>Loading filters...</div>}>
          <SearchFilters />
        </Suspense>

        <Suspense fallback={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="h-6 bg-border rounded w-32 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col p-5 sm:p-6 bg-bg-card border-2 border-border h-full animate-pulse">
                  <div className="flex justify-between items-start mb-4 sm:mb-5">
                    <div className="flex gap-3 sm:gap-4 items-start w-full">
                      <div className="min-w-0 flex-1">
                        <div className="h-6 bg-border rounded mb-2 w-3/4"></div>
                        <div className="h-4 bg-border rounded w-1/2"></div>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4 flex-1 space-y-2">
                    <div className="h-4 bg-border rounded w-full"></div>
                    <div className="h-4 bg-border rounded w-5/6"></div>
                    <div className="h-4 bg-border rounded w-4/6"></div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
                    <div className="h-6 bg-border rounded w-16"></div>
                    <div className="h-6 bg-border rounded w-20"></div>
                    <div className="h-6 bg-border rounded w-12"></div>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t-2 border-border">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-4 bg-border rounded w-8"></div>
                      <div className="h-4 bg-border rounded w-12"></div>
                      <div className="h-4 bg-border rounded w-10"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        }>
          <ListingGrid searchParams={searchParams} />
        </Suspense>
      </div>
    </main>
  );
}
