# Setup and Seeding Guide

This document explains how to set up the AgentDropkit database and populate it with initial data.

## Overview

AgentDropkit uses API routes instead of standalone scripts for database operations. This approach ensures compatibility with the Next.js environment and Prisma configuration.

## Why API Routes Instead of Scripts?

### Problem with Standalone Scripts
When running database scripts directly with Node.js (`node script.js` or `npx ts-node script.ts`), several issues occur:

1. **Module Resolution**: Prisma client can't properly resolve paths outside Next.js context
2. **Configuration Loading**: Missing Next.js configuration for TypeScript paths (`@/lib/db`)
3. **Environment Context**: Prisma expects the Next.js runtime environment
4. **Client Generation**: Prisma client is generated specifically for the Next.js build context

### Solution: API Routes
Using API routes (`/app/api/*/route.ts`) provides:
- ✅ Full Next.js runtime environment
- ✅ Proper TypeScript compilation and path resolution
- ✅ Automatic environment variable loading
- ✅ Correct Prisma client initialization
- ✅ Consistent error handling and logging

## Available API Endpoints

### 1. Database Seeding
**Endpoint:** `POST /api/seed`

**Purpose:** Populate the database with sample skills, MCPs, and tools

**Usage:**
```bash
# Start the dev server first
npm run dev

# Then seed the database
curl -X POST http://localhost:3000/api/seed
```

**What it creates:**
- Sample Skills: API Scaffolder, Code Reviewer
- Sample MCPs: GitHub MCP
- Sample Tools: JSON Processor

**Response:**
```json
{
  "success": true,
  "message": "🎉 Successfully seeded 4 listings!",
  "created": 4
}
```

### 2. Admin User Creation
**Endpoint:** `POST /api/create-admin`

**Purpose:** Create or update admin user

**Usage:**
```bash
# Create admin user (only works after you've logged in once via GitHub)
curl -X POST http://localhost:3000/api/create-admin
```

**What it does:**
- Checks if user `bonyuglen@gmail.com` exists
- Creates new admin user if not found
- Updates existing user to admin role if found

**Response:**
```json
{
  "message": "✅ Successfully created admin user: bonyuglen@gmail.com",
  "user": {
    "id": "clx...",
    "email": "bonyuglen@gmail.com", 
    "name": "Glen",
    "role": "admin"
  }
}
```

## Setup Process

### 1. Initial Database Setup
```bash
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Apply database schema
npx prisma db push
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Seed Database
```bash
curl -X POST http://localhost:3000/api/seed
```

### 4. Create Admin User
**Option A: Login via GitHub first (recommended)**
1. Visit `http://localhost:3000`
2. Click "Login" and authenticate with GitHub
3. Then run: `curl -X POST http://localhost:3000/api/create-admin`

**Option B: Create admin user directly**
```bash
curl -X POST http://localhost:3000/api/create-admin
```

## User Roles System

### Available Roles
- `user` - Default role for all new users
- `admin` - Administrative privileges

### Role Assignment
The system automatically assigns `user` role to new GitHub OAuth users. Use the `/api/create-admin` endpoint to create or promote users to admin.

### Schema
```prisma
enum UserRole {
  user
  admin
}

model User {
  // ... other fields
  role UserRole @default(user)
  // ...
}
```

## Agent Skills Architecture

The project implements a comprehensive Agent Skills system with:

### Database Models
- `Listing` - Basic skill/MCP/tool information
- `Skill` - Extended skill-specific data with instructions
- `SkillFile` - Individual files within skills

### Repository Analysis
- GitHub API integration for automatic repository scanning
- SKILL.md detection and parsing
- Complete file system preservation
- Auto-population of form fields from skill metadata

### Progressive Loading (3-Level Architecture)
1. **Level 1: Metadata** - Basic skill information
2. **Level 2: Instructions** - SKILL.md content and documentation  
3. **Level 3: Resources** - Complete file system with all assets

## Troubleshooting

### Prisma Client Issues
If you encounter Prisma client initialization errors:

```bash
# Regenerate the client
npx prisma generate

# Restart the dev server
npm run dev
```

### Database Schema Drift
If database schema is out of sync:

```bash
# Reset database (⚠️ destroys all data)
npx prisma db push --force-reset

# Regenerate client
npx prisma generate

# Re-seed
curl -X POST http://localhost:3000/api/seed
```

### Environment Issues
Ensure your `.env.local` contains:
- `DATABASE_URL` - PostgreSQL connection string
- `GITHUB_CLIENT_ID` - GitHub OAuth app ID
- `GITHUB_CLIENT_SECRET` - GitHub OAuth secret
- `BETTER_AUTH_SECRET` - Random secret for auth encryption

## File Structure

```
/app/api/
├── seed/route.ts           # Database seeding endpoint
├── create-admin/route.ts   # Admin user creation
├── analyze-repo/route.ts   # GitHub repository analysis
└── submissions/route.ts    # Skill submission handling

/docs/
└── setup-and-seeding.md   # This documentation

/scripts/
└── test-db.ts            # Database connection testing (optional)

/lib/
├── db.ts                 # Prisma client configuration
└── skill-parser.ts       # Agent Skills parsing utilities
```

## Best Practices

1. **Always use API routes** for database operations in development
2. **Start the dev server first** before running any database commands
3. **Use curl or Postman** to test API endpoints
4. **Check the console output** in the dev server for detailed operation logs
5. **Backup important data** before running destructive operations like `db push --force-reset`

## Production Considerations

For production deployments:
- Use proper environment variable management
- Implement authentication for admin endpoints
- Add rate limiting to API routes
- Use database migrations instead of `db push`
- Set up proper logging and monitoring