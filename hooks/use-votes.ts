import { useState, useOptimistic, useTransition } from "react";

interface VoteState {
  voteCount: number;
  userVote: "up" | "down" | null;
}

interface UseVotesProps {
  listingId: string;
  initialVoteCount: number;
  initialUserVote: "up" | "down" | null;
}

export function useVotes({ listingId, initialVoteCount, initialUserVote }: UseVotesProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  
  const [optimisticVoteState, updateOptimisticVoteState] = useOptimistic<VoteState, "up" | "down">(
    { voteCount: initialVoteCount, userVote: initialUserVote },
    (state, newDirection) => {
      let newVoteCount = state.voteCount;
      let newUserVote: "up" | "down" | null = newDirection;

      if (state.userVote === newDirection) {
        // Toggle off (remove vote)
        newUserVote = null;
        newVoteCount += newDirection === "up" ? -1 : 1;
      } else if (state.userVote && state.userVote !== newDirection) {
        // Change direction
        newVoteCount += newDirection === "up" ? 2 : -2;
      } else {
        // New vote
        newVoteCount += newDirection === "up" ? 1 : -1;
      }

      return {
        voteCount: newVoteCount,
        userVote: newUserVote,
      };
    }
  );

  const vote = (direction: "up" | "down") => {
    setError(null);
    
    startTransition(async () => {
      updateOptimisticVoteState(direction);
      
      try {
        const response = await fetch("/api/votes", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            listingId,
            direction,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to vote");
        }

        // The server response will have the actual state, but we don't need to update
        // since the optimistic update should match the server response
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to vote");
        // The optimistic update will be reverted automatically on error
      }
    });
  };

  return {
    voteCount: optimisticVoteState.voteCount,
    userVote: optimisticVoteState.userVote,
    vote,
    isPending,
    error,
  };
}