export interface RankingInputs {
  voteCount: number;
  githubStars: number;
  totalInstalls: number;
  weeklyInstalls: number;
  createdAt: Date;
  isOfficial: boolean;
}

/**
 * Composite ranking score for homepage ordering.
 *
 * Weights:
 *   voteCount      × 3.0  — explicit community quality signal (can be negative)
 *   githubStars    × 2.0  — logarithmic: prevents mega-repos from dominating
 *   totalInstalls  × 1.5  — longtail popularity
 *   weeklyInstalls × 0.0  — zeroed until the weekly-reset cron is live;
 *                           weeklyInstalls currently behaves like totalInstalls
 *                           because it has never been reset (see reset-weekly cron)
 *   recency        × 5.0  — decays from 1.0 toward 0 over ~90 days so new
 *                           listings briefly surface above stale ones
 *   isOfficial     +10    — flat admin-curated quality floor
 */
export function computeRankScore(inputs: RankingInputs): number {
  const { voteCount, githubStars, totalInstalls, createdAt, isOfficial } = inputs;

  const daysSinceCreated =
    (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
  const recencyFactor = 1 / (1 + daysSinceCreated / 30);

  const score =
    3.0 * voteCount +
    2.0 * Math.log10(githubStars + 1) +
    1.5 * Math.log10(totalInstalls + 1) +
    5.0 * recencyFactor +
    (isOfficial ? 10 : 0);

  return score;
}
