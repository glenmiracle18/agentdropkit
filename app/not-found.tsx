import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-bg-base flex items-center justify-center px-6">
      <div className="max-w-lg w-full">

        {/* Terminal frame */}
        <div className="border-2 border-border bg-bg-surface shadow-[6px_6px_0px_0px_var(--color-border)]">

          {/* Terminal chrome */}
          <div className="flex items-center gap-2 px-4 py-3 border-b-2 border-border bg-bg-card">
            <span className="w-3 h-3 rounded-full bg-red-400 border border-red-500" />
            <span className="w-3 h-3 rounded-full bg-yellow-400 border border-yellow-500" />
            <span className="w-3 h-3 rounded-full bg-green-400 border border-green-500" />
            <span className="ml-3 font-mono text-xs text-text-muted tracking-widest uppercase">
              agentdropkit — bash
            </span>
          </div>

          {/* Terminal body */}
          <div className="p-6 font-mono text-sm">
            <p className="text-text-muted tracking-widest uppercase text-xs mb-4">
              $ agentdropkit lookup --path &quot;/???&quot;
            </p>

            <p className="text-red-500 font-bold text-4xl mb-2 tracking-tight">
              404
            </p>

            <p className="text-text-primary font-bold text-lg uppercase tracking-widest mb-1">
              Skill not found
            </p>

            <p className="text-text-muted text-xs uppercase tracking-widest mb-6">
              Error: the path you requested does not exist in the registry.
            </p>

            <div className="border-t-2 border-border pt-6 flex flex-col sm:flex-row gap-3">
              <Link
                href="/"
                className="flex-1 py-3 text-center text-xs font-bold uppercase tracking-widest bg-accent text-white hover:bg-accent-hover transition-colors border-2 border-accent"
              >
                Browse Directory
              </Link>
              <Link
                href="/submit"
                className="flex-1 py-3 text-center text-xs font-bold uppercase tracking-widest border-2 border-border text-text-primary hover:bg-bg-card transition-colors"
              >
                Submit a Skill
              </Link>
            </div>
          </div>
        </div>

        {/* Hint */}
        <p className="mt-4 text-center font-mono text-xs text-text-muted uppercase tracking-widest">
          Lost? Try{" "}
          <Link href="/" className="text-accent hover:underline">
            agentdropkit.com
          </Link>
        </p>

      </div>
    </main>
  );
}
