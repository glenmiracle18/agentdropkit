import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import BulkImportClient from "@/components/bulk-import-client";
import Link from "next/link";

export const metadata = {
  title: "Bulk Import — Admin",
  description: "Import multiple skills at once from GitHub repositories",
};

export default async function BulkImportPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) redirect("/login?from=/admin/import");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  });
  if (!user || user.role !== "admin") redirect("/");

  return (
    <main className="min-h-screen bg-bg-deep">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-10">
          <Link
            href="/admin"
            className="text-xs font-mono font-bold uppercase tracking-widest text-text-muted hover:text-text-primary transition-colors"
          >
            ← Admin
          </Link>
          <h1 className="mt-4 text-4xl font-bold text-text-primary font-mono">
            Bulk Import Skills
          </h1>
          <p className="mt-2 text-text-secondary font-mono">
            Paste GitHub repo URLs to detect, review, and import multiple skills at once.
          </p>
        </div>

        <BulkImportClient />
      </div>
    </main>
  );
}
