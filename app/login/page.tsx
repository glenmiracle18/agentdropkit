"use client";

import { authClient } from "@/lib/auth-client";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { sileo } from "sileo";

export default function LoginPage() {
  const { data: session, isPending } = authClient.useSession();

  useEffect(() => {
    if (session) {
      redirect("/");
    }
  }, [session]);

  if (isPending) {
    return (
      <main className="min-h-screen bg-bg-deep flex items-center justify-center">
        <div className="text-text-secondary">Loading...</div>
      </main>
    );
  }

  if (session) {
    return null; // Will redirect
  }

  const handleGitHubSignIn = async (e: React.MouseEvent) => {
    e.preventDefault();
    sileo.info({ title: "Initiating GitHub login..." });
    try {
      const result = await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
      });
      if (result?.error) {
        sileo.error({
          title: "Sign in failed",
          description: result.error.message || "Please check your network and try again.",
          styles: { title: "text-[var(--sileo-state-error)]!" }
        });
      } else if (result?.data?.url) {
        sileo.success({ title: "Redirecting...", description: "Taking you to GitHub." });
        // Fallback in case the internal redirect fails
        window.location.href = result.data.url;
      }
    } catch (error) {
      console.error("Sign in error:", error);
      sileo.error({
        title: "Connection Error",
        description: "Failed to connect to the authentication server.",
        styles: { title: "text-[var(--sileo-state-error)]!" }
      });
    }
  };

  return (
    <main className="min-h-screen bg-bg-deep flex items-center justify-center">
      <div className="bg-bg-surface border border-border p-8 max-w-md w-full mx-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-text-primary mb-2">
            Sign in to AgentDropkit
          </h1>
        </div>

        <button
          onClick={handleGitHubSignIn}
          className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-accent text-bg-deep rounded-sm font-medium hover:bg-accent/90 transition-colors"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
          </svg>
          Continue with GitHub
        </button>

        <div className="mt-6 text-center">
          <p className="text-text-dim text-sm opacity-50">
            By signing in, you agree to our terms of service and privacy policy
          </p>
        </div>
      </div>
    </main>
  );
}