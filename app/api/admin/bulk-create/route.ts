import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';
import { SkillParser } from '@/lib/skill-parser';
import { collectSkillFiles } from '@/lib/github';
import { generateInstallCommand } from '@/lib/install-command';
import { z } from 'zod';

export const maxDuration = 300;

const skillInputSchema = z.object({
  repoUrl: z.string().url(),
  skillPath: z.string(),   // '' or 'root' for repo root, else subdir path
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(1000),
  tags: z.array(z.string().max(50)),
  category: z.string().min(1),
  type: z.enum(['skill', 'mcp', 'tool']),
  compatibleAgents: z.array(z.string()).default([]),
  triggerWords: z.array(z.string()).default([]),
  owner: z.string().min(1),
  repo: z.string().min(1),
});

const bulkCreateSchema = z.object({
  skills: z.array(skillInputSchema).min(1).max(50),
});

export interface BulkCreateResult {
  repoUrl: string;
  skillPath: string;
  status: 'created' | 'skipped' | 'failed';
  slug?: string;
  error?: string;
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = bulkCreateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request body', details: parsed.error.issues }, { status: 400 });
  }

  const { skills } = parsed.data;

  // ── Phase 1: Fetch GitHub files in parallel (no DB, safe to parallelise) ──
  type FetchedSkill = {
    input: typeof skills[number];
    parsedSkillData: ReturnType<typeof SkillParser.parseSkill> | null;
    slug: string;
    installCommand: string;
    normalizedCategory: string;
    actualSkillPath: string;
  };

  const fetched = await Promise.all(
    skills.map(async (skillInput): Promise<FetchedSkill> => {
      const { repoUrl, skillPath, name, category, owner, repo } = skillInput;
      const actualSkillPath = (skillPath === 'root' || skillPath === '') ? '' : skillPath;

      const normalizedCategory = category.toLowerCase().replace(/\s+/g, '-');
      const installCommand = generateInstallCommand({ repoUrl, authorHandle: owner, skillName: name });

      let parsedSkillData: ReturnType<typeof SkillParser.parseSkill> | null = null;
      try {
        const skillFiles = await collectSkillFiles(owner, repo, actualSkillPath);
        const skillMdFile = skillFiles.find(f => f.fileName.toLowerCase() === 'skill.md');
        if (skillMdFile) {
          parsedSkillData = SkillParser.parseSkill(skillMdFile.fileContent, skillFiles);
        }
      } catch (err) {
        console.warn(`bulk-create: failed to fetch skill files for ${repoUrl}/${skillPath}:`, err);
      }

      // Resolve unique slug here (read-only query, fine in parallel)
      const baseSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim() || 'skill';
      let slug = baseSlug;
      let counter = 1;
      while (await db.listing.findUnique({ where: { slug } })) {
        slug = `${baseSlug}-${counter++}`;
      }

      return { input: skillInput, parsedSkillData, slug, installCommand, normalizedCategory, actualSkillPath };
    })
  );

  // ── Phase 2: DB writes one at a time — avoids NeonDB connection exhaustion ─
  const formattedResults: BulkCreateResult[] = [];

  for (const { input, parsedSkillData, slug, installCommand, normalizedCategory, actualSkillPath } of fetched) {
    const { repoUrl, skillPath, name, description, tags, type, compatibleAgents, triggerWords, owner } = input;
    try {
      await db.$transaction(async (tx) => {
        const listing = await tx.listing.create({
          data: {
            slug,
            name,
            type,
            description,
            authorHandle: owner,
            repoUrl,
            repoPath: actualSkillPath || null,
            installCommand,
            category: normalizedCategory,
            tags,
            compatibleAgents,
            triggerWords,
            isOpenSource: true,
            license: 'MIT',
            isOfficial: false,
            isSafe: false,
            healthScore: 50,
            githubStars: 0,
            weeklyInstalls: 0,
            totalInstalls: 0,
            voteCount: 0,
            files: '[]',
            agentsInstalledOn: '{}',
          },
        });

        if (parsedSkillData) {
          const skill = await tx.skill.create({
            data: {
              listingId: listing.id,
              name: String(parsedSkillData.metadata.name || name),
              description: String(parsedSkillData.metadata.description || description),
              instructions: parsedSkillData.instructions,
              fileStructure: parsedSkillData.fileStructure as Prisma.InputJsonValue,
              triggerKeywords: parsedSkillData.triggerKeywords,
            },
          });

          if (parsedSkillData.files.length > 0) {
            await tx.skillFile.createMany({
              data: parsedSkillData.files.map(f => ({
                skillId: skill.id,
                filePath: f.filePath,
                fileName: f.fileName,
                fileContent: f.fileContent,
                fileType: f.fileType,
                isExecutable: f.isExecutable,
                fileSize: f.fileSize,
              })),
              skipDuplicates: true,
            });
          }
        }
      });

      formattedResults.push({ repoUrl, skillPath, status: 'created', slug });
    } catch (err) {
      const e = err as Error;
      const isPrismaConflict =
        e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002';
      formattedResults.push({
        repoUrl,
        skillPath,
        status: 'failed',
        error: isPrismaConflict ? 'A listing with this name already exists' : e.message,
      });
    }
  }

  const createdCount = formattedResults.filter(r => r.status === 'created').length;
  const failedCount = formattedResults.filter(r => r.status === 'failed').length;

  return NextResponse.json({
    results: formattedResults,
    summary: { created: createdCount, failed: failedCount, total: formattedResults.length },
  });
}
