import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service - skills.claude",
  description: "Terms of service for the skills.claude directory platform.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-bg-base py-8 md:py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-mono text-text-primary tracking-tight uppercase mb-4">
            Terms of Service
          </h1>
          <p className="text-lg font-mono text-text-muted">
            Last updated: March 3, 2026
          </p>
        </div>

        <div className="font-mono text-text-muted leading-relaxed space-y-6 text-lg">
          <p>
            By using skills.claude, you agree to these terms. If you don't agree, please don't use our service. These terms govern your access to and use of the skills directory platform.
          </p>

          <p>
            You may browse and search skills, submit original skills you've created, vote on skills, and use skills according to their licenses. The platform is designed for developers to share and discover useful Claude agent capabilities.
          </p>

          <p>
            You must not submit malicious or harmful code, violate others' intellectual property, spam or abuse the platform, impersonate others, or attempt to hack or disrupt the service. We maintain a safe, productive environment for the developer community.
          </p>

          <p>
            When you submit skills, you retain ownership of your code but grant us permission to display it publicly. You confirm you have the right to share it and you're responsible for keeping it updated. All submissions become part of the public directory.
          </p>

          <p>
            We strive for high availability but can't guarantee 100% uptime. We may need to take the service down for maintenance or updates. Skills are provided "as-is" and we're not responsible for any issues arising from using skills found on our platform. Test everything before production use.
          </p>

          <p>
            We reserve the right to remove content that violates these terms or is harmful to the community. Moderation decisions are final but you can appeal by contacting us. We may update these terms and significant changes will be communicated through the platform.
          </p>

          <div className="text-center mt-12 pt-8 border-t-2 border-border border-dahsed">
            <p className="text-accent font-bold text-xl">
              <a href="https://x.com/glen_miracle4" target="_blank" rel="noopener noreferrer" className="underline decoration-2 underline-offset-4 hover:text-accent-hover transition-colors">
                @glen_miracle4
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}