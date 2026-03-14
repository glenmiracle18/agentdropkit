"use client";

import Link from "next/link";
import { useSession, signOut } from "@/lib/auth-client";
import Image from "next/image";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AgentDropkitLogo from "@/public/assets/logo";

export default function Navigation() {
  const { data: session, isPending } = useSession();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setIsProfileMenuOpen(false);
    setIsMobileMenuOpen(false);
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          router.push("/");
          router.refresh();
        },
      },
    });
  };

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when switching themes to prevent weird states
  const handleThemeToggle = () => {
    setTheme(theme === "dark" ? "light" : "dark");
    // Optionally close mobile menu when theme is toggled
    // setIsMobileMenuOpen(false);
  };

  return (
    <nav className="border-b-2 border-border bg-bg-surface relative z-50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 sm:h-20 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center group" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="bg-accent flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 hover:bg-accent-hover transition-colors">
              <AgentDropkitLogo size="30px" />
              <span className="text-bg-base font-bold text-lg sm:text-xl tracking-tight uppercase">
                AgentDropkit
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8 font-mono tracking-widest text-sm uppercase">
            <Link
              href="/"
              className="text-text-muted hover:text-text-primary transition-colors font-bold"
            >
              Directory
            </Link>
            <span
              className="text-text-muted/30 font-bold cursor-not-allowed select-none blur-[1.5px] pointer-events-none"
              title="Coming soon"
            >
              Docs
            </span>
            <span
              className="text-text-muted/30 font-bold cursor-not-allowed select-none blur-[1.5px] pointer-events-none"
              title="Coming soon"
            >
              Advertise
            </span>
            <Link
              href="/submit"
              className="text-text-muted hover:text-text-primary transition-colors font-bold"
            >
              Submit
            </Link>
          </div>

          {/* Desktop Auth/Profile & Theme Section */}
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={handleThemeToggle}
              className="text-text-primary hover:text-accent transition-colors"
              aria-label="Toggle dark mode"
            >
              {mounted && theme === "dark" ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="12" y1="1" x2="12" y2="3"></line>
                  <line x1="12" y1="21" x2="12" y2="23"></line>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                  <line x1="1" y1="12" x2="3" y2="12"></line>
                  <line x1="21" y1="12" x2="23" y2="12"></line>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                </svg>
              )}
            </button>
            {isPending ? (
              <div className="text-text-muted text-sm uppercase font-mono tracking-widest font-bold">Loading...</div>
            ) : session?.user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                  className={`flex items-center gap-3 px-3 py-2 border-2 border-transparent hover:border-border transition-colors ${isProfileMenuOpen ? "border-border bg-bg-surface" : ""
                    }`}
                >
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={32}
                      height={32}
                      className="border-2 border-border"
                    />
                  )}
                  <span className="text-text-primary text-sm uppercase font-mono tracking-widest font-bold hidden lg:block">
                    {session.user.name || session.user.email}
                  </span>
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    className={`transition-transform duration-200 text-text-primary ${isProfileMenuOpen ? "rotate-180" : ""
                      }`}
                  >
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </button>

                {/* Dropdown Menu */}
                {isProfileMenuOpen && (
                  <div className="absolute right-0 mt-3 w-48 bg-bg-base border-2 border-border shadow-[4px_4px_0px_0px_var(--color-border)] flex flex-col font-mono tracking-widest text-sm uppercase font-bold z-50">
                    {(session.user as { role?: string }).role === "admin" && (
                      <Link
                        href="/admin"
                        onClick={() => setIsProfileMenuOpen(false)}
                        className="px-4 py-3 text-accent hover:bg-bg-surface transition-colors border-b-2 border-border flex items-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Admin
                      </Link>
                    )}
                    <button
                      onClick={handleSignOut}
                      className="px-4 py-3 text-left bg-text-primary text-bg-base hover:bg-text-muted transition-colors w-full"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-6 py-2 text-sm uppercase font-mono tracking-widest font-bold bg-text-primary text-bg-base hover:bg-text-muted transition-colors border-2 border-transparent"
                >
                  login
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburger Button */}
          <div className="flex bg-transparent md:hidden items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-text-primary p-2 focus:outline-none"
              aria-label="Toggle mobile menu"
            >
              {isMobileMenuOpen ? (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              ) : (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="square" strokeLinejoin="miter">
                  <line x1="3" y1="12" x2="21" y2="12"></line>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <line x1="3" y1="18" x2="21" y2="18"></line>
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="absolute top-full left-0 w-full bg-bg-surface border-b-2 border-border md:hidden flex flex-col font-mono tracking-widest text-sm uppercase font-bold">
          <Link
            href="/"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-6 py-4 border-b-2 border-border text-text-primary hover:bg-bg-inset transition-colors"
          >
            Directory
          </Link>
          <span
            className="px-6 py-4 border-b-2 border-border text-text-muted/30 font-bold blur-[1.5px] select-none pointer-events-none cursor-not-allowed"
          >
            Advertise
          </span>
          <Link
            href="/submit"
            onClick={() => setIsMobileMenuOpen(false)}
            className="px-6 py-4 border-b-2 border-border text-text-primary hover:bg-bg-inset transition-colors"
          >
            Submit
          </Link>

          <div className="px-6 py-6 flex flex-col gap-6 bg-bg-base">
            <div className="flex items-center justify-between">
              <span className="text-text-muted">Theme</span>
              <button
                onClick={handleThemeToggle}
                className="text-text-primary p-2 border-2 border-border hover:bg-bg-surface transition-colors focus:outline-none"
                aria-label="Toggle dark mode"
              >
                {mounted && theme === "dark" ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                )}
              </button>
            </div>

            {isPending ? (
              <div className="text-text-muted text-sm uppercase">Loading...</div>
            ) : session?.user ? (
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  {session.user.image && (
                    <Image
                      src={session.user.image}
                      alt="Profile"
                      width={40}
                      height={40}
                      className="border-2 border-border"
                    />
                  )}
                  <span className="text-text-primary text-base truncate">
                    {session.user.name || session.user.email}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full py-3 text-center border-2 border-border hover:bg-border hover:text-bg-base transition-colors"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center border-2 border-text-primary text-text-primary hover:bg-bg-surface transition-colors"
                >
                  Log In
                </Link>
                <Link
                  href="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="w-full py-3 text-center bg-text-primary text-bg-base hover:bg-text-muted transition-colors"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
