import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

const sampleListings = [
  // Skills
  {
    slug: 'api-scaffolder',
    name: 'API Scaffolder',
    type: 'skill' as const,
    description: 'Automatically scaffold REST APIs with CRUD operations, authentication, and documentation.',
    longDescription: '# API Scaffolder\n\nA powerful skill that generates complete REST API scaffolds with Express.js, including:\n\n- CRUD operations for any data model\n- JWT authentication middleware\n- Input validation with Joi\n- Auto-generated OpenAPI documentation\n- Database integration with Prisma or Mongoose\n\n## Usage\n\nSimply describe your data model and the skill will generate a complete, production-ready API.',
    authorHandle: 'anthropic',
    repoUrl: 'https://github.com/anthropic/skills',
    repoPath: 'api-scaffolder',
    category: 'infrastructure',
    tags: ['api', 'express', 'crud', 'auth', 'backend'],
    compatibleAgents: ['Claude', 'GPT-4', 'Codex'],
    triggerWords: ['api', 'scaffold', 'express', 'crud'],
    isOpenSource: true,
    license: 'MIT',
    isOfficial: true,
    isSafe: true,
    healthScore: 95,
    githubStars: 1247,
    weeklyInstalls: 342,
    totalInstalls: 8924,
    voteCount: 89,
    files: JSON.stringify([
      { name: 'SKILL.md', sizeKb: 4.2, content: '# API Scaffolder\n\nScaffolds REST APIs...' },
      { name: 'main.py', sizeKb: 12.8, content: 'def scaffold_api(model):\n    # Implementation here' }
    ]),
    agentsInstalledOn: { 'claude-code': 312, 'cursor': 30 }
  },
  {
    slug: 'code-reviewer',
    name: 'Code Reviewer',
    type: 'skill' as const,
    description: 'AI-powered code review that checks for bugs, security issues, and style violations.',
    longDescription: '# Code Reviewer\n\nPerforms comprehensive code reviews checking for:\n\n- Logic bugs and edge cases\n- Security vulnerabilities\n- Performance issues\n- Code style and best practices\n- Documentation quality\n\nSupports 20+ programming languages with language-specific rules.',
    authorHandle: 'anthropic',
    repoUrl: 'https://github.com/anthropic/skills',
    repoPath: 'code-reviewer',
    category: 'code-review',
    tags: ['review', 'security', 'bugs', 'quality'],
    compatibleAgents: ['Claude', 'GPT-4', 'Gemini'],
    triggerWords: ['review', 'security', 'bugs', 'quality'],
    isOpenSource: true,
    license: 'MIT',
    isOfficial: true,
    isSafe: true,
    healthScore: 98,
    githubStars: 2156,
    weeklyInstalls: 891,
    totalInstalls: 15632,
    voteCount: 142,
    files: JSON.stringify([
      { name: 'SKILL.md', sizeKb: 6.1, content: '# Code Reviewer\n\nAI-powered code reviews...' },
      { name: 'reviewer.py', sizeKb: 18.3, content: 'class CodeReviewer:\n    def review(self, code):\n        # Review implementation' }
    ]),
    agentsInstalledOn: { 'claude-code': 624, 'cursor': 267 }
  },
  {
    slug: 'github-mcp',
    name: 'GitHub MCP',
    type: 'mcp' as const,
    description: 'Complete GitHub integration with repos, issues, PRs, and workflow management.',
    longDescription: '# GitHub MCP\n\nFull GitHub integration providing:\n\n- Repository management\n- Issue and PR operations\n- Workflow automation\n- Code search and analysis\n- Team collaboration tools\n- Security and compliance checks\n\nAuthentication via GitHub Apps or personal tokens.',
    authorHandle: 'anthropic',
    repoUrl: 'https://github.com/anthropic/mcp-servers',
    repoPath: 'github',
    category: 'devops',
    tags: ['github', 'git', 'collaboration', 'ci-cd'],
    compatibleAgents: ['Claude', 'GPT-4', 'Anthropic Claude'],
    triggerWords: ['github', 'git', 'repo', 'collaboration'],
    isOpenSource: true,
    license: 'MIT',
    isOfficial: true,
    isSafe: true,
    healthScore: 96,
    githubStars: 3421,
    weeklyInstalls: 1234,
    totalInstalls: 28945,
    voteCount: 287,
    files: JSON.stringify([]),
    agentsInstalledOn: { 'claude-code': 1089, 'cursor': 145 }
  },
  {
    slug: 'json-processor',
    name: 'JSON Processor',
    type: 'tool' as const,
    description: 'Advanced JSON manipulation, validation, and transformation utilities.',
    longDescription: '# JSON Processor\n\nComprehensive JSON tools:\n\n- Schema validation with JSON Schema\n- JSONPath queries and filtering\n- Data transformation and mapping\n- Format conversion (JSON to CSV, XML, YAML)\n- Minification and beautification\n- Diff and merge operations\n\nHandles large JSON files efficiently.',
    authorHandle: 'jsontools',
    repoUrl: 'https://github.com/jsontools/claude-json',
    category: 'data',
    tags: ['json', 'validation', 'transformation', 'data-processing'],
    compatibleAgents: ['Claude', 'Node.js', 'JavaScript'],
    triggerWords: ['json', 'validation', 'transform', 'data'],
    isOpenSource: true,
    license: 'MIT',
    isOfficial: false,
    isSafe: true,
    healthScore: 93,
    githubStars: 432,
    weeklyInstalls: 78,
    totalInstalls: 2156,
    voteCount: 45,
    files: JSON.stringify([]),
    agentsInstalledOn: { 'claude-code': 67, 'cursor': 11 }
  }
];

export async function POST(request: NextRequest) {
  try {
    console.log('🌱 Starting database seed...');
    
    // Clear existing data (ignore errors if table is empty)
    try {
      await db.listing.deleteMany();
      console.log('✨ Cleared existing listings');
    } catch (error) {
      console.log('ℹ️  No existing listings to clear (table might be empty)');
    }

    // Insert seed data one by one
    let created = 0;
    for (const listing of sampleListings) {
      await db.listing.create({
        data: {
          ...listing,
          firstSeenAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });
      console.log(`✅ Inserted ${listing.name}`);
      created++;
    }

    return NextResponse.json({
      success: true,
      message: `🎉 Successfully seeded ${created} listings!`,
      created
    });
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    return NextResponse.json(
      { error: 'Seeding failed', details: error },
      { status: 500 }
    );
  }
}