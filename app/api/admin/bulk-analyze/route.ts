import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { SkillParser } from '@/lib/skill-parser';

export const maxDuration = 60;

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const MAX_REPOS = 10;
const MAX_SKILLS_PER_REPO = 20;

function parseGitHubUrl(rawUrl: string): { owner: string; repo: string } | null {
  let url: URL;
  try { url = new URL(rawUrl.trim()); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;
  const parts = url.pathname.replace(/^\//, '').split('/');
  const owner = parts[0];
  const repoRaw = parts[1];
  if (!owner || !repoRaw) return null;
  const repo = repoRaw.replace(/\.git$/, '');
  const valid = /^[a-zA-Z0-9_.-]+$/;
  if (!valid.test(owner) || !valid.test(repo)) return null;
  return { owner, repo };
}

export interface AnalyzedSkill {
  path: string;       // '' or 'root' for repo-root skills, else 'subdir/name'
  owner: string;
  repo: string;
  name: string;
  description: string;
  tags: string[];
  triggerKeywords: string[];
  category: string;
  type: 'skill' | 'mcp' | 'tool';
  alreadyExists: boolean;
}

export interface AnalyzeRepoResult {
  repoUrl: string;
  skills: AnalyzedSkill[];
  error?: string;
}

async function analyzeRepo(
  repoUrl: string,
  existingKeys: Set<string>,
): Promise<AnalyzeRepoResult> {
  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) {
    return { repoUrl, skills: [], error: 'Invalid GitHub URL — must be https://github.com/owner/repo' };
  }
  const { owner, repo } = parsed;

  try {
    const treeResult = await octokit.rest.git.getTree({
      owner, repo, tree_sha: 'HEAD', recursive: '1',
    });

    const skillMdItems = treeResult.data.tree
      .filter(item =>
        item.type === 'blob' &&
        (item.path?.toLowerCase() === 'skill.md' ||
          item.path?.toLowerCase().endsWith('/skill.md'))
      )
      .slice(0, MAX_SKILLS_PER_REPO);

    if (skillMdItems.length === 0) {
      return { repoUrl, skills: [], error: 'No SKILL.md files found in this repository' };
    }

    const skills = await Promise.all(
      skillMdItems.map(async (item) => {
        const skillMdPath = item.path!;
        const skillDir = skillMdPath.includes('/')
          ? skillMdPath.substring(0, skillMdPath.lastIndexOf('/'))
          : '';

        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner, repo, path: skillMdPath,
          });

          if (!('content' in fileData) || !fileData.content) return null;

          const content = Buffer.from(fileData.content, 'base64').toString('utf-8');

          // Parse with just the SKILL.md file to extract metadata
          const dummyFiles = [{
            filePath: 'SKILL.md',
            fileName: 'SKILL.md',
            fileContent: content,
            fileType: 'markdown' as const,
            isExecutable: false,
            fileSize: Buffer.byteLength(content, 'utf8'),
          }];

          const parsed = SkillParser.parseSkill(content, dummyFiles);
          const meta = parsed.metadata;

          // Duplicate detection: match on repoUrl + skillDir
          const normalizedRepoUrl = `https://github.com/${owner}/${repo}`;
          const existenceKey = skillDir
            ? `${normalizedRepoUrl}::${skillDir}`
            : normalizedRepoUrl;
          const alreadyExists = existingKeys.has(existenceKey);

          return {
            path: skillDir,
            owner,
            repo,
            name: String(meta.name || repo),
            description: String(meta.description || ''),
            tags: parsed.triggerKeywords.slice(0, 5),
            triggerKeywords: parsed.triggerKeywords,
            category: String((meta as { category?: unknown }).category || 'research'),
            type: 'skill' as const,
            alreadyExists,
          } satisfies AnalyzedSkill;
        } catch {
          return null;
        }
      })
    );

    return {
      repoUrl,
      skills: skills.filter((s): s is AnalyzedSkill => s !== null),
    };
  } catch (error: unknown) {
    const e = error as { status?: number };
    if (e.status === 404) return { repoUrl, skills: [], error: 'Repository not found or is private' };
    if (e.status === 403) return { repoUrl, skills: [], error: 'GitHub API rate limit exceeded — try again later' };
    return { repoUrl, skills: [], error: 'Failed to analyze repository' };
  }
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

  let body: { repoUrls?: unknown };
  try { body = await request.json(); } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (!Array.isArray(body.repoUrls) || body.repoUrls.length === 0) {
    return NextResponse.json({ error: 'repoUrls must be a non-empty array' }, { status: 400 });
  }

  const repoUrls = (body.repoUrls as unknown[])
    .filter((u): u is string => typeof u === 'string' && u.trim().length > 0)
    .map(u => u.trim())
    .slice(0, MAX_REPOS);

  // Pre-fetch existing listing keys for fast duplicate detection
  const existing = await db.listing.findMany({ select: { repoUrl: true, repoPath: true } });
  const existingKeys = new Set(
    existing.map(l => l.repoPath ? `${l.repoUrl}::${l.repoPath}` : l.repoUrl)
  );

  const results = await Promise.all(
    repoUrls.map(url => analyzeRepo(url, existingKeys))
  );

  return NextResponse.json({ results });
}
