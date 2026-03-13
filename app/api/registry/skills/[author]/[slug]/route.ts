import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { collectSkillFiles } from '@/lib/github';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ author: string; slug: string }> }
) {
  try {
    const { author, slug } = await params;
    
    // Primary lookup: by exact slug (repo name)
    let listing = await db.listing.findFirst({
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

    // Fallback: the install command uses the skill display name (slugified), not the repo slug.
    // e.g. listing.name = "PDF Handler" → install command uses "pdf-handler"
    // but listing.slug = "claude-pdf-tools" (the repo name). Try matching by name.
    if (!listing) {
      const candidates = await db.listing.findMany({
        where: {
          authorHandle: author,
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
      listing = candidates.find(
        (c) => c.name.toLowerCase().replace(/\s+/g, '-') === slug
      ) ?? null;
    }

    if (!listing) {
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

    // Process files — three sources in priority order:
    // 1. New format: SkillFile records in DB (created at approval time)
    // 2. Old format: legacy JSON stored in listing.files
    // 3. Live fetch from GitHub (fallback for listings approved before the pipeline existed)
    let skillFiles: { name: string; path: string; content: string; type: string; executable: boolean; size: number }[] = [];

    if (listing.skill?.files && listing.skill.files.length > 0) {
      skillFiles = listing.skill.files.map((file) => ({
        name: file.fileName,
        path: file.filePath,
        content: file.fileContent,
        type: file.fileType,
        executable: file.isExecutable,
        size: file.fileSize,
      }));
    } else if (listing.files && typeof listing.files === 'string') {
      try {
        skillFiles = JSON.parse(listing.files);
      } catch (error) {
        console.warn('Failed to parse legacy files JSON:', error);
      }
    } else if (Array.isArray(listing.files) && (listing.files as unknown[]).length > 0) {
      skillFiles = listing.files as typeof skillFiles;
    }

    // Fallback: fetch files live from GitHub for listings that predate the pipeline
    if (skillFiles.length === 0 && listing.repoUrl) {
      try {
        const match = listing.repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (match) {
          const repoOwner = match[1];
          const repoName = match[2].replace(/\.git$/, '');
          const skillPath = listing.repoPath ?? '';

          const fetched = await collectSkillFiles(repoOwner, repoName, skillPath);
          skillFiles = fetched.map((f) => ({
            name: f.fileName,
            path: f.filePath,
            content: f.fileContent,
            type: f.fileType,
            executable: f.isExecutable,
            size: f.fileSize,
          }));
        }
      } catch (err) {
        console.warn('Registry: live GitHub fetch failed for', listing.repoUrl, err);
        // Non-fatal — return with empty files rather than 500
      }
    }

    // CLI-specific response format
    const registryResponse = {
      id: `${author}_${slug}`,
      author: listing.authorHandle,
      slug: listing.slug,
      name: listing.name,
      description: listing.description,
      long_description: listing.longDescription,
      version: listing.version || "1.0.0",
      repository: listing.repoUrl,
      homepage: listing.homepageUrl,
      files: skillFiles,
      dependencies: {
        skills: listing.skillDependencies || [],
        npm: listing.npmDependencies || [],
        binaries: listing.binaryDependencies || []
      },
      metadata: {
        category: listing.category,
        tags: listing.tags || [],
        language: listing.language,
        framework: listing.framework,
        trigger_words: listing.triggerWords || [],
        install_count: listing.totalInstalls,
        vote_count: listing.voteCount,
        github_stars: listing.githubStars,
        created_at: listing.createdAt,
        updated_at: listing.updatedAt,
        first_seen_at: listing.firstSeenAt
      }
    };

    return NextResponse.json(registryResponse);
  } catch (error) {
    console.error('Registry API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}