"use client";

import Link from "next/link";
import { useState } from "react";
import type { Listing } from "@prisma/client";
import VoteButtons from "./vote-buttons";

// Function to get appropriate icon for skill
function getSkillIcon(skillName: string) {
  const name = skillName.toLowerCase();

  if (name.includes('github') || name.includes('pr')) {
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    );
  } else if (name.includes('figma') || name.includes('design')) {
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.02s-1.354-3.02-3.019-3.02h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.02s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019c0 2.476-2.014 4.49-4.49 4.49s-4.49-2.014-4.49-4.49 2.014-4.49 4.49-4.49h4.49v4.49z" />
      </svg>
    );
  } else if (name.includes('postgres') || name.includes('database')) {
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.128 0C15.892 0 14.758.963 14.758 2.344v7.406c0 1.381 1.134 2.344 2.37 2.344s2.37-.963 2.37-2.344V2.344C19.498.963 18.364 0 17.128 0zM6.872 0C5.636 0 4.502.963 4.502 2.344v7.406c0 1.381 1.134 2.344 2.37 2.344s2.37-.963 2.37-2.344V2.344C9.242.963 8.108 0 6.872 0zM12 11.063c-3.866 0-7 1.567-7 3.5v7c0 1.933 3.134 3.5 7 3.5s7-1.567 7-3.5v-7c0-1.933-3.134-3.5-7-3.5z" />
      </svg>
    );
  } else if (name.includes('api') || name.includes('scaffold')) {
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  } else {
    return (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  }
}

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
      fetch('/api/track-install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: listing.slug }),
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <Link
      href={`/${listing.authorHandle}/${listing.slug}`}
      className="group flex flex-col p-5 sm:p-6 bg-bg-card border-2 border-border hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--color-text-primary)] transition-all duration-200 h-full"
    >
      <div className="flex justify-between items-start mb-4 sm:mb-5">
        <div className="w-full">
          <h3 className="text-base sm:text-lg font-bold text-text-primary mb-1 truncate">
            {listing.name}
          </h3>
          <p className="text-xs sm:text-sm text-text-muted truncate font-mono">{listing.category}</p>
        </div>
      </div>

      <p className="text-sm text-text-primary leading-relaxed mb-4 flex-1 line-clamp-3 font-mono">
        {listing.description}
      </p>

      <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
        {listing.tags.slice(0, 3).map(tag => (
          <span key={tag} className="text-[10px] font-bold uppercase tracking-widest border border-border px-2 py-1 text-text-muted">
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
            <svg className="w-4 h-4 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <polyline points="12 19 12 5" />
              <polyline points="5 12 12 5 19 12" />
            </svg>
            <span className="text-text-primary">{listing.voteCount}</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
            </svg>
            <span>{(listing.githubStars / 1000).toFixed(1)}k</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
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