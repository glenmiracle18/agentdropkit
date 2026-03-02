"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { sileo } from "sileo";

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
  tags: string;
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
  "Other"
];

const commonLicenses = [
  "MIT",
  "Apache-2.0", 
  "GPL-3.0",
  "BSD-3-Clause",
  "ISC",
  "Unlicense",
  "Proprietary",
  "Other"
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
  "Other"
];

export default function SubmissionForm({ user }: SubmissionFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [availableFolders, setAvailableFolders] = useState<string[]>([]);
  const [currentTriggerWord, setCurrentTriggerWord] = useState("");
  
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    longDescription: "",
    type: "skill",
    category: "Development",
    repoUrl: "",
    repoPath: "",
    tags: "",
    authorHandle: user.githubUsername || user.name?.toLowerCase().replace(/\s+/g, "") || "",
    compatibleAgents: [],
    triggerWords: [],
    isOpenSource: true,
    license: "MIT",
    documentation: "",
    overview: ""
  });

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleAgentToggle = (agent: string) => {
    setFormData(prev => ({
      ...prev,
      compatibleAgents: prev.compatibleAgents.includes(agent)
        ? prev.compatibleAgents.filter(a => a !== agent)
        : [...prev.compatibleAgents, agent]
    }));
  };

  const addTriggerWord = (word: string) => {
    const trimmedWord = word.trim();
    if (trimmedWord && !formData.triggerWords.includes(trimmedWord)) {
      setFormData(prev => ({
        ...prev,
        triggerWords: [...prev.triggerWords, trimmedWord]
      }));
    }
    setCurrentTriggerWord("");
  };

  const removeTriggerWord = (wordToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      triggerWords: prev.triggerWords.filter(word => word !== wordToRemove)
    }));
  };

  const handleTriggerWordInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === ',') {
      e.preventDefault();
      addTriggerWord(currentTriggerWord);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addTriggerWord(currentTriggerWord);
    } else if (e.key === 'Backspace' && currentTriggerWord === '' && formData.triggerWords.length > 0) {
      // Remove last trigger word if input is empty and backspace is pressed
      const lastWord = formData.triggerWords[formData.triggerWords.length - 1];
      removeTriggerWord(lastWord);
    }
  };

  const analyzeRepository = useCallback(async (repoUrl: string) => {
    if (!repoUrl || !repoUrl.includes('github.com')) {
      setAvailableFolders([]);
      return;
    }

    setIsAnalyzing(true);
    sileo.info({ title: "Analyzing repository...", description: "Fetching folders, README, and license information." });

    try {
      const response = await fetch('/api/analyze-repo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ repoUrl }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze repository');
      }

      const analysis = await response.json();
      
      setAvailableFolders(analysis.folders || []);

      // Auto-populate fields if data is available
      setFormData(prev => ({
        ...prev,
        overview: analysis.readme && !prev.overview ? analysis.readme : prev.overview,
        license: analysis.license && analysis.license !== 'NOASSERTION' ? analysis.license : prev.license,
        documentation: !prev.documentation ? `${repoUrl}#readme` : prev.documentation,
      }));

      sileo.success({ 
        title: "Repository analyzed successfully!", 
        description: `Found ${analysis.folders?.length || 0} folders${analysis.readme ? ', README content' : ''}${analysis.license ? ', and license info' : ''}.` 
      });

    } catch (error: any) {
      console.error('Repository analysis failed:', error);
      sileo.error({
        title: "Analysis failed",
        description: error.message || "Could not analyze repository. Please check the URL and try again.",
        styles: { title: "text-[var(--sileo-state-error)]!" }
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
      if (value && value.includes('github.com')) {
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
        styles: { title: "text-[var(--sileo-state-error)]!" }
      });
      return;
    }

    sileo.info({ title: "Processing submission...", description: "Validating your skill and creating submission." });

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          tags: formData.tags.split(",").map(tag => tag.trim()).filter(Boolean),
          triggerWords: formData.triggerWords,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to submit");
      }

      const result = await response.json();
      
      sileo.success({ 
        title: "Submission successful!", 
        description: "Your skill has been submitted for review. We'll notify you once it's approved." 
      });
      
      router.push(`/submission/${result.id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit";
      setError(errorMessage);
      
      sileo.error({
        title: "Submission failed",
        description: errorMessage,
        styles: { title: "text-[var(--sileo-state-error)]!" }
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-bg-surface border-2 border-dashed border-border rounded-lg p-8">
      <form onSubmit={handleSubmit} className="space-y-12">
        {/* Basic Information */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Basic Information
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
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
              <label htmlFor="type" className="block text-sm font-medium text-text-primary mb-2">
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
            <label htmlFor="description" className="block text-sm font-medium text-text-primary mb-2">
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
              placeholder="Brief description that appears on the skill card..."
            />
            <p className="text-xs text-text-dim mt-1">1-2 sentences that summarize what your skill does</p>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div>
            <label htmlFor="longDescription" className="block text-sm font-medium text-text-primary mb-2">
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
            <p className="text-xs text-text-dim mt-1">Comprehensive description shown on the skill details page</p>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-text-primary mb-2">
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
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-text-primary mb-2">
                Tags
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none"
                placeholder="python, api, automation (comma separated)"
              />
              <p className="text-xs text-text-dim mt-1">Comma-separated tags</p>
            </div>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div>
            <label htmlFor="authorHandle" className="block text-sm font-medium text-text-primary mb-2">
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
            <p className="text-xs text-text-dim mt-1">Your username or handle for attribution</p>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          {/* Compatible Agents */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-4">
              Compatible Agents *
            </label>
            <div className="flex flex-wrap gap-2">
              {availableAgents.map(agent => (
                <button
                  key={agent}
                  type="button"
                  onClick={() => handleAgentToggle(agent)}
                  disabled={isAnalyzing}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-widest border-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
                    formData.compatibleAgents.includes(agent)
                      ? 'bg-accent text-white border-accent shadow-[2px_2px_0px_0px_var(--color-text-primary)] hover:shadow-[4px_4px_0px_0px_var(--color-text-primary)] hover:-translate-x-[2px] hover:-translate-y-[2px]'
                      : 'bg-bg-base text-text-primary border-border hover:bg-bg-card hover:border-accent'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {formData.compatibleAgents.includes(agent) && (
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                    )}
                    {agent}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-xs text-text-dim mt-3">
              Select all AI agents that are compatible with your {formData.type}. 
              At least one agent must be selected.
              {formData.compatibleAgents.length > 0 && (
                <span className="block mt-1 text-accent font-medium">
                  Selected: {formData.compatibleAgents.join(', ')}
                </span>
              )}
            </p>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          {/* Trigger Words */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Trigger Words
            </label>
            <div className="border border-border rounded-sm p-2 bg-bg-deep focus-within:border-accent min-h-[44px]">
              <div className="flex flex-wrap gap-2 items-center">
                {formData.triggerWords.map((word, index) => (
                  <div
                    key={index}
                    className="group inline-flex items-center gap-1 px-2 py-1 bg-bg-card border border-border rounded text-xs font-medium text-text-primary hover:border-accent transition-colors"
                  >
                    <span>{word}</span>
                    <button
                      type="button"
                      onClick={() => removeTriggerWord(word)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-0.5 hover:bg-red-500 hover:text-white rounded-full"
                      title="Remove trigger word"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
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
                  placeholder={formData.triggerWords.length === 0 ? "Type trigger words and press comma or enter..." : "Add more..."}
                />
              </div>
            </div>
            <p className="text-xs text-text-dim mt-2">
              Type action phrases like "navigate page", "fill forms", "take screenshot" and press comma or enter to add them.
              {formData.triggerWords.length > 0 && (
                <span className="block mt-1 text-accent font-medium">
                  {formData.triggerWords.length} trigger word{formData.triggerWords.length !== 1 ? 's' : ''} added: {formData.triggerWords.join(', ')}
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Repository Information */}
        <div className="space-y-8">
          <h2 className="text-xl font-semibold text-text-primary font-mono">
            Repository Information
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <label htmlFor="repoUrl" className="block text-sm font-medium text-text-primary mb-2">
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
                    <svg className="animate-spin h-4 w-4 text-accent" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                )}
              </div>
              <p className="text-xs text-text-dim mt-1">GitHub repository URL - will auto-scan for folders and content</p>
            </div>

            <div>
              <label htmlFor="repoPath" className="block text-sm font-medium text-text-primary mb-2">
                Skill Directory
              </label>
              {availableFolders.length > 0 ? (
                <select
                  id="repoPath"
                  name="repoPath"
                  value={formData.repoPath}
                  onChange={handleInputChange}
                  disabled={isAnalyzing}
                  className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">Root directory</option>
                  {availableFolders.map(folder => (
                    <option key={folder} value={folder}>
                      {folder}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  id="repoPath"
                  name="repoPath"
                  value={formData.repoPath}
                  onChange={handleInputChange}
                  disabled={isAnalyzing}
                  className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="src/skill (or leave empty for root)"
                />
              )}
              <p className="text-xs text-text-dim mt-1">
                {availableFolders.length > 0 
                  ? "Select the folder containing your skill" 
                  : "Path to skill within the repository (optional)"
                }
              </p>
            </div>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div>
            <label htmlFor="documentation" className="block text-sm font-medium text-text-primary mb-2">
              Documentation URL
            </label>
            <input
              type="url"
              id="documentation"
              name="documentation"
              value={formData.documentation}
              onChange={handleInputChange}
              disabled={isAnalyzing}
              className="w-full px-3 py-2 bg-bg-deep border border-border rounded-sm text-text-primary placeholder-text-dim focus:border-accent focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="https://docs.example.com"
            />
            <p className="text-xs text-text-dim mt-1">Link to documentation or README (auto-filled from repository)</p>
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
            <label htmlFor="isOpenSource" className="ml-2 block text-sm text-text-primary">
              This is open source
            </label>
          </div>

          <div className="border-t border-dashed border-border/50 pt-6"></div>

          <div>
            <label htmlFor="license" className="block text-sm font-medium text-text-primary mb-2">
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
              {commonLicenses.map(license => (
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
            <label htmlFor="overview" className="block text-sm font-medium text-text-primary mb-2">
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
              placeholder="Provide detailed usage instructions, examples, and any additional information users should know..."
            />
            <p className="text-xs text-text-dim mt-1">
              Comprehensive guide shown on the skill details page. Include usage examples, configuration details, etc. (Auto-populated from README when available)
            </p>
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
            You'll receive an email notification once it's approved or if changes are needed.
          </p>
        </div>
      </form>
    </div>
  );
}