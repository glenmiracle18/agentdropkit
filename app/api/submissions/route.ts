import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { z } from "zod";
import { SkillParser, type SkillFile } from "@/lib/skill-parser";
import { Octokit } from '@octokit/rest';
import { generateInstallCommand } from "@/lib/install-command";

const submissionSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  description: z.string().min(10, "Description must be at least 10 characters").max(1000, "Description must be less than 1000 characters"),
  longDescription: z.string().min(10, "Long description is required"),
  type: z.enum(["skill", "mcp", "tool"]),
  category: z.string().min(1, "Category is required"),
  repoUrl: z.string().url("Must be a valid URL"),
  repoPath: z.string().optional(),
  tags: z.array(z.string()).default([]),
  authorHandle: z.string().min(1, "Author handle is required"),
  compatibleAgents: z.array(z.string()).min(1, "At least one compatible agent is required"),
  triggerWords: z.array(z.string()).default([]),
  isOpenSource: z.boolean().default(true),
  license: z.string().min(1, "License is required"),
  documentation: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  overview: z.string().optional(),
  selectedSkillPath: z.string().optional(),
});

// Initialize Octokit
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

// Helper function to collect all files in a skill directory
async function collectSkillFiles(
  owner: string,
  repo: string,
  dirPath: string,
  currentPath: string = ''
): Promise<SkillFile[]> {
  const skillFiles: SkillFile[] = [];
  
  try {
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: dirPath ? `${dirPath}${currentPath ? `/${currentPath}` : ''}` : currentPath,
    });

    if (!Array.isArray(contents)) return skillFiles;

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
        const subFiles = await collectSkillFiles(owner, repo, dirPath, relativePath);
        skillFiles.push(...subFiles);
      }
    }
  } catch (error) {
    console.warn(`Could not collect files from ${dirPath}/${currentPath}:`, error);
  }

  return skillFiles;
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = submissionSchema.parse(body);

    // Create slug from name
    const slug = validatedData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    // Generate install command
    const installCommand = generateInstallCommand({
      repoUrl: validatedData.repoUrl,
      authorHandle: validatedData.authorHandle,
      skillName: validatedData.name
    });

    // Check if a submission with this repo URL and path already exists
    const existingSubmission = await db.submission.findFirst({
      where: {
        repoUrl: validatedData.repoUrl,
        repoPath: validatedData.repoPath || null,
      },
    });

    if (existingSubmission) {
      return NextResponse.json(
        { error: "A submission with this repository URL and path already exists" },
        { status: 409 }
      );
    }

    // Create submission
    const submission = await db.submission.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        longDescription: validatedData.longDescription,
        type: validatedData.type,
        category: validatedData.category,
        repoUrl: validatedData.repoUrl,
        repoPath: validatedData.repoPath || null,
        installCommand: installCommand,
        tags: validatedData.tags,
        authorHandle: validatedData.authorHandle,
        compatibleAgents: validatedData.compatibleAgents,
        triggerWords: validatedData.triggerWords,
        isOpenSource: validatedData.isOpenSource,
        license: validatedData.license,
        documentation: validatedData.documentation || null,
        overview: validatedData.overview || null,
        status: "pending",
        userId: session.user.id,
      },
    });

    // If this is a skill submission with a selected skill path, parse and store the skill
    if (validatedData.type === 'skill' && validatedData.selectedSkillPath) {
      try {
        const [, owner, repoName] = validatedData.repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/) || [];
        const repo = repoName?.replace(/\.git$/, '');
        
        if (owner && repo) {
          // Re-analyze the repository to get skill data
          const skillPath = validatedData.selectedSkillPath === 'root' ? '' : validatedData.selectedSkillPath;
          const skillFiles = await collectSkillFiles(owner, repo, skillPath);
          
          // Get SKILL.md content
          const skillMdPath = skillPath ? `${skillPath}/SKILL.md` : 'SKILL.md';
          const skillMdFile = skillFiles.find(f => f.fileName.toLowerCase() === 'skill.md');
          
          if (skillMdFile) {
            const parsedSkill = SkillParser.parseSkill(skillMdFile.fileContent, skillFiles);
            
            // Create Listing for the skill
            const listing = await db.listing.create({
              data: {
                slug,
                name: validatedData.name,
                type: 'skill',
                description: validatedData.description,
                longDescription: validatedData.longDescription,
                authorHandle: validatedData.authorHandle,
                repoUrl: validatedData.repoUrl,
                repoPath: validatedData.repoPath,
                installCommand: installCommand,
                category: validatedData.category,
                tags: validatedData.tags,
                compatibleAgents: validatedData.compatibleAgents,
                triggerWords: validatedData.triggerWords,
                isOpenSource: validatedData.isOpenSource,
                license: validatedData.license,
                documentation: validatedData.documentation,
                overview: validatedData.overview,
                files: JSON.stringify(skillFiles),
              },
            });

            // Create Skill record
            const skill = await db.skill.create({
              data: {
                listingId: listing.id,
                name: parsedSkill.metadata.name,
                description: parsedSkill.metadata.description,
                instructions: parsedSkill.instructions,
                fileStructure: parsedSkill.fileStructure,
                triggerKeywords: parsedSkill.triggerKeywords,
              },
            });

            // Create SkillFile records
            await db.skillFile.createMany({
              data: skillFiles.map(file => ({
                skillId: skill.id,
                filePath: file.filePath,
                fileName: file.fileName,
                fileContent: file.fileContent,
                fileType: file.fileType,
                isExecutable: file.isExecutable,
                fileSize: file.fileSize,
              })),
            });
          }
        }
      } catch (skillError) {
        console.error('Failed to store skill data:', skillError);
        // Don't fail the submission if skill parsing fails
      }
    }

    return NextResponse.json({
      id: submission.id,
      message: "Submission created successfully",
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid data", details: error.errors },
        { status: 400 }
      );
    }

    console.error("Submission error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}