# Claude Skills Directory - Setup Guide

## Environment Setup

1. **Copy environment file:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Update `.env.local` with your values:**
   ```bash
   # Database
   DATABASE_URL="your-neon-database-url"

   # Better Auth
   BETTER_AUTH_SECRET="your-secret-key-here"
   BETTER_AUTH_URL="http://localhost:3000"

   # GitHub OAuth
   GITHUB_CLIENT_ID="your-github-client-id"
   GITHUB_CLIENT_SECRET="your-github-client-secret"

   # GitHub API (for syncing repo data)
   GITHUB_TOKEN="ghp_your_github_personal_access_token"
   ```

## Database Setup

1. **Generate Prisma client:**
   ```bash
   npm run db:generate
   ```

2. **Push schema to database:**
   ```bash
   npm run db:push
   ```

3. **Seed with sample data (optional):**
   ```bash
   npm run db:seed
   ```

## Development

1. **Start the development server:**
   ```bash
   npm run dev
   ```

2. **Open in browser:**
   ```
   http://localhost:3000
   ```

## Features

✅ **Completed:**
- Modern Prisma ORM with NeonDB
- Better Auth with GitHub OAuth
- Browse skills with search and filtering
- Individual skill detail pages
- Install command copy-to-clipboard
- Responsive dark theme design

🔄 **In Progress:**
- Voting system
- Skill submission form
- GitHub sync automation

## Tech Stack

- **Framework:** Next.js 14+ (App Router)
- **Database:** NeonDB (PostgreSQL) with Prisma ORM
- **Authentication:** Better Auth with GitHub OAuth
- **Styling:** Tailwind CSS v4 with JetBrains Mono
- **Deployment:** Vercel-ready