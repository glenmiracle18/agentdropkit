import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - skills.claude",
  description: "Privacy policy for the skills.claude directory platform.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-bg-base py-8 md:py-16 px-6">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8 md:mb-12">
          <h1 className="text-4xl md:text-5xl font-bold font-mono text-text-primary tracking-tight uppercase mb-4">
            Privacy Policy
          </h1>
          <p className="text-lg font-mono text-text-muted">
            Last updated: March 3, 2026
          </p>
        </div>

        <div className="font-mono text-text-muted leading-relaxed space-y-6 text-lg">
          <p>
            We collect minimal data to provide our service. When you submit
            skills, we collect your GitHub data for validation purposes. We also
            collect anonymous usage analytics and your votes and ratings on
            skills to improve the platform and maintain quality.
          </p>

          <p>
            Your data helps us process skill submissions, prevent spam and
            abuse, improve the platform, and communicate with you about your
            submissions. We use this information solely to operate and enhance
            the skills directory service.
          </p>

          <p>
            We don't sell your data. We only share public skill information as
            intended by the platform's purpose, anonymous usage statistics for
            service improvement, and information when required by legal
            disclosures.
          </p>

          <p>
            You have the right to access your data, correct any inaccuracies,
            delete your account, and export your submissions. Contact us if you
            need to exercise any of these rights.
          </p>

          <p>
            We protect your data with industry-standard security measures
            including encryption, secure servers, and regular security audits.
            Your privacy and data security are important to us.
          </p>

          <div className="text-center mt-12 pt-8 border-t-2 border-border border-dashed">
            <p className="text-accent font-bold text-xl">
              <a
                href="https://x.com/glen_miracle4"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-2 underline-offset-4 hover:text-accent-hover transition-colors"
              >
                @glen_miracle4
              </a>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
