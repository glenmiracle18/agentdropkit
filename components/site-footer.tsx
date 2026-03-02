export default function SiteFooter() {
    return (
        <footer className="w-full border-t-2 border-border bg-bg-base py-8 px-6 mt-12">
            <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-sm">
                <div className="flex items-center gap-6">
                    <div className="text-accent font-bold tracking-widest">
                        ##
                    </div>
                    <div className="flex items-center gap-2 text-text-muted font-bold tracking-widest uppercase">
                        <a href="/privacy" className="hover:text-text-primary transition-colors">Privacy</a>
                        <span className="text-border">/</span>
                        <a href="/terms" className="hover:text-text-primary transition-colors">Terms</a>
                    </div>
                </div>

                <div className="text-text-muted font-bold tracking-widest uppercase">
                    Krafted by <a href="https://x.com/glen_miracle4" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 text-text-muted hover:text-text-primary transition-colors tracking-widest">GLEN</a>
                </div>
            </div>
        </footer>
    );
}
