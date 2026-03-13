import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface SkillFileData {
  name: string;
  path: string;
  content: string;
  type: string;
  executable: boolean;
  size: number;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ author: string; slug: string }> },
) {
  const { author, slug } = await params;
  const decodedAuthor = decodeURIComponent(author);

  const listing = await db.listing.findFirst({
    where: {
      authorHandle: { equals: decodedAuthor, mode: "insensitive" },
      slug,
      isVisible: true,
      isEjected: false,
    },
    include: {
      skill: { include: { files: true } },
    },
  });

  if (!listing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Get user vote
  const session = await auth.api.getSession({ headers: await headers() });
  const userVote = session?.user
    ? await db.vote.findUnique({
        where: {
          listingId_userId: {
            listingId: listing.id,
            userId: session.user.id,
          },
        },
        select: { value: true },
      })
    : null;

  // Process files — new format (SkillFile records) takes priority, then legacy JSON
  let skillFiles: SkillFileData[] = [];
  if (listing.skill?.files && Array.isArray(listing.skill.files)) {
    skillFiles = listing.skill.files.map((file) => ({
      name: file.fileName,
      path: file.filePath,
      content: file.fileContent,
      type: file.fileType,
      executable: file.isExecutable,
      size: file.fileSize,
    }));
  } else if (typeof listing.files === "string") {
    try {
      skillFiles = JSON.parse(listing.files);
    } catch {
      skillFiles = [];
    }
  } else if (Array.isArray(listing.files)) {
    skillFiles = listing.files as unknown as SkillFileData[];
  }

  return NextResponse.json({
    id: listing.id,
    slug: listing.slug,
    name: listing.name,
    type: listing.type,
    description: listing.description,
    longDescription: listing.longDescription,
    authorHandle: listing.authorHandle,
    repoUrl: listing.repoUrl,
    repoPath: listing.repoPath,
    category: listing.category,
    tags: listing.tags,
    compatibleAgents: listing.compatibleAgents,
    triggerWords: listing.triggerWords,
    isOpenSource: listing.isOpenSource,
    license: listing.license,
    documentation: listing.documentation,
    isOfficial: listing.isOfficial,
    isSafe: listing.isSafe,
    healthScore: listing.healthScore,
    githubStars: listing.githubStars,
    weeklyInstalls: listing.weeklyInstalls,
    totalInstalls: listing.totalInstalls,
    voteCount: listing.voteCount,
    binaryDependencies: listing.binaryDependencies,
    ejectedBy: listing.ejectedBy,
    framework: listing.framework,
    homepageUrl: listing.homepageUrl,
    installCommand: listing.installCommand,
    isEjected: listing.isEjected,
    isVisible: listing.isVisible,
    language: listing.language,
    npmDependencies: listing.npmDependencies,
    skillDependencies: listing.skillDependencies,
    version: listing.version,
    firstSeenAt: listing.firstSeenAt.toISOString(),
    createdAt: listing.createdAt.toISOString(),
    updatedAt: listing.updatedAt.toISOString(),
    ejectedAt: listing.ejectedAt?.toISOString() ?? null,
    // Computed/enriched fields
    overview: listing.overview ?? "",
    triggerPhrases: listing.triggerWords ?? [],
    repository: listing.repoUrl.replace("https://", ""),
    upvotes: listing.voteCount,
    stars: listing.githubStars,
    installs: listing.totalInstalls,
    firstSeen: new Date(listing.firstSeenAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }),
    command: listing.repoUrl,
    faq: [],
    userVote: userVote?.value ?? null,
    files: skillFiles,
  });
}
