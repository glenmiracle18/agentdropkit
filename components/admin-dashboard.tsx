"use client";

import { useState } from "react";
import { sileo } from "sileo";
import SkillsManagement from "./skills-management";

interface DashboardData {
  totalUsers: number;
  totalSubmissions: number;
  pendingSubmissions: number;
  totalListings: number;
  totalInstalls: number;
  weeklyInstalls: number;
  recentSubmissions: Array<{
    id: string;
    name: string;
    description: string;
    longDescription: string;
    type: string;
    category: string;
    repoUrl: string;
    repoPath: string | null;
    tags: string[];
    compatibleAgents: string[];
    triggerWords: string[];
    isOpenSource: boolean;
    license: string;
    createdAt: Date;
    user: {
      name: string | null;
      email: string;
      githubUsername: string | null;
    };
  }>;
}

interface AdminDashboardProps {
  data: DashboardData;
}

export default function AdminDashboard({ data }: AdminDashboardProps) {
  const [selectedTab, setSelectedTab] = useState<"overview" | "submissions" | "skills">("overview");
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);

  const handleSubmissionAction = async (submissionId: string, action: "approve" | "reject") => {
    // Show loading toast
    const loadingToast = sileo.show({
      title: `${action === "approve" ? "Approving" : "Rejecting"} Submission`,
      description: `Processing ${action} action...`,
      type: "loading",
      duration: null, // persistent
    });

    try {
      const response = await fetch("/api/admin/submissions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ submissionId, action }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "Failed to update submission");
      }

      const result = await response.json();

      // Dismiss loading toast and show success
      sileo.dismiss(loadingToast);
      sileo.success({
        title: `Submission ${action === "approve" ? "Approved" : "Rejected"}`,
        description: action === "approve"
          ? `Successfully approved and published as "${result.slug}".`
          : "Successfully rejected the submission.",
        duration: 5000,
      });

      // Update local state by refetching - could be improved with state management
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      // Dismiss loading toast and show error
      sileo.dismiss(loadingToast);
      sileo.error({
        title: `${action === "approve" ? "Approval" : "Rejection"} Failed`,
        description: error instanceof Error ? error.message : `Failed to ${action} submission. Please try again.`,
        duration: 6000,
      });
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  return (
    <div className="space-y-8">
      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-bg-surface border border-border border-2 border-dashed border-border p-1">
        <button
          onClick={() => setSelectedTab("overview")}
          className={`flex-1 py-2 px-4 text-sm font-mono tracking-widest uppercase font-bold transition-colors ${selectedTab === "overview"
              ? "bg-accent text-bg-base"
              : "text-text-secondary hover:text-text-primary"
            }`}
        >
          Overview
        </button>
        <button
          onClick={() => setSelectedTab("submissions")}
          className={`flex-1 py-2 px-4 text-sm font-mono tracking-widest uppercase font-bold transition-colors relative ${selectedTab === "submissions"
              ? "bg-accent text-bg-base"
              : "text-text-secondary hover:text-text-primary"
            }`}
        >
          Submissions
          {data.pendingSubmissions > 0 && (
            <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold border border-red-300 w-5 h-5 flex items-center justify-center">
              {data.pendingSubmissions}
            </span>
          )}
        </button>
        <button
          onClick={() => setSelectedTab("skills")}
          className={`flex-1 py-2 px-4 text-sm font-mono tracking-widest uppercase font-bold transition-colors ${selectedTab === "skills"
              ? "bg-accent text-bg-base"
              : "text-text-secondary hover:text-text-primary"
            }`}
        >
          Skills
        </button>
      </div>

      {/* Overview Tab */}
      {selectedTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Users Card */}
          <div className="bg-bg-surface border border-border border-2 border-dashed border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono font-bold text-text-primary">Total Users</h3>
              <svg className="w-8 h-8 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-2">{data.totalUsers.toLocaleString()}</div>
            <p className="text-sm text-text-secondary">Registered platform users</p>
          </div>

          {/* Submissions Card */}
          <div className="bg-bg-surface border border-border border-2 border-dashed border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono font-bold text-text-primary">Submissions</h3>
              <svg className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-2">{data.totalSubmissions.toLocaleString()}</div>
            <p className="text-sm text-text-secondary">
              {data.pendingSubmissions} pending review
            </p>
          </div>

          {/* Listings Card */}
          <div className="bg-bg-surface border border-border border-2 border-dashed border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono font-bold text-text-primary">Published</h3>
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-2">{data.totalListings.toLocaleString()}</div>
            <p className="text-sm text-text-secondary">Active skill listings</p>
          </div>

          {/* Total Installs Card */}
          <div className="bg-bg-surface border border-border border-2 border-dashed border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono font-bold text-text-primary">Total Installs</h3>
              <svg className="w-8 h-8 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-2">{data.totalInstalls.toLocaleString()}</div>
            <p className="text-sm text-text-secondary">Across all skills</p>
          </div>

          {/* Weekly Installs Card */}
          <div className="bg-bg-surface border border-border border-2 border-dashed border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono font-bold text-text-primary">This Week</h3>
              <svg className="w-8 h-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-2">{data.weeklyInstalls.toLocaleString()}</div>
            <p className="text-sm text-text-secondary">New installs this week</p>
          </div>

          {/* Approval Rate Card */}
          <div className="bg-bg-surface border border-border border-2 border-dashed border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-mono font-bold text-text-primary">Approval Rate</h3>
              <svg className="w-8 h-8 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2H9a2 2 0 00-2 2z"></path>
              </svg>
            </div>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {data.totalSubmissions > 0
                ? Math.round(((data.totalSubmissions - data.pendingSubmissions) / data.totalSubmissions) * 100)
                : 0}%
            </div>
            <p className="text-sm text-text-secondary">Submissions approved</p>
          </div>
        </div>
      )}

      {/* Submissions Tab */}
      {selectedTab === "submissions" && (
        <div className="space-y-6">
          <div className="bg-bg-surface border border-border border-2 border-dashed border-border">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-xl font-mono font-bold text-text-primary">Pending Submissions</h2>
              <p className="text-text-secondary mt-1">Review and moderate skill submissions</p>
            </div>

            {data.recentSubmissions.length === 0 ? (
              <div className="p-8 text-center">
                <svg className="mx-auto w-12 h-12 text-text-dim mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414a1 1 0 00-.707-.293H4"></path>
                </svg>
                <p className="text-text-secondary text-lg">No pending submissions</p>
                <p className="text-text-dim">All caught up! 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {data.recentSubmissions.map((submission) => (
                  <div key={submission.id} className="p-6">
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 min-w-0 cursor-pointer group"
                        onClick={() => setSelectedSubmission(selectedSubmission === submission.id ? null : submission.id)}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{submission.name}</h3>
                          <span className="inline-flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 border border-red-300">
                            {submission.type}
                          </span>
                          <svg
                            className={`w-4 h-4 text-text-dim transition-transform duration-200 ${selectedSubmission === submission.id ? 'rotate-180' : ''
                              }`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                          </svg>
                        </div>
                        <p className="text-text-secondary mb-3 line-clamp-2">{submission.description}</p>

                        <div className="flex items-center gap-4 text-sm text-text-dim">
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                            </svg>
                            <span>{submission.user.name || submission.user.email}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                            <span>{formatDate(submission.createdAt)}</span>
                          </div>
                          <a
                            href={submission.repoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-accent hover:text-accent-hover transition-colors"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                            </svg>
                            <span>Repository</span>
                          </a>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        <button
                          onClick={() => handleSubmissionAction(submission.id, "approve")}
                          className="px-4 py-2 bg-green-600 text-white text-sm font-medium  hover:bg-green-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                          Approve
                        </button>
                        <button
                          onClick={() => handleSubmissionAction(submission.id, "reject")}
                          className="px-4 py-2 bg-red-600 text-white text-sm font-medium  hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                          </svg>
                          Reject
                        </button>
                      </div>
                    </div>

                    {/* Expanded Detail View */}
                    {selectedSubmission === submission.id && (
                      <div className="mt-4 pt-4 border-t border-border bg-bg-inset border-2 border-dashed border-border p-4">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                          {/* Left Column - Details */}
                          <div className="space-y-4">
                            <div>
                              <h4 className="text-sm font-medium text-text-primary mb-2">Long Description</h4>
                              <div className="bg-bg-base border border-border  p-3 max-h-40 overflow-y-auto">
                                <p className="text-sm text-text-secondary whitespace-pre-wrap">{submission.longDescription}</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium text-text-primary mb-2">Category</h4>
                                <span className="inline-flex items-center px-3 py-1 text-sm bg-bg-card border border-border ">
                                  {submission.category}
                                </span>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium text-text-primary mb-2">License</h4>
                                <span className="inline-flex items-center px-3 py-1 text-sm bg-bg-card border border-border ">
                                  {submission.license}
                                </span>
                              </div>
                            </div>

                            {submission.repoPath && (
                              <div>
                                <h4 className="text-sm font-medium text-text-primary mb-2">Repository Path</h4>
                                <code className="text-sm bg-bg-base border border-border  px-3 py-2 block font-mono">
                                  {submission.repoPath}
                                </code>
                              </div>
                            )}
                          </div>

                          {/* Right Column - Tags & Additional Info */}
                          <div className="space-y-4">
                            {submission.tags && submission.tags.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-text-primary mb-2">Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                  {submission.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 text-xs bg-blue-100 text-blue-800 "
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {submission.triggerWords && submission.triggerWords.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-text-primary mb-2">Trigger Phrases</h4>
                                <div className="flex flex-wrap gap-2">
                                  {submission.triggerWords.map((word, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 text-xs bg-green-100 text-green-800 "
                                    >
                                      {word}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {submission.compatibleAgents && submission.compatibleAgents.length > 0 && (
                              <div>
                                <h4 className="text-sm font-medium text-text-primary mb-2">Compatible Agents</h4>
                                <div className="flex flex-wrap gap-2">
                                  {submission.compatibleAgents.map((agent, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-1 text-xs bg-purple-100 text-purple-800 "
                                    >
                                      {agent}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-1 gap-3 text-sm">
                              <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-text-secondary">Open Source</span>
                                <span className={`font-medium ${submission.isOpenSource ? 'text-green-600' : 'text-red-600'}`}>
                                  {submission.isOpenSource ? 'Yes' : 'No'}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-text-secondary">Submitted by</span>
                                <span className="font-medium text-text-primary">
                                  {submission.user.githubUsername ? `@${submission.user.githubUsername}` : submission.user.name || submission.user.email}
                                </span>
                              </div>
                              <div className="flex items-center justify-between py-2">
                                <span className="text-text-secondary">Full Date</span>
                                <span className="font-medium text-text-primary">
                                  {new Intl.DateTimeFormat("en-US", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit"
                                  }).format(new Date(submission.createdAt))}
                                </span>
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
        </div>
      )}

      {/* Skills Management Tab */}
      {selectedTab === "skills" && (
        <SkillsManagement />
      )}
    </div>
  );
}