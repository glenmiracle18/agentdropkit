import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SkillDetailClient from "./skill-detail-client";

interface DetailPageProps {
  params: Promise<{
    author: string;
    slug: string;
  }>;
}

// Function to get appropriate icon for skill
function getSkillIcon(skillName: string) {
  const name = skillName.toLowerCase();

  if (name.includes('github') || name.includes('pr')) {
    return (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
      </svg>
    );
  } else if (name.includes('figma') || name.includes('design')) {
    return (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15.852 8.981h-4.588V0h4.588c2.476 0 4.49 2.014 4.49 4.49s-2.014 4.491-4.49 4.491zM12.735 7.51h3.117c1.665 0 3.019-1.355 3.019-3.02s-1.354-3.02-3.019-3.02h-3.117V7.51zm0 1.471H8.148c-2.476 0-4.49-2.015-4.49-4.491S5.672 0 8.148 0h4.588v8.981zm-4.587-7.51c-1.665 0-3.019 1.355-3.019 3.02s1.354 3.02 3.019 3.02h3.117V1.471H8.148zm4.587 15.019c0 2.476-2.014 4.49-4.49 4.49s-4.49-2.014-4.49-4.49 2.014-4.49 4.49-4.49h4.49v4.49z" />
      </svg>
    );
  } else if (name.includes('postgres') || name.includes('database')) {
    return (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M17.128 0C15.892 0 14.758.963 14.758 2.344v7.406c0 1.381 1.134 2.344 2.37 2.344s2.37-.963 2.37-2.344V2.344C19.498.963 18.364 0 17.128 0zM6.872 0C5.636 0 4.502.963 4.502 2.344v7.406c0 1.381 1.134 2.344 2.37 2.344s2.37-.963 2.37-2.344V2.344C9.242.963 8.108 0 6.872 0zM12 11.063c-3.866 0-7 1.567-7 3.5v7c0 1.933 3.134 3.5 7 3.5s7-1.567 7-3.5v-7c0-1.933-3.134-3.5-7-3.5z" />
      </svg>
    );
  } else if (name.includes('api') || name.includes('scaffold')) {
    return (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
    );
  } else {
    return (
      <svg className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
      </svg>
    );
  }
}

export async function generateMetadata({ params }: DetailPageProps) {
  const { author, slug } = await params;
  const listing = await db.listing.findFirst({
    where: {
      authorHandle: author,
      slug: slug,
    },
  });

  if (!listing) {
    return {
      title: "Skill Not Found",
    };
  }

  return {
    title: `${listing.name} - AgentDropkit`,
    description: listing.description,
  };
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { author, slug } = await params;
  const listing = await db.listing.findFirst({
    where: {
      authorHandle: author,
      slug: slug,
      isVisible: true,
      isEjected: false,
    },
    include: {
      skill: {
        include: {
          files: true
        }
      }
    }
  });

  if (!listing) {
    notFound();
  }

  // Get user session and their vote for this listing
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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

  // Process files - handle both old format (JSON) and new format (related SkillFile records)
  let skillFiles: any[] = [];
  
  if (listing.skill?.files && Array.isArray(listing.skill.files)) {
    // New format: SkillFile records from database
    skillFiles = listing.skill.files.map((file: any) => ({
      name: file.fileName,
      path: file.filePath,
      content: file.fileContent,
      type: file.fileType,
      executable: file.isExecutable,
      size: file.fileSize
    }));
  } else if (listing.files && typeof listing.files === 'string') {
    // Old format: JSON string in listing.files
    try {
      skillFiles = JSON.parse(listing.files);
    } catch (error) {
      console.warn('Failed to parse legacy files JSON:', error);
      skillFiles = [];
    }
  } else if (Array.isArray(listing.files)) {
    // Old format: JSON array in listing.files
    skillFiles = listing.files;
  }

  const skillData = {
    ...listing,
    icon: getSkillIcon(listing.name),
    triggerPhrases: listing.triggerWords || [],
    repository: listing.repoUrl.replace('https://', ''),
    upvotes: listing.voteCount,
    stars: listing.githubStars,
    installs: listing.totalInstalls,
    firstSeen: new Date(listing.firstSeenAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }),
    command: listing.repoUrl, // Use repo URL as command for now
    overview: listing.longDescription || listing.description || '',
    faq: [],
    userVote: userVote?.value || null,
    files: skillFiles
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-12 bg-bg-base min-h-screen">
      <SkillDetailClient skill={skillData} />
    </div>
  );
}