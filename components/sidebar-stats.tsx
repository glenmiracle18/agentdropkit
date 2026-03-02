import Link from "next/link";
import type { Listing } from "@prisma/client";

interface SidebarStatsProps {
  listing: Listing;
}

function getHealthGrade(score: number): string {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function formatDate(date: Date): string {
  return new Intl.RelativeTimeFormat('en', { numeric: 'auto' }).format(
    Math.round((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
    'day'
  );
}

export default function SidebarStats({ listing }: SidebarStatsProps) {
  const healthGrade = getHealthGrade(listing.healthScore);
  const gradeColor = {
    A: 'text-green',
    B: 'text-blue',
    C: 'text-accent',
    D: 'text-text-muted',
    F: 'text-red-400'
  }[healthGrade];

  return (
    <div className="space-y-12">
      {/* Health Score */}
      <div>
        <h3 className="text-text-muted font-bold mb-6 uppercase tracking-widest border-b-2 border-border pb-2">Security & Health</h3>

        <div className="mb-2 text-sm text-text-muted">Health Score</div>
        <div className="flex items-center gap-3 mb-6">
          <div className={`text-5xl font-bold leading-none ${gradeColor}`}>
            {healthGrade}
            {listing.healthScore === 100 ? '+' : ''}
          </div>
          <div className="text-text-primary text-xl font-bold">
            {listing.healthScore}/100
          </div>
        </div>

        {listing.isOfficial && (
          <div className="bg-[#E6F7F0] dark:bg-[#064E3B]/30 border-2 border-green p-4 flex gap-3">
            <svg className="w-5 h-5 text-green shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <circle cx="8" cy="8" r="3" />
              <path d="M10 10l8 8M14 18l3 3M18 14l3 3" />
            </svg>
            <div>
              <div className="text-green font-bold text-sm mb-1">Official Skill</div>
              <div className="text-text-muted text-xs leading-relaxed">Verified and maintained by the core team.</div>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div>
        <h3 className="text-text-muted font-bold mb-6 uppercase tracking-widest border-b-2 border-border pb-2">Skill Stats</h3>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
              <span className="text-text-primary font-bold">Stars</span>
            </div>
            <span className="text-text-primary font-bold text-lg">
              {(listing.githubStars / 1000).toFixed(1)}k
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              <span className="text-text-primary font-bold">Installs</span>
            </div>
            <span className="text-text-primary font-bold text-lg">
              {(listing.totalInstalls / 1000).toFixed(1)}k
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              <span className="text-text-primary font-bold">Added</span>
            </div>
            <span className="text-text-muted font-bold">
              {formatDate(listing.firstSeenAt)}
            </span>
          </div>
        </div>
      </div>

      {/* Agents Installed On */}
      {listing.agentsInstalledOn && typeof listing.agentsInstalledOn === 'object' && Object.keys(listing.agentsInstalledOn as Record<string, number>).length > 0 && (
        <div className="pt-6 border-t-2 border-border">
          <h3 className="text-text-muted font-bold mb-4 uppercase tracking-widest">Installed on</h3>
          <div className="space-y-3">
            {Object.entries(listing.agentsInstalledOn as Record<string, number>).map(([agent, count]) => (
              <div key={agent} className="flex items-center justify-between">
                <span className="text-text-primary font-bold capitalize">{agent}</span>
                <span className="text-text-muted font-bold">
                  {count.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tags */}
      {listing.tags.length > 0 && (
        <div className="pt-6 border-t-2 border-border">
          <h3 className="text-text-muted font-bold mb-4 uppercase tracking-widest">Tags</h3>
          <div className="flex flex-wrap gap-2">
            {listing.tags.map((tag) => (
              <Link
                key={tag}
                href={`/?search=${encodeURIComponent(tag)}`}
                className="px-2 py-1 text-xs font-bold uppercase tracking-widest border-2 border-border text-text-muted hover:text-text-primary hover:border-text-primary transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Repository */}
      <div className="pt-6 border-t-2 border-border">
        <h3 className="text-text-muted font-bold mb-4 uppercase tracking-widest">Repository</h3>
        <a
          href={listing.repoUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-text-primary hover:text-accent font-bold transition-colors uppercase tracking-widest"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          View on GitHub
        </a>
      </div>
    </div>
  );
}