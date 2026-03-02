import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const { listingId, direction } = await request.json();

    if (!listingId || !direction || !["up", "down"].includes(direction)) {
      return NextResponse.json({ error: "Invalid request data" }, { status: 400 });
    }

    // Check if user already voted on this listing
    const existingVote = await db.vote.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: listingId,
        },
      },
    });

    let voteChange = 0;

    if (existingVote) {
      if (existingVote.direction === direction) {
        // Remove vote (toggle off)
        await db.vote.delete({
          where: {
            userId_listingId: {
              userId: session.user.id,
              listingId: listingId,
            },
          },
        });
        voteChange = direction === "up" ? -1 : 1;
      } else {
        // Change vote direction
        await db.vote.update({
          where: {
            userId_listingId: {
              userId: session.user.id,
              listingId: listingId,
            },
          },
          data: { direction },
        });
        voteChange = direction === "up" ? 2 : -2;
      }
    } else {
      // Create new vote
      await db.vote.create({
        data: {
          userId: session.user.id,
          listingId: listingId,
          direction,
        },
      });
      voteChange = direction === "up" ? 1 : -1;
    }

    // Update listing vote count
    await db.listing.update({
      where: { id: listingId },
      data: {
        voteCount: {
          increment: voteChange,
        },
      },
    });

    // Get updated vote count
    const updatedListing = await db.listing.findUnique({
      where: { id: listingId },
      select: { voteCount: true },
    });

    // Get user's current vote
    const userVote = await db.vote.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId: listingId,
        },
      },
      select: { direction: true },
    });

    return NextResponse.json({
      voteCount: updatedListing?.voteCount || 0,
      userVote: userVote?.direction || null,
    });
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}