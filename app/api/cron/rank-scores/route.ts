import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeRankScore } from "@/lib/ranking";

const BATCH_SIZE = 100;

async function runRankScoreUpdate() {
  let cursor: string | undefined;
  let updated = 0;

  while (true) {
    const batch = await db.listing.findMany({
      where: { isVisible: true, isEjected: false },
      select: {
        id: true,
        voteCount: true,
        githubStars: true,
        totalInstalls: true,
        weeklyInstalls: true,
        createdAt: true,
        isOfficial: true,
      },
      take: BATCH_SIZE,
      ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
      orderBy: { id: "asc" },
    });

    if (batch.length === 0) break;

    await Promise.all(
      batch.map((listing) =>
        db.listing.update({
          where: { id: listing.id },
          data: {
            rankScore: computeRankScore({
              voteCount: listing.voteCount,
              githubStars: listing.githubStars,
              totalInstalls: listing.totalInstalls,
              weeklyInstalls: listing.weeklyInstalls,
              createdAt: listing.createdAt,
              isOfficial: listing.isOfficial,
            }),
          },
        })
      )
    );

    updated += batch.length;
    cursor = batch[batch.length - 1].id;

    if (batch.length < BATCH_SIZE) break;
  }

  return updated;
}

async function handle(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const updated = await runRankScoreUpdate();
    return NextResponse.json({ success: true, updated });
  } catch (error) {
    console.error("rank-scores cron failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handle(request);
}

export async function POST(request: NextRequest) {
  return handle(request);
}
