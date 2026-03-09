import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { SkillParser, type SkillFile } from '@/lib/skill-parser';

// Increase serverless function timeout on Vercel
export const maxDuration = 30;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const MAX_FILES_PER_SKILL = 30;

interface RepoAnalysis {
  folders: string[];
  readme: string | null;
  license: string | null;
  skills: {
    [path: string]: ReturnType<typeof SkillParser.parseSkill>;
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    let body: { repoUrl?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { repoUrl } = body;
    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    const githubUrlPattern = /github\.com\/([^/]+)\/([^/]+)/;
    const match = repoUrl.match(githubUrlPattern);
    if (!match) {
      return NextResponse.json({ error: 'Invalid GitHub repository URL' }, { status: 400 });
    }

    const [, owner, repoName] = match;
    const repo = repoName.replace(/\.git$/, '');

    // 1. Fetch repo metadata + full recursive tree in parallel — 2 API calls total
    let repoData: Awaited<ReturnType<typeof octokit.rest.repos.get>>['data'] | null = null;
    let treeItems: { path?: string; type?: string }[] = [];

    try {
      const [repoResult, treeResult] = await Promise.all([
        octokit.rest.repos.get({ owner, repo }),
        octokit.rest.git.getTree({ owner, repo, tree_sha: 'HEAD', recursive: '1' }),
      ]);
      repoData = repoResult.data;
      treeItems = treeResult.data.tree;
    } catch (error: unknown) {
      const e = error as { status?: number };
      if (e.status === 404) {
        return NextResponse.json({ error: 'Repository not found or not accessible' }, { status: 404 });
      }
      if (e.status === 403) {
        return NextResponse.json({ error: 'GitHub API rate limit exceeded. Please try again later.' }, { status: 429 });
      }
      throw error;
    }

    // 2. Extract folder list from tree (no extra API calls needed)
    const folders = treeItems
      .filter(item => item.type === 'tree')
      .map(item => item.path!)
      .sort();

    // 3. Find all SKILL.md files in the tree
    const skillMdItems = treeItems.filter(
      item =>
        item.type === 'blob' &&
        (item.path?.toLowerCase() === 'skill.md' ||
          item.path?.toLowerCase().endsWith('/skill.md'))
    );

    // 4. For each SKILL.md, fetch its content + direct sibling files in parallel
    const skillEntries = await Promise.all(
      skillMdItems.map(async skillMd => {
        const skillPath = skillMd.path!;
        const skillDir = skillPath.includes('/')
          ? skillPath.substring(0, skillPath.lastIndexOf('/'))
          : '';

        // Only files that live directly inside this skill directory (non-recursive)
        const siblingItems = treeItems.filter(item => {
          if (item.type !== 'blob' || !item.path) return false;
          if (skillDir === '') {
            return !item.path.includes('/');
          }
          const relative = item.path.substring(skillDir.length + 1);
          return item.path.startsWith(skillDir + '/') && !relative.includes('/');
        });

        const filesToFetch = siblingItems.slice(0, MAX_FILES_PER_SKILL);

        const fileResults = await Promise.all(
          filesToFetch.map(async item => {
            try {
              const { data } = await octokit.rest.repos.getContent({
                owner,
                repo,
                path: item.path!,
              });
              if (!('content' in data) || !data.content) return null;
              const fileContent = Buffer.from(data.content, 'base64').toString('utf-8');
              const relativePath = skillDir
                ? item.path!.substring(skillDir.length + 1)
                : item.path!;
              return {
                filePath: relativePath,
                fileName: item.path!.split('/').pop()!,
                fileContent,
                fileType: SkillParser.determineFileType(relativePath, fileContent),
                isExecutable: SkillParser.isExecutable(relativePath),
                fileSize: Buffer.byteLength(fileContent, 'utf8'),
              } satisfies SkillFile;
            } catch {
              return null;
            }
          })
        );

        const skillFiles = fileResults.filter((f): f is SkillFile => f !== null);
        const skillMdFile = skillFiles.find(f => f.fileName.toLowerCase() === 'skill.md');
        if (!skillMdFile) return null;

        try {
          const parsed = SkillParser.parseSkill(skillMdFile.fileContent, skillFiles);
          return [skillDir || 'root', parsed] as const;
        } catch (e) {
          console.warn(`Failed to parse skill at ${skillDir}:`, e);
          return null;
        }
      })
    );

    const skills = Object.fromEntries(
      skillEntries.filter(
        (e): e is [string, ReturnType<typeof SkillParser.parseSkill>] => e !== null
      )
    );

    const analysis: RepoAnalysis = {
      folders,
      readme: null,
      license: repoData?.license?.spdx_id ?? null,
      skills,
    };

    return NextResponse.json(analysis);

  } catch (error: unknown) {
    console.error('Repository analysis error:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to analyze repository',
        folders: [],
        readme: null,
        license: null,
        skills: {},
      },
      { status: 500 }
    );
  }
}
