"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import { generateInstallCommand } from "@/lib/install-command";
import { submissionsQueryKey } from "@/lib/queries/submissions";
import { FileTree } from "@/components/file-tree";

interface User {
  id: string;
  name: string | null;
  email: string;
  githubUsername: string | null;
}

interface SubmissionFormProps {
  user: User;
}

interface DetectedSkill {
  metadata: { name: string; description: string };
  instructions: string;
  files: unknown[];
  fileTree?: string[];
}

interface FormData {
  name: string;
  description: string; // auto-filled from skill metadata; not shown in UI
  type: "skill" | "mcp" | "tool";
  category: string;
  repoUrl: string;
  repoPath: string;
  tags: string[];
  authorHandle: string;
  compatibleAgents: string[];
  triggerWords: string[];
  isOpenSource: boolean;
  license: string;
  documentation: string;
  overview: string;
}

const categories = [
  "Development",
  "Data Analysis",
  "Content Creation",
  "Automation",
  "Research",
  "Communication",
  "Productivity",
  "Entertainment",
  "Education",
  "Finance",
  "Other",
];

const commonLicenses = [
  "MIT",
  "Apache-2.0",
  "GPL-3.0",
  "BSD-3-Clause",
  "ISC",
  "Unlicense",
  "Proprietary",
  "Other",
];

const availableAgents = [
  "Cursor",
  "Claude Code",
  "Gemini CLI",
  "GitHub Copilot",
  "Codex",
  "OpenCode",
  "Antigravity",
  "OpenClaws",
  "Aider",
  "Cline",
  "RooCode",
  "Windsurf",
  "Devin",
  "Manus",
  "Amp",
  "Goose",
  "Crush",
  "Kiro",
  "Kilo Code",
  "Zencoder",
  "Amazon Q",
  "Tabnine",
  "Other",
];

const analyzeMessages = [
  "Analysing repository...",
  "Searching for /skills directory...",
  "Fetching through skill files...",
  "Parsing SKILL.md metadata...",
  "Detecting trigger keywords...",
  "Checking README for docs...",
  "Reading repository tree...",
  "Almost there...",
];

const ROTATE_KEYFRAMES = `
  @keyframes __adk_msg_in {
    from { opacity: 0; transform: translateY(7px); }
    to   { opacity: 1; transform: translateY(0px); }
  }
  @keyframes __adk_msg_out {
    from { opacity: 1; transform: translateY(0px); }
    to   { opacity: 0; transform: translateY(-7px); }
  }
`;

function RotatingAnalysisMessage() {
  const [msgIndex, setMsgIndex] = useState(0);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    if (exiting) return;
    const delay = 3000 + Math.random() * 2000;
    const t = setTimeout(() => setExiting(true), delay);
    return () => clearTimeout(t);
  }, [msgIndex, exiting]);

  useEffect(() => {
    if (!exiting) return;
    const t = setTimeout(() => {
      setMsgIndex((prev) => (prev + 1) % analyzeMessages.length);
      setExiting(false);
    }, 260);
    return () => clearTimeout(t);
  }, [exiting]);

  return (
    <>
      <style>{ROTATE_KEYFRAMES}</style>
      <span
        key={`${msgIndex}-${exiting}`}
        style={{
          display: "inline-block",
          animationName: exiting ? "__adk_msg_out" : "__adk_msg_in",
          animationDuration: "0.25s",
          animationTimingFunction: "ease",
          animationFillMode: "forwards",
        }}
      >
        {analyzeMessages[msgIndex]}
      </span>
    </>
  );
}

export default function SubmissionForm({ user }: SubmissionFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detectedSkills, setDetectedSkills] = useState<
    Record<string, DetectedSkill>
  >({});
  const [selectedSkillPath, setSelectedSkillPath] = useState<string>("");
  const [skillSearch, setSkillSearch] = useState("");
  const [currentTriggerWord, setCurrentTriggerWord] = useState("");
  const [currentTag, setCurrentTag] = useState("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    type: "skill",
    category: "Development",
    repoUrl: "",
    repoPath: "",
    tags: [],
    authorHandle: "",
    compatibleAgents: [],
    triggerWords: [],
    isOpenSource: true,
    license: "MIT",
    documentation: "",
    overview: "",
  });

  // Install command — only after a skill has been selected and named
  const generatedInstallCommand = useMemo(() => {
    if (!selectedSkillPath || !formData.authorHandle || !formData.name)
      return "";
    return generateInstallCommand({
      authorHandle: formData.authorHandle,
      skillName: formData.name,
    });
  }, [selectedSkillPath, formData.authorHandle, formData.name]);

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >,
  ) => {
    const { name, value, type } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "checkbox" ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleAgentToggle = (agent: string) => {
    setFormData((prev) => ({
      ...prev,
      compatibleAgents: prev.compatibleAgents.includes(agent)
        ? prev.compatibleAgents.filter((a) => a !== agent)
        : [...prev.compatibleAgents, agent],
    }));
  };

  const addTriggerWord = (word: string) => {
    const trimmed = word.trim();
    if (trimmed && !formData.triggerWords.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        triggerWords: [...prev.triggerWords, trimmed],
      }));
    }
    setCurrentTriggerWord("");
  };

  const removeTriggerWord = (w: string) => {
    setFormData((prev) => ({
      ...prev,
      triggerWords: prev.triggerWords.filter((x) => x !== w),
    }));
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !formData.tags.includes(trimmed)) {
      setFormData((prev) => ({ ...prev, tags: [...prev.tags, trimmed] }));
    }
    setCurrentTag("");
  };

  const removeTag = (t: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((x) => x !== t),
    }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(currentTag);
    } else if (
      e.key === "Backspace" &&
      currentTag === "" &&
      formData.tags.length > 0
    ) {
      removeTag(formData.tags[formData.tags.length - 1]);
    }
  };

  const handleTagPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted.includes(",")) return;
    e.preventDefault();
    pasted
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach(addTag);
  };

  const handleTriggerWordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTriggerWord(currentTriggerWord);
    } else if (
      e.key === "Backspace" &&
      currentTriggerWord === "" &&
      formData.triggerWords.length > 0
    ) {
      removeTriggerWord(
        formData.triggerWords[formData.triggerWords.length - 1],
      );
    }
  };

  const handleTriggerWordPaste = (
    e: React.ClipboardEvent<HTMLInputElement>,
  ) => {
    const pasted = e.clipboardData.getData("text");
    if (!pasted.includes(",")) return;
    e.preventDefault();
    pasted
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean)
      .forEach(addTriggerWord);
  };

  const selectSkill = (skillPath: string, skill: DetectedSkill) => {
    setSelectedSkillPath(skillPath);
    setFormData((prev) => ({
      ...prev,
      name: skill.metadata.name || prev.name,
      // description is the hidden short-form field sent to the API
      description: skill.metadata.description || prev.description,
      // overview is the user-visible textarea — pre-filled from SKILL.md frontmatter
      overview: skill.metadata.description || prev.overview,
      repoPath: skillPath === "root" ? "" : skillPath,
    }));
  };

  // H-5: analyzeRepository accepts an AbortSignal so stale in-flight requests
  // can be cancelled when the URL changes before the response arrives.
  const analyzeRepository = useCallback(
    async (repoUrl: string, signal?: AbortSignal) => {
      if (!repoUrl || !repoUrl.includes("github.com")) {
        setDetectedSkills({});
        return;
      }

      setIsAnalyzing(true);
      const loadingToast = sileo.show({
        title: "Analyzing Repository",
        description: <RotatingAnalysisMessage />,
        type: "loading",
        duration: null,
      });

      try {
        const response = await fetch("/api/analyze-repo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ repoUrl }),
          signal,
        });

        if (!response.ok) {
          let errorMessage = "Failed to analyze repository";
          try {
            const errorData = (await response.json()) as { error?: string };
            errorMessage = errorData.error ?? errorMessage;
          } catch {
            errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          }
          throw new Error(errorMessage);
        }

        const analysis = (await response.json()) as {
          folders?: string[];
          skills?: Record<string, DetectedSkill>;
          license?: string;
        };

        const skills = analysis.skills ?? {};
        setDetectedSkills(skills);

        const skillPaths = Object.keys(skills);
        const skillsMessage =
          skillPaths.length > 0
            ? `, ${skillPaths.length} skill${skillPaths.length === 1 ? "" : "s"}`
            : "";

        // Auto-select and auto-populate if exactly one skill found
        if (skillPaths.length === 1) {
          const skillPath = skillPaths[0];
          selectSkill(skillPath, skills[skillPath]);
        }

        setFormData((prev) => ({
          ...prev,
          license:
            analysis.license && analysis.license !== "NOASSERTION"
              ? analysis.license
              : prev.license,
        }));

        sileo.dismiss(loadingToast);
        sileo.success({
          title: "Repository Analysis Complete",
          description: `Found ${analysis.folders?.length ?? 0} folders${skillsMessage}${analysis.license ? `, license: ${analysis.license}` : ""}.`,
          duration: 4000,
        });
      } catch (err) {
        // AbortError means the URL changed and a newer request superseded this
        // one — silently discard rather than showing a spurious error toast.
        if (err instanceof Error && err.name === "AbortError") return;
        const message =
          err instanceof Error
            ? err.message
            : "Could not analyze repository. Please verify the URL is correct and the repository is accessible.";
        sileo.dismiss(loadingToast);
        sileo.error({
          title: "Repository Analysis Failed",
          description: message,
          duration: 6000,
        });
        setDetectedSkills({});
      } finally {
        setIsAnalyzing(false);
      }
    },
    // selectSkill only calls stable setters — safe to omit from deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // H-5: Debounce in a useEffect so cleanup (clearTimeout + abort) actually runs.
  // Event handler return values are ignored by React; only useEffect returns work.
  useEffect(() => {
    const url = formData.repoUrl;
    if (!url || !url.includes("github.com")) {
      setDetectedSkills({});
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      void analyzeRepository(url, controller.signal);
    }, 1000);

    return () => {
      clearTimeout(timeoutId);
      controller.abort();
    };
  }, [formData.repoUrl, analyzeRepository]);

  const handleRepoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    handleInputChange(e);

    // Auto-extract repo owner as authorHandle from the URL
    const ownerMatch = value.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (ownerMatch) {
      setFormData((prev) => ({ ...prev, authorHandle: ownerMatch[1] }));
    }
    // Debounced analysis is handled by the useEffect above
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    if (formData.compatibleAgents.length === 0) {
      setError("Please select at least one compatible agent.");
      setIsSubmitting(false);
      sileo.error({
        title: "Validation Error",
        description: "Please select at least one compatible agent.",
        styles: { title: "text-[var(--sileo-state-error)]!" },
      });
      return;
    }

    const submittingToast = sileo.show({
      title: "Processing submission...",
      description: "Validating your skill and creating submission.",
      type: "loading",
      duration: null,
    });

    try {
      // description is auto-filled from skill metadata; fall back to first
      // 200 chars of overview if somehow still empty
      const description =
        formData.description ||
        formData.overview.slice(0, 200).replace(/\n/g, " ").trim();

      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          description,
          longDescription: formData.overview, // overview covers the long-form content
          selectedSkillPath,
        }),
      });

      if (!response.ok) {
        const errorData = (await response.json()) as { error?: string };
        throw new Error(errorData.error ?? "Failed to submit");
      }

      sileo.dismiss(submittingToast);
      sileo.success({
        title: "Submission successful!",
        description:
          "Your skill has been submitted for review. We'll notify you once it's approved.",
        duration: 3000,
      });

      await queryClient.invalidateQueries({ queryKey: submissionsQueryKey });
      setTimeout(() => router.push("/submit"), 2000);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit";
      setError(errorMessage);
      sileo.dismiss(submittingToast);
      sileo.error({
        title: "Submission failed",
        description: errorMessage,
        styles: { title: "text-[var(--sileo-state-error)]!" },
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const skillPaths = Object.keys(detectedSkills);
  const selectedSkill = selectedSkillPath
    ? detectedSkills[selectedSkillPath]
    : null;

  return (
    <div className="bg-bg-surface border-2 border-dashed border-border p-8">
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* ── 1. REPOSITORY ─────────────────────────────────────────────── */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Repository
          </h2>

          {/* Repo URL */}
          <div>
            <label
              htmlFor="repoUrl"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Repository URL *
            </label>
            <div className="relative">
              <input
                type="url"
                id="repoUrl"
                name="repoUrl"
                required
                value={formData.repoUrl}
                onChange={handleRepoUrlChange}
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none"
                placeholder="https://github.com/username/repo"
              />
              {isAnalyzing && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <svg
                    className="animate-spin h-4 w-4 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
            </div>
            <p className="sr-only">
              GitHub repository URL — will auto-scan for skills and content
            </p>
          </div>

          {/* Author (read-only, right next to repo URL) */}
          {formData.authorHandle && (
            <div>
              <label
                htmlFor="authorHandle"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Author
              </label>
              <input
                type="text"
                id="authorHandle"
                name="authorHandle"
                readOnly
                value={formData.authorHandle}
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-dim cursor-not-allowed opacity-70"
              />
              <p className="sr-only">
                Auto-extracted from the repo URL — this is the GitHub owner, not
                your account
              </p>
            </div>
          )}

          {/* Detected skills — collapses to selected card once a skill is chosen */}
          {skillPaths.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-text-primary">
                  {selectedSkillPath
                    ? "Selected Skill"
                    : `Detected Skills (${skillPaths.length})`}
                </label>
                {selectedSkillPath && (
                  <button
                    type="button"
                    onClick={() => { setSelectedSkillPath(""); setSkillSearch(""); }}
                    className="text-xs text-text-dim hover:text-accent transition-colors underline underline-offset-2"
                  >
                    Change
                  </button>
                )}
              </div>

              {selectedSkill ? (
                /* Compact selected-skill card */
                <div className="p-4 border border-accent bg-accent/5 rounded-sm">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h4 className="font-medium text-text-primary truncate">
                        {selectedSkill.metadata.name}
                      </h4>
                      <p className="text-sm text-text-secondary mt-0.5 truncate">
                        {selectedSkill.metadata.description}
                      </p>
                      <p className="text-xs text-text-dim mt-1">
                        {selectedSkillPath === "root"
                          ? "/"
                          : `/${selectedSkillPath}`}
                        {" · "}
                        {(selectedSkill.files as unknown[]).length} files
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-semibold text-accent uppercase tracking-widest mt-0.5">
                      ✓ Selected
                    </span>
                  </div>

                  {(selectedSkill.files as unknown[]).length > 0 && (
                    <div className="mt-3 border border-border bg-bg-base">
                      <p className="px-3 pt-2 pb-1 text-xs font-bold text-text-muted uppercase tracking-widest border-b border-border">
                        File structure
                      </p>
                      <FileTree
                        files={(selectedSkill.files as Array<{ filePath: string; fileName: string }>).map((f) => ({
                          name: f.fileName,
                          path: f.filePath,
                        }))}
                        className="py-1 max-h-48 overflow-y-auto"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Full list — shown when no skill is selected yet */
                <div className="space-y-2">
                  {/* Search filter — only shown when there are enough skills to warrant it */}
                  {skillPaths.length > 5 && (
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Search skills..."
                        value={skillSearch}
                        onChange={(e) => setSkillSearch(e.target.value)}
                        className="w-full px-3 py-2 pl-8 bg-bg-deep border border-border rounded-sm text-sm text-text-primary placeholder:text-text-dim focus:outline-none focus:border-accent font-mono"
                      />
                      <svg
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                      </svg>
                    </div>
                  )}

                  {(() => {
                    const query = skillSearch.trim().toLowerCase();
                    const filtered = skillPaths.filter((skillPath) => {
                      if (!query) return true;
                      const skill = detectedSkills[skillPath];
                      return (
                        skill.metadata.name.toLowerCase().includes(query) ||
                        skillPath.toLowerCase().includes(query)
                      );
                    });

                    if (filtered.length === 0) {
                      return (
                        <p className="text-xs text-text-dim text-center py-4 font-mono">
                          No skills match &ldquo;{skillSearch}&rdquo;
                        </p>
                      );
                    }

                    return (
                      <>
                        {filtered.map((skillPath) => {
                          const skill = detectedSkills[skillPath];
                          return (
                            <div
                              key={skillPath}
                              className="p-4 border border-border hover:border-accent/50 rounded-sm cursor-pointer transition-colors"
                              onClick={() => {
                                setSkillSearch("");
                                selectSkill(skillPath, skill);
                              }}
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="min-w-0">
                                  <h4 className="font-medium text-text-primary truncate">
                                    {skill.metadata.name}
                                  </h4>
                                  <p className="text-sm text-text-secondary mt-0.5 truncate">
                                    {skill.metadata.description}
                                  </p>
                                  <p className="text-xs text-text-dim mt-1">
                                    {skillPath === "root" ? "/" : `/${skillPath}`}
                                    {" · "}
                                    {(skill.files as unknown[]).length} files
                                  </p>
                                </div>
                                <span className="shrink-0 text-xs text-text-dim mt-0.5">
                                  Select →
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        {query && (
                          <p className="text-xs text-text-dim text-center pt-1 font-mono">
                            {filtered.length} of {skillPaths.length} skills
                          </p>
                        )}
                      </>
                    );
                  })()}

                  <p className="sr-only">
                    Click a skill to auto-populate the form fields below
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-dashed border-border/50" />

        {/* ── 2. SKILL DETAILS ──────────────────────────────────────────── */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Skill Details
          </h2>

          {/* Name + Type */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none"
                placeholder="My Awesome Skill"
              />
            </div>

            <div>
              <label
                htmlFor="type"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Type *
              </label>
              <select
                id="type"
                name="type"
                required
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary focus:border-accent focus:outline-none"
              >
                <option value="skill">Skill</option>
                <option value="mcp">MCP Server</option>
                <option value="tool">Tool</option>
              </select>
            </div>
          </div>

          {/* Install command — only visible after skill selection */}
          {generatedInstallCommand && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Install Command
                <span className="text-xs text-text-dim font-normal ml-2">
                  (auto-generated)
                </span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={generatedInstallCommand}
                  readOnly
                  className="w-full px-3 py-2 bg-bg-inset border border-border text-text-primary font-mono text-sm focus:border-accent focus:outline-none cursor-text"
                  onClick={(e) => e.currentTarget.select()}
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(generatedInstallCommand);
                    sileo.success({
                      title: "Copied!",
                      description: "Install command copied to clipboard",
                      duration: 2000,
                    });
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-text-dim hover:text-text-primary transition-colors"
                  title="Copy to clipboard"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          {/* Category + Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="category"
                className="block text-sm font-medium text-text-primary mb-2"
              >
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary focus:border-accent focus:outline-none"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Tags
              </label>
              <div className="border border-border rounded-sm p-2 bg-bg-deep focus-within:border-accent min-h-[44px]">
                <div className="flex flex-wrap gap-2 items-center">
                  {formData.tags.map((tag, i) => (
                    <div
                      key={`${tag}-${i}`}
                      className="group inline-flex items-center gap-1 px-2 py-1 bg-bg-card border border-border rounded text-xs font-medium text-text-primary hover:border-accent transition-all duration-200"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-150 ml-1 p-0.5 hover:bg-red-500 hover:text-white rounded-full"
                        title="Remove tag"
                      >
                        <svg
                          className="w-3 h-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth="2"
                        >
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <input
                    type="text"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyDown={handleTagInput}
                    onPaste={handleTagPaste}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-text-primary placeholder-text-dim"
                    placeholder={
                      formData.tags.length === 0
                        ? "Type tags and press comma or enter..."
                        : "Add more..."
                    }
                  />
                </div>
              </div>
              <p className="sr-only">e.g. python, api, automation</p>
            </div>
          </div>
        </div>

        <div className="border-t border-dashed border-border/50" />

        {/* ── 3. DESCRIPTION ────────────────────────────────────────────── */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Description
          </h2>

          <div>
            <label
              htmlFor="overview"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Overview *
            </label>
            <textarea
              id="overview"
              name="overview"
              required
              rows={4}
              value={formData.overview}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none resize-none"
              placeholder="A short paragraph describing what this skill does and when to use it."
            />
            <p className="sr-only">
              Plain text only. Keep it concise — 2 to 4 sentences.
            </p>
          </div>
        </div>

        <div className="border-t border-dashed border-border/50" />

        {/* ── 4. AGENTS & TRIGGERS ──────────────────────────────────────── */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Agents &amp; Triggers
          </h2>

          {/* Compatible Agents */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-3">
              Compatible Agents *
            </label>
            <div className="flex flex-wrap gap-2">
              {availableAgents.map((agent) => (
                <button
                  key={agent}
                  type="button"
                  onClick={() => handleAgentToggle(agent)}
                  disabled={isAnalyzing}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.compatibleAgents.includes(agent)
                      ? "bg-accent text-white border-accent shadow-[2px_2px_0px_0px_var(--color-text-primary)] hover:shadow-[4px_4px_0px_0px_var(--color-text-primary)] hover:-translate-x-[2px] hover:-translate-y-[2px]"
                      : "bg-bg-base text-text-primary border-border hover:bg-bg-card hover:border-accent"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {formData.compatibleAgents.includes(agent) && (
                      <svg
                        className="w-3 h-3"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                    {agent}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="border-t border-dashed border-border/50" />

          {/* Trigger Phrases */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Trigger Phrases
            </label>
            <div className="border border-border rounded-sm p-2 bg-bg-deep focus-within:border-accent min-h-[44px]">
              <div className="flex flex-wrap gap-2 items-center">
                {formData.triggerWords.map((word, i) => (
                  <div
                    key={`${word}-${i}`}
                    className="group inline-flex items-center gap-1 px-2 py-1 bg-bg-card border border-border rounded text-xs font-medium text-text-primary hover:border-accent transition-all duration-200"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => removeTriggerWord(word)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-150 ml-1 p-0.5 hover:bg-red-500 hover:text-white rounded-full"
                      title="Remove"
                    >
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        strokeWidth="2"
                      >
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                ))}
                <input
                  type="text"
                  value={currentTriggerWord}
                  onChange={(e) => setCurrentTriggerWord(e.target.value)}
                  onKeyDown={handleTriggerWordInput}
                  onPaste={handleTriggerWordPaste}
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-text-primary placeholder-text-dim"
                  placeholder={
                    formData.triggerWords.length === 0
                      ? "e.g. navigate page, fill form, take screenshot..."
                      : "Add more..."
                  }
                />
              </div>
            </div>
            <p className="sr-only">
              Phrases that describe when Claude should use this skill. Press
              comma or enter to add.
            </p>
          </div>
        </div>

        <div className="border-t border-dashed border-border/50" />

        {/* ── 5. LICENSE & AVAILABILITY ─────────────────────────────────── */}
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            License &amp; Availability
          </h2>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="isOpenSource"
              name="isOpenSource"
              checked={formData.isOpenSource}
              onChange={handleInputChange}
              className="h-4 w-4 text-accent bg-bg-deep border-border rounded focus:ring-accent focus:ring-2"
            />
            <label htmlFor="isOpenSource" className="text-sm text-text-primary">
              This is open source
            </label>
          </div>

          <div className="max-w-xs">
            <label
              htmlFor="license"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              License *
            </label>
            <select
              id="license"
              name="license"
              required
              value={formData.license}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary focus:border-accent focus:outline-none"
            >
              {commonLicenses.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── SUBMIT ────────────────────────────────────────────────────── */}
        <div className="border-t border-border pt-8">
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-accent text-bg-deep font-medium rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Submitting..." : "Submit for Review"}
            </button>
          </div>

          <p className="text-xs text-text-dim mt-4">
            Your submission will be reviewed by our team before being published.
            You&apos;ll receive a notification once it&apos;s approved or if
            changes are needed.
          </p>
        </div>
      </form>
    </div>
  );
}
