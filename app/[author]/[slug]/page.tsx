import { headers } from "next/headers";
import type { ListingDetail } from "@/lib/queries/listings";
import SkillDetailWrapper from "./skill-detail-wrapper";

interface DetailPageProps {
  params: Promise<{
    author: string;
    slug: string;
  }>;
}

async function fetchListingMeta(
  author: string,
  slug: string,
): Promise<ListingDetail | null> {
  const headersList = await headers();
  const host = headersList.get("host") ?? "localhost:3000";
  const protocol = process.env.NODE_ENV === "development" ? "http" : "https";

  try {
    const res = await fetch(
      `${protocol}://${host}/api/listings/${encodeURIComponent(author)}/${slug}`,
      { cache: "no-store" },
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: DetailPageProps) {
  const { author, slug } = await params;
  const decodedAuthor = decodeURIComponent(author);
  const listing = await fetchListingMeta(decodedAuthor, slug);

  if (!listing) {
    return { title: "Skill Not Found" };
  }

  return {
    title: `${listing.name} - AgentDropkit`,
    description: listing.description,
  };
}

export default async function DetailPage({ params }: DetailPageProps) {
  const { author, slug } = await params;
  const decodedAuthor = decodeURIComponent(author);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-12 bg-bg-base min-h-screen">
      <SkillDetailWrapper author={decodedAuthor} slug={slug} />
    </div>
  );
}
