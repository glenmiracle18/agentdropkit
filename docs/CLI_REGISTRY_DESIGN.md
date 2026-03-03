# AgentDropkit CLI Registry Design

## Overview

The AgentDropkit CLI (`npx agentdropkit`) enables developers to easily install, manage, and discover Claude skills from the AgentDropkit registry. It bridges the gap between the web directory and local Claude Code installations.

## Command Structure

### Core Commands

```bash
# Install a skill
npx agentdropkit add vercel/agent-browser
npx agentdropkit add glen/web-scraper --global
npx agentdropkit add coding-standards --project

# Search and discover
npx agentdropkit search "browser automation"
npx agentdropkit info vercel/agent-browser
npx agentdropkit list --installed

# Management
npx agentdropkit remove agent-browser
npx agentdropkit update vercel/agent-browser
npx agentdropkit sync  # Sync with registry for updates

# Initialize 
npx agentdropkit init   # Setup local config
npx agentdropkit doctor # Check installation health
```

## Installation Flow

### First-Time User Experience

1. **Auto-Install Check**
   ```bash
   npx agentdropkit add vercel/agent-browser
   ```
   
2. **CLI Auto-Installation**
   - Checks if `agentdropkit` is installed globally
   - Prompts: "Install AgentDropkit CLI globally? (y/N)"
   - If yes: `npm install -g agentdropkit`

3. **Claude Code Detection**
   - Checks for `~/.claude/skills/` directory
   - If missing: "Claude Code not detected. Please install Claude Code first."
   - Provides installation link and exits gracefully

4. **Installation Scope Selection**
   ```
   Where would you like to install 'vercel/agent-browser'?
   
   [1] Global (all projects) - ~/.claude/skills/
   [2] Project only - ./claude/skills/
   [3] Cancel
   
   Choice: 1
   ```

5. **Skill Installation**
   - Downloads skill files from AgentDropkit registry API
   - Creates skill directory structure
   - Handles dependencies (other skills, npm packages, binaries)
   - Updates install tracking in registry

## Installation Modes

### Global Installation (`~/.claude/skills/`)
- Available across all projects and Claude sessions
- Default for general-purpose skills (coding-standards, git-workflows)
- Managed via symbolic links for easy updates

### Project Installation (`./claude/skills/` or `./.claude/skills/`)
- Scoped to current project directory
- For project-specific skills or temporary experiments
- Can override global skills of same name
- Ideal for team-shared project conventions

## Skill Resolution Priority
1. Project skills (`./.claude/skills/`)
2. Global skills (`~/.claude/skills/`)
3. System skills (shipped with Claude Code)

## Registry API Integration

### Skill Metadata Endpoint
```bash
GET /api/skills/vercel/agent-browser
```
Returns:
```json
{
  "id": "vercel_agent-browser",
  "author": "vercel",
  "slug": "agent-browser", 
  "name": "Browser Automation",
  "description": "Automate browser interactions...",
  "version": "1.2.0",
  "repository": "https://github.com/vercel/agent-browser",
  "files": [
    {
      "name": "SKILL.md",
      "path": "SKILL.md", 
      "content": "---\nname: agent-browser\n...",
      "type": "skill"
    },
    {
      "name": "config.json",
      "path": "config.json",
      "content": "{\"threshold\": 0.8}",
      "type": "config" 
    }
  ],
  "dependencies": {
    "skills": ["web-utils"],
    "npm": ["puppeteer"], 
    "binaries": ["playwright"]
  },
  "install_count": 15420,
  "updated_at": "2026-03-01T10:30:00Z"
}
```

### Installation Tracking
```bash
POST /api/skills/vercel/agent-browser/installs
```
Body:
```json
{
  "cli_version": "1.0.0",
  "installation_mode": "global",
  "user_agent": "agentdropkit-cli/1.0.0"
}
```

## Local Configuration

### `~/.agentdropkit/config.json`
```json
{
  "registry_url": "https://skills.claude",
  "default_install_mode": "global", 
  "auto_update": false,
  "installed_skills": {
    "vercel/agent-browser": {
      "version": "1.2.0",
      "installed_at": "2026-03-03T10:30:00Z",
      "install_mode": "global",
      "path": "~/.claude/skills/agent-browser"
    }
  }
}
```

### Project Configuration `./agentdropkit.json`
```json
{
  "skills": [
    {
      "name": "vercel/agent-browser",
      "version": "^1.2.0",
      "install_mode": "project"
    },
    {
      "name": "coding-standards", 
      "version": "latest"
    }
  ]
}
```

## Dependency Management

### Skill Dependencies
- Other AgentDropkit skills
- Automatically resolved and installed
- Version constraints supported (`^1.2.0`, `>=1.0.0`)

### NPM Dependencies  
- Skills can declare npm dependencies
- CLI prompts: "Install npm dependencies? (y/N)"
- Runs `npm install <packages>` in appropriate scope

### Binary Dependencies
- Skills can require system binaries (playwright, ffmpeg)
- CLI checks with `which <binary>`
- Provides installation instructions if missing

## Error Handling & Edge Cases

### Network Issues
- Retry logic with exponential backoff
- Offline mode: "Skill cache not available offline"
- Graceful degradation

### Permission Issues
- Global install requires sudo/admin on some systems
- Clear error messages with suggested fixes
- Fallback to project-only installation

### Skill Conflicts
- Same skill name in global vs project
- Version conflicts between dependencies
- Clear conflict resolution prompts

### Malformed Skills
- Validation of skill structure before installation
- Rollback on installation failure
- Corrupted file detection and re-download

## Implementation Architecture

### CLI Tool Structure
```
agentdropkit-cli/
├── src/
│   ├── commands/
│   │   ├── add.ts        # Install skills
│   │   ├── search.ts     # Search registry  
│   │   ├── info.ts       # Skill details
│   │   ├── list.ts       # Installed skills
│   │   ├── remove.ts     # Uninstall skills
│   │   └── sync.ts       # Update skills
│   ├── utils/
│   │   ├── api.ts        # Registry API client
│   │   ├── install.ts    # Installation logic
│   │   ├── config.ts     # Config management
│   │   └── validation.ts # Skill validation
│   └── index.ts          # CLI entry point
├── package.json
└── README.md
```

### Technology Stack
- **CLI Framework**: Commander.js or Oclif
- **HTTP Client**: axios or fetch
- **File System**: fs-extra for enhanced file operations
- **Progress**: ora for spinners, progress bars
- **Prompts**: inquirer for interactive prompts
- **Validation**: joi or zod for schema validation

## Implementation Plan

### Phase 1: Core CLI (Week 1-2)
- [ ] Basic CLI structure with Commander.js
- [ ] `npx agentdropkit add <skill>` command
- [ ] Registry API integration for skill download
- [ ] Global vs project installation logic
- [ ] Basic error handling and validation

### Phase 2: Discovery & Management (Week 3)
- [ ] `search`, `info`, `list` commands
- [ ] Local configuration management
- [ ] Installation tracking and analytics
- [ ] Dependency resolution (skills only)

### Phase 3: Advanced Features (Week 4)
- [ ] NPM and binary dependency handling
- [ ] Update and sync functionality
- [ ] Project configuration (`agentdropkit.json`)
- [ ] Health check (`doctor` command)

### Phase 4: Polish & Edge Cases (Week 5)
- [ ] Comprehensive error handling
- [ ] Offline support and caching
- [ ] Conflict resolution
- [ ] Performance optimization

### Phase 5: Registry Integration (Week 6)
- [ ] Install tracking analytics
- [ ] Version management
- [ ] Auto-update notifications
- [ ] Usage metrics

## Security Considerations

### Skill Validation
- Validate skill structure and metadata
- Scan for suspicious patterns in skill files
- Maintain allowlist of trusted authors
- Community reporting for malicious skills

### API Security
- Rate limiting on registry API
- Authentication for install tracking (optional)
- HTTPS-only communication
- Input validation and sanitization

### Local Security  
- File permission validation before installation
- Sandboxed skill execution (future)
- Clear audit trail of installed skills
- Easy removal/quarantine of suspicious skills

## Future Enhancements

### CLI v2 Features
- Skill development tools (`agentdropkit create`)
- Local skill testing and validation
- Skill publishing workflow
- Team/organization skill management

### Integration Opportunities
- VS Code extension for skill management
- GitHub Actions for automated skill testing
- Integration with Claude Code update notifications
- Skill usage analytics and recommendations

---

**Questions for Clarification:**

1. Should we use the existing AgentDropkit database/API or create a separate registry API?
2. Do you want skill versioning support from day 1, or start simple with latest-only?
3. Should the CLI be a separate npm package or part of the main AgentDropkit repo?
4. Any preference for CLI framework (Commander.js, Oclif, or custom)?
5. How should we handle skill authentication/signing for security?