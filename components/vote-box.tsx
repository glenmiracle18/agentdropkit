"use client";

import { useSession } from "@/lib/auth-client";
import { useVotes } from "@/hooks/use-votes";
import Link from "next/link";

interface VoteBoxProps {
  listingId: string;
  initialVoteCount: number;
  initialUserVote?: "up" | "down" | null;
}

export default function VoteBox({ listingId, initialVoteCount, initialUserVote = null }: VoteBoxProps) {
  const { data: session } = useSession();
  const { voteCount, userVote, vote, isPending, error } = useVotes({
    listingId,
    initialVoteCount,
    initialUserVote,
  });

  const handleUpvote = () => vote("up");
  const handleDownvote = () => vote("down");

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-6">
      <div className="flex flex-col items-center space-y-4">
        <button 
          onClick={handleUpvote}
          disabled={!session || isPending}
          className={`p-2 rounded-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            userVote === "up"
              ? "border-green-500 bg-green-500/10 text-green-400"
              : "border-border hover:border-border-hover text-text-dim hover:text-text-secondary"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M3.293 9.707a1 1 0 010-1.414l6-6a1 1 0 011.414 0l6 6a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L4.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        
        <span className={`text-2xl font-bold transition-colors ${
          isPending ? "text-text-dim" : "text-text-primary"
        }`}>
          {voteCount}
        </span>
        
        <button 
          onClick={handleDownvote}
          disabled={!session || isPending}
          className={`p-2 rounded-sm border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            userVote === "down"
              ? "border-red-500 bg-red-500/10 text-red-400"
              : "border-border hover:border-border-hover text-text-dim hover:text-text-secondary"
          }`}
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 10.293a1 1 0 010 1.414l-6 6a1 1 0 01-1.414 0l-6-6a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l4.293-4.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      
      {error && (
        <p className="text-red-400 text-xs text-center mt-2">
          {error}
        </p>
      )}
      
      {!session && (
        <p className="text-text-dim text-xs text-center mt-4">
          <Link href="/login" className="hover:text-text-secondary">
            Sign in to vote
          </Link>
        </p>
      )}
    </div>
  );
}