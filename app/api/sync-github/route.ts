import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string | null;
  stargazers_count: number;
  forks_count: number;
  open_issues_count: number;
  language: string | null;
  license: {
    key: string;
    name: string;
  } | null;
  updated_at: string;
  html_url: string;
}

async function extractRepoInfo(repoUrl: string) {
  const match = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (!match) return null;
  
  const [, owner, repo] = match;
  return { owner, repo: repo.replace(/\.git$/, "") };
}

async function syncRepoData(listing: any): Promise<Partial<any>> {
  try {
    const repoInfo = await extractRepoInfo(listing.repoUrl);
    if (!repoInfo) return {};

    const { data: repo }: { data: GitHubRepo } = await octokit.rest.repos.get({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
    });

    // Get recent commit activity for trend calculation
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const { data: commits } = await octokit.rest.repos.listCommits({
      owner: repoInfo.owner,
      repo: repoInfo.repo,
      since: oneWeekAgo.toISOString(),
      per_page: 100,
    });

    // Try to get download stats (for npm packages)
    let weeklyInstalls = listing.weeklyInstalls || 0;
    let totalInstalls = listing.totalInstalls || 0;

    // If it's an npm package, try to get download stats
    if (listing.installCommand.includes('npm install')) {
      try {
        const packageName = listing.installCommand.match(/npm install\s+(@?[^\s]+)/)?.[1];
        if (packageName) {
          const npmResponse = await fetch(
            `https://api.npmjs.org/downloads/point/last-week/${packageName}`
          );
          if (npmResponse.ok) {
            const npmData = await npmResponse.json();
            weeklyInstalls = npmData.downloads || 0;
          }

          const totalResponse = await fetch(
            `https://api.npmjs.org/downloads/range/2010-01-01:${new Date().toISOString().split('T')[0]}/${packageName}`
          );
          if (totalResponse.ok) {
            const totalData = await totalResponse.json();
            totalInstalls = totalData.downloads?.reduce((sum: number, day: any) => sum + day.downloads, 0) || 0;
          }
        }
      } catch (npmError) {
        console.warn(`Failed to fetch npm stats for ${listing.name}:`, npmError);
      }
    }

    return {
      githubStars: repo.stargazers_count,
      githubForks: repo.forks_count,
      githubIssues: repo.open_issues_count,
      primaryLanguage: repo.language,
      weeklyInstalls,
      totalInstalls,
      recentActivity: commits.length,
      lastSyncedAt: new Date(),
    };
  } catch (error) {
    console.error(`Failed to sync repo data for ${listing.name}:`, error);
    return {};
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify request is from cron job or has proper authorization
    const authHeader = request.headers.get("authorization");
    const cronSecret = process.env.CRON_SECRET;
    
    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("Starting GitHub sync job...");

    // Get all approved listings that need syncing
    const listings = await db.listing.findMany({
      where: {
        repoUrl: {
          contains: "github.com",
        },
        // Only sync listings that haven't been synced in the last hour
        OR: [
          { lastSyncedAt: null },
          {
            lastSyncedAt: {
              lt: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
            },
          },
        ],
      },
      take: 50, // Limit to avoid rate limits
    });

    console.log(`Found ${listings.length} listings to sync`);

    let successCount = 0;
    let errorCount = 0;

    for (const listing of listings) {
      try {
        const updates = await syncRepoData(listing);
        
        if (Object.keys(updates).length > 0) {
          await db.listing.update({
            where: { id: listing.id },
            data: updates,
          });
          successCount++;
          console.log(`✓ Synced ${listing.name}`);
        }
      } catch (error) {
        errorCount++;
        console.error(`✗ Failed to sync ${listing.name}:`, error);
      }

      // Add a small delay to avoid hitting rate limits
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log(`GitHub sync completed: ${successCount} success, ${errorCount} errors`);

    return NextResponse.json({
      success: true,
      synced: successCount,
      errors: errorCount,
      total: listings.length,
    });
  } catch (error) {
    console.error("GitHub sync job failed:", error);
    return NextResponse.json(
      { error: "Sync job failed", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}