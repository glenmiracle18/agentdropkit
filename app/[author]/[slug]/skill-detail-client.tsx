"use client";

import Link from "next/link";
import { useState } from "react";
import { generateInstallCommandWithScopes } from "@/lib/install-command";

interface SkillDetailClientProps {
  skill: any;
}

export default function SkillDetailClient({ skill }: SkillDetailClientProps) {
  const [copied, setCopied] = useState(false);
  const [upvotes, setUpvotes] = useState(skill.upvotes || 0);
  const [hasUpvoted, setHasUpvoted] = useState(skill.userVote === 1);
  const [selectedFile, setSelectedFile] = useState(skill.files?.[0] || null);
  const [isFileExpanded, setIsFileExpanded] = useState(false);
  const [installScope, setInstallScope] = useState<'default' | 'global' | 'project'>('default');

  // Generate install commands for different scopes
  const installCommands = generateInstallCommandWithScopes({
    repoUrl: skill.repository ? `https://${skill.repository}` : skill.command || "",
    authorHandle: skill.authorHandle,
    skillName: skill.name
  });

  const getCurrentCommand = () => {
    switch (installScope) {
      case 'global':
        return installCommands.global;
      case 'project':
        return installCommands.project;
      default:
        return installCommands.default;
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(getCurrentCommand());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleUpvote = async () => {
    if (hasUpvoted) {
      setUpvotes(prev => prev - 1);
      setHasUpvoted(false);
    } else {
      setUpvotes(prev => prev + 1);
      setHasUpvoted(true);
    }
  };

  return (
    <>
      {/* Breadcrumbs */}
      <div className="text-xs sm:text-sm font-bold text-text-muted mb-6 md:mb-10 flex flex-wrap items-center gap-2 sm:gap-3 uppercase tracking-widest">
        <Link href="/" className="hover:text-accent transition-colors">Home</Link>
        <span>/</span>
        <span className="text-text-primary truncate max-w-[100px] sm:max-w-none">{skill.authorHandle}</span>
        <span>/</span>
        <span className="text-accent truncate max-w-[120px] sm:max-w-none">{skill.name}</span>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 md:gap-12">
        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="mb-8 md:mb-10 flex flex-col sm:flex-row sm:items-start justify-between gap-6">
            <div>
              <h1 className="text-2xl sm:text-4xl font-bold text-text-primary mb-1 sm:mb-2 truncate">{skill.name}</h1>
              <p className="text-text-muted text-base sm:text-lg truncate">{skill.authorHandle}</p>
            </div>

            {/* Upvote Button */}
            <button 
              onClick={handleUpvote}
              className={`flex items-center justify-center gap-2 px-6 py-3 border-2 border-text-primary font-bold uppercase tracking-widest transition-all active:translate-y-1 w-full sm:w-auto ${
                hasUpvoted 
                  ? 'bg-accent text-white shadow-[4px_4px_0px_0px_var(--color-text-primary)] hover:shadow-[2px_2px_0px_0px_var(--color-text-primary)] hover:translate-x-[2px] hover:translate-y-[2px]' 
                  : 'bg-bg-base text-text-primary shadow-[4px_4px_0px_0px_var(--color-accent)] hover:bg-bg-card hover:shadow-[2px_2px_0px_0px_var(--color-accent)] hover:translate-x-[2px] hover:translate-y-[2px]'
              }`}
            >
              <svg className={`w-5 h-5 sm:w-6 sm:h-6 ${hasUpvoted ? 'fill-white' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M7 11l5-5m0 0l5 5m-5-5v12"/>
              </svg>
              <span className="text-lg sm:text-xl">{upvotes}</span>
            </button>
          </div>
            
          <p className="text-lg sm:text-xl text-text-primary leading-relaxed mt-6 mb-8">
            {skill.description}
          </p>

          {/* Install Command */}
          <div className="mb-8 md:mb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest">Install Command</h3>
              
              {/* Scope Selector */}
              <div className="flex items-center gap-2 text-sm">
                <span className="text-text-secondary font-medium">Scope:</span>
                <div className="flex border-2 border-border bg-bg-base">
                  <button
                    onClick={() => setInstallScope('default')}
                    className={`px-3 py-1 text-xs font-medium transition-colors border-r border-border ${
                      installScope === 'default' 
                        ? 'bg-accent text-white' 
                        : 'text-text-primary hover:bg-bg-card'
                    }`}
                  >
                    Default
                  </button>
                  <button
                    onClick={() => setInstallScope('global')}
                    className={`px-3 py-1 text-xs font-medium transition-colors border-r border-border ${
                      installScope === 'global' 
                        ? 'bg-accent text-white' 
                        : 'text-text-primary hover:bg-bg-card'
                    }`}
                  >
                    Global
                  </button>
                  <button
                    onClick={() => setInstallScope('project')}
                    className={`px-3 py-1 text-xs font-medium transition-colors ${
                      installScope === 'project' 
                        ? 'bg-accent text-white' 
                        : 'text-text-primary hover:bg-bg-card'
                    }`}
                  >
                    Project
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-text-primary text-bg-base p-1 flex flex-col sm:flex-row shadow-[4px_4px_0px_0px_var(--color-accent)] md:shadow-[6px_6px_0px_0px_var(--color-accent)]">
              <div className="flex items-center gap-3 px-4 overflow-x-auto py-3 sm:py-0 w-full">
                <svg className="w-5 h-5 text-accent shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="m9 9 3 3-3 3"/>
                  <path d="m15 15h-3"/>
                </svg>
                <code className="font-mono text-xs sm:text-sm whitespace-nowrap">{getCurrentCommand()}</code>
              </div>
              <button 
                onClick={handleCopy}
                className="bg-bg-base text-text-primary hover:bg-accent hover:text-white transition-colors p-3 sm:p-4 font-bold uppercase tracking-widest text-sm shrink-0 border-t-2 sm:border-t-0 sm:border-l-2 border-text-primary flex items-center justify-center gap-2 w-full sm:w-auto"
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Copied
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                      <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/>
                    </svg>
                    Copy
                  </>
                )}
              </button>
            </div>

            {/* Scope Description */}
            <div className="mt-3 text-xs text-text-dim">
              {installScope === 'default' && (
                <p>Default installation - CLI will prompt you to choose between global and project scope</p>
              )}
              {installScope === 'global' && (
                <p>Global installation - Available across all projects in <code className="bg-bg-card px-1 py-0.5 font-mono">~/.claude/skills/</code></p>
              )}
              {installScope === 'project' && (
                <p>Project installation - Only available in current project directory <code className="bg-bg-card px-1 py-0.5 font-mono">./claude/skills/</code></p>
              )}
            </div>
          </div>

          {/* Reference Files (File Tree) */}
          {skill.files && skill.files.length > 0 && (
            <div className="mb-8 md:mb-12">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-3">Reference Files</h3>
              <div className="flex flex-col md:flex-row border-2 border-border bg-bg-card shadow-[4px_4px_0px_0px_var(--color-border)] md:shadow-[6px_6px_0px_0px_var(--color-border)]">
                
                {/* File List Sidebar */}
                <div className="w-full md:w-48 border-b-2 md:border-b-0 md:border-r-2 border-border flex flex-row md:flex-col bg-bg-base overflow-x-auto">
                  {skill.files.map((file: any) => (
                    <button
                      key={file.name}
                      onClick={() => { setSelectedFile(file); setIsFileExpanded(false); }}
                      className={`flex items-center gap-2 p-3 md:p-4 text-left font-bold text-xs md:text-sm border-r-2 md:border-r-0 md:border-b-2 border-border transition-colors whitespace-nowrap md:whitespace-normal last:border-r-0 md:last:border-b-0 ${
                        selectedFile?.name === file.name 
                          ? 'bg-text-primary text-bg-base' 
                          : 'text-text-primary hover:bg-accent hover:text-white'
                      }`}
                    >
                      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14,2 14,8 20,8"/>
                        <line x1="16" y1="13" x2="8" y2="13"/>
                        <line x1="16" y1="17" x2="8" y2="17"/>
                        <polyline points="10,9 9,9 8,9"/>
                      </svg>
                      <span className="truncate">{file.name}</span>
                    </button>
                  ))}
                </div>

                {/* File Content */}
                <div className="flex-1 overflow-x-auto bg-bg-card min-h-[300px] md:min-h-[400px] relative flex flex-col">
                  {selectedFile ? (
                    <>
                      <div className={`p-4 md:p-6 overflow-hidden transition-all duration-300 ${isFileExpanded ? '' : 'max-h-[220px]'}`}>
                        <pre className="text-text-primary font-mono text-xs md:text-sm leading-relaxed whitespace-pre-wrap break-words">
                          {selectedFile.content}
                        </pre>
                      </div>

                      {/* Gradient + Expand/Collapse button */}
                      {!isFileExpanded ? (
                        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-bg-card via-bg-card/80 to-transparent flex items-end justify-center pb-4">
                          <button
                            onClick={() => setIsFileExpanded(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-bg-base border-2 border-border text-text-primary text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-colors shadow-[2px_2px_0px_0px_var(--color-border)]"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>
                            </svg>
                            Expand
                          </button>
                        </div>
                      ) : (
                        <div className="flex justify-center py-4 border-t border-border">
                          <button
                            onClick={() => setIsFileExpanded(false)}
                            className="flex items-center gap-2 px-4 py-2 bg-bg-base border-2 border-border text-text-primary text-xs font-bold uppercase tracking-widest hover:bg-accent hover:text-white hover:border-accent transition-colors shadow-[2px_2px_0px_0px_var(--color-border)]"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path d="M7 9l5-5 5 5M7 15l5 5 5-5"/>
                            </svg>
                            Collapse
                          </button>
                        </div>
                      )}
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

          {/* Overview Section */}
          {skill.overview && (
            <div className="mb-8 md:mb-12">
              <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4 md:mb-6 border-b-2 border-border pb-2">Overview</h3>
              <div className="text-text-primary leading-relaxed whitespace-pre-wrap text-base md:text-lg">
                {skill.overview}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="w-full lg:w-80 shrink-0 space-y-6 md:space-y-8">
          {/* Metadata Box */}
          <div className="bg-bg-card border-2 border-border p-6">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6 border-b-2 border-border pb-2">Details</h3>
            
            <div className="space-y-6">

              <div>
                <div className="flex items-center gap-2 text-text-muted font-bold text-sm uppercase tracking-widest mb-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0112 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z"/>
                  </svg>
                  Repository
                </div>
                <a href={skill.repoUrl} target="_blank" rel="noreferrer" className="text-accent hover:underline font-bold text-sm break-all">
                  {skill.repository}
                </a>
              </div>

              <div>
                <div className="flex items-center gap-2 text-text-muted font-bold text-sm uppercase tracking-widest mb-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/>
                    <line x1="7" y1="7" x2="7.01" y2="7"/>
                  </svg>
                  Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {skill.tags.map((tag: string) => (
                    <span key={tag} className="text-xs font-bold uppercase tracking-widest border-2 border-border bg-bg-base px-2 py-1 text-text-primary">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Stats Box */}
          <div className="bg-bg-card border-2 border-border p-6">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6 border-b-2 border-border pb-2">Skill Stats</h3>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-primary font-bold">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                  </svg>
                  Stars
                </div>
                <span className="text-xl font-bold">{(skill.stars / 1000).toFixed(1)}k</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-primary font-bold">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Installs
                </div>
                <span className="text-xl font-bold">{(skill.installs / 1000).toFixed(1)}k</span>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-primary font-bold">
                  <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <circle cx="12" cy="12" r="10"/>
                    <polyline points="12 6 12 12 16 14"/>
                  </svg>
                  Added
                </div>
                <span className="text-md font-bold text-text-muted">{skill.firstSeen}</span>
              </div>
            </div>
          </div>

          {/* Security Box */}
          <div className="bg-bg-card border-2 border-border p-6">
            <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6 border-b-2 border-border pb-2">Security & Health</h3>
            
            <div className="space-y-6">
              <div>
                <div className="text-sm text-text-muted mb-1">Health Score</div>
                <div className="flex items-end gap-2">
                  <span className="text-4xl font-bold text-success leading-none">
                    {skill.healthScore >= 95 ? 'A+' : skill.healthScore >= 90 ? 'A' : 'B+'}
                  </span>
                  <span className="text-lg font-bold text-text-muted leading-none mb-0.5">{skill.healthScore}/100</span>
                </div>
              </div>

              {skill.isOfficial && (
                <div className="flex items-start gap-3 bg-success/10 p-3 border-2 border-success/20">
                  <svg className="w-5 h-5 text-success shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path d="M9 12l2 2 4-4"/>
                    <path d="M21 12c-1 0-3-1-3-3s2-3 3-3 3 1 3 3-2 3-3 3"/>
                    <path d="M3 12c1 0 3-1 3-3s-2-3-3-3-3 1-3 3 2 3 3 3"/>
                    <path d="M12 3c0 1-1 3-3 3s-3-2-3-3 1-3 3-3 3 2 3 3"/>
                    <path d="M12 21c0-1-1-3-3-3s-3 2-3 3 1 3 3 3 3-2 3-3"/>
                  </svg>
                  <div>
                    <div className="font-bold text-success text-sm">Official Skill</div>
                    <div className="text-xs text-text-muted mt-1">Verified and maintained by the core team.</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}