/**
 * Shared GitHub API helpers used across submission + approval flows.
 * All file-content fetching lives here — nowhere else should construct Octokit
 * calls for skill file collection.
 */

import { Octokit } from "@octokit/rest";
import { SkillParser, type SkillFile } from "./skill-parser";

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

/** Per-file size guard: skip files larger than 100 KB to avoid memory/DB bloat. */
const MAX_FILE_BYTES = 100_000;

/** Maximum number of files collected across the whole skill directory tree. */
const MAX_SKILL_FILES = 50;

/** Maximum directory recursion depth. */
const MAX_DEPTH = 5;

/**
 * Return the SHA of the latest commit on the default branch.
 * Used at submission time to pin the exact version being submitted.
 * Returns null if the request fails (non-fatal — approval will fetch HEAD).
 */
export async function getRepoCommitSha(
  owner: string,
  repo: string,
): Promise<string | null> {
  try {
    const { data } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      per_page: 1,
    });
    return data[0]?.sha ?? null;
  } catch {
    return null;
  }
}

/**
 * Fetch the raw text content of SKILL.md at a given path.
 * Optional `ref` pins the fetch to a specific commit SHA.
 * Returns null if the file is not found or the request fails.
 */
export async function fetchSkillMd(
  owner: string,
  repo: string,
  skillPath: string,
  ref?: string,
): Promise<string | null> {
  try {
    const filePath = skillPath ? `${skillPath}/SKILL.md` : "SKILL.md";
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ...(ref ? { ref } : {}),
    });

    if ("content" in data && data.content) {
      return Buffer.from(data.content, "base64").toString("utf-8");
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Recursively fetch every file inside a skill directory from GitHub.
 *
 * @param owner       - GitHub repository owner
 * @param repo        - Repository name
 * @param dirPath     - Root path of the skill within the repo (empty string = repo root)
 * @param ref         - Optional commit SHA to pin the fetch to a specific version
 * @param currentPath - Internal recursion cursor (leave empty on first call)
 * @param _counter    - Internal shared counter for total files collected (leave undefined)
 * @param _depth      - Internal recursion depth tracker (leave undefined)
 */
export async function collectSkillFiles(
  owner: string,
  repo: string,
  dirPath: string,
  ref?: string,
  currentPath: string = "",
  _counter: { n: number } = { n: 0 },
  _depth: number = 0,
): Promise<SkillFile[]> {
  // C-2: Guard against runaway recursion and unbounded file collection.
  if (_depth >= MAX_DEPTH || _counter.n >= MAX_SKILL_FILES) return [];

  const skillFiles: SkillFile[] = [];

  try {
    const fetchPath = dirPath
      ? `${dirPath}${currentPath ? `/${currentPath}` : ""}`
      : currentPath;

    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: fetchPath,
      ...(ref ? { ref } : {}),
    });

    if (!Array.isArray(contents)) return skillFiles;

    for (const item of contents) {
      // Stop as soon as we've hit the cap
      if (_counter.n >= MAX_SKILL_FILES) break;

      const relativePath = currentPath
        ? `${currentPath}/${item.name}`
        : item.name;

      if (item.type === "file") {
        // H-4: Skip files that are too large to avoid memory and DB bloat
        if (item.size > MAX_FILE_BYTES) {
          console.warn(
            `collectSkillFiles: skipping large file ${item.path} (${item.size} bytes)`,
          );
          continue;
        }

        try {
          const { data: fileData } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: item.path,
            ...(ref ? { ref } : {}),
          });

          if ("content" in fileData && fileData.content) {
            const fileContent = Buffer.from(
              fileData.content,
              "base64",
            ).toString("utf-8");

            skillFiles.push({
              filePath: relativePath,
              fileName: item.name,
              fileContent,
              fileType: SkillParser.determineFileType(relativePath, fileContent),
              isExecutable: SkillParser.isExecutable(relativePath),
              fileSize: Buffer.byteLength(fileContent, "utf8"),
            });

            _counter.n++;
          }
        } catch (fileError) {
          console.warn(`Could not read file ${item.path}:`, fileError);
        }
      } else if (item.type === "dir") {
        const subFiles = await collectSkillFiles(
          owner,
          repo,
          dirPath,
          ref,
          relativePath,
          _counter,
          _depth + 1,
        );
        skillFiles.push(...subFiles);
      }
    }
  } catch (error) {
    console.warn(
      `Could not list directory ${dirPath}/${currentPath}:`,
      error,
    );
  }

  return skillFiles;
}
