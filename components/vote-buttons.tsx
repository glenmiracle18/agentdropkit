"use client";

import { useSession } from "@/lib/auth-client";
import { useVotes } from "@/hooks/use-votes";

interface VoteButtonsProps {
  listingId: string;
  initialVoteCount: number;
  initialUserVote?: "up" | "down" | null;
  className?: string;
}

export default function VoteButtons({
  listingId,
  initialVoteCount,
  initialUserVote = null,
  className = ""
}: VoteButtonsProps) {
  const { data: session } = useSession();
  const { voteCount, userVote, vote, isPending } = useVotes({
    listingId,
    initialVoteCount,
    initialUserVote,
  });

  const handleUpvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    vote("up");
  };

  const handleDownvote = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    vote("down");
  };

  if (!session) {
    return (
      <div className={`flex items-center gap-2 border-[2px] border-border px-2 py-1 ${className}`}>
        <div className="flex items-center gap-1">
          <svg className="w-3 h-3 text-text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <polyline points="18 15 12 9 6 15"></polyline>
          </svg>
          <span className="text-sm font-mono font-bold text-text-primary">{voteCount}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-1 border-[2px] border-border px-2 py-1 bg-bg-card hover:shadow-[2px_2px_0px_0px_var(--color-text-primary)] transition-shadow ${className}`}>
      <button
        onClick={handleUpvote}
        disabled={isPending}
        className={`p-0.5 rounded-none transition-colors border-2 border-transparent hover:border-text-primary disabled:opacity-50 ${userVote === "up"
          ? "text-accent"
          : "text-text-primary hover:text-accent"
          }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
          <polyline points="18 15 12 9 6 15"></polyline>
        </svg>
      </button>

      <span className={`text-sm font-mono font-bold min-w-[2rem] text-center transition-colors ${isPending ? "text-text-muted" : "text-text-primary"
        }`}>
        {voteCount}
      </span>

      <button
        onClick={handleDownvote}
        disabled={isPending}
        className={`p-0.5 rounded-none transition-colors border-2 border-transparent hover:border-text-primary disabled:opacity-50 ${userVote === "down"
          ? "text-text-muted"
          : "text-text-primary hover:text-text-muted"
          }`}
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>
    </div>
  );
}