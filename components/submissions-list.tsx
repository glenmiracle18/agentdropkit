"use client";

import { useState } from "react";
import Link from "next/link";
import { IconFolderSend } from "@/public/assets/arcade-icons";
import type { Submission } from "@prisma/client";

const INITIAL_VISIBLE = 5;

const statusConfig: Record<string, { color: string; bg: string; border: string; label: string }> = {
    pending: {
        color: "text-yellow-400",
        bg: "bg-yellow-400/10",
        border: "border-yellow-400/20",
        label: "Under Review"
    },
    approved: {
        color: "text-green-400",
        bg: "bg-green-400/10",
        border: "border-green-400/20",
        label: "Approved"
    },
    rejected: {
        color: "text-red-400",
        bg: "bg-red-400/10",
        border: "border-red-400/20",
        label: "Rejected"
    },
    changes_requested: {
        color: "text-orange-400",
        bg: "bg-orange-400/10",
        border: "border-orange-400/20",
        label: "Changes Requested"
    }
};

interface SubmissionsListProps {
    submissions: Submission[];
}

export default function SubmissionsList({ submissions }: SubmissionsListProps) {
    const [showAll, setShowAll] = useState(false);

    if (submissions.length === 0) {
        return null;
    }

    const visible = showAll ? submissions : submissions.slice(0, INITIAL_VISIBLE);
    const hiddenCount = submissions.length - INITIAL_VISIBLE;

    return (
        <div className="space-y-12">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4">
                <div className="text-center sm:text-left">
                    <h2 className="text-3xl font-bold text-text-primary font-mono mb-2">
                        Your Submissions
                    </h2>
                    <p className="text-text-secondary">
                        Manage your submitted skills, MCP servers, and tools.
                    </p>
                </div>
                <Link
                    href="/submit?new=true"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-bg-deep font-bold font-mono uppercase tracking-widest rounded-sm shadow-[4px_4px_0px_0px_var(--color-text-primary)] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-[2px_2px_0px_0px_var(--color-text-primary)] transition-all"
                >
                    <div className="scale-75 origin-left h-[40px] flex items-center">
                        <IconFolderSend />
                    </div>
                    Submit Another
                </Link>
            </div>

            <div className="space-y-3">
                {visible.map((submission) => {
                    const status = statusConfig[submission.status] ?? statusConfig.pending;

                    return (
                        <div key={submission.id} className="bg-bg-surface border border-border border-dashed px-6 py-4 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                                <h3 className="text-base font-bold text-text-primary font-mono truncate">
                                    {submission.name}
                                </h3>
                                <p className="text-sm text-text-secondary mt-0.5 line-clamp-1" title={submission.description}>
                                    {submission.description}
                                </p>
                            </div>
                            <div className={`inline-flex items-center px-3 py-1.5 border ${status.bg} ${status.border} shrink-0`}>
                                <span className={`text-xs font-medium ${status.color} whitespace-nowrap`}>
                                    {status.label}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {hiddenCount > 0 && (
                <div className="flex justify-center">
                    <button
                        onClick={() => setShowAll((v) => !v)}
                        className="px-6 py-2 border border-border border-dashed text-sm font-mono text-text-secondary hover:text-text-primary hover:border-text-primary transition-colors"
                    >
                        {showAll ? "Show Less" : `View ${hiddenCount} More`}
                    </button>
                </div>
            )}
        </div>
    );
}
