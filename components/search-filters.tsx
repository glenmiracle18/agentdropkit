"use client";

import { useRouter, useSearchParams } from "next/navigation";

const categories = [
  "All",
  // Tech
  "Development",
  "Data Analysis",
  "DevOps",
  "Infrastructure",
  "Security",
  "Code Review",
  "Agents",
  "Automation",
  // Creative
  "Writing",
  "Design",
  "Content Creation",
  "Media & Video",
  // Business
  "Marketing",
  "Sales",
  "Finance",
  "Legal",
  "HR & Recruiting",
  "Project Management",
  "Customer Support",
  // Knowledge
  "Research",
  "Education",
  "Documentation",
  // Personal
  "Productivity",
  "Communication",
  "Health & Wellness",
  "Entertainment",
  // Catch-all
  "Other",
];

const sortOptions = [
  { value: "ranked", label: "Best Match" },
  { value: "trending", label: "Trending" },
  { value: "newest", label: "Newest" },
  { value: "votes", label: "Top Voted" },
  { value: "stars", label: "Most Stars" },
  { value: "installs", label: "Most Installs" },
];

export default function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentCategory = searchParams.get("category") || "All";
  const currentSort = searchParams.get("sort") || "ranked";

  const updateSearchParams = (key: string, value: string | null) => {
    const params = new URLSearchParams(searchParams);
    if (value && value !== "All" && value !== "") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="pt-8 sm:pt-12 space-y-6 sm:space-y-8">
      {/* Filter Row: Header style */}
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between border-b-2 border-border pb-4 gap-4 sm:gap-0">
        <h2 className="text-2xl sm:text-3xl font-bold font-mono text-text-primary tracking-tight">
          Top Skills
        </h2>

        {/* Categories / Sort Dropdown */}
        <div className="flex flex-wrap items-center gap-4 sm:gap-6 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-text-dim text-sm font-mono tracking-widest uppercase shrink-0">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            <span className="hidden sm:inline">Filter</span>
          </div>

          <div className="flex items-center gap-2 min-w-[120px] flex-1 sm:flex-none bg-bg-surface border-2 border-border px-2 py-1">
            <select
              value={currentCategory}
              onChange={(e) => updateSearchParams("category", e.target.value)}
              className="bg-transparent text-text-primary text-xs sm:text-sm font-mono tracking-widest uppercase cursor-pointer hover:text-accent transition-colors focus:outline-none appearance-none w-full"
            >
              {categories.map((category) => (
                <option key={category} value={category} className="bg-bg-base text-text-primary">
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 min-w-[120px] flex-1 sm:flex-none bg-bg-surface border-2 border-border px-2 py-1">
            <select
              value={currentSort}
              onChange={(e) => updateSearchParams("sort", e.target.value)}
              className="bg-transparent text-text-primary text-xs sm:text-sm font-mono tracking-widest uppercase cursor-pointer hover:text-accent transition-colors focus:outline-none appearance-none w-full"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value} className="bg-bg-base text-text-primary">
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}