import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SubmissionForm from "@/components/submission-form";
import SubmitHeaderIcon from "@/components/submit-header-icon";

export const metadata = {
  title: "Submit a Skill - skills.claude",
  description: "Submit your Claude skill, MCP server, or tool to the directory",
};

export default async function SubmitPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?from=/submit");
  }

  return (
    <main className="min-h-screen bg-bg-deep">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
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

        <SubmissionForm user={session.user} />
      </div>
    </main>
  );
}