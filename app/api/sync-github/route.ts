import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Octokit } from "@octokit/rest";
import type { Listing } from "@prisma/client";
import { computeRankScore } from "@/lib/ranking";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface GitHubRepo {
  stargazers_count: number;
  language: string | null;
}

function extractRepoInfo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function syncRepoStars(listing: Listing): Promise<number | null> {
  try {
    const repoInfo = extractRepoInfo(listing.repoUrl);
    if (!repoInfo) return null;

    const { data: repo }: { data: GitHubRepo } = await octokit.rest.repos.get({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
    });

    return repo.stargazers_count;
  } catch (error) {
    console.error(`Failed to sync stars for ${listing.name}:`, error);
    return null;
  }
}

async function runSync(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch the 50 listings with GitHub repos sorted by oldest update — rotate through all listings over time
  const listings = await db.listing.findMany({
    where: {
      repoUrl: { contains: "github.com" },
      isVisible: true,
    },
    orderBy: { updatedAt: "asc" },
    take: 50,
  });

  let successCount = 0;
  let errorCount = 0;

  for (const listing of listings) {
    const stars = await syncRepoStars(listing);

    if (stars !== null) {
      await db.listing.update({
        where: { id: listing.id },
        data: {
          githubStars: stars,
          rankScore: computeRankScore({
            voteCount: listing.voteCount,
            githubStars: stars,
            totalInstalls: listing.totalInstalls,
            weeklyInstalls: listing.weeklyInstalls,
            createdAt: listing.createdAt,
            isOfficial: listing.isOfficial,
          }),
        },
      });
      successCount++;
    } else {
      errorCount++;
    }

    // Small delay to stay within GitHub rate limits
    await new Promise((resolve) => setTimeout(resolve, 150));
  }

  return NextResponse.json({
    success: true,
    synced: successCount,
    errors: errorCount,
    total: listings.length,
  });
}

// Vercel Cron sends GET — this is the primary handler
export async function GET(request: NextRequest) {
  return runSync(request);
}

// POST available for manual admin triggers
export async function POST(request: NextRequest) {
  return runSync(request);
}
