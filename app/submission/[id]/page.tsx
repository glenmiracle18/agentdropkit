import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

interface SubmissionPageProps {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: SubmissionPageProps) {
  const submission = await db.submission.findUnique({
    where: { id: params.id },
  });

  if (!submission) {
    return {
      title: "Submission Not Found",
    };
  }

  return {
    title: `${submission.name} - Submission Status`,
    description: `Review status for ${submission.name}`,
  };
}

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

export default async function SubmissionPage({ params }: SubmissionPageProps) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  const submission = await db.submission.findUnique({
    where: { id: params.id },
  });

  if (!submission) {
    notFound();
  }

  // Only allow the submitter to view their submission
  if (!session?.user || submission.userId !== session.user.id) {
    notFound();
  }

  const status = statusConfig[submission.status];

  return (
    <main className="min-h-screen bg-bg-deep">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-text-primary font-mono mb-4">
            Submission Status
          </h1>
          <p className="text-lg text-text-secondary">
            Track the review progress of your submission
          </p>
        </div>

        <div className="bg-bg-surface border border-border rounded-lg p-8 space-y-8">
          {/* Status Badge */}
          <div className="text-center">
            <div className={`inline-flex items-center px-4 py-2 rounded-sm border ${status.bg} ${status.border}`}>
              <span className={`font-medium ${status.color}`}>
                {status.label}
              </span>
            </div>
          </div>

          {/* Submission Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-text-primary font-mono mb-2">
                {submission.name}
              </h2>
              <p className="text-text-secondary">
                {submission.description}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Type</h3>
                <p className="text-text-secondary capitalize">{submission.type}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Category</h3>
                <p className="text-text-secondary capitalize">
                  {submission.category.replace("-", " ")}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Repository</h3>
                <a 
                  href={submission.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:text-accent/80 break-all"
                >
                  {submission.repoUrl}
                </a>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Install Command</h3>
                <code className="text-text-secondary bg-bg-deep px-2 py-1 rounded text-sm font-mono">
                  {submission.installCommand}
                </code>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">License</h3>
                <p className="text-text-secondary">{submission.license}</p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Submitted</h3>
                <p className="text-text-secondary">
                  {new Date(submission.submittedAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            {submission.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {submission.tags.map((tag, index) => (
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

            {submission.reviewNotes && (
              <div>
                <h3 className="text-sm font-medium text-text-primary mb-2">Review Notes</h3>
                <div className="bg-bg-deep border border-border rounded-sm p-4">
                  <p className="text-text-secondary whitespace-pre-wrap">
                    {submission.reviewNotes}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Status Information */}
          <div className="border-t border-border pt-8">
            {submission.status === "pending" && (
              <div className="text-center">
                <p className="text-text-secondary mb-4">
                  Your submission is currently under review. Our team will review it within 2-3 business days.
                </p>
                <p className="text-text-dim text-sm">
                  You'll receive an email notification once the review is complete.
                </p>
              </div>
            )}

            {submission.status === "approved" && (
              <div className="text-center">
                <p className="text-green-400 mb-4">
                  🎉 Congratulations! Your submission has been approved and published.
                </p>
                <Link
                  href={`/${submission.authorHandle}/${submission.slug}`}
                  className="inline-flex items-center px-4 py-2 bg-accent text-bg-deep font-medium rounded-sm hover:bg-accent/90 transition-colors"
                >
                  View Published Listing
                </Link>
              </div>
            )}

            {submission.status === "rejected" && (
              <div className="text-center">
                <p className="text-red-400 mb-4">
                  Your submission was not approved. Please see the review notes above for details.
                </p>
                <Link
                  href="/submit"
                  className="inline-flex items-center px-4 py-2 bg-accent text-bg-deep font-medium rounded-sm hover:bg-accent/90 transition-colors"
                >
                  Submit Another
                </Link>
              </div>
            )}

            {submission.status === "changes_requested" && (
              <div className="text-center">
                <p className="text-orange-400 mb-4">
                  Changes have been requested for your submission. Please see the review notes above.
                </p>
                <Link
                  href="/submit"
                  className="inline-flex items-center px-4 py-2 bg-accent text-bg-deep font-medium rounded-sm hover:bg-accent/90 transition-colors"
                >
                  Submit Updated Version
                </Link>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="border-t border-border pt-8 text-center">
            <Link
              href="/"
              className="text-accent hover:text-accent/80"
            >
              ← Back to Directory
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}