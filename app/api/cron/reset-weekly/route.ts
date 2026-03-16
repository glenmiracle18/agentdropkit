import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeRankScore } from "@/lib/ranking";

/**
 * Runs every Monday at midnight (see vercel.json).
 * 1. Resets weeklyInstalls to 0 on every visible listing
 * 2. Recomputes rankScore so the weekly-install weight clears immediately
 */
async function handle(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const listings = await db.listing.findMany({
      where: { isVisible: true, isEjected: false },
      select: {
        id: true,
        voteCount: true,
        githubStars: true,
        totalInstalls: true,
        createdAt: true,
        isOfficial: true,
      },
    });

    await Promise.all(
      listings.map((listing) =>
        db.listing.update({
          where: { id: listing.id },
          data: {
            weeklyInstalls: 0,
            rankScore: computeRankScore({
              voteCount: listing.voteCount,
              githubStars: listing.githubStars,
              totalInstalls: listing.totalInstalls,
              weeklyInstalls: 0,
              createdAt: listing.createdAt,
              isOfficial: listing.isOfficial,
            }),
          },
        })
      )
    );

    return NextResponse.json({ success: true, reset: listings.length });
  } catch (error) {
    console.error("reset-weekly cron failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
