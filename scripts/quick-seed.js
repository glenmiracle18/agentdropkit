require('dotenv').config({ path: '.env.local' });

const { PrismaClient } = require('@prisma/client');
const { neonConfig } = require('@neondatabase/serverless');
const { PrismaNeon } = require('@prisma/adapter-neon');

// Configure WebSocket for serverless environments
const ws = require('ws');
neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter });

const sampleListings = [
  {
    slug: 'api-scaffolder',
    name: 'API Scaffolder',
    type: 'skill',
    description: 'Automatically scaffold REST APIs with CRUD operations, authentication, and documentation.',
    longDescription: '# API Scaffolder\n\nA powerful skill that generates complete REST API scaffolds...',
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
      { name: 'SKILL.md', sizeKb: 4.2, content: '# API Scaffolder\n\nScaffolds REST APIs...' }
    ],
    agentsInstalledOn: { 'claude-code': 312, 'cursor': 30 }
  },
  {
    slug: 'code-reviewer',
    name: 'Code Reviewer',
    type: 'skill',
    description: 'AI-powered code review that checks for bugs, security issues, and style violations.',
    longDescription: '# Code Reviewer\n\nPerforms comprehensive code reviews...',
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
      { name: 'SKILL.md', sizeKb: 6.1, content: '# Code Reviewer\n\nAI-powered code reviews...' }
    ],
    agentsInstalledOn: { 'claude-code': 624, 'cursor': 267 }
  },
  {
    slug: 'github-pr-reviewer',
    name: 'GitHub PR Reviewer',
    type: 'skill',
    description: 'Automatically review pull requests, check for common bugs, and ensure code style compliance.',
    longDescription: '# GitHub PR Reviewer\n\nAutomatically reviews PRs...',
    authorHandle: 'core',
    repoUrl: 'https://github.com/core/github',
    repoPath: 'github-pr-reviewer',
    installCommand: 'claude install core/github/github-pr-reviewer',
    category: 'core/github',
    tags: ['github', 'pr', 'review', 'automation'],
    isOfficial: true,
    isSafe: true,
    healthScore: 96,
    githubStars: 1845,
    weeklyInstalls: 567,
    totalInstalls: 12345,
    voteCount: 123,
    files: [
      { name: 'SKILL.md', sizeKb: 5.8, content: '# GitHub PR Reviewer...' }
    ],
    agentsInstalledOn: { 'claude-code': 445, 'cursor': 122 }
  },
  {
    slug: 'figma-to-react',
    name: 'Figma to React',
    type: 'skill',
    description: 'Convert Figma designs directly into production-ready React components using Tailwind CSS.',
    longDescription: '# Figma to React\n\nConverts Figma designs...',
    authorHandle: 'design',
    repoUrl: 'https://github.com/design/tools',
    repoPath: 'figma-to-react',
    installCommand: 'claude install design/tools/figma-to-react',
    category: 'design/tools',
    tags: ['figma', 'react', 'ui', 'conversion'],
    isOfficial: true,
    isSafe: true,
    healthScore: 94,
    githubStars: 2134,
    weeklyInstalls: 678,
    totalInstalls: 18567,
    voteCount: 189,
    files: [
      { name: 'SKILL.md', sizeKb: 4.9, content: '# Figma to React...' }
    ],
    agentsInstalledOn: { 'claude-code': 523, 'cursor': 155 }
  },
  {
    slug: 'postgres-admin',
    name: 'Postgres Admin',
    type: 'skill',
    description: 'A secure database administration skill. Allows the agent to query, analyze, and optimize your PostgreSQL databases.',
    longDescription: '# Postgres Admin\n\nDatabase administration...',
    authorHandle: 'db',
    repoUrl: 'https://github.com/db/utils',
    repoPath: 'postgres-admin',
    installCommand: 'claude install db/utils/postgres-admin',
    category: 'db/utils',
    tags: ['postgresql', 'admin', 'database', 'optimization'],
    isOfficial: true,
    isSafe: true,
    healthScore: 97,
    githubStars: 1678,
    weeklyInstalls: 432,
    totalInstalls: 9876,
    voteCount: 134,
    files: [
      { name: 'SKILL.md', sizeKb: 6.2, content: '# Postgres Admin...' }
    ],
    agentsInstalledOn: { 'claude-code': 387, 'cursor': 45 }
  }
];

async function seed() {
  console.log('🌱 Starting database seed...');
  
  try {
    // Clear existing data
    await prisma.listing.deleteMany();
    console.log('✨ Cleared existing listings');

    // Insert seed data
    for (const listing of sampleListings) {
      await prisma.listing.create({ data: listing });
      console.log(`✅ Inserted ${listing.name}`);
    }

    console.log(`🎉 Successfully seeded ${sampleListings.length} listings!`);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seed();