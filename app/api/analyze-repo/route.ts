import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

// Initialize Octokit with GitHub token if available
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN, // Optional: for higher rate limits
});

interface RepoAnalysis {
  folders: string[];
  readme: string | null;
  license: string | null;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const { repoUrl } = await request.json();

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

      // Get README content
      try {
        const readmeFiles = ['README.md', 'readme.md', 'README.MD', 'README.txt', 'README'];
        
        for (const readmeFile of readmeFiles) {
          try {
            const { data: readmeData } = await octokit.rest.repos.getContent({
              owner,
              repo,
              path: readmeFile,
            });

            if ('content' in readmeData && readmeData.content) {
              analysis.readme = Buffer.from(readmeData.content, 'base64').toString('utf-8');
              break;
            }
          } catch (error) {
            // Continue to next README filename
            continue;
          }
        }
      } catch (error) {
        console.warn('Could not fetch README:', error);
      }

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

      throw error;
    }

    return NextResponse.json(analysis);

  } catch (error: any) {
    console.error('Repository analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze repository. Please check the URL and try again.' },
      { status: 500 }
    );
  }
}