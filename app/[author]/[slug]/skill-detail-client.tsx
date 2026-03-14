"use client";

import Link from "next/link";
import { useState } from "react";
import { zipSync, strToU8 } from "fflate";
import { generateInstallCommandWithScopes } from "@/lib/install-command";
import { useVoteMutation } from "@/lib/queries/listings";
import type { ListingDetail, SkillFileData } from "@/lib/queries/listings";
import { IconTags, IconAtSign } from "@/public/assets/arcade-icons-darkmode";
import { FileTree } from "@/components/file-tree";

interface SkillDetailClientProps {
  skill: ListingDetail;
}

/** File-type color dot — matches common extensions to a muted accent hue. */
function getFileDotColor(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (ext === "md") return "#60A5FA";
  if (ext === "sh" || ext === "bash") return "#34D399";
  if (["ts", "tsx", "js", "jsx"].includes(ext)) return "#FBBF24";
  if (ext === "json") return "#F472B6";
  return "var(--color-text-muted)";
}

export default function SkillDetailClient({ skill }: SkillDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [copiedFile, setCopiedFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<SkillFileData | null>(
    skill.files?.find((f: SkillFileData) => f.name.toLowerCase() === "skill.md") ??
    skill.files?.[0] ??
    null,
  );
  const [contentKey, setContentKey] = useState(0);
  const [installScope, setInstallScope] = useState<"global" | "project">(
    "global",
  );
  const [cmdVisible, setCmdVisible] = useState(true);
  const [voteAnimating, setVoteAnimating] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // Derive vote state from cache-fed prop — optimistic updates flow through automatically
  const upvotes = skill.upvotes ?? 0;
  const hasUpvoted = skill.userVote === 1;

  const { mutate: vote, isPending: isVoting } = useVoteMutation(
    skill.authorHandle,
    skill.slug,
  );

  const installCommands = generateInstallCommandWithScopes({
    repoUrl: skill.repository
      ? `https://${skill.repository}`
      : skill.command || "",
    authorHandle: skill.authorHandle,
    skillName: skill.name,
  });

  const getCurrentCommand = () =>
    installScope === "project"
      ? installCommands.project
      : installCommands.global;

  const handleCopy = () => {
    void navigator.clipboard.writeText(getCurrentCommand()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);

      // Track the copy as an install event — fire and forget
      void fetch("/api/track-install", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: skill.slug }),
      });
    });
  };

  const handleDownload = () => {
    if (!skill.files?.length) return;
    setDownloading(true);

    try {
      // Build { "path/to/file": Uint8Array } map for fflate
      const entries: Record<string, Uint8Array> = {};
      for (const file of skill.files) {
        // Use the stored path (relative to skill root) or fall back to name
        const filePath = file.path || file.name;
        entries[filePath] = strToU8(file.content);
      }

      const zipped = zipSync(entries, { level: 6 });
      const blob = new Blob([new Uint8Array(zipped)], {
        type: "application/zip",
      });
      const url = URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `${skill.slug}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  };

  const handleUpvote = () => {
    setVoteAnimating(true);
    setTimeout(() => setVoteAnimating(false), 400);
    vote({ listingId: skill.id, value: 1 });
  };

  const handleScopeChange = (scope: "global" | "project") => {
    if (scope === installScope) return;
    setCmdVisible(false);
    setTimeout(() => {
      setInstallScope(scope);
      setCmdVisible(true);
    }, 120);
  };

  // Pre-compute file viewer data (avoids repeated splits in JSX)
  const selectedFileLines = selectedFile?.content.split("\n") ?? [];
  const selectedFileExt =
    selectedFile?.name.split(".").pop()?.toUpperCase() ?? "TEXT";

  return (
    <>
      {/* ── Breadcrumbs ─────────────────────────────────────────────── */}
      <div
        className="text-xs font-bold text-text-muted mb-8 flex flex-wrap items-center gap-1.5 uppercase tracking-widest animate-fade-up"
        style={{ animationDelay: "0ms" }}
      >
        <Link
          href="/"
          className="hover:text-accent transition-colors duration-150"
        >
          ~/skills
        </Link>
        <span className="text-border">/</span>
        <span className="text-text-accent">{skill.authorHandle}</span>
        <span className="text-border">/</span>
        <span className="text-text-accent">{skill.slug}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-10 md:gap-14">
        {/* ── Main Content ─────────────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          {/* Hero */}
          <div
            className="mb-10 animate-fade-up"
            style={{ animationDelay: "60ms" }}
          >
            {/* Type badge */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-6">
              <div className="flex-1 min-w-0">
                <h1
                  className="font-bold text-text-primary tracking-tight"
                  style={{
                    fontSize: "clamp(2rem, 5vw, 3.5rem)",
                    lineHeight: "0.95",
                  }}
                >
                  {skill.name}
                </h1>
                <p className="text-accent text-xs font-bold uppercase tracking-widest mt-3 flex items-center gap-.5">
                  <IconAtSign className="text-accent h-3 w-3" />
                  {skill.authorHandle}
                </p>
              </div>

              {/* Upvote button */}
              <button
                onClick={handleUpvote}
                disabled={isVoting}
                className={`group flex items-center justify-center gap-2.5 px-5 py-3 border-2 border-text-primary font-bold uppercase tracking-widest transition-all duration-150 active:scale-[0.97] w-full sm:w-auto shrink-0 tabular-nums disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none ${
                  hasUpvoted
                    ? "bg-accent text-white shadow-[4px_4px_0px_0px_var(--color-text-primary)]"
                    : "bg-bg-base text-text-primary shadow-[4px_4px_0px_0px_var(--color-accent)] hover:shadow-[2px_2px_0px_0px_var(--color-accent)] hover:translate-x-[2px] hover:translate-y-[2px]"
                }`}
              >
                {/* Arrow drifts up on hover, pulses on vote */}
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${voteAnimating ? "animate-vote-pulse" : "group-hover:-translate-y-0.5"} ${hasUpvoted ? "fill-white" : ""}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path d="M7 11l5-5m0 0l5 5m-5-5v12" />
                </svg>
                {/* Count springs when value changes */}
                <span
                  className={`text-xl tabular-nums inline-block ${voteAnimating ? "animate-count-pop" : ""}`}
                >
                  {upvotes}
                </span>
              </button>
            </div>

            {/* Thin ruled line with accent lead */}
            <div className="mt-8 h-px bg-border relative" />
          </div>

          {/* Overview — pull-quote treatment */}
          <p
            className="text-text-primary leading-relaxed py-1 mb-12 animate-fade-up"
            style={{
              fontSize: "clamp(1rem, 2vw, 1.2rem)",
              animationDelay: "120ms",
            }}
          >
            {skill.overview}
          </p>

          {/* ── 01 — Install Command ─────────────────────────────── */}
          <div
            className="mb-12 animate-fade-up"
            style={{ animationDelay: "180ms" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest flex items-center gap-2">
                <span className="text-accent">01</span>
                <span className="text-border">—</span>
                Install Command
              </h3>

              {/* Scope selector */}
              <div className="flex items-center gap-2">
                <span className="text-text-muted text-xs font-bold uppercase tracking-widest">
                  Scope:
                </span>
                {/* Sliding pill toggle */}
                <div className="relative flex border-2 border-border overflow-hidden">
                  {/* Sliding indicator — animates with a soft spring */}
                  <div
                    className="absolute inset-y-0 left-0 w-1/2 bg-accent pointer-events-none"
                    style={{
                      transform:
                        installScope === "project"
                          ? "translateX(100%)"
                          : "translateX(0)",
                      transition:
                        "transform 0.22s cubic-bezier(0.34, 1.3, 0.64, 1)",
                    }}
                  />
                  {(["global", "project"] as const).map((scope, i, arr) => (
                    <div key={scope} className="relative group flex-1">
                      <button
                        onClick={() => handleScopeChange(scope)}
                        className={`relative z-10 w-full px-3 py-1 text-xs font-bold uppercase tracking-widest transition-all duration-150 active:scale-95 ${
                          i < arr.length - 1 ? "border-r border-border/50" : ""
                        } ${
                          installScope === scope
                            ? "text-white"
                            : "text-text-primary hover:text-text-primary"
                        }`}
                      >
                        {scope === "global" ? "Global" : "Project"}
                      </button>
                      {/* Hover tooltip */}
                      <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                        <div className="bg-text-primary text-bg-base text-xs font-mono px-2 py-1.5 whitespace-nowrap shadow-[3px_3px_0px_0px_var(--color-accent)]">
                          {scope === "global"
                            ? "~/.claude/skills/"
                            : "./.claude/skills/"}
                        </div>
                        <div className="w-2 h-2 bg-text-primary rotate-45 mx-auto -mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Terminal block — 2px frame matches bg so it reads as a solid monolithic block */}
            <div
              className="border-2 shadow-[4px_4px_0px_0px_var(--color-accent)] md:shadow-[6px_6px_0px_0px_var(--color-accent)]"
              style={{ borderColor: "var(--terminal-frame)" }}
            >
              {/* Terminal chrome — dark in light mode, white in dark mode */}
              <div
                className="flex items-center gap-1.5 px-4 py-2.5 border-b"
                style={{
                  backgroundColor: "var(--terminal-bg)",
                  borderColor: "var(--terminal-chrome-border)",
                }}
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "var(--terminal-dot)" }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "var(--terminal-dot)" }}
                />
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: "var(--terminal-dot)" }}
                />
                <span
                  className="ml-auto text-xs font-mono select-none"
                  style={{ color: "var(--terminal-label)" }}
                >
                  agentdropkit
                </span>
              </div>

              {/* Command row */}
              <div
                className="flex flex-col sm:flex-row"
                style={{ backgroundColor: "var(--terminal-bg)" }}
              >
                <div className="flex items-center gap-3 px-4 overflow-x-auto no-scrollbar py-4 w-full">
                  <span className="text-accent font-mono text-sm shrink-0 select-none">
                    $
                  </span>
                  <code
                    className="font-mono text-xs sm:text-sm whitespace-nowrap"
                    style={{
                      opacity: cmdVisible ? 1 : 0,
                      transform: cmdVisible
                        ? "translateY(0)"
                        : "translateY(5px)",
                      transition: "opacity 0.14s ease, transform 0.14s ease",
                      color: "var(--terminal-text)",
                    }}
                  >
                    {getCurrentCommand()}
                  </code>
                </div>

                {/* Copy — primary CTA, fixed-width via ghost sizer */}
                <button
                  onClick={handleCopy}
                  className="relative shrink-0 flex items-center justify-center px-6 py-4 font-bold uppercase tracking-widest text-xs w-full sm:w-auto border-t-2 sm:border-t-0 sm:border-l-2 hover:opacity-80 active:scale-95 transition-all duration-100 overflow-hidden"
                  style={{
                    backgroundColor: "#FF6B35",
                    color: "#FFFFFF",
                    borderColor: "var(--terminal-btn-separator)",
                  }}
                >
                  {/* Invisible ghost — always "Copied" width so button never resizes */}
                  <span
                    className="invisible flex items-center gap-2"
                    aria-hidden="true"
                  >
                    <svg className="w-4 h-4">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Copied
                  </span>
                  {/* Actual content — absolutely centered over the ghost */}
                  <span className="absolute inset-0 flex items-center justify-center gap-2">
                    {copied ? (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2.5"
                        >
                          <polyline
                            className="animate-check-draw"
                            points="20 6 9 17 4 12"
                          />
                        </svg>
                        <span className="animate-label-in">Copied</span>
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <rect
                            width="14"
                            height="14"
                            x="8"
                            y="8"
                            rx="2"
                            ry="2"
                          />
                          <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                        </svg>
                        Copy
                      </>
                    )}
                  </span>
                </button>

                {/* ZIP — secondary CTA, only when files present */}
                {skill.files && skill.files.length > 0 && (
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    title={`Download ${skill.slug}.zip for Claude web app`}
                    className="shrink-0 flex items-center justify-center gap-2 px-6 py-4 font-bold uppercase tracking-widest text-xs transition-all w-full sm:w-auto border-t-2 sm:border-t-0 sm:border-l-2 hover:opacity-60 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{
                      backgroundColor: "var(--terminal-zip-bg)",
                      color: "var(--terminal-zip-text)",
                      borderColor: "var(--terminal-zip-border)",
                    }}
                  >
                    {downloading ? (
                      <>
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                        </svg>
                        Zipping
                      </>
                    ) : (
                      <>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        .zip
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── 02 — Reference Files ─────────────────────────────── */}
          {skill.files && skill.files.length > 0 && (
            <div
              className="mb-12 animate-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 flex items-center gap-2">
                <span className="text-accent">02</span>
                <span className="text-border">—</span>
                Reference Files
              </h3>

              <div className="flex flex-col md:flex-row border-2 border-border bg-bg-card shadow-[4px_4px_0px_0px_var(--color-border)] md:shadow-[6px_6px_0px_0px_var(--color-border)]">
                {/* File tree sidebar */}
                <div className="w-full md:w-52 border-b-2 md:border-b-0 md:border-r-2 border-border bg-bg-base shrink-0 overflow-y-auto md:max-h-[550px]">
                  <FileTree
                    files={skill.files}
                    selectedPath={selectedFile?.path}
                    onFileSelect={(f) => {
                      const match = skill.files.find((sf: SkillFileData) => sf.path === f.path);
                      if (!match || selectedFile?.path === match.path) return;
                      setSelectedFile(match);
                      setContentKey((k) => k + 1);
                      setCopiedFile(false);
                    }}
                  />
                </div>

                {/* File content */}
                <div className="flex-1 bg-bg-card min-h-[300px] md:max-h-[550px] relative flex flex-col overflow-hidden">
                  {selectedFile ? (
                    <>
                      {/* Copy file content */}
                      <button
                        onClick={() => {
                          void navigator.clipboard
                            .writeText(selectedFile.content)
                            .then(() => {
                              setCopiedFile(true);
                              setTimeout(() => setCopiedFile(false), 2000);
                            });
                        }}
                        className="absolute top-3 right-3 z-10 flex items-center gap-1.5 px-2 py-1 border-2 border-border bg-bg-base text-text-muted hover:bg-accent hover:text-white hover:border-accent transition-all duration-150 font-bold text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_var(--color-border)] hover:shadow-[1px_1px_0px_0px_var(--color-accent)] hover:-translate-y-px active:translate-y-0 active:scale-95 active:shadow-none"
                        title="Copy file content"
                      >
                        {copiedFile ? (
                          <>
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2.5"
                            >
                              <polyline
                                className="animate-check-draw"
                                points="20 6 9 17 4 12"
                              />
                            </svg>
                            <span className="animate-label-in">Copied</span>
                          </>
                        ) : (
                          <>
                            <svg
                              className="w-3 h-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              strokeWidth="2"
                            >
                              <rect
                                width="14"
                                height="14"
                                x="8"
                                y="8"
                                rx="2"
                                ry="2"
                              />
                              <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                            </svg>
                            Copy
                          </>
                        )}
                      </button>

                      {/* Line numbers + content — keyed so it re-mounts and animates on file switch */}
                      <div
                        key={contentKey}
                        className="flex flex-1 overflow-auto animate-content-in"
                      >
                        {/* Gutter — sticky so it stays put on horizontal scroll */}
                        <div
                          className="sticky left-0 shrink-0 select-none text-right border-r border-border/40 bg-bg-card z-[5] pt-4 pb-4"
                          aria-hidden="true"
                        >
                          {selectedFileLines.map((_, i) => (
                            <div
                              key={i}
                              className="font-mono px-3 leading-5 tabular-nums"
                              style={{
                                fontSize: "0.65rem",
                                color: "var(--theme-text-muted)",
                                opacity: 0.35,
                              }}
                            >
                              {i + 1}
                            </div>
                          ))}
                        </div>

                        {/* Pre — scrolls horizontally */}
                        <pre className="flex-1 p-4 text-text-primary font-mono text-xs sm:text-sm leading-5 whitespace-pre overflow-x-auto">
                          {selectedFile.content}
                        </pre>
                      </div>

                      {/* Status bar */}
                      <div className="shrink-0 border-t border-border/40 px-4 py-1.5 flex items-center gap-3 text-xs text-text-muted font-mono bg-bg-base/60 select-none">
                        <span className="truncate">{selectedFile.path || selectedFile.name}</span>
                        <span className="opacity-30 shrink-0">·</span>
                        <span className="tabular-nums shrink-0">
                          {selectedFileLines.length} lines
                        </span>
                        <span className="opacity-30 shrink-0">·</span>
                        <span className="uppercase shrink-0 text-accent/60">
                          {selectedFileExt}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="text-text-muted text-sm font-bold uppercase tracking-widest flex items-center justify-center h-full p-6">
                      Select a file to view
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ────────────────────────────────────────────────── */}
        <div
          className="w-full lg:w-80 shrink-0 space-y-5 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          {/* Details */}
          <div className="bg-bg-card border-2 border-border p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-5 border-b-2 border-border pb-2">
              Details
            </h3>
            <div className="space-y-5">
              {/* Repository */}
              <div>
                <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest mb-2">
                  <svg
                    className="w-3.5 h-3.5 shrink-0"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
                  </svg>
                  Repository
                </div>
                <a
                  href={skill.repoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent hover:underline text-xs font-bold break-all"
                >
                  {skill.repository}
                </a>
              </div>

              {/* Tags */}
              <div>
                <div className="flex items-center gap-2 text-text-muted font-bold text-xs uppercase tracking-widest mb-2">
                  <IconTags />
                  Tags
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {skill.tags.map((tag: string, i: number) => (
                    <span
                      key={tag}
                      className="text-xs font-bold uppercase tracking-widest border-2 px-2 py-0.5 transition-all duration-150 border-border bg-bg-base text-text-muted hover:border-accent hover:text-accent hover:-translate-y-px"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats — 3-column grid with top accent bar */}
          <div className="bg-bg-card border-2 border-border overflow-hidden">
            <div className="border-b-4 border-accent px-5 py-3">
              <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
                Skill Stats
              </h3>
            </div>
            <div className="grid grid-cols-3 divide-x-2 divide-border">
              {(
                [
                  {
                    value:
                      skill.stars >= 1000
                        ? `${(skill.stars / 1000).toFixed(1)}k`
                        : String(skill.stars),
                    label: "Stars",
                  },
                  {
                    value:
                      skill.installs >= 1000
                        ? `${(skill.installs / 1000).toFixed(1)}k`
                        : String(skill.installs),
                    label: "Installs",
                  },
                  {
                    value: skill.firstSeen,
                    label: "Added",
                    small: true,
                  },
                ] as Array<{ value: string; label: string; small?: boolean }>
              ).map(({ value, label, small }) => (
                <div
                  key={label}
                  className="flex flex-col items-center py-5 px-2 gap-1"
                >
                  <span
                    className="font-bold text-text-primary leading-none tabular-nums text-center"
                    style={{
                      fontSize: small
                        ? "clamp(0.65rem, 1.2vw, 0.8rem)"
                        : "clamp(1.2rem, 2.5vw, 1.6rem)",
                    }}
                  >
                    {value}
                  </span>
                  <span className="text-xs text-text-muted uppercase tracking-widest font-bold text-center leading-tight mt-0.5">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Compatible Agents */}
          <div className="bg-bg-card border-2 border-border p-5">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-5 border-b-2 border-border pb-2">
              Compatible Agents
            </h3>
            {skill.compatibleAgents && skill.compatibleAgents.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {skill.compatibleAgents.map((agent) => (
                  <span
                    key={agent}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold uppercase tracking-widest border-2 border-border text-text-muted bg-bg-base hover:-translate-y-px transition-transform"
                  >
                    {agent}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-text-muted">
                No compatible agents specified.
              </p>
            )}

            {skill.isOfficial && (
              <div className="flex items-start gap-2.5 bg-success/10 p-3 border border-success/20 mt-4">
                <svg
                  className="w-4 h-4 text-success shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth="2"
                >
                  <path d="M9 12l2 2 4-4" />
                  <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3" />
                  <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3" />
                  <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3" />
                  <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3" />
                </svg>
                <div>
                  <div className="font-bold text-success text-xs uppercase tracking-widest">
                    Official Skill
                  </div>
                  <div className="text-xs text-text-muted mt-0.5">
                    Verified and maintained by the core team.
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
