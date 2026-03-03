"use client";

import AgentDropkitLogo from "@/public/assets/logo";

export default function SiteFooter() {
    return (
        <footer className="w-full border-t-2 border-border bg-bg-base py-6 px-4 md:py-8 md:px-6 mt-12">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 font-mono">
                <div className="flex items-center gap-4 md:gap-6">
                    <div className="scale-50 origin-left h-[30px] flex items-center pointer-events-none">
                        <AgentDropkitLogo size="30px" />
                    </div>
                    <div className="flex items-center gap-2 text-text-muted font-bold tracking-widest uppercase text-xs md:text-sm">
                        <a href="/privacy" className="hover:text-text-primary transition-colors">Privacy</a>
                        <span className="text-border">/</span>
                        <a href="/terms" className="hover:text-text-primary transition-colors">Terms</a>
                    </div>
                </div>

                <div className="text-text-muted font-bold tracking-widest uppercase text-xs md:text-sm">
                    Krafted by <a href="https://x.com/glen_miracle4" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 text-text-muted hover:text-text-primary transition-colors tracking-widest">GLEN</a>
                </div>
            </div>
        </footer>
    );
}
