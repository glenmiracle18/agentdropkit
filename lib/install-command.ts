/**
 * Utility functions for generating AgentDropkit CLI installation commands
 * Based on the CLI Registry Design document
 */

export interface InstallCommandOptions {
  repoUrl: string;
  authorHandle: string;
  slug?: string;
  skillName?: string;
}

/**
 * Generates the installation command for a skill based on its repository URL
 * Follows patterns from CLI_REGISTRY_DESIGN.md:
 * - npx agentdropkit add vercel/agent-browser
 * - npx agentdropkit add glen/web-scraper
 * - npx agentdropkit add coding-standards (for skills with single names)
 */
export function generateInstallCommand({
  repoUrl,
  authorHandle,
  slug,
  skillName,
}: InstallCommandOptions): string {
  // Clean up repository URL to extract meaningful parts. remove https frontmatter and the .git at the end if it exists
  const cleanUrl = repoUrl.replace(/^https?:\/\//, "").replace(/\.git$/, "");

  // Extract repository info from different URL formats
  let repoInfo = extractRepositoryInfo(cleanUrl);

  // Generate the skill identifier for the CLI command
  let skillIdentifier: string;

  if (repoInfo) {
    // Use repository-based identifier: owner/repo-name
    skillIdentifier = `${repoInfo.owner}/${repoInfo.name}`;
  } else if (slug) {
    // Use author/slug format
    skillIdentifier = `${authorHandle}/${slug}`;
  } else if (skillName) {
    // For single-name skills, check if it's a common name that doesn't need author prefix
    const commonSkills = ["coding-standards", "git-workflows", "web-utils"];
    if (commonSkills.includes(skillName.toLowerCase().replace(/\s+/g, "-"))) {
      skillIdentifier = skillName.toLowerCase().replace(/\s+/g, "-");
    } else {
      skillIdentifier = `${authorHandle}/${skillName.toLowerCase().replace(/\s+/g, "-")}`;
    }
  } else {
    // Fallback to author/repo format
    skillIdentifier = `${authorHandle}/skill`;
  }

  return `npx agentdropkit add ${skillIdentifier}`;
}

/**
 * Extract repository information from various URL formats
 */
function extractRepositoryInfo(
  cleanUrl: string,
): { owner: string; name: string } | null {
  // GitHub patterns
  const githubMatch = cleanUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
  if (githubMatch) {
    return {
      owner: githubMatch[1],
      name: githubMatch[2],
    };
  }

  // GitLab patterns
  const gitlabMatch = cleanUrl.match(/gitlab\.com\/([^\/]+)\/([^\/]+)/);
  if (gitlabMatch) {
    return {
      owner: gitlabMatch[1],
      name: gitlabMatch[2],
    };
  }

  // Bitbucket patterns
  const bitbucketMatch = cleanUrl.match(/bitbucket\.org\/([^\/]+)\/([^\/]+)/);
  if (bitbucketMatch) {
    return {
      owner: bitbucketMatch[1],
      name: bitbucketMatch[2],
    };
  }

  // Codeberg patterns
  const codebergMatch = cleanUrl.match(/codeberg\.org\/([^\/]+)\/([^\/]+)/);
  if (codebergMatch) {
    return {
      owner: codebergMatch[1],
      name: codebergMatch[2],
    };
  }

  return null;
}

/**
 * Generate installation command with scope options for display in UI
 */
export function generateInstallCommandWithScopes({
  repoUrl,
  authorHandle,
  slug,
  skillName,
}: InstallCommandOptions) {
  const baseCommand = generateInstallCommand({
    repoUrl,
    authorHandle,
    slug,
    skillName,
  });

  return {
    global: `${baseCommand} --global`,
    project: `${baseCommand} --project`,
    default: baseCommand,
  };
}

/**
 * Validate if a repository URL is supported for CLI installation
 */
export function isValidRepositoryUrl(repoUrl: string): boolean {
  const cleanUrl = repoUrl.replace(/^https?:\/\//, "").replace(/\.git$/, "");

  const supportedHosts = [
    "github.com",
    "gitlab.com",
    "bitbucket.org",
    "codeberg.org",
  ];

  return supportedHosts.some((host) => cleanUrl.includes(host));
}

/**
 * Get the display name for the skill identifier used in CLI commands
 */
export function getSkillDisplayName({
  repoUrl,
  authorHandle,
  slug,
  skillName,
}: InstallCommandOptions): string {
  const repoInfo = extractRepositoryInfo(
    repoUrl.replace(/^https?:\/\//, "").replace(/\.git$/, ""),
  );

  if (repoInfo) {
    return `${repoInfo.owner}/${repoInfo.name}`;
  } else if (slug) {
    return `${authorHandle}/${slug}`;
  } else if (skillName) {
    const formattedName = skillName.toLowerCase().replace(/\s+/g, "-");
    const commonSkills = ["coding-standards", "git-workflows", "web-utils"];
    if (commonSkills.includes(formattedName)) {
      return formattedName;
    }
    return `${authorHandle}/${formattedName}`;
  }

  return `${authorHandle}/skill`;
}
