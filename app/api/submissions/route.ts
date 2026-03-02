import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";

const submissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  type: z.enum(["skill", "mcp", "tool"]),
  category: z.string().min(1, "Category is required"),
  repoUrl: z.string().url("Must be a valid URL"),
  installCommand: z.string().min(1, "Install command is required"),
  tags: z.array(z.string()).default([]),
  isOpenSource: z.boolean().default(true),
  license: z.string().min(1, "License is required"),
  documentation: z.string().url("Must be a valid URL").optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = submissionSchema.parse(body);

    // Create slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Check if a submission with this repo URL already exists
    const existingSubmission = await db.submission.findFirst({
      where: {
        repoUrl: validatedData.repoUrl,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "A submission with this repository URL already exists" },
        { status: 409 }
      );
    }

    // Extract GitHub username from user or repo URL
    let authorHandle = session.user.githubUsername || session.user.name || "unknown";
    
    // Try to extract from GitHub repo URL if no GitHub username
    if (!session.user.githubUsername && validatedData.repoUrl.includes("github.com")) {
      const match = validatedData.repoUrl.match(/github\.com\/([^\/]+)/);
      if (match) {
        authorHandle = match[1];
      }
    }

    // Create submission
    const submission = await db.submission.create({
      data: {
        name: validatedData.name,
        slug,
        description: validatedData.description,
        type: validatedData.type,
        category: validatedData.category.toLowerCase().replace(/\s+/g, "-"),
        authorHandle,
        repoUrl: validatedData.repoUrl,
        installCommand: validatedData.installCommand,
        tags: validatedData.tags,
        isOpenSource: validatedData.isOpenSource,
        license: validatedData.license,
        documentation: validatedData.documentation || null,
        userId: session.user.id,
        status: "pending",
        submittedAt: new Date(),
      },
    });

    return NextResponse.json({
      id: submission.id,
      message: "Submission created successfully",
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}