import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import AdminDashboard from "@/components/admin-dashboard";

export const metadata = {
  title: "Admin - AgentDropkit",
  description: "Admin panel for managing the skills directory",
};

export default async function AdminPage() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login?from=/admin");
  }

  // Check if user has admin role
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, email: true, name: true }
  });

  if (!user || user.role !== "admin") {
    redirect("/");
  }

  // Fetch admin dashboard data
  const [
    totalUsers,
    totalSubmissions,
    pendingSubmissions,
    totalListings,
    recentSubmissions
  ] = await Promise.all([
    // Total users count
    db.user.count(),
    
    // Total submissions count
    db.submission.count(),
    
    // Pending submissions count
    db.submission.count({
      where: { status: "pending" }
    }),
    
    // Total listings count
    db.listing.count(),
    
    // Recent submissions for review
    db.submission.findMany({
      where: { status: "pending" },
      include: {
        user: {
          select: { name: true, email: true, githubUsername: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    })
  ]);

  // Calculate total installs across all listings
  const installStats = await db.listing.aggregate({
    _sum: {
      totalInstalls: true,
      weeklyInstalls: true
    }
  });

  const dashboardData = {
    totalUsers,
    totalSubmissions,
    pendingSubmissions,
    totalListings,
    totalInstalls: installStats._sum.totalInstalls || 0,
    weeklyInstalls: installStats._sum.weeklyInstalls || 0,
    recentSubmissions
  };

  return (
    <main className="min-h-screen bg-bg-deep">
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-text-primary font-mono mb-4">
            Admin Dashboard
          </h1>
          <p className="text-lg text-text-secondary">
            Manage submissions, users, and monitor platform metrics
          </p>
        </div>

        <AdminDashboard data={dashboardData} />
      </div>
    </main>
  );
}