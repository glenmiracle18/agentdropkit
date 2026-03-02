import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import SyncTrigger from "@/components/sync-trigger";

export const metadata = {
  title: "Admin - skills.claude",
  description: "Admin panel for managing the skills directory",
};

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?from=/admin");
  }

  // For now, allow any authenticated user (in production, add proper admin checks)

  return (
    <main className="min-h-screen bg-bg-deep">
      <div className="mx-auto max-w-4xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-text-primary font-mono mb-4">
            Admin Panel
          </h1>
          <p className="text-lg text-text-secondary">
            Manage and maintain the skills directory
          </p>
        </div>

        <div className="space-y-8">
          {/* GitHub Sync Section */}
          <div className="bg-bg-surface border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary font-mono mb-4">
              GitHub Data Sync
            </h2>
            <p className="text-text-secondary mb-6">
              Manually trigger a sync of GitHub repository data including stars, forks, 
              and install statistics for all listings.
            </p>
            
            <SyncTrigger />
          </div>

          {/* Future admin features can be added here */}
          <div className="bg-bg-surface border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary font-mono mb-4">
              Coming Soon
            </h2>
            <ul className="text-text-secondary space-y-2">
              <li>• Review pending submissions</li>
              <li>• Manage user accounts</li>
              <li>• View analytics and metrics</li>
              <li>• Content moderation tools</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}