"use client";

import { useQuery } from "@tanstack/react-query";

export interface SkillFileData {
  name: string;
  path: string;
  content: string;
  type: string;
  executable: boolean;
  size: number;
}

export interface ListingDetail {
  // Core Listing fields (JSON-serializable)
  id: string;
  slug: string;
  name: string;
  type: string;
  description: string;
  longDescription: string | null;
  authorHandle: string;
  repoUrl: string;
  repoPath: string | null;
  category: string;
  tags: string[];
  compatibleAgents: string[];
  triggerWords: string[];
  isOpenSource: boolean;
  license: string;
  documentation: string | null;
  isOfficial: boolean;
  isSafe: boolean;
  healthScore: number;
  githubStars: number;
  weeklyInstalls: number;
  totalInstalls: number;
  voteCount: number;
  binaryDependencies: string[];
  ejectedBy: string | null;
  framework: string | null;
  homepageUrl: string | null;
  installCommand: string | null;
  isEjected: boolean;
  isVisible: boolean;
  language: string | null;
  npmDependencies: string[];
  skillDependencies: string[];
  version: string;
  // Date fields serialized as ISO strings from API
  firstSeenAt: string;
  createdAt: string;
  updatedAt: string;
  ejectedAt: string | null;
  // Computed/enriched fields
  overview: string;
  triggerPhrases: string[];
  repository: string;
  upvotes: number;
  stars: number;
  installs: number;
  firstSeen: string;
  command: string;
  faq: unknown[];
  userVote: number | null;
  files: SkillFileData[];
}

export const listingDetailQueryKey = (author: string, slug: string) =>
  ["listings", "detail", author, slug] as const;

async function fetchListingDetail(
  author: string,
  slug: string,
): Promise<ListingDetail> {
  const res = await fetch(
    `/api/listings/${encodeURIComponent(author)}/${slug}`,
  );
  if (res.status === 404) throw new Error("NOT_FOUND");
  if (!res.ok) throw new Error("Failed to fetch listing");
  return res.json();
}

export function useListingDetail(author: string, slug: string) {
  return useQuery<ListingDetail>({
    queryKey: listingDetailQueryKey(author, slug),
    queryFn: () => fetchListingDetail(author, slug),
    staleTime: 60_000,
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "NOT_FOUND") return false;
      return failureCount < 3;
    },
  });
}
