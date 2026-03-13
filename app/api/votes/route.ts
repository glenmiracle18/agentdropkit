import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const voteBodySchema = z.object({
  listingId: z.string().min(1),
  value: z.union([z.literal(1), z.literal(-1)]),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 },
      );
    }

    const { listingId, value } = voteBodySchema.parse(await request.json());

    // Verify listing exists
    const listing = await db.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    });
    if (!listing) {
      return NextResponse.json({ error: "Listing not found" }, { status: 404 });
    }

    const existingVote = await db.vote.findUnique({
      where: { listingId_userId: { listingId, userId: session.user.id } },
    });

    let voteChange = 0;

    if (existingVote) {
      if (existingVote.value === value) {
        // Same direction — toggle off (remove vote)
        await db.vote.delete({
          where: { listingId_userId: { listingId, userId: session.user.id } },
        });
        voteChange = -value; // upvote removed = -1, downvote removed = +1
      } else {
        // Switching direction
        await db.vote.update({
          where: { listingId_userId: { listingId, userId: session.user.id } },
          data: { value },
        });
        voteChange = value - existingVote.value; // e.g. 1 - (-1) = +2
      }
    } else {
      // New vote
      await db.vote.create({
        data: { listingId, userId: session.user.id, value },
      });
      voteChange = value;
    }

    // Update listing vote count and return it
    const updatedListing = await db.listing.update({
      where: { id: listingId },
      data: { voteCount: { increment: voteChange } },
      select: { voteCount: true },
    });

    // Return the caller's current vote (null if removed)
    const userVoteRecord = await db.vote.findUnique({
      where: { listingId_userId: { listingId, userId: session.user.id } },
      select: { value: true },
    });

    return NextResponse.json({
      voteCount: updatedListing.voteCount,
      userVote: userVoteRecord?.value ?? null,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
