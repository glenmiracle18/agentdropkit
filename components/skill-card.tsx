"use client";

import Link from "next/link";
import { useState } from "react";
import type { Listing } from "@prisma/client";
import VoteButtons from "./vote-buttons";

interface SkillCardProps {
  listing: Listing & {
    userVote?: "up" | "down" | null;
  };
  index: number;
}

export default function SkillCard({ listing, index }: SkillCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleCopyInstall = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await navigator.clipboard.writeText(listing.installCommand);
      // Track install
      fetch("/api/track-install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: listing.slug }),
      });
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const staggerDelay = `${Math.min(index, 5) * 0.06}s`;

  return (
    <Link
      href={`/${encodeURIComponent(listing.authorHandle)}/${listing.slug}`}
      className="group flex flex-col p-5 sm:p-6 bg-bg-card border-2 border-border hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--color-text-primary)] transition-all duration-200 h-full animate-stagger [animation-fill-mode:both]"
      style={{ "--stagger-delay": staggerDelay } as React.CSSProperties}
    >
      <div className="flex justify-between items-start mb-4 sm:mb-5">
        <div className="w-full">
          <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 truncate">
            {listing.name}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted truncate font-mono">
            {listing.category}
          </p>
        </div>
      </div>

      <p className="text-sm text-text-primary leading-relaxed mb-4 flex-1 line-clamp-3 font-mono">
        {listing.description}
      </p>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        {listing.tags.slice(0, 3).map((tag) => (
          <span
            key={tag}
            className="text-[10px] font-bold uppercase tracking-widest border border-border px-2 py-1 text-text-muted"
          >
            {tag}
          </span>
        ))}
        {listing.tags.length > 3 && (
          <span className="text-[10px] font-bold uppercase tracking-widest border border-border px-2 py-1 text-text-muted">
            +{listing.tags.length - 3}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-4 border-t-2 border-border">
        <div className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm font-medium text-text-muted font-mono">
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4 text-text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <polyline points="12 19 12 5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            <span className="text-text-primary">{listing.voteCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>{(listing.githubStars / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex items-center gap-1">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            <span>{(listing.totalInstalls / 1000).toFixed(1)}k</span>
          </div>
        </div>
        {listing.isOfficial && (
          <span className="text-[10px] uppercase tracking-widest bg-text-primary text-bg-base px-2 py-1 font-bold">
            Official
          </span>
        )}
      </div>
    </Link>
  );
}
