"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { sileo } from "sileo";
import ConfirmationDialog from "./confirmation-dialog";
import { useAdminSkills, useAdminSkillAction, adminSkillsQueryKey } from "@/lib/queries/admin";
import type { Listing } from "@prisma/client";

type SkillAction = "eject" | "restore" | "delete" | "toggle-safe" | "toggle-official";

export default function SkillsManagement() {
  const { data: skills = [], isLoading: loading } = useAdminSkills();
  const queryClient = useQueryClient();
  const { mutate: performAction } = useAdminSkillAction();

  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("published"); // published, ejected, all
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [bulkActionMode, setBulkActionMode] = useState(false);
  const [confirmationDialog, setConfirmationDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    variant: "danger" | "warning" | "info";
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "",
    variant: "info",
    onConfirm: () => { },
  });

  const showConfirmation = (
    title: string,
    message: string,
    confirmText: string,
    variant: "danger" | "warning" | "info",
    onConfirm: () => void
  ) => {
    setConfirmationDialog({ isOpen: true, title, message, confirmText, variant, onConfirm });
  };

  const hideConfirmation = () => {
    setConfirmationDialog(prev => ({ ...prev, isOpen: false }));
  };

  const handleSkillActionConfirmed = (skillId: string, action: SkillAction) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;

    let loadingMessage = "";
    let successMessage = "";

    switch (action) {
      case "eject":
        loadingMessage = "Ejecting skill from platform...";
        successMessage = "Skill ejected successfully";
        break;
      case "restore":
        loadingMessage = "Restoring skill to platform...";
        successMessage = "Skill restored successfully";
        break;
      case "delete":
        loadingMessage = "Permanently deleting skill...";
        successMessage = "Skill permanently deleted";
        break;
      case "toggle-safe":
        loadingMessage = `Marking skill as ${skill.isSafe ? "unsafe" : "safe"}...`;
        successMessage = `Skill marked as ${skill.isSafe ? "unsafe" : "safe"}`;
        break;
      case "toggle-official":
        loadingMessage = `Marking skill as ${skill.isOfficial ? "unofficial" : "official"}...`;
        successMessage = `Skill marked as ${skill.isOfficial ? "unofficial" : "official"}`;
        break;
    }

    const loadingToast = sileo.show({
      title: "Processing Action",
      description: loadingMessage,
      type: "loading",
      duration: null,
    });

    performAction(
      { skillId, action },
      {
        onSuccess: () => {
          sileo.dismiss(loadingToast);
          sileo.success({ title: "Action Completed", description: successMessage, duration: 4000 });
          hideConfirmation();
        },
        onError: (error) => {
          sileo.dismiss(loadingToast);
          sileo.error({
            title: "Action Failed",
            description: error instanceof Error ? error.message : "Failed to perform action",
            duration: 6000,
          });
        },
      }
    );
  };

  const handleSkillAction = (skillId: string, action: SkillAction) => {
    const skill = skills.find(s => s.id === skillId);
    if (!skill) return;

    if (action === "delete") {
      showConfirmation(
        "Permanently Delete Skill",
        `Are you sure you want to permanently delete "${skill.name}"? This action cannot be undone and will remove all associated data.`,
        "Delete Permanently",
        "danger",
        () => handleSkillActionConfirmed(skillId, action)
      );
    } else if (action === "eject") {
      showConfirmation(
        "Eject Skill",
        `Are you sure you want to eject "${skill.name}" from public visibility? This skill will be hidden from the directory but can be restored later.`,
        "Eject Skill",
        "warning",
        () => handleSkillActionConfirmed(skillId, action)
      );
    } else {
      handleSkillActionConfirmed(skillId, action);
    }
  };

  const handleBulkAction = (action: "eject" | "delete" | "restore") => {
    if (selectedSkills.length === 0) return;

    const actionText = action === "eject" ? "eject" : action === "delete" ? "permanently delete" : "restore";
    const variant = action === "delete" ? "danger" : action === "eject" ? "warning" : "info";

    showConfirmation(
      `Bulk ${action.charAt(0).toUpperCase() + action.slice(1)}`,
      `Are you sure you want to ${actionText} ${selectedSkills.length} skill(s)?`,
      `${action.charAt(0).toUpperCase() + action.slice(1)} Selected`,
      variant,
      async () => {
        const loadingToast = sileo.show({
          title: "Processing Bulk Action",
          description: `${actionText.charAt(0).toUpperCase() + actionText.slice(1)}ing ${selectedSkills.length} skills...`,
          type: "loading",
          duration: null,
        });

        try {
          await Promise.all(
            selectedSkills.map(skillId =>
              fetch("/api/admin/skills", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ skillId, action }),
              })
            )
          );

          setSelectedSkills([]);
          setBulkActionMode(false);
          hideConfirmation();

          await queryClient.invalidateQueries({ queryKey: adminSkillsQueryKey });

          sileo.dismiss(loadingToast);
          sileo.success({
            title: "Bulk Action Complete",
            description: `Successfully ${actionText}ed ${selectedSkills.length} skills.`,
            duration: 4000,
          });
        } catch {
          sileo.dismiss(loadingToast);
          sileo.error({
            title: "Bulk Action Failed",
            description: "Some actions may have failed. Please check and try again.",
            duration: 6000,
          });
        }
      }
    );
  };

  const toggleSkillSelection = (skillId: string) => {
    setSelectedSkills(prev =>
      prev.includes(skillId) ? prev.filter(id => id !== skillId) : [...prev, skillId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedSkills.length === filteredSkills.length) {
      setSelectedSkills([]);
    } else {
      setSelectedSkills(filteredSkills.map(s => s.id));
    }
  };

  const filteredSkills = skills.filter((skill: Listing) => {
    const matchesSearch =
      skill.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (skill.description ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      skill.authorHandle.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || skill.type === typeFilter;
    const matchesCategory = categoryFilter === "all" || skill.category === categoryFilter;
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "published" && !(skill.isEjected ?? false)) ||
      (statusFilter === "ejected" && (skill.isEjected ?? false));

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(date));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin border border-green-300 h-8 w-8 border-b-2 border-accent"></div>
        <span className="ml-3 text-text-secondary">Loading skills...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-mono font-bold text-text-primary">Skills Management</h2>
          <p className="text-text-secondary mt-1">Manage all published skills on the platform</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-text-dim">
            {filteredSkills.length} of {skills.length} skills
          </div>
          {!bulkActionMode ? (
            <button
              onClick={() => setBulkActionMode(true)}
              className="px-3 py-1 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700 transition-colors border border-blue-700"
              disabled={filteredSkills.length === 0}
            >
              Bulk Actions
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-sm text-text-secondary">
                {selectedSkills.length} selected
              </span>
              <button
                onClick={() => { setBulkActionMode(false); setSelectedSkills([]); }}
                className="px-3 py-1 bg-gray-600 text-white text-xs font-medium hover:bg-gray-700 transition-colors border border-gray-700"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-bg-surface border-2 border-dashed border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Search</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search skills..."
              className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary placeholder-text-dim focus:border-accent focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="skill">Skills</option>
              <option value="mcp">MCP Servers</option>
              <option value="tool">Tools</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="all">All Categories</option>
              <option value="development">Development</option>
              <option value="data-analysis">Data Analysis</option>
              <option value="devops">DevOps</option>
              <option value="infrastructure">Infrastructure</option>
              <option value="security">Security</option>
              <option value="code-review">Code Review</option>
              <option value="agents">Agents</option>
              <option value="automation">Automation</option>
              <option value="writing">Writing</option>
              <option value="design">Design</option>
              <option value="content-creation">Content Creation</option>
              <option value="media-video">Media & Video</option>
              <option value="marketing">Marketing</option>
              <option value="sales">Sales</option>
              <option value="finance">Finance</option>
              <option value="legal">Legal</option>
              <option value="hr-recruiting">HR & Recruiting</option>
              <option value="project-management">Project Management</option>
              <option value="customer-support">Customer Support</option>
              <option value="research">Research</option>
              <option value="education">Education</option>
              <option value="documentation">Documentation</option>
              <option value="productivity">Productivity</option>
              <option value="communication">Communication</option>
              <option value="health-wellness">Health & Wellness</option>
              <option value="entertainment">Entertainment</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-border bg-bg-base text-text-primary focus:border-accent focus:outline-none"
            >
              <option value="published">Published</option>
              <option value="ejected">Ejected</option>
              <option value="all">All Status</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar */}
      {bulkActionMode && (
        <div className="bg-yellow-50 border-2 border-yellow-300 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedSkills.length === filteredSkills.length && filteredSkills.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">
                Select All ({filteredSkills.length})
              </span>
            </label>
          </div>
          <div className="flex items-center gap-2">
            {statusFilter !== "ejected" && (
              <button
                onClick={() => handleBulkAction("eject")}
                disabled={selectedSkills.length === 0}
                className="px-4 py-2 bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition-colors border border-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bulk Eject ({selectedSkills.length})
              </button>
            )}
            {statusFilter === "ejected" && (
              <button
                onClick={() => handleBulkAction("restore")}
                disabled={selectedSkills.length === 0}
                className="px-4 py-2 bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors border border-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Bulk Restore ({selectedSkills.length})
              </button>
            )}
            <button
              onClick={() => handleBulkAction("delete")}
              disabled={selectedSkills.length === 0}
              className="px-4 py-2 bg-red-600 text-white text-sm font-medium hover:bg-red-700 transition-colors border border-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Bulk Delete ({selectedSkills.length})
            </button>
          </div>
        </div>
      )}

      {/* Skills List */}
      <div className="bg-bg-surface border-2 border-dashed border-border">
        {filteredSkills.length === 0 ? (
          <div className="p-8 text-center">
            <svg className="mx-auto w-12 h-12 text-text-dim mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p className="text-text-secondary text-lg">No skills found</p>
            <p className="text-text-dim">Try adjusting your search filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredSkills.map((skill: Listing) => (
              <div key={skill.id} className="p-6">
                <div className="flex items-start justify-between">
                  {bulkActionMode && (
                    <div className="flex items-center mr-4">
                      <input
                        type="checkbox"
                        checked={selectedSkills.includes(skill.id)}
                        onChange={() => toggleSkillSelection(skill.id)}
                        className="w-4 h-4 text-accent border-border focus:border-accent"
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                  )}
                  <div
                    className="flex-1 min-w-0 cursor-pointer group"
                    onClick={() => setSelectedSkill(selectedSkill === skill.id ? null : skill.id)}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-text-primary truncate group-hover:text-accent transition-colors">
                        {skill.name}
                      </h3>
                      <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-blue-300">
                        {skill.type}
                      </span>
                      {skill.isOfficial && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-green-100 text-green-800 border border-green-300">
                          Official
                        </span>
                      )}
                      {skill.isSafe && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-emerald-100 text-emerald-800 border border-emerald-300">
                          Safe
                        </span>
                      )}
                      {(skill.isEjected ?? false) && (
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-red-100 text-red-800 border border-red-300">
                          Ejected
                        </span>
                      )}
                      <svg
                        className={`w-4 h-4 text-text-dim transition-transform duration-200 ${selectedSkill === skill.id ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>

                    <p className="text-text-secondary mb-3 line-clamp-2">{skill.description}</p>

                    <div className="flex items-center gap-6 text-sm text-text-dim">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                        </svg>
                        <span>@{skill.authorHandle}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path>
                        </svg>
                        <span>{skill.githubStars}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                        </svg>
                        <span>{skill.totalInstalls.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        <span>{formatDate(skill.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!(skill.isEjected ?? false) ? (
                      <>
                        <button
                          onClick={() => handleSkillAction(skill.id, "toggle-safe")}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${skill.isSafe
                            ? "bg-yellow-600 text-white hover:bg-yellow-700"
                            : "bg-green-600 text-white hover:bg-green-700"
                            }`}
                        >
                          {skill.isSafe ? "Mark Unsafe" : "Mark Safe"}
                        </button>
                        <button
                          onClick={() => handleSkillAction(skill.id, "toggle-official")}
                          className={`px-3 py-1 text-xs font-medium transition-colors ${skill.isOfficial
                            ? "bg-gray-600 text-white hover:bg-gray-700"
                            : "bg-blue-600 text-white hover:bg-blue-700"
                            }`}
                        >
                          {skill.isOfficial ? "Unofficialize" : "Make Official"}
                        </button>
                        <button
                          onClick={() => handleSkillAction(skill.id, "eject")}
                          className="px-3 py-1 bg-orange-600 text-white text-xs font-medium hover:bg-orange-700 transition-colors"
                        >
                          Eject
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleSkillAction(skill.id, "restore")}
                          className="px-3 py-1 bg-green-600 text-white text-xs font-medium hover:bg-green-700 transition-colors"
                        >
                          Restore
                        </button>
                        <button
                          onClick={() => handleSkillAction(skill.id, "delete")}
                          className="px-3 py-1 bg-red-600 text-white text-xs font-medium hover:bg-red-700 transition-colors"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Expanded Detail View */}
                {selectedSkill === skill.id && (
                  <div className="mt-4 pt-4 border-t border-border bg-bg-inset -lg p-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Health Score:</span>
                            <span className={`font-medium ${skill.healthScore >= 75 ? 'text-green-600' : skill.healthScore >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {skill.healthScore}/100
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-text-secondary">Vote Count:</span>
                            <span className="font-medium text-text-primary">{skill.voteCount}</span>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-medium text-text-primary mb-2">Tags</h4>
                          <div className="flex flex-wrap gap-2">
                            {skill.tags.map((tag, index) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>

                        <div>
                          <a
                            href={skill.repoUrl ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:text-accent-hover transition-colors text-sm flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            View Repository
                          </a>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="grid grid-cols-1 gap-2 text-sm">
                          <div className="flex justify-between py-1">
                            <span className="text-text-secondary">Slug:</span>
                            <code className="text-xs bg-bg-base border border-border px-2 py-1 font-mono">
                              {skill.slug}
                            </code>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-text-secondary">Weekly Installs:</span>
                            <span className="font-medium text-text-primary">{skill.weeklyInstalls.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-text-secondary">Category:</span>
                            <span className="font-medium text-text-primary">{skill.category}</span>
                          </div>
                          <div className="flex justify-between py-1">
                            <span className="text-text-secondary">Last Updated:</span>
                            <span className="font-medium text-text-primary">{formatDate(skill.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={confirmationDialog.isOpen}
        title={confirmationDialog.title}
        message={confirmationDialog.message}
        confirmText={confirmationDialog.confirmText}
        confirmVariant={confirmationDialog.variant}
        onConfirm={confirmationDialog.onConfirm}
        onCancel={hideConfirmation}
      />
    </div>
  );
}
