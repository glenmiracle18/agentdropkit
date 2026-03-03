import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { SkillParser, type SkillFile } from '@/lib/skill-parser';

// Initialize Octokit with GitHub token if available
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Optional: for higher rate limits
});

// Helper function to recursively detect skills in directories
async function detectSkills(
  owner: string, 
  repo: string, 
  path: string, 
  analysis: RepoAnalysis, 
  depth: number = 0
): Promise<void> {
  // Limit recursion depth to prevent excessive API calls
  if (depth > 3) return;

  try {
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path,
    });

    if (!Array.isArray(contents)) return;

    // Check if this directory contains a SKILL.md file
    const skillMdFile = contents.find(
      item => item.type === 'file' && item.name.toLowerCase() === 'skill.md'
    );

    if (skillMdFile) {
      try {
        // Get SKILL.md content
        const { data: skillMdData } = await octokit.rest.repos.getContent({
          owner,
          repo,
          path: skillMdFile.path,
        });

        if ('content' in skillMdData && skillMdData.content) {
          const skillMdContent = Buffer.from(skillMdData.content, 'base64').toString('utf-8');

          // Get all files in the skill directory
          const skillFiles: SkillFile[] = [];
          await collectSkillFiles(owner, repo, path, skillFiles);

          // Parse the skill using SkillParser
          const parsedSkill = SkillParser.parseSkill(skillMdContent, skillFiles);

          // Store the parsed skill
          const skillPath = path || 'root';
          analysis.skills[skillPath] = parsedSkill;
        }
      } catch (skillError) {
        console.warn(`Failed to parse skill at ${path}:`, skillError);
      }
    }

    // Recursively check subdirectories
    const directories = contents.filter(item => item.type === 'dir');
    for (const dir of directories) {
      await detectSkills(owner, repo, dir.path, analysis, depth + 1);
    }

  } catch (error) {
    console.warn(`Could not access directory ${path}:`, error);
  }
}

// Helper function to collect all files in a skill directory
async function collectSkillFiles(
  owner: string,
  repo: string,
  dirPath: string,
  skillFiles: SkillFile[],
  currentPath: string = ''
): Promise<void> {
  try {
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: dirPath ? `${dirPath}${currentPath ? `/${currentPath}` : ''}` : currentPath,
    });

    if (!Array.isArray(contents)) return;

    for (const item of contents) {
      const relativePath = currentPath ? `${currentPath}/${item.name}` : item.name;

      if (item.type === 'file') {
        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path,
          });

          if ('content' in fileData && fileData.content) {
            const fileContent = Buffer.from(fileData.content, 'base64').toString('utf-8');

            skillFiles.push({
              filePath: relativePath,
              fileName: item.name,
              fileContent,
              fileType: SkillParser.determineFileType(relativePath, fileContent),
              isExecutable: SkillParser.isExecutable(relativePath),
              fileSize: Buffer.byteLength(fileContent, 'utf8'),
            });
          }
        } catch (fileError) {
          console.warn(`Could not read file ${item.path}:`, fileError);
        }
      } else if (item.type === 'dir') {
        // Recursively collect files from subdirectories
        await collectSkillFiles(owner, repo, dirPath, skillFiles, relativePath);
      }
    }
  } catch (error) {
    console.warn(`Could not collect files from ${dirPath}/${currentPath}:`, error);
  }
}

interface RepoAnalysis {
  folders: string[];
  readme: string | null;
  license: string | null;
  skills: {
    [path: string]: {
      metadata: {
        name: string;
        description: string;
        [key: string]: any;
      };
      instructions: string;
      files: SkillFile[];
      fileStructure: Record<string, any>;
      triggerKeywords: string[];
    };
  };
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      );
    }

    const { repoUrl } = body;

    if (!repoUrl) {
      return NextResponse.json(
        { error: 'Repository URL is required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL to extract owner and repo
    const githubUrlPattern = /github\.com\/([^\/]+)\/([^\/]+)/;
    const match = repoUrl.match(githubUrlPattern);

    if (!match) {
      return NextResponse.json(
        { error: 'Invalid GitHub repository URL' },
        { status: 400 }
      );
    }

    const [, owner, repoName] = match;
    const repo = repoName.replace(/\.git$/, ''); // Remove .git extension if present

    const analysis: RepoAnalysis = {
      folders: [],
      readme: null,
      license: null,
      skills: {},
    };

    try {
      // Get repository contents to find folders
      const { data: contents } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: '',
      });

      if (Array.isArray(contents)) {
        // Filter for directories and get their paths
        analysis.folders = contents
          .filter(item => item.type === 'dir')
          .map(item => item.name)
          .sort();

        // Recursively get subdirectories up to 2 levels deep
        for (const folder of analysis.folders.slice()) {
          try {
            const { data: subContents } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: folder,
            });

            if (Array.isArray(subContents)) {
              const subFolders = subContents
                .filter(item => item.type === 'dir')
                .map(item => `${folder}/${item.name}`);
              
              analysis.folders.push(...subFolders);
            }
          } catch (error) {
            // Skip if we can't access this folder
            console.warn(`Could not access folder ${folder}:`, error);
          }
        }

        analysis.folders.sort();
      }

      // Skip README fetching - not needed for skill submission

      // Get license information
      try {
        const { data: licenseData } = await octokit.rest.repos.get({
          owner,
          repo,
        });

        if (licenseData.license?.spdx_id) {
          analysis.license = licenseData.license.spdx_id;
        }
      } catch (error) {
        console.warn('Could not fetch license:', error);
      }

      // Detect and parse skills in all directories
      await detectSkills(owner, repo, '', analysis);

    } catch (error: any) {
      console.error('GitHub API error:', error);
      
      if (error.status === 404) {
        return NextResponse.json(
          { error: 'Repository not found or not accessible' },
          { status: 404 }
        );
      }
      
      if (error.status === 403) {
        return NextResponse.json(
          { error: 'GitHub API rate limit exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      // Return JSON error instead of throwing
      return NextResponse.json(
        { error: `GitHub API error: ${error.message || 'Unknown error'}` },
        { status: error.status || 500 }
      );
    }

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Repository analysis error:', error);
    
    // Ensure we always return a JSON response
    const errorMessage = error instanceof Error 
      ? error.message 
      : 'Failed to analyze repository. Please check the URL and try again.';
    
    return NextResponse.json(
      { 
        error: errorMessage,
        folders: [],
        readme: null,
        license: null,
        skills: {}
      },
      { status: 500 }
    );
  }
}