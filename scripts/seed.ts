import { config } from 'dotenv';

// Load environment variables FIRST, before importing db
config({ path: '.env.local' });

import { db } from '../lib/db';
import type { Prisma } from '@prisma/client';

const sampleListings: Prisma.ListingCreateInput[] = [
  // Skills
  {
    slug: 'api-scaffolder',
    name: 'API Scaffolder',
    type: 'skill',
    description: 'Automatically scaffold REST APIs with CRUD operations, authentication, and documentation.',
    longDescription: '# API Scaffolder\n\nA powerful skill that generates complete REST API scaffolds with Express.js, including:\n\n- CRUD operations for any data model\n- JWT authentication middleware\n- Input validation with Joi\n- Auto-generated OpenAPI documentation\n- Database integration with Prisma or Mongoose\n\n## Usage\n\nSimply describe your data model and the skill will generate a complete, production-ready API.',
    authorHandle: 'anthropic',
    repoUrl: 'https://github.com/anthropic/skills',
    repoPath: 'api-scaffolder',
    installCommand: 'claude install anthropic/skills/api-scaffolder',
    category: 'infrastructure',
    tags: ['api', 'express', 'crud', 'auth', 'backend'],
    isOfficial: true,
    isSafe: true,
    healthScore: 95,
    githubStars: 1247,
    weeklyInstalls: 342,
    totalInstalls: 8924,
    voteCount: 89,
    files: [
      { name: 'SKILL.md', sizeKb: 4.2, content: '# API Scaffolder\n\nScaffolds REST APIs...' },
      { name: 'main.py', sizeKb: 12.8, content: 'def scaffold_api(model):\n    # Implementation here' }
    ],
    agentsInstalledOn: { 'claude-code': 312, 'cursor': 30 }
  },
  {
    slug: 'code-reviewer',
    name: 'Code Reviewer',
    type: 'skill',
    description: 'AI-powered code review that checks for bugs, security issues, and style violations.',
    longDescription: '# Code Reviewer\n\nPerforms comprehensive code reviews checking for:\n\n- Logic bugs and edge cases\n- Security vulnerabilities\n- Performance issues\n- Code style and best practices\n- Documentation quality\n\nSupports 20+ programming languages with language-specific rules.',
    authorHandle: 'anthropic',
    repoUrl: 'https://github.com/anthropic/skills',
    repoPath: 'code-reviewer',
    installCommand: 'claude install anthropic/skills/code-reviewer',
    category: 'code-review',
    tags: ['review', 'security', 'bugs', 'quality'],
    isOfficial: true,
    isSafe: true,
    healthScore: 98,
    githubStars: 2156,
    weeklyInstalls: 891,
    totalInstalls: 15632,
    voteCount: 142,
    files: [
      { name: 'SKILL.md', sizeKb: 6.1, content: '# Code Reviewer\n\nAI-powered code reviews...' },
      { name: 'reviewer.py', sizeKb: 18.3, content: 'class CodeReviewer:\n    def review(self, code):\n        # Review implementation' }
    ],
    agentsInstalledOn: { 'claude-code': 624, 'cursor': 267 }
  },
  {
    slug: 'test-generator',
    name: 'Test Generator',
    type: 'skill',
    description: 'Automatically generate comprehensive unit tests for any codebase.',
    longDescription: '# Test Generator\n\nGenerates thorough unit tests with:\n\n- High code coverage\n- Edge case testing\n- Mock setup for dependencies\n- Test data generation\n- Multiple testing frameworks support\n\nWorks with Jest, Pytest, JUnit, and more.',
    authorHandle: 'vercel',
    repoUrl: 'https://github.com/vercel/ai-skills',
    repoPath: 'test-generator',
    installCommand: 'claude install vercel/ai-skills/test-generator',
    category: 'code-review',
    tags: ['testing', 'unit-tests', 'coverage', 'automation'],
    isOfficial: true,
    isSafe: true,
    healthScore: 92,
    githubStars: 987,
    weeklyInstalls: 234,
    totalInstalls: 5431,
    voteCount: 67,
    files: [
      { name: 'SKILL.md', sizeKb: 5.4, content: '# Test Generator\n\nGenerates unit tests...' },
      { name: 'generator.js', sizeKb: 23.1, content: 'function generateTests(sourceCode) {\n    // Test generation logic' }
    ],
    agentsInstalledOn: { 'claude-code': 201, 'cursor': 33 }
  },
  
  // MCPs
  {
    slug: 'github-mcp',
    name: 'GitHub MCP',
    type: 'mcp',
    description: 'Complete GitHub integration with repos, issues, PRs, and workflow management.',
    longDescription: '# GitHub MCP\n\nFull GitHub integration providing:\n\n- Repository management\n- Issue and PR operations\n- Workflow automation\n- Code search and analysis\n- Team collaboration tools\n- Security and compliance checks\n\nAuthentication via GitHub Apps or personal tokens.',
    authorHandle: 'anthropic',
    repoUrl: 'https://github.com/anthropic/mcp-servers',
    repoPath: 'github',
    installCommand: 'npx @anthropic-ai/mcp-server-github',
    category: 'devops',
    tags: ['github', 'git', 'collaboration', 'ci-cd'],
    isOfficial: true,
    isSafe: true,
    healthScore: 96,
    githubStars: 3421,
    weeklyInstalls: 1234,
    totalInstalls: 28945,
    voteCount: 287,
    files: [
      { name: 'MCP.md', sizeKb: 8.1, content: '# GitHub MCP Server\n\nComplete GitHub integration...' },
      { name: 'server.js', sizeKb: 45.3, content: 'const { MCPServer } = require("@anthropic-ai/mcp");\n// Server implementation' }
    ],
    agentsInstalledOn: { 'claude-code': 1089, 'cursor': 145 }
  },
  {
    slug: 'postgres-mcp',
    name: 'PostgreSQL MCP',
    type: 'mcp',
    description: 'PostgreSQL database operations with query execution and schema management.',
    longDescription: '# PostgreSQL MCP\n\nDatabase operations including:\n\n- SQL query execution\n- Schema introspection\n- Table and index management\n- Data import/export\n- Query performance analysis\n- Migration support\n\nSecure connection handling with SSL support.',
    authorHandle: 'anthropic',
    repoUrl: 'https://github.com/anthropic/mcp-servers',
    repoPath: 'postgresql',
    installCommand: 'npx @anthropic-ai/mcp-server-postgresql',
    category: 'data',
    tags: ['postgresql', 'database', 'sql', 'data-management'],
    isOfficial: true,
    isSafe: true,
    healthScore: 94,
    githubStars: 1876,
    weeklyInstalls: 542,
    totalInstalls: 12387,
    voteCount: 156,
    files: [
      { name: 'MCP.md', sizeKb: 6.7, content: '# PostgreSQL MCP Server\n\nDatabase operations...' },
      { name: 'postgres.js', sizeKb: 28.9, content: 'const { Pool } = require("pg");\n// Database connection and operations' }
    ],
    agentsInstalledOn: { 'claude-code': 423, 'cursor': 119 }
  },

  // Tools
  {
    slug: 'json-processor',
    name: 'JSON Processor',
    type: 'tool',
    description: 'Advanced JSON manipulation, validation, and transformation utilities.',
    longDescription: '# JSON Processor\n\nComprehensive JSON tools:\n\n- Schema validation with JSON Schema\n- JSONPath queries and filtering\n- Data transformation and mapping\n- Format conversion (JSON to CSV, XML, YAML)\n- Minification and beautification\n- Diff and merge operations\n\nHandles large JSON files efficiently.',
    authorHandle: 'jsontools',
    repoUrl: 'https://github.com/jsontools/claude-json',
    installCommand: 'claude install jsontools/claude-json',
    category: 'data',
    tags: ['json', 'validation', 'transformation', 'data-processing'],
    isOfficial: false,
    isSafe: true,
    healthScore: 93,
    githubStars: 432,
    weeklyInstalls: 78,
    totalInstalls: 2156,
    voteCount: 45,
    files: [
      { name: 'README.md', sizeKb: 4.6, content: '# JSON Processor\n\nAdvanced JSON manipulation...' },
      { name: 'processor.js', sizeKb: 21.7, content: 'class JSONProcessor {\n    validate(json, schema) {\n        // Validation logic' }
    ],
    agentsInstalledOn: { 'claude-code': 67, 'cursor': 11 }
  }
];

async function seedDatabase() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Clear existing data (ignore errors if table is empty)
    try {
      await db.listing.deleteMany();
      console.log('✨ Cleared existing listings');
    } catch (error) {
      console.log('ℹ️  No existing listings to clear (table might be empty)');
    }

    // Insert seed data one by one
    for (const listing of sampleListings) {
      await db.listing.create({
        data: {
          ...listing,
          firstSeenAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
        },
      });
      console.log(`✅ Inserted ${listing.name}`);
    }

    console.log(`🎉 Successfully seeded ${sampleListings.length} listings!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seedDatabase();