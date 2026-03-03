import Link from "next/link";
import SubmitHeaderIcon from "@/components/submit-header-icon";
import { IconFolderSend } from "@/public/assets/arcade-icons";

const statusConfig = {
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
    submissions: any[];
}

export default function SubmissionsList({ submissions }: SubmissionsListProps) {
    if (submissions.length === 0) {
        return null;
    }

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

            <div className="space-y-8">
                {submissions.map((submission) => {
                    const status = statusConfig[submission.status as keyof typeof statusConfig] || statusConfig.pending;

                    return (
                        <div key={submission.id} className="bg-bg-surface border border-border border-dashed p-8 space-y-8">
                            {/* Header with name and status */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-text-primary font-mono mb-2">
                                        {submission.name}
                                    </h3>
                                    <p className="text-text-secondary max-w-2xl">
                                        <span className="block truncate" title={submission.description}>
                                            {submission.description}
                                        </span>
                                    </p>
                                </div>
                                <div className={`inline-flex items-center px-4 py-2  border ${status.bg} ${status.border} shrink-0`}>
                                    <span className={`font-medium ${status.color}`}>
                                        {status.label}
                                    </span>
                                </div>
                            </div>

                            {/* Submission Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-bg-deep  p-6 border border-border border-dashed">
                                <div>
                                    <h4 className="text-sm font-medium text-text-primary mb-2">Type</h4>
                                    <p className="text-text-secondary capitalize">{submission.type}</p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-2">Category</h4>
                                    <p className="text-text-secondary capitalize">
                                        {submission.category.replace("-", " ")}
                                    </p>
                                </div>

                                <div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-2">Repository</h4>
                                    <a
                                        href={submission.repoUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-accent hover:text-accent/80 break-all"
                                    >
                                        {submission.repoUrl}
                                    </a>
                                </div>

                                {submission.installCommand && (
                                    <div>
                                        <h4 className="text-sm font-semibold text-text-primary mb-2">Install Command</h4>
                                        <code className="text-text-secondary bg-bg-base px-2 py-1 rounded text-sm font-mono block overflow-x-auto">
                                            {submission.installCommand}
                                        </code>
                                    </div>
                                )}

                                <div>
                                    <h4 className="text-sm font-semibold text-text-primary mb-2">Submitted</h4>
                                    <p className="text-text-secondary">
                                        {new Date(submission.submittedAt).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>

                            {/* Tags */}
                            {submission.tags && submission.tags.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium text-text-primary mb-2">Tags</h4>
                                    <div className="flex flex-wrap gap-2">
                                        {submission.tags.map((tag: string, index: number) => (
                                            <span
                                                key={index}
                                                className="px-2 py-1 text-xs bg-bg-card text-text-dim rounded-sm"
                                            >
                                                {tag}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Review Notes */}
                            {submission.reviewNotes && (
                                <div>
                                    <h4 className="text-sm font-medium text-text-primary mb-2">Review Notes</h4>
                                    <div className="bg-bg-deep border border-border rounded-sm p-4">
                                        <p className="text-text-secondary whitespace-pre-wrap">
                                            {submission.reviewNotes}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Status Actions / Next Steps */}
                            <div className="pt-6">
                                {submission.status === "pending" && (
                                    <p className="text-text-dim text-sm text-center">
                                        Review in progress. You'll receive an email notification once complete.
                                    </p>
                                )}

                                {/* {submission.status === "approved" && (
                                    <div className="flex justify-center">
                                        <Link
                                            href={`/${submission.authorHandle}/${submission.slug}`}
                                            className="inline-flex items-center px-4 py-2 bg-accent text-bg-deep font-medium rounded-sm hover:bg-accent/90 transition-colors"
                                        >
                                            View Published Listing
                                        </Link>
                                    </div>
                                )} */}

                                {submission.status === "rejected" && (
                                    <div className="flex flex-col items-center gap-3">
                                        <p className="text-red-400/80 text-sm">
                                            Please see the review notes above for detailed feedback.
                                        </p>
                                    </div>
                                )}

                                {submission.status === "changes_requested" && (
                                    <div className="flex flex-col items-center gap-3">
                                        <p className="text-orange-400/80 text-sm text-center">
                                            Please address the requested changes in your repository. Our team will re-review once complete.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
