"use client";

import { useMySubmissions } from "@/lib/queries/submissions";
import SubmissionForm from "@/components/submission-form";
import SubmissionsList from "@/components/submissions-list";
import SubmitHeaderIcon from "@/components/submit-header-icon";

interface SubmitPageClientProps {
  user: { id: string; name: string; email: string; image?: string | null; githubUsername: string | null };
  isNew: boolean;
}

export default function SubmitPageClient({ user, isNew }: SubmitPageClientProps) {
  const { data: submissions = [], isLoading } = useMySubmissions();

  const showList = submissions.length > 0 && !isNew;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <p className="text-text-secondary font-mono animate-pulse">Loading...</p>
      </div>
    );
  }

  return (
    <>
      {!showList && (
        <div className="text-center mb-12">
          <h1 className="flex items-center justify-center gap-4 text-4xl font-bold text-text-primary font-mono mb-4">
            <SubmitHeaderIcon />
            Submit a Skill
          </h1>
          <p className="text-lg text-text-secondary max-w-2xl mx-auto">
            Share your Claude skill, MCP server, or tool with the community.
            All submissions are reviewed before being published.
          </p>
        </div>
      )}

      {showList ? (
        <SubmissionsList submissions={submissions} />
      ) : (
        <SubmissionForm user={user} />
      )}
    </>
  );
}
