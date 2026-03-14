import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { SkillParser, type SkillFile } from '@/lib/skill-parser';

// Increase serverless function timeout on Vercel
export const maxDuration = 30;

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const MAX_FILES_PER_SKILL = 30;
const MAX_SKILLS = 50; // cap how many skill dirs we process per repo
const MAX_FILE_BYTES = 100_000; // 100 KB per file — skip anything larger

// Parse a GitHub HTTPS URL — accepts both:
//   https://github.com/<owner>/<repo>           (standard repo URL)
//   https://github.com/<owner>/<repo>/tree/<branch>/<path>  (direct skill dir URL)
// Returns { owner, repo, skillPath? } where skillPath is the subdirectory
// hint extracted from the /tree/... URL (undefined for plain repo URLs).
function parseGitHubUrl(rawUrl: string): {
  owner: string;
  repo: string;
  skillPath?: string;
} | null {
  let url: URL;
  try { url = new URL(rawUrl); } catch { return null; }
  if (url.protocol !== 'https:' || url.hostname !== 'github.com') return null;
  const parts = url.pathname.replace(/^\//, '').split('/');
  const owner = parts[0];
  const repoRaw = parts[1];
  if (!owner || !repoRaw) return null;
  const repo = repoRaw.replace(/\.git$/, '');
  // Only allow characters GitHub permits in owner/repo names
  const valid = /^[a-zA-Z0-9_.-]+$/;
  if (!valid.test(owner) || !valid.test(repo)) return null;

  // Detect /tree/<branch>/<path> — e.g. .../tree/main/finance or .../tree/main/skills/pdf
  // parts: [owner, repo, 'tree', branch, ...pathSegments]
  let skillPath: string | undefined;
  if (parts[2] === 'tree' && parts.length > 4) {
    const path = parts.slice(4).join('/').replace(/\/$/, '');
    if (path) skillPath = path;
  }

  return { owner, repo, skillPath };
}

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
  // C-1: Require authentication — prevents unauthenticated callers from
  // exhausting the server's GitHub token rate limit.
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  try {
    let body: { repoUrl?: string; skillPathHint?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
    }

    const { repoUrl, skillPathHint: bodyHint } = body;
    if (!repoUrl) {
      return NextResponse.json({ error: 'Repository URL is required' }, { status: 400 });
    }

    // C-3: Accept both plain repo URLs and direct skill directory URLs
    // (https://github.com/owner/repo/tree/branch/path)
    const parsed = parseGitHubUrl(repoUrl);
    if (!parsed) {
      return NextResponse.json(
        { error: 'URL must be a valid GitHub repository or skill directory URL (https://github.com/owner/repo)' },
        { status: 400 },
      );
    }
    const { owner, repo, skillPath: urlSkillPath } = parsed;
    // URL-extracted path takes priority over a separately-supplied hint
    const effectiveSkillPath = urlSkillPath ?? bodyHint ?? null;

    // 1. Fetch repo metadata + full recursive tree in parallel — 2 API calls total
    let repoData: Awaited<ReturnType<typeof octokit.rest.repos.get>>['data'] | null = null;
    let treeItems: { path?: string; type?: string; size?: number }[] = [];

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

    // 3. Find SKILL.md files in the tree.
    //    If a direct skill path was provided (via /tree/... URL or hint), only
    //    look in that specific directory — fast and precise.
    //    Otherwise scan the whole tree for all SKILL.md files.
    const skillMdItems = effectiveSkillPath
      ? treeItems.filter(
          item =>
            item.type === 'blob' &&
            item.path?.toLowerCase() === `${effectiveSkillPath}/skill.md`,
        )
      : treeItems.filter(
          item =>
            item.type === 'blob' &&
            (item.path?.toLowerCase() === 'skill.md' ||
              item.path?.toLowerCase().endsWith('/skill.md')),
        );

    // C-2: Cap how many skill directories we process per request to bound API usage.
    const skillMdItemsCapped = skillMdItems.slice(0, MAX_SKILLS);

    // 4. For each SKILL.md, fetch its content + direct sibling files in parallel
    const skillEntries = await Promise.all(
      skillMdItemsCapped.map(async skillMd => {
        const skillPath = skillMd.path!;
        const skillDir = skillPath.includes('/')
          ? skillPath.substring(0, skillPath.lastIndexOf('/'))
          : '';

        // All files under this skill directory (recursive — includes subfolders)
        const siblingItems = treeItems.filter(item => {
          if (item.type !== 'blob' || !item.path) return false;
          // H-4: Skip large files before fetching to avoid memory/storage bloat
          if ((item.size ?? 0) > MAX_FILE_BYTES) return false;
          if (skillDir === '') return true; // root skill — include all blobs
          return item.path.startsWith(skillDir + '/'); // subdir skill — all blobs under dir
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
          const parsedSkill = SkillParser.parseSkill(skillMdFile.fileContent, skillFiles);
          return [skillDir || 'root', parsedSkill] as const;
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
    // M-5: Log internally, return a generic message to avoid leaking internals
    console.error('Repository analysis error:', error);
    return NextResponse.json(
      {
        error: 'Repository analysis failed. Please try again.',
        folders: [],
        readme: null,
        license: null,
        skills: {},
      },
      { status: 500 }
    );
  }
}
