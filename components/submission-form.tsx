"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";
import { generateInstallCommand } from "@/lib/install-command";

interface User {
  id: string;
  name: string | null;
  email: string;
  githubUsername: string | null;
}

interface SubmissionFormProps {
  user: User;
}

interface FormData {
  name: string;
  description: string;
  longDescription: string;
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
  "Claude",
  "GPT-4",
  "GPT-3.5",
  "Codex",
  "Gemini",
  "LLaMA",
  "Anthropic Claude",
  "OpenAI GPT",
  "Google Bard",
  "Microsoft Copilot",
  "Cohere",
  "AI21 Jurassic",
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

  // Schedule the next exit after a random 3–5 s window
  useEffect(() => {
    if (exiting) return;
    const delay = 3000 + Math.random() * 2000;
    const t = setTimeout(() => setExiting(true), delay);
    return () => clearTimeout(t);
  }, [msgIndex, exiting]);

  // After the exit animation plays, swap the message and start the enter
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [detectedSkills, setDetectedSkills] = useState<Record<string, any>>({});
  const [selectedSkillPath, setSelectedSkillPath] = useState<string>("");
  const [currentTriggerWord, setCurrentTriggerWord] = useState("");
  const [currentTag, setCurrentTag] = useState("");

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    longDescription: "",
    type: "skill",
    category: "Development",
    repoUrl: "",
    repoPath: "",
    tags: [],
    authorHandle:
      user.githubUsername || user.name?.toLowerCase().replace(/\s+/g, "") || "",
    compatibleAgents: [],
    triggerWords: [],
    isOpenSource: true,
    license: "MIT",
    documentation: "",
    overview: "",
  });

  // Generate install command based on current form data
  const generatedInstallCommand = useMemo(() => {
    if (!formData.repoUrl || !formData.authorHandle) {
      return "";
    }
    
    return generateInstallCommand({
      repoUrl: formData.repoUrl,
      authorHandle: formData.authorHandle,
      skillName: formData.name || undefined
    });
  }, [formData.repoUrl, formData.authorHandle, formData.name]);

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
    const trimmedWord = word.trim();
    if (trimmedWord && !formData.triggerWords.includes(trimmedWord)) {
      setFormData((prev) => ({
        ...prev,
        triggerWords: [...prev.triggerWords, trimmedWord],
      }));
    }
    setCurrentTriggerWord("");
  };

  const removeTriggerWord = (wordToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      triggerWords: prev.triggerWords.filter((word) => word !== wordToRemove),
    }));
  };

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !formData.tags.includes(trimmedTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, trimmedTag],
      }));
    }
    setCurrentTag("");
  };

  const removeTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "," || e.key === "Enter") {
      e.preventDefault();
      addTag(currentTag);
    } else if (e.key === "Backspace" && currentTag === "" && formData.tags.length > 0) {
      const lastTag = formData.tags[formData.tags.length - 1];
      removeTag(lastTag);
    }
  };

  const handleTriggerWordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ",") {
      e.preventDefault();
      addTriggerWord(currentTriggerWord);
    } else if (e.key === "Enter") {
      e.preventDefault();
      addTriggerWord(currentTriggerWord);
    } else if (
      e.key === "Backspace" &&
      currentTriggerWord === "" &&
      formData.triggerWords.length > 0
    ) {
      // Remove last trigger word if input is empty and backspace is pressed
      const lastWord = formData.triggerWords[formData.triggerWords.length - 1];
      removeTriggerWord(lastWord);
    }
  };

  const analyzeRepository = useCallback(async (repoUrl: string) => {
    if (!repoUrl || !repoUrl.includes("github.com")) {
      setAvailableFolders([]);
      return;
    }

    setIsAnalyzing(true);

    // Show persistent loading toast
    const loadingToast = sileo.show({
      title: "Analyzing Repository",
      description: <RotatingAnalysisMessage />,
      type: "loading",
      duration: null, // persistent
    });

    try {
      const response = await fetch("/api/analyze-repo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        let errorMessage = "Failed to analyze repository";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (jsonError) {
          console.warn("Failed to parse error response as JSON:", jsonError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      let analysis;
      try {
        analysis = await response.json();
      } catch (jsonError) {
        console.error("Failed to parse analysis response as JSON:", jsonError);
        throw new Error("Invalid response format from repository analysis");
      }

      setAvailableFolders(analysis.folders || []);
      setDetectedSkills(analysis.skills || {});

      // Check if skills were detected
      const skillPaths = Object.keys(analysis.skills || {});
      let skillsMessage = "";

      if (skillPaths.length > 0) {
        skillsMessage = `, ${skillPaths.length} skill${skillPaths.length === 1 ? "" : "s"}`;

        // If only one skill detected, auto-select it
        if (skillPaths.length === 1) {
          const skillPath = skillPaths[0];
          const skill = analysis.skills[skillPath];
          setSelectedSkillPath(skillPath);

          // Auto-populate form with skill metadata
          setFormData((prev) => ({
            ...prev,
            name: skill.metadata.name || prev.name,
            description: skill.metadata.description || prev.description,
            longDescription: skill.instructions || prev.longDescription,
            triggerWords: prev.triggerWords,
            repoPath: skillPath === "root" ? "" : skillPath,
            license:
              analysis.license && analysis.license !== "NOASSERTION"
                ? analysis.license
                : prev.license,
          }));
        }
      }

      // Auto-populate basic fields if no skills detected
      if (skillPaths.length === 0) {
        setFormData((prev) => ({
          ...prev,
          license:
            analysis.license && analysis.license !== "NOASSERTION"
              ? analysis.license
              : prev.license,
        }));
      }

      // Dismiss loading toast and show success
      sileo.dismiss(loadingToast);
      sileo.success({
        title: "Repository Analysis Complete",
        description: `Found ${analysis.folders?.length || 0} folders${skillsMessage}${analysis.license ? `, license: ${analysis.license}` : ""}.`,
        duration: 4000,
      });
    } catch (error: any) {
      console.error("Repository analysis failed:", error);

      // Dismiss loading toast and show error
      sileo.dismiss(loadingToast);
      sileo.error({
        title: "Repository Analysis Failed",
        description:
          error.message ||
          "Could not analyze repository. Please verify the URL is correct and the repository is accessible.",
        duration: 6000,
      });
      setAvailableFolders([]);
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const handleRepoUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    handleInputChange(e);

    // Debounce the analysis
    const timeoutId = setTimeout(() => {
      if (value && value.includes("github.com")) {
        analyzeRepository(value);
      }
    }, 1000);

    return () => clearTimeout(timeoutId);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate compatible agents
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
      duration: null, // persistent until dismissed
    });

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          triggerWords: formData.triggerWords,
          selectedSkillPath: selectedSkillPath,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit");
      }

      const result = await response.json();

      sileo.dismiss(submittingToast);
      sileo.success({
        title: "Submission successful!",
        description:
          "Your skill has been submitted for review. We'll notify you once it's approved.",
        duration: 3000,
      });

      // Delay navigation so the success toast is visible
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

  return (
    <div className="bg-bg-surface border-2 border-dashed border-border p-8">
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Repository Information */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Repository Information
          </h2>

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
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
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
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
              )}
            </div>
            <p className="text-xs text-text-dim mt-1">
              GitHub repository URL - will auto-scan for folders and content
            </p>
          </div>

          {/* Auto-Generated Install Command */}
          {generatedInstallCommand && (
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Installation Command
                <span className="text-xs text-text-dim font-normal ml-2">
                  (Auto-generated)
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
                      description: "Installation command copied to clipboard",
                      duration: 2000,
                    });
                  }}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1.5 text-text-dim hover:text-text-primary transition-colors"
                  title="Copy to clipboard"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                  </svg>
                </button>
              </div>
              <p className="text-xs text-text-dim mt-1">
                This command will be used to install your skill via the AgentDropkit CLI
              </p>
            </div>
          )}

          {/* Detected Skills Selection */}
          {Object.keys(detectedSkills).length > 0 && (
            <div className="mt-6">
              <label className="block text-sm font-medium text-text-primary mb-2">
                Detected Skills
              </label>
              <div className="space-y-3">
                {Object.entries(detectedSkills).map(
                  ([skillPath, skill]: [string, any]) => (
                    <div
                      key={skillPath}
                      className={`p-4 border rounded-sm cursor-pointer transition-colors ${selectedSkillPath === skillPath
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-accent/50"
                        }`}
                      onClick={() => {
                        setSelectedSkillPath(skillPath);
                        setFormData((prev) => ({
                          ...prev,
                          name: skill.metadata.name || prev.name,
                          description:
                            skill.metadata.description || prev.description,
                          longDescription:
                            skill.instructions || prev.longDescription,
                          triggerWords: prev.triggerWords,
                          repoPath: skillPath === "root" ? "" : skillPath,
                        }));
                      }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-text-primary truncate">
                            {skill.metadata.name}
                          </h4>
                          <p className="text-sm text-text-secondary mt-1 truncate overflow-hidden whitespace-nowrap">
                            {skill.metadata.description}
                          </p>
                          <p className="text-xs text-text-dim mt-1 truncate">
                            Path: {skillPath === "root" ? "/" : `/${skillPath}`}{" "}
                            • {skill.files.length} files
                          </p>
                        </div>
                        {selectedSkillPath === skillPath && (
                          <div className="text-accent text-sm font-medium ml-4">
                            Selected
                          </div>
                        )}
                      </div>

                      {/* File Tree */}
                      {selectedSkillPath === skillPath && skill.fileTree && (
                        <div className="mt-4 p-3 bg-bg-deep rounded border">
                          <h5 className="text-xs font-medium text-text-secondary mb-2">
                            File Structure:
                          </h5>
                          <pre className="text-xs text-text-dim font-mono leading-relaxed">
                            {skill.fileTree.join("\n")}
                          </pre>
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
              <p className="text-xs text-text-dim mt-2">
                Select a skill to auto-populate form fields with its metadata
              </p>
            </div>
          )}
        </div>

        {/* Basic Information */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Basic Information
          </h2>

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

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Short Description *
            </label>
            <textarea
              id="description"
              name="description"
              required
              rows={3}
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none resize-vertical"
              placeholder="1-2 sentences that summarize what your skill does"
            />
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div>
            <label
              htmlFor="longDescription"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Detailed Description *
            </label>
            <textarea
              id="longDescription"
              name="longDescription"
              required
              rows={6}
              value={formData.longDescription}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none resize-vertical"
              placeholder="Detailed description of features, use cases, and benefits..."
            />
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
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
                  {formData.tags.map((tag, index) => (
                    <div
                      key={`${tag}-${index}`}
                      className="group inline-flex items-center gap-1 px-2 py-1 bg-bg-card border border-border rounded text-xs font-medium text-text-primary hover:border-accent transition-all duration-200 animate-in fade-in slide-in-from-bottom-1"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="opacity-0 group-hover:opacity-100 transition-all duration-150 ml-1 p-0.5 hover:bg-red-500 hover:text-white rounded-full hover:scale-110"
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
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-text-primary placeholder-text-dim"
                    placeholder={
                      formData.tags.length === 0
                        ? "Type tags and press comma or enter..."
                        : "Add more..."
                    }
                  />
                </div>
              </div>
              <p className="text-xs text-text-dim mt-2">
                Type tags like "python", "api", "automation" and press comma or enter to add them.
              </p>
            </div>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div>
            <label
              htmlFor="authorHandle"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Author Handle *
            </label>
            <input
              type="text"
              id="authorHandle"
              name="authorHandle"
              required
              value={formData.authorHandle}
              onChange={handleInputChange}
              className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none"
              placeholder="your-username"
            />
            <p className="text-xs text-text-dim mt-1 sr-only">
              Your username or handle for attribution
            </p>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          {/* Compatible Agents */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-4">
              Compatible Agents *
            </label>
            <div className="flex flex-wrap gap-2">
              {availableAgents.map((agent) => (
                <button
                  key={agent}
                  type="button"
                  onClick={() => handleAgentToggle(agent)}
                  disabled={isAnalyzing}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${formData.compatibleAgents.includes(agent)
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
            <p className="text-xs text-text-dim mt-3 sr-only">
              Select all AI agents that are compatible with your {formData.type}
              . At least one agent must be selected.
              {formData.compatibleAgents.length > 0 && (
                <span className="block mt-1 text-accent font-medium">
                  Selected: {formData.compatibleAgents.join(", ")}
                </span>
              )}
            </p>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          {/* Trigger Phrases */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Trigger Phrases
            </label>
            <div className="border border-border rounded-sm p-2 bg-bg-deep focus-within:border-accent min-h-[44px]">
              <div className="flex flex-wrap gap-2 items-center">
                {formData.triggerWords.map((word, index) => (
                  <div
                    key={`${word}-${index}`}
                    className="group inline-flex items-center gap-1 px-2 py-1 bg-bg-card border border-border rounded text-xs font-medium text-text-primary hover:border-accent transition-all duration-200 animate-in fade-in slide-in-from-bottom-1"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => removeTriggerWord(word)}
                      className="opacity-0 group-hover:opacity-100 transition-all duration-150 ml-1 p-0.5 hover:bg-red-500 hover:text-white rounded-full hover:scale-110"
                      title="Remove trigger phrase"
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
                  className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-text-primary placeholder-text-dim"
                  placeholder={
                    formData.triggerWords.length === 0
                      ? "Type trigger phrases and press comma or enter..."
                      : "Add more..."
                  }
                />
              </div>
            </div>
            <p className="text-xs text-text-dim mt-2">
              Type action phrases like "navigate page", "fill forms", "take
              screenshot" and press comma or enter to add them.
            </p>
          </div>
        </div>

        {/* License Information */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            License & Availability
          </h2>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isOpenSource"
              name="isOpenSource"
              checked={formData.isOpenSource}
              onChange={handleInputChange}
              className="h-4 w-4 text-accent bg-bg-deep border-border rounded focus:ring-accent focus:ring-2"
            />
            <label
              htmlFor="isOpenSource"
              className="ml-2 block text-sm text-text-primary"
            >
              This is open source
            </label>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div>
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
              disabled={isAnalyzing}
              className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {commonLicenses.map((license) => (
                <option key={license} value={license}>
                  {license}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Overview Section */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Overview & Usage
          </h2>

          <div>
            <label
              htmlFor="overview"
              className="block text-sm font-medium text-text-primary mb-2"
            >
              Overview
            </label>
            <textarea
              id="overview"
              name="overview"
              rows={8}
              value={formData.overview}
              onChange={handleInputChange}
              disabled={isAnalyzing}
              className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none resize-vertical disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Comprehensive guide shown on the skill details page. Include usage
              examples, configuration details, etc. (Auto-populated from README
              when available)..."
            />
          </div>
        </div>

        {/* Submit Button */}
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
            You'll receive an email notification once it's approved or if
            changes are needed.
          </p>
        </div>
      </form>
    </div>
  );
}
