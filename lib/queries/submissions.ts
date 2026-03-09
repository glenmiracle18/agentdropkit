"use client";

import { useQuery } from "@tanstack/react-query";
import type { Submission } from "@prisma/client";

export const submissionsQueryKey = ["submissions", "me"] as const;

async function fetchMySubmissions(): Promise<Submission[]> {
  const res = await fetch("/api/submissions/me");
  if (!res.ok) throw new Error("Failed to fetch submissions");
  return res.json();
}

export function useMySubmissions() {
  return useQuery<Submission[]>({
    queryKey: submissionsQueryKey,
    queryFn: fetchMySubmissions,
  });
}
