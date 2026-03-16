"use client";

import { useState } from "react";
import Link from "next/link";
import type { AnalyzedSkill, AnalyzeRepoResult } from "@/app/api/admin/bulk-analyze/route";
import type { BulkCreateResult } from "@/app/api/admin/bulk-create/route";

const CATEGORIES = [
  // Tech
  "development",
  "data-analysis",
  "devops",
  "infrastructure",
  "security",
  "code-review",
  "agents",
  "automation",
  // Creative
  "writing",
  "design",
  "content-creation",
  "media-video",
  // Business
  "marketing",
  "sales",
  "finance",
  "legal",
  "hr-recruiting",
  "project-management",
  "customer-support",
  // Knowledge
  "research",
  "education",
  "documentation",
  // Personal
  "productivity",
  "communication",
  "health-wellness",
  "entertainment",
  // Catch-all
  "other",
];

const ALL_AGENTS = [
  "Cursor", "Claude Code", "Gemini CLI", "GitHub Copilot", "Codex",
  "OpenCode", "Antigravity", "OpenClaws", "Aider", "Cline",
  "RooCode", "Windsurf", "Devin", "Manus", "Amp", "Goose",
  "Crush", "Kiro", "Kilo Code", "Zencoder", "Amazon Q", "Tabnine", "Other",
];

type Step = "input" | "analyzing" | "review" | "importing" | "done";

interface EditableSkill extends AnalyzedSkill {
  id: string;
  selected: boolean;
  editedName: string;
  editedDescription: string;
  editedTags: string;
  editedTriggerWords: string;
  editedCategory: string;
  editedType: "skill" | "mcp" | "tool";
  editedAgents: string[];
  importStatus?: "importing" | "created" | "failed" | "skipped";
  importError?: string;
  importedSlug?: string;
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export default function BulkImportClient() {
  const [step, setStep] = useState<Step>("input");
  const [urlInput, setUrlInput] = useState("");
  const [analyzeErrors, setAnalyzeErrors] = useState<{ repoUrl: string; error: string }[]>([]);
  const [skills, setSkills] = useState<EditableSkill[]>([]);
  const [importSummary, setImportSummary] = useState<{
    created: number;
    failed: number;
    total: number;
  } | null>(null);
  // tracks which skill (1-based) is currently being processed
  const [importingIndex, setImportingIndex] = useState(0);

  const repoUrls = urlInput
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);

  // ── Step 1 → 2: Analyze repos ────────────────────────────────────────────

  async function handleAnalyze() {
    if (repoUrls.length === 0) return;
    setStep("analyzing");
    setAnalyzeErrors([]);
    setSkills([]);

    try {
      const res = await fetch("/api/admin/bulk-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repoUrls }),
      });

      const data = (await res.json()) as { results: AnalyzeRepoResult[]; error?: string };

      if (!res.ok) {
        setAnalyzeErrors([{ repoUrl: "Request", error: data.error ?? "Request failed" }]);
        setStep("input");
        return;
      }

      const errors: { repoUrl: string; error: string }[] = [];
      const detected: EditableSkill[] = [];

      for (const result of data.results) {
        if (result.error) {
          errors.push({ repoUrl: result.repoUrl, error: result.error });
        }
        for (const skill of result.skills) {
          detected.push({
            ...skill,
            id: makeId(),
            selected: !skill.alreadyExists,
            editedName: skill.name,
            editedDescription: skill.description,
            editedTags: skill.tags.join(", "),
            editedTriggerWords: skill.triggerKeywords.join(", "),
            editedCategory: skill.category,
            editedType: skill.type,
            editedAgents: [...ALL_AGENTS],
          });
        }
      }

      setAnalyzeErrors(errors);

      if (detected.length === 0) {
        setAnalyzeErrors(prev => [
          ...prev,
          { repoUrl: "—", error: "No skills detected across the provided URLs." },
        ]);
        setStep("input");
        return;
      }

      setSkills(detected);
      setStep("review");
    } catch {
      setAnalyzeErrors([{ repoUrl: "Network", error: "Network error — check your connection and try again." }]);
      setStep("input");
    }
  }

  // ── Retry: go back to review with only failed skills re-selected ─────────

  function handleRetryFailed() {
    setSkills(prev =>
      prev.map(s => {
        if (s.importStatus === "failed") {
          // Re-arm failed skills: clear error, mark selected, reset status
          return { ...s, selected: true, importStatus: undefined, importError: undefined };
        }
        // Created skills stay in state but deselected so they show in "excluded"
        return { ...s, selected: false };
      })
    );
    setImportSummary(null);
    setStep("review");
  }

  // ── Step 3 → 4: Import selected ─────────────────────────────────────────

  async function handleImport() {
    const selected = skills.filter(s => s.selected);
    if (selected.length === 0) return;

    setStep("importing");
    setImportingIndex(0);

    // All selected start as "queued" (pending, no spinner yet)
    setSkills(prev =>
      prev.map(s => (s.selected ? { ...s, importStatus: undefined, importError: undefined } : s))
    );

    let created = 0;
    let failed = 0;

    for (let i = 0; i < selected.length; i++) {
      const s = selected[i];
      setImportingIndex(i + 1);

      // Mark THIS skill as actively importing
      setSkills(prev =>
        prev.map(sk => sk.id === s.id ? { ...sk, importStatus: "importing" } : sk)
      );

      try {
        const res = await fetch("/api/admin/bulk-create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            skills: [{
              repoUrl: `https://github.com/${s.owner}/${s.repo}`,
              skillPath: s.path,
              name: s.editedName.trim(),
              description: s.editedDescription.trim() || s.editedName.trim(),
              tags: s.editedTags.split(",").map(t => t.trim()).filter(Boolean),
              category: s.editedCategory,
              type: s.editedType,
              triggerWords: s.editedTriggerWords.split(",").map(t => t.trim()).filter(Boolean),
              compatibleAgents: s.editedAgents,
              owner: s.owner,
              repo: s.repo,
            }],
          }),
        });

        const data = (await res.json()) as {
          results: BulkCreateResult[];
          error?: string;
        };

        const result = data.results?.[0];

        if (!res.ok || !result) {
          setSkills(prev =>
            prev.map(sk =>
              sk.id === s.id
                ? { ...sk, importStatus: "failed", importError: data.error ?? "Import failed" }
                : sk
            )
          );
          failed++;
        } else {
          setSkills(prev =>
            prev.map(sk =>
              sk.id === s.id
                ? {
                    ...sk,
                    importStatus: result.status === "created" ? "created" : "failed",
                    importError: result.error,
                    importedSlug: result.slug,
                  }
                : sk
            )
          );
          if (result.status === "created") created++;
          else failed++;
        }
      } catch {
        setSkills(prev =>
          prev.map(sk =>
            sk.id === s.id
              ? { ...sk, importStatus: "failed", importError: "Network error" }
              : sk
          )
        );
        failed++;
      }
    }

    setImportingIndex(0);
    setImportSummary({ created, failed, total: selected.length });
    setStep("done");
  }

  function updateSkill(id: string, patch: Partial<EditableSkill>) {
    setSkills(prev => prev.map(s => (s.id === id ? { ...s, ...patch } : s)));
  }

  function toggleSelectAll(select: boolean) {
    setSkills(prev => prev.map(s => ({ ...s, selected: select })));
  }

  const selectedCount = skills.filter(s => s.selected).length;

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* ── Step indicator ─────────────────────────────────────────── */}
      <div className="flex items-center gap-0 font-mono text-xs font-bold uppercase tracking-widest">
        {(["input", "review", "done"] as const).map((s, i) => {
          const labels = { input: "1. Paste URLs", review: "2. Review & Edit", done: "3. Done" };
          const isActive = step === s || (s === "review" && step === "analyzing") || (s === "review" && step === "importing");
          const isPast =
            (s === "input" && ["review", "analyzing", "importing", "done"].includes(step)) ||
            (s === "review" && ["importing", "done"].includes(step));
          return (
            <div key={s} className="flex items-center">
              {i > 0 && (
                <div className={`w-8 h-0.5 ${isPast || isActive ? "bg-text-primary" : "bg-border"}`} />
              )}
              <span
                className={`px-3 py-1 border-2 text-[10px] ${
                  isActive
                    ? "border-text-primary bg-text-primary text-bg-base"
                    : isPast
                      ? "border-text-primary text-text-primary"
                      : "border-border text-text-muted"
                }`}
              >
                {labels[s]}
              </span>
            </div>
          );
        })}
      </div>

      {/* ── Step 1: Input ──────────────────────────────────────────── */}
      {step === "input" && (
        <div className="space-y-6">
          {analyzeErrors.length > 0 && (
            <div className="border-2 border-red-500 bg-red-50 p-4 space-y-1">
              {analyzeErrors.map((e, i) => (
                <p key={i} className="font-mono text-sm text-red-700">
                  <span className="font-bold">{e.repoUrl}:</span> {e.error}
                </p>
              ))}
            </div>
          )}

          <div className="border-2 border-border bg-bg-card p-6 space-y-4 shadow-[4px_4px_0px_0px_var(--color-text-primary)]">
            <div>
              <label className="block font-mono text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                GitHub Repository URLs
              </label>
              <textarea
                value={urlInput}
                onChange={e => setUrlInput(e.target.value)}
                placeholder={
                  "https://github.com/anthropics/claude-skills\nhttps://github.com/owner/repo\nhttps://github.com/owner/another-repo"
                }
                rows={8}
                className="w-full bg-bg-base border-2 border-border font-mono text-sm text-text-primary p-3 focus:outline-none focus:border-text-primary resize-none placeholder-text-muted"
              />
              <p className="mt-1 font-mono text-xs text-text-muted">
                {repoUrls.length} / 10 URLs · one per line
              </p>
            </div>

            <div className="bg-bg-inset border-2 border-border p-4 space-y-1">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                How it works
              </p>
              <p className="font-mono text-xs text-text-secondary">
                1. Paste up to 10 GitHub repo URLs (one per line)
              </p>
              <p className="font-mono text-xs text-text-secondary">
                2. Each repo is scanned for SKILL.md files — one card per detected skill
              </p>
              <p className="font-mono text-xs text-text-secondary">
                3. Review and edit names, descriptions, tags, and categories
              </p>
              <p className="font-mono text-xs text-text-secondary">
                4. Import selected skills directly — no submission queue
              </p>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={repoUrls.length === 0}
              className="w-full py-4 bg-text-primary text-bg-base font-mono font-bold uppercase tracking-widest hover:bg-text-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Analyze {repoUrls.length > 0 ? `${repoUrls.length} Repo${repoUrls.length > 1 ? "s" : ""}` : "Repos"} →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 1.5: Analyzing ─────────────────────────────────────── */}
      {step === "analyzing" && (
        <div className="border-2 border-border bg-bg-card p-12 flex flex-col items-center gap-4 shadow-[4px_4px_0px_0px_var(--color-text-primary)]">
          <div className="flex gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-3 h-3 bg-text-primary animate-pulse"
                style={{ animationDelay: `${i * 0.15}s` }}
              />
            ))}
          </div>
          <p className="font-mono font-bold text-text-primary">
            Scanning {repoUrls.length} repo{repoUrls.length > 1 ? "s" : ""} for skills…
          </p>
          <p className="font-mono text-xs text-text-muted">
            Fetching repository trees and SKILL.md files
          </p>
        </div>
      )}

      {/* ── Step 2: Review ──────────────────────────────────────────── */}
      {step === "review" && (
        <div className="space-y-6">
          {/* Toolbar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b-2 border-border pb-4">
            <div className="space-y-0.5">
              <p className="font-mono font-bold text-text-primary">
                {skills.length} skill{skills.length !== 1 ? "s" : ""} detected
                {analyzeErrors.length > 0 && (
                  <span className="ml-2 text-text-muted text-sm font-normal">
                    ({analyzeErrors.length} repo{analyzeErrors.length > 1 ? "s" : ""} had errors)
                  </span>
                )}
              </p>
              <p className="font-mono text-xs text-text-muted">
                {selectedCount} selected for import ·{" "}
                {skills.filter(s => s.alreadyExists).length} already in directory
              </p>
            </div>

            <div className="flex gap-2 font-mono text-xs font-bold uppercase tracking-widest">
              <button
                onClick={() => toggleSelectAll(true)}
                className="px-3 py-2 border-2 border-border hover:bg-bg-card transition-colors"
              >
                Select All
              </button>
              <button
                onClick={() => toggleSelectAll(false)}
                className="px-3 py-2 border-2 border-border hover:bg-bg-card transition-colors"
              >
                None
              </button>
              <button
                onClick={() => { setStep("input"); setSkills([]); }}
                className="px-3 py-2 border-2 border-border text-text-muted hover:bg-bg-card transition-colors"
              >
                ← Back
              </button>
            </div>
          </div>

          {/* Errors from analyze */}
          {analyzeErrors.length > 0 && (
            <div className="border-2 border-border bg-bg-inset p-4 space-y-1">
              <p className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted mb-2">
                Repos with errors (not analyzed)
              </p>
              {analyzeErrors.map((e, i) => (
                <p key={i} className="font-mono text-xs text-text-secondary">
                  <span className="text-red-600 font-bold">✗</span>{" "}
                  <span className="text-text-primary">{e.repoUrl}</span> — {e.error}
                </p>
              ))}
            </div>
          )}

          {/* Selected skills — full editable cards in a clean grid */}
          {skills.filter(s => s.selected).length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {skills.filter(s => s.selected).map(skill => (
                <SkillReviewCard
                  key={skill.id}
                  skill={skill}
                  onChange={patch => updateSkill(skill.id, patch)}
                />
              ))}
            </div>
          )}

          {/* Excluded skills — compact list, easy to re-select */}
          {skills.filter(s => !s.selected).length > 0 && (
            <div className="space-y-2">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
                Excluded ({skills.filter(s => !s.selected).length})
              </p>
              <div className="border-2 border-border divide-y-2 divide-border">
                {skills.filter(s => !s.selected).map(skill => (
                  <SkillReviewCard
                    key={skill.id}
                    skill={skill}
                    onChange={patch => updateSkill(skill.id, patch)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Import button */}
          <div className="flex items-center justify-between border-t-2 border-border pt-6">
            <p className="font-mono text-sm text-text-muted">
              {selectedCount === 0
                ? "Select at least one skill to import"
                : `${selectedCount} skill${selectedCount !== 1 ? "s" : ""} will be imported`}
            </p>
            <button
              onClick={handleImport}
              disabled={selectedCount === 0}
              className="px-8 py-4 bg-accent text-bg-base font-mono font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed shadow-[4px_4px_0px_0px_var(--color-text-primary)]"
            >
              Import {selectedCount > 0 ? selectedCount : ""} Skill{selectedCount !== 1 ? "s" : ""} →
            </button>
          </div>
        </div>
      )}

      {/* ── Step 3: Importing ───────────────────────────────────────── */}
      {step === "importing" && (
        <div className="space-y-6">
          {/* Live progress header */}
          {(() => {
            const total = skills.filter(s => s.selected).length;
            const done = skills.filter(s => s.selected && (s.importStatus === "created" || s.importStatus === "failed")).length;
            const activeName = skills.find(s => s.importStatus === "importing")?.editedName ?? "";
            const pct = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div className="border-2 border-border bg-bg-card p-6 space-y-3 shadow-[4px_4px_0px_0px_var(--color-text-primary)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent animate-spin shrink-0" />
                    <div>
                      <p className="font-mono font-bold text-text-primary">
                        {importingIndex > 0
                          ? `Processing ${importingIndex} of ${total}…`
                          : `Preparing…`}
                      </p>
                      {activeName && (
                        <p className="font-mono text-xs text-text-muted truncate max-w-xs">
                          {activeName}
                        </p>
                      )}
                    </div>
                  </div>
                  <span className="font-mono text-xs font-bold text-text-muted tabular-nums">
                    {done}/{total}
                  </span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 bg-bg-base border border-border w-full">
                  <div
                    className="h-full bg-accent transition-all duration-300"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {skills.filter(s => s.selected).map(skill => (
              <SkillImportStatusCard key={skill.id} skill={skill} />
            ))}
          </div>
        </div>
      )}

      {/* ── Step 4: Done ────────────────────────────────────────────── */}
      {step === "done" && importSummary && (
        <div className="space-y-6">
          {/* Summary banner */}
          <div className="border-2 border-text-primary bg-bg-card p-6 shadow-[4px_4px_0px_0px_var(--color-text-primary)]">
            <p className="font-mono text-xs font-bold uppercase tracking-widest text-text-muted mb-3">
              Import complete
            </p>
            <div className="flex gap-8">
              <div>
                <p className="font-mono text-4xl font-bold text-text-primary">
                  {importSummary.created}
                </p>
                <p className="font-mono text-xs text-text-muted uppercase tracking-widest">Created</p>
              </div>
              {importSummary.failed > 0 && (
                <div>
                  <p className="font-mono text-4xl font-bold text-red-600">
                    {importSummary.failed}
                  </p>
                  <p className="font-mono text-xs text-text-muted uppercase tracking-widest">Failed</p>
                </div>
              )}
            </div>
          </div>

          {/* Result cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {skills.filter(s => s.selected).map(skill => (
              <SkillImportStatusCard key={skill.id} skill={skill} showLink />
            ))}
          </div>

          {/* Actions */}
          <div className="flex flex-wrap gap-4 pt-4 border-t-2 border-border">
            {importSummary.failed > 0 && (
              <button
                onClick={handleRetryFailed}
                className="px-6 py-3 bg-red-600 text-white font-mono font-bold uppercase tracking-widest text-sm hover:bg-red-700 transition-colors shadow-[3px_3px_0px_0px_var(--color-text-primary)]"
              >
                ↺ Retry {importSummary.failed} Failed
              </button>
            )}
            <button
              onClick={() => {
                setStep("input");
                setSkills([]);
                setUrlInput("");
                setAnalyzeErrors([]);
                setImportSummary(null);
              }}
              className="px-6 py-3 border-2 border-border font-mono font-bold uppercase tracking-widest text-sm hover:bg-bg-card transition-colors"
            >
              Import More
            </button>
            <Link
              href="/admin"
              className="px-6 py-3 bg-text-primary text-bg-base font-mono font-bold uppercase tracking-widest text-sm hover:bg-text-muted transition-colors"
            >
              Back to Admin →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Skill review card (editable) ──────────────────────────────────────────

interface SkillReviewCardProps {
  skill: EditableSkill;
  onChange: (patch: Partial<EditableSkill>) => void;
}

function SkillReviewCard({ skill, onChange }: SkillReviewCardProps) {
  return (
    <div
      className={`bg-bg-card transition-all duration-200 ${
        skill.selected
          ? "border-2 border-text-primary p-5 space-y-4"
          : "px-4 py-2.5"
      }`}
    >
      {/* Header row — always visible */}
      <div className="flex items-center justify-between gap-3">
        <label className="flex items-center gap-3 cursor-pointer min-w-0 flex-1">
          <input
            type="checkbox"
            checked={skill.selected}
            onChange={e => onChange({ selected: e.target.checked })}
            className="w-4 h-4 border-2 border-border accent-text-primary cursor-pointer shrink-0"
          />
          <div className="min-w-0">
            <p className={`font-mono font-bold truncate transition-colors ${skill.selected ? "text-text-primary text-sm" : "text-text-muted text-xs"}`}>
              {skill.editedName}
            </p>
            <p className="font-mono text-[10px] text-text-muted truncate">
              {skill.owner}/{skill.repo}
              {skill.path && skill.path !== "root" && (
                <span className="ml-1 text-accent">/ {skill.path}</span>
              )}
            </p>
          </div>
        </label>

        {skill.alreadyExists && (
          <span className="shrink-0 text-[10px] font-mono font-bold uppercase tracking-widest border-2 border-border px-2 py-0.5 text-text-muted">
            Exists
          </span>
        )}
      </div>

      {/* Expanded content — only when selected */}
      {skill.selected && (
        <>
      {/* Name */}
      <div>
        <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
          Name
        </label>
        <input
          type="text"
          value={skill.editedName}
          onChange={e => onChange({ editedName: e.target.value })}
          className="w-full bg-bg-base border-2 border-border font-mono text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-text-primary"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
          Description
        </label>
        <textarea
          value={skill.editedDescription}
          onChange={e => onChange({ editedDescription: e.target.value })}
          rows={2}
          className="w-full bg-bg-base border-2 border-border font-mono text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-text-primary resize-none"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
          Tags <span className="normal-case font-normal">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={skill.editedTags}
          onChange={e => onChange({ editedTags: e.target.value })}
          placeholder="e.g. pdf, documents, extraction"
          className="w-full bg-bg-base border-2 border-border font-mono text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-text-primary"
        />
      </div>

      {/* Trigger Phrases */}
      <div>
        <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
          Trigger Phrases <span className="normal-case font-normal">(comma-separated)</span>
        </label>
        <input
          type="text"
          value={skill.editedTriggerWords}
          onChange={e => onChange({ editedTriggerWords: e.target.value })}
          placeholder="e.g. read pdf, extract from document, parse pdf"
          className="w-full bg-bg-base border-2 border-border font-mono text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-text-primary"
        />
        <p className="mt-1 font-mono text-[10px] text-text-muted">
          Phrases that trigger this skill to be suggested to the agent
        </p>
      </div>

      {/* Category + Type row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
            Category
          </label>
          <select
            value={skill.editedCategory}
            onChange={e => onChange({ editedCategory: e.target.value })}
            className="w-full bg-bg-base border-2 border-border font-mono text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-text-primary appearance-none cursor-pointer"
          >
            {CATEGORIES.map(c => (
              <option key={c} value={c}>
                {c.replace(/-/g, " ")}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted mb-1">
            Type
          </label>
          <select
            value={skill.editedType}
            onChange={e => onChange({ editedType: e.target.value as "skill" | "mcp" | "tool" })}
            className="w-full bg-bg-base border-2 border-border font-mono text-sm text-text-primary px-3 py-2 focus:outline-none focus:border-text-primary appearance-none cursor-pointer"
          >
            <option value="skill">Skill</option>
            <option value="mcp">MCP</option>
            <option value="tool">Tool</option>
          </select>
        </div>
      </div>

      {/* Compatible Agents */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
            Compatible Agents
            <span className="ml-2 font-normal normal-case text-text-muted/70">
              ({skill.editedAgents.length}/{ALL_AGENTS.length})
            </span>
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({ editedAgents: [...ALL_AGENTS] })}
              className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              All
            </button>
            <span className="text-text-muted/40">·</span>
            <button
              type="button"
              onClick={() => onChange({ editedAgents: [] })}
              className="font-mono text-[10px] uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
            >
              None
            </button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_AGENTS.map(agent => {
            const active = skill.editedAgents.includes(agent);
            return (
              <button
                key={agent}
                type="button"
                onClick={() =>
                  onChange({
                    editedAgents: active
                      ? skill.editedAgents.filter(a => a !== agent)
                      : [...skill.editedAgents, agent],
                  })
                }
                className={`font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-1 border-2 transition-colors ${
                  active
                    ? "border-text-primary bg-text-primary text-bg-base"
                    : "border-border text-text-muted hover:border-text-primary hover:text-text-primary"
                }`}
              >
                {agent}
              </button>
            );
          })}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

// ── Skill import status card (read-only, shows result) ────────────────────

interface SkillImportStatusCardProps {
  skill: EditableSkill;
  showLink?: boolean;
}

function SkillImportStatusCard({ skill, showLink }: SkillImportStatusCardProps) {
  const status = skill.importStatus;

  return (
    <div
      className={`border-2 p-5 bg-bg-card flex items-start gap-4 ${
        status === "created"
          ? "border-text-primary"
          : status === "failed"
            ? "border-red-500"
            : "border-border"
      }`}
    >
      {/* Status indicator */}
      <div className="shrink-0 mt-0.5">
        {status === "importing" && (
          <div className="w-5 h-5 border-2 border-text-primary border-t-transparent animate-spin" />
        )}
        {status === "created" && (
          <div className="w-5 h-5 bg-text-primary flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <polyline points="2 6 5 9 10 3" stroke="white" strokeWidth="2" strokeLinecap="square" />
            </svg>
          </div>
        )}
        {status === "failed" && (
          <div className="w-5 h-5 bg-red-500 flex items-center justify-center">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <line x1="2" y1="2" x2="8" y2="8" stroke="white" strokeWidth="2" />
              <line x1="8" y1="2" x2="2" y2="8" stroke="white" strokeWidth="2" />
            </svg>
          </div>
        )}
        {!status && (
          <div className="w-5 h-5 border-2 border-border" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="font-mono font-bold text-text-primary truncate">
          {skill.editedName}
        </p>
        <p className="font-mono text-xs text-text-muted truncate">
          {skill.owner}/{skill.repo}
          {skill.path && skill.path !== "root" ? ` / ${skill.path}` : ""}
        </p>

        {status === "failed" && skill.importError && (
          <p className="font-mono text-xs text-red-600 mt-1">{skill.importError}</p>
        )}
        {status === "created" && showLink && skill.importedSlug && (
          <Link
            href={`/${skill.owner}/${skill.importedSlug}`}
            className="font-mono text-xs text-accent underline mt-1 inline-block hover:text-text-primary"
          >
            View /{skill.owner}/{skill.importedSlug} →
          </Link>
        )}
      </div>

      <div className="shrink-0">
        <span
          className={`font-mono text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 border-2 ${
            status === "created"
              ? "border-text-primary text-text-primary"
              : status === "failed"
                ? "border-red-500 text-red-600"
                : "border-border text-text-muted"
          }`}
        >
          {status ?? "queued"}
        </span>
      </div>
    </div>
  );
}
