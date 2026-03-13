"use client";

import { notFound } from "next/navigation";
import SkillDetailClient from "./skill-detail-client";
import { useListingDetail } from "@/lib/queries/listings";

interface SkillDetailWrapperProps {
  author: string;
  slug: string;
}

export default function SkillDetailWrapper({
  author,
  slug,
}: SkillDetailWrapperProps) {
  const { data, isLoading, isError, error } = useListingDetail(author, slug);

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-4 bg-bg-card w-48" />
        <div className="h-10 bg-bg-card w-96" />
        <div className="h-5 bg-bg-card w-full" />
        <div className="h-5 bg-bg-card w-3/4" />
      </div>
    );
  }

  if (isError) {
    if (error instanceof Error && error.message === "NOT_FOUND") {
      notFound();
    }
    return (
      <p className="text-text-muted font-bold uppercase tracking-widest">
        Failed to load listing.
      </p>
    );
  }

  if (!data) return notFound();

  return <SkillDetailClient skill={data} />;
}
