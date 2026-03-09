"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Listing, Submission } from "@prisma/client";

// ─── Skills ───────────────────────────────────────────────────────────────────

export const adminSkillsQueryKey = ["admin", "skills"] as const;

async function fetchAdminSkills(): Promise<Listing[]> {
  const res = await fetch("/api/admin/skills");
  if (!res.ok) throw new Error("Failed to fetch skills");
  const data = await res.json() as { skills: Listing[] };
  return data.skills ?? [];
}

export function useAdminSkills() {
  return useQuery<Listing[]>({
    queryKey: adminSkillsQueryKey,
    queryFn: fetchAdminSkills,
  });
}

type SkillAction = "eject" | "restore" | "delete" | "toggle-safe" | "toggle-official";

export function useAdminSkillAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ skillId, action }: { skillId: string; action: SkillAction }) => {
      const res = await fetch("/api/admin/skills", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skillId, action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to perform action");
      }
      return res.json() as Promise<{ message: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSkillsQueryKey });
    },
  });
}

// ─── Submissions ──────────────────────────────────────────────────────────────

export const adminSubmissionsQueryKey = ["admin", "submissions"] as const;

export type SubmissionWithUser = Submission & {
  user: { name: string | null; email: string; githubUsername: string | null };
};

async function fetchAdminSubmissions(): Promise<SubmissionWithUser[]> {
  const res = await fetch("/api/admin/submissions");
  if (!res.ok) throw new Error("Failed to fetch submissions");
  return res.json() as Promise<SubmissionWithUser[]>;
}

export function useAdminSubmissions() {
  return useQuery<SubmissionWithUser[]>({
    queryKey: adminSubmissionsQueryKey,
    queryFn: fetchAdminSubmissions,
    staleTime: 0, // always fresh for admin
  });
}

type SubmissionAction = "approve" | "reject" | "requeue";

export function useAdminSubmissionAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ submissionId, action }: { submissionId: string; action: SubmissionAction }) => {
      const res = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ submissionId, action }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        throw new Error(err.error ?? "Failed to perform action");
      }
      return res.json() as Promise<{ message: string; slug?: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminSubmissionsQueryKey });
    },
  });
}
