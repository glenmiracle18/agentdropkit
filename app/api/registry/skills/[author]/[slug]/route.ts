import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ author: string; slug: string }> }
) {
  try {
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
      return NextResponse.json(
        { error: 'Skill not found' },
        { status: 404 }
      );
    }

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