import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SubmitPageClient from "@/components/submit-page-client";

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

  return (
    <main className="min-h-screen bg-bg-deep">
      <div className="mx-auto max-w-4xl px-6 py-8">
        <SubmitPageClient user={session.user} isNew={isNew} />
      </div>
    </main>
  );
}
