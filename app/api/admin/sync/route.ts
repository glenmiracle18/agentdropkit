import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { Octokit } from "@octokit/rest";
import type { Listing } from "@prisma/client";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

function extractRepoInfo(repoUrl: string): { owner: string; repo: string } | null {
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function syncRepoStars(listing: Listing): Promise<number | null> {
  try {
    const repoInfo = extractRepoInfo(listing.repoUrl);
    if (!repoInfo) return null;
    const { data: repo } = await octokit.rest.repos.get(repoInfo);
    return repo.stargazers_count;
  } catch {
    console.error(`Failed to sync stars for ${listing.name}`);
    return null;
  }
}

export async function POST() {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    });

    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    const listings = await db.listing.findMany({
      where: { repoUrl: { contains: "github.com" }, isVisible: true },
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
          data: { githubStars: stars },
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
  } catch (error) {
    console.error("Manual sync failed:", error);
    return NextResponse.json(
      { error: "Sync failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 },
    );
  }
}
