import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    // For now, allow any authenticated user to trigger sync (in production, add admin check)
    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    // Make a request to the sync endpoint
    const syncResponse = await fetch(`${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/api/sync-github`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CRON_SECRET || "dev-secret"}`,
        "Content-Type": "application/json",
      },
    });

    const result = await syncResponse.json();

    if (!syncResponse.ok) {
      throw new Error(result.error || "Sync failed");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Manual sync trigger failed:", error);
    return NextResponse.json(
      { error: "Failed to trigger sync", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}