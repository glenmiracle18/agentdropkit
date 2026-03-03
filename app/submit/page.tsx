import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import SubmissionForm from "@/components/submission-form";
import SubmissionsList from "@/components/submissions-list";
import SubmitHeaderIcon from "@/components/submit-header-icon";

export const metadata = {
  title: "Submit a Skill - skills.claude",
  description: "Submit your Claude skill, MCP server, or tool to the directory",
};

interface SubmitPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function SubmitPage({ searchParams }: SubmitPageProps) {
  const params = await searchParams;
  const isNew = params.new === "true";

  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?from=/submit");
  }

  // Fetch past and pending submissions for this user
  const submissions = await db.submission.findMany({
    where: {
      userId: session.user.id,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const showList = submissions.length > 0 && !isNew;

  return (
    <main className="min-h-screen bg-bg-deep">
      <div className="mx-auto max-w-4xl px-6 py-8">
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
          <SubmissionForm user={session.user} />
        )}
      </div>
    </main>
  );
}