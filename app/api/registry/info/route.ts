import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    name: "AgentDropkit Registry",
    version: "1.0.0",
    description: "Registry API for Claude Code skills",
    endpoints: {
      skill_info: "/api/registry/skills/{author}/{slug}",
      install_tracking: "/api/registry/skills/{author}/{slug}/install",
      search: "/api/registry/search?q={query}&category={category}&type={type}",
      health: "/api/registry/health"
    },
    supported_cli_versions: ["^1.0.0"],
    documentation: "https://skills.claude/docs/cli"
  });
}