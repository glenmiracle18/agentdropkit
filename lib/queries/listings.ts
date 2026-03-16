"use client";

import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";

// ─── Grid / homepage listing card ─────────────────────────────────────────────

/**
 * Shape returned by GET /api/listings.
 * Dates are ISO strings (JSON serialization of Prisma Date fields).
 */
export interface ListingCardData {
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
  agentsInstalledOn: Record<string, unknown>;
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
  rankScore: number;
  skillDependencies: string[];
  version: string;
  firstSeenAt: string;
  createdAt: string;
  updatedAt: string;
  ejectedAt: string | null;
  /** Attached server-side when the request is authenticated */
  userVote?: "up" | "down" | null;
}

export interface ListingsParams {
  search?: string;
  category?: string;
  type?: string;
  sort?: string;
  official_only?: string;
  page?: number;
  limit?: number;
}

export interface ListingsResponse {
  listings: ListingCardData[];
  total: number;
  hasMore: boolean;
}

export const listingsQueryKey = (params: ListingsParams) =>
  ["listings", "grid", params] as const;

async function fetchListings(params: ListingsParams): Promise<ListingsResponse> {
  const qs = new URLSearchParams();
  if (params.search) qs.set("search", params.search);
  if (params.category && params.category !== "All") qs.set("category", params.category);
  if (params.type && params.type !== "All") qs.set("type", params.type);
  if (params.sort) qs.set("sort", params.sort);
  if (params.official_only) qs.set("official_only", params.official_only);
  const limit = params.limit ?? 12;
  qs.set("limit", String(limit));
  const offset = ((params.page ?? 1) - 1) * limit;
  if (offset > 0) qs.set("offset", String(offset));

  const res = await fetch(`/api/listings?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch listings");
  return res.json() as Promise<ListingsResponse>;
}

/**
 * TanStack Query hook for the homepage listing grid.
 *
 * Uses `keepPreviousData` so the old page stays visible (at reduced opacity)
 * while the next page is loading — no jarring blank-grid flash.
 */
export function useListings(params: ListingsParams) {
  return useQuery<ListingsResponse>({
    queryKey: listingsQueryKey(params),
    queryFn: () => fetchListings(params),
    staleTime: 60_000,
    placeholderData: keepPreviousData,
  });
}

// ─── Detail page ─────────────────────────────────────────────────────────────

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

// ─── Vote mutation ────────────────────────────────────────────────────────────

interface VotePayload {
  listingId: string;
  value: 1 | -1;
}

interface VoteResponse {
  voteCount: number;
  userVote: number | null;
}

async function postVote(payload: VotePayload): Promise<VoteResponse> {
  const res = await fetch("/api/votes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 401) throw new Error("UNAUTHENTICATED");
  if (!res.ok) throw new Error("Vote failed");
  return res.json() as Promise<VoteResponse>;
}

export function useVoteMutation(author: string, slug: string) {
  const queryClient = useQueryClient();
  const queryKey = listingDetailQueryKey(author, slug);

  return useMutation<
    VoteResponse,
    Error,
    VotePayload,
    { previous: ListingDetail | undefined }
  >({
    mutationFn: postVote,

    // Optimistic update — immediately reflect the vote in the UI
    onMutate: async (payload) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ListingDetail>(queryKey);

      if (previous) {
        const isTogglingOff = previous.userVote === payload.value;
        const newUserVote = isTogglingOff ? null : payload.value;

        let delta = 0;
        if (isTogglingOff) {
          delta = -payload.value; // remove vote: upvote removed = -1
        } else if (previous.userVote != null) {
          delta = payload.value - previous.userVote; // switch: -1→1 = +2
        } else {
          delta = payload.value; // fresh vote
        }

        queryClient.setQueryData<ListingDetail>(queryKey, {
          ...previous,
          upvotes: previous.upvotes + delta,
          voteCount: previous.voteCount + delta,
          userVote: newUserVote,
        });
      }

      return { previous };
    },

    // Roll back optimistic update on error
    onError: (_err, _payload, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },

    // Always sync with server after settle (success or error)
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    },
  });
}
