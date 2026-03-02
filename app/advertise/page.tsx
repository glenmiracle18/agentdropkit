"use client";

import { useState, useEffect } from "react";
import { IconUsers, IconMouse2, IconTree, IconTerminal, IconCloudShowers, IconLock, IconChart, IconCode } from "@/public/assets/arcade-icons";
import { IconUsers as IconUsersDark, IconMouse2 as IconMouse2Dark, IconTree as IconTreeDark, IconTerminal as IconTerminalDark, IconEnvelopePlus } from "@/public/assets/arcade-icons-darkmode";
import { useTheme } from "next-themes";

export default function AdvertisePage() {
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedAdType, setSelectedAdType] = useState("");
  const [copiedEmail, setCopiedEmail] = useState(false);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const bannerAds = [
    {
      company: "AutoCheck",
      icon: <IconLock size="24px" strokeWidth={3} />,
      color: "bg-purple-600",
      title: "AutoCheck: Smart Git Hooks",
      description: "Automatically run tests, lint, and security checks on every commit. Zero setup..."
    },
    {
      company: "SecureFlow",
      icon: <IconLock size="24px" strokeWidth={3} />,
      color: "bg-red-600",
      title: "SecureFlow: Code Security Scanner",
      description: "Real-time vulnerability detection with AI-powered threat analysis. Integrates with..."
    },
    {
      company: "DataPipe",
      icon: <IconChart size="24px" strokeWidth={3} />,
      color: "bg-indigo-600",
      title: "DataPipe: ETL Made Simple",
      description: "Transform and sync data between services with visual pipelines. No-code solution..."
    }
  ];

  const adTypes = [
    {
      id: "featured-skill",
      title: "Featured Skill",
      description: "Premium positioning in our skill directory with enhanced visibility",
      price: "From $500/month",
      emailSubject: "Featured Skill Advertising Inquiry",
      emailBody: "Hi Glen,\n\nI'm interested in featuring a skill on AgentDropkit through your Featured Skill advertising option.\n\nHere are some details about what I'd like to promote:\n\nSkill/Product Name: [Your skill name]\nBrief Description: [Brief description]\nTarget Audience: [Who is this for?]\nPreferred Start Date: [When would you like to start?]\nBudget Range: [Your budget]\n\nI'd love to discuss the details and next steps.\n\nBest regards,\n[Your Name]\n[Your Company]\n[Your Email]"
    },
    {
      id: "newsletter-sponsor",
      title: "Newsletter Sponsor",
      description: "Exclusive sponsorship in our weekly developer newsletter",
      price: "From $800/week",
      emailSubject: "Newsletter Sponsorship Inquiry",
      emailBody: "Hi Glen,\n\nI'm interested in sponsoring your weekly developer newsletter on AgentDropkit.\n\nHere are some details about my advertising needs:\n\nCompany/Product Name: [Your company name]\nBrief Description: [What you're promoting]\nTarget Message: [Key message you want to convey]\nPreferred Weeks: [How many weeks or which weeks?]\nBudget: [Your budget]\n\nI'd appreciate learning more about your newsletter reach and available sponsorship slots.\n\nBest regards,\n[Your Name]\n[Your Company]\n[Your Email]"
    },
    {
      id: "banner-ads",
      title: "Banner Ads",
      description: "Strategic banner placement across high-traffic pages",
      price: "From $300/month",
      emailSubject: "Banner Advertising Inquiry",
      emailBody: "Hi Glen,\n\nI'm interested in placing banner advertisements on AgentDropkit.\n\nHere are my advertising requirements:\n\nCompany/Product: [Your company/product name]\nAd Creative: [Do you have banners ready or need help creating them?]\nTarget Pages: [Specific pages you'd like to target, if any]\nCampaign Duration: [How long you'd like to run the campaign]\nBudget: [Your monthly budget]\n\nI'd love to discuss banner specifications, placement options, and performance metrics.\n\nBest regards,\n[Your Name]\n[Your Company]\n[Your Email]"
    },
    {
      id: "sponsored-content",
      title: "Sponsored Content",
      description: "Native skill recommendations and custom content",
      price: "Custom Pricing",
      emailSubject: "Sponsored Content Inquiry",
      emailBody: "Hi Glen,\n\nI'm interested in creating sponsored content for AgentDropkit.\n\nHere's what I have in mind:\n\nContent Type: [Blog post, skill showcase, case study, etc.]\nTopic/Focus: [What would the content be about?]\nGoal: [Brand awareness, lead generation, education, etc.]\nTarget Audience: [Who should this content reach?]\nTimeline: [When do you need this published?]\nBudget Range: [Your budget for this project]\n\nI'd love to discuss content ideas, format options, and pricing.\n\nBest regards,\n[Your Name]\n[Your Company]\n[Your Email]"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentBannerIndex((prev) => (prev + 1) % bannerAds.length);
        setIsAnimating(false);
      }, 300);
    }, 10000);

    return () => clearInterval(interval);
  }, [bannerAds.length]);

  const getMailtoLink = (adType) => {
    const subject = encodeURIComponent(adType.emailSubject);
    const body = encodeURIComponent(adType.emailBody);
    return `mailto:bonyuglen@gmail.com?subject=${subject}&body=${body}`;
  };

  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText('bonyuglen@gmail.com');
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-8 py-8 md:py-16 bg-bg-base min-h-screen">
      {/* Hero Section */}
      <div className="text-center mb-16 md:mb-24">
        <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-text-primary mb-6 md:mb-8 leading-tight">
          Reach 50k+ developers building with Claude
        </h1>
        <p className="text-lg sm:text-xl text-text-muted mb-8 md:mb-12 max-w-3xl mx-auto leading-relaxed">
          Connect with highly engaged developers actively building AI-powered applications and automating their workflows
        </p>
        <a
          href="#contact"
          className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-white font-bold uppercase tracking-widest border-2 border-text-primary shadow-[4px_4px_0px_0px_var(--color-text-primary)] hover:shadow-[2px_2px_0px_0px_var(--color-text-primary)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          Start Advertising
        </a>
      </div>

      {/* Audience Stats */}
      <div className="grid md:grid-cols-2 gap-8 mb-16 md:mb-24">
        <div className="bg-bg-card border border-border p-6 md:p-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6 border-b border-border pb-2">
            Developer Reach
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-dashed border-border">
              <div className="text-text-primary font-bold">
                Monthly Active Developers
              </div>
              <span className="text-2xl font-bold">52k</span>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-dashed border-border">
              <div className="text-text-primary font-bold">
                Skill Downloads
              </div>
              <span className="text-2xl font-bold">180k/mo</span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="text-text-primary font-bold">
                Weekly Active Users
              </div>
              <span className="text-2xl font-bold">28k</span>
            </div>
          </div>
        </div>

        <div className="bg-bg-card border border-border p-6 md:p-8">
          <h3 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-6 border-b border-border pb-2">
            Engagement Quality
          </h3>
          <div className="space-y-6">
            <div className="flex items-center justify-between py-4 border-b border-dashed border-border">
              <div className="text-text-primary font-bold">
                Avg Session Time
              </div>
              <span className="text-2xl font-bold">12min</span>
            </div>

            <div className="flex items-center justify-between py-4 border-b border-dashed border-border">
              <div className="text-text-primary font-bold">
                Return Visitors
              </div>
              <span className="text-2xl font-bold">68%</span>
            </div>

            <div className="flex items-center justify-between py-4">
              <div className="text-text-primary font-bold">
                Engagement Rate
              </div>
              <span className="text-2xl font-bold">45%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Ad Examples & Options */}
      <div className="mb-16 md:mb-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8 md:mb-12 text-center">
          Advertising Examples & Options
        </h2>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Side - Examples */}
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-8">How Your Ads Will Look</h3>
            <div className="space-y-8">
              {/* Floating Banner Example */}
              <div>
                <h4 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Floating Banner</h4>
                <div className="bg-bg-card border-2 border-border p-6 overflow-hidden">
                  <div
                    className={`transition-transform duration-300 ease-in-out ${isAnimating ? 'transform translate-y-full opacity-0' : 'transform translate-y-0 opacity-100'
                      }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 ${bannerAds[currentBannerIndex].color} text-white flex items-center justify-center border-2 border-text-primary`}>
                        {bannerAds[currentBannerIndex].icon}
                      </div>
                      <div className="flex-1">
                        <h5 className="text-lg font-bold text-text-primary mb-1">{bannerAds[currentBannerIndex].title}</h5>
                        <p className="text-text-muted text-sm">{bannerAds[currentBannerIndex].description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pinned Card Example */}
              <div>
                <h4 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">Pinned Card</h4>
                <div className="bg-bg-card border-2 border-border p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-600 text-white flex items-center justify-center border-2 border-text-primary">
                      <IconCode size="30px" strokeWidth={3} />
                    </div>
                    <div className="flex-1">
                      <h5 className="text-lg font-bold text-text-primary mb-1">DevXperience: Team Analytics</h5>
                      <p className="text-text-muted text-sm">Track developer productivity, code quality metrics, and team collaboration...</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* In-Feed Card Example */}
              <div>
                <h4 className="text-sm font-bold text-text-muted uppercase tracking-widest mb-4">In-Feed Card</h4>
                <div className="bg-bg-card border-2 border-border p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h5 className="text-xl font-bold text-text-primary mb-2">CloudFlow: Instant Deployments</h5>
                      <p className="text-text-muted leading-relaxed">
                        Deploy your apps to production in seconds with automatic scaling, rollbacks, and monitoring.
                        Supports Docker, Node.js, Python, and static sites. Free tier includes 10GB bandwidth.
                      </p>
                    </div>
                    <div className="w-12 h-12 bg-blue-500 text-white flex items-center justify-center shrink-0 border-2 border-text-primary ml-4">
                      <IconCloudShowers size="30px" strokeWidth={3} />
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="bg-accent/10 text-accent px-3 py-1 text-xs font-bold uppercase tracking-widest border border-accent">
                      sponsored
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Options */}
          <div>
            <h3 className="text-xl font-bold text-text-primary mb-8">Available Ad Types</h3>
            <div className="grid grid-cols-1 gap-6">
              {adTypes.map((adType) => (
                <div
                  key={adType.id}
                  onClick={() => setSelectedAdType(adType.id)}
                  className={`cursor-pointer border-2 p-6 hover:-translate-y-1 hover:-translate-x-1 hover:shadow-[4px_4px_0px_0px_var(--color-text-primary)] transition-all duration-200 ${selectedAdType === adType.id
                    ? 'bg-accent/10 border-accent shadow-[4px_4px_0px_0px_var(--color-accent)]'
                    : 'bg-bg-card border-border'
                    }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold text-text-primary">{adType.title}</h3>
                    {selectedAdType === adType.id && (
                      <svg className="w-5 h-5 text-accent shrink-0" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    )}
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed mb-4">{adType.description}</p>
                  <div className="text-accent font-bold text-sm uppercase tracking-widest">{adType.price}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>


      {/* Why Advertise Here */}
      <div className="mb-16 md:mb-24">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-8 md:mb-12 text-center">
          Why Advertise on AgentDropkit
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              {mounted && resolvedTheme === 'dark' ? (
                <IconUsersDark size="40px" strokeWidth={3} />
              ) : (
                <IconUsers size="40px" strokeWidth={3} />
              )}
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Quality Audience</h3>
            <p className="text-text-muted text-sm">Professional developers building production applications</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              {mounted && resolvedTheme === 'dark' ? (
                <IconMouse2Dark size="40px" strokeWidth={3} />
              ) : (
                <IconMouse2 size="40px" strokeWidth={3} />
              )}
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">High Engagement</h3>
            <p className="text-text-muted text-sm">45% engagement rate with 12-minute average sessions</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              {mounted && resolvedTheme === 'dark' ? (
                <IconTreeDark size="40px" strokeWidth={3} />
              ) : (
                <IconTree size="40px" strokeWidth={3} />
              )}
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Growing Fast</h3>
            <p className="text-text-muted text-sm">150% YoY growth with expanding developer community</p>
          </div>

          <div className="text-center">
            <div className="flex justify-center mb-4">
              {mounted && resolvedTheme === 'dark' ? (
                <IconTerminalDark size="40px" strokeWidth={3} />
              ) : (
                <IconTerminal size="40px" strokeWidth={3} />
              )}
            </div>
            <h3 className="text-lg font-bold text-text-primary mb-2">Technical Focus</h3>
            <p className="text-text-muted text-sm">Developers actively seeking automation and AI tools</p>
          </div>
        </div>

      </div>

      {/* Contact Section */}
      <div id="contact" className="bg-bg-card border-2 border-border p-8 md:p-12 text-center">
        <h2 className="text-2xl sm:text-3xl font-bold text-text-primary mb-4">
          Ready to Start Advertising?
        </h2>
        <p className="text-text-muted text-lg mb-8 max-w-2xl mx-auto">
          {selectedAdType ? (
            <>
              You've selected <strong className="text-accent">{adTypes.find(ad => ad.id === selectedAdType)?.title}</strong>.
              Click the button below to start a conversation with a pre-filled email template.
            </>
          ) : (
            "Select an ad type above, then get in touch to discuss your goals and create a custom campaign that drives results."
          )}
        </p>

        <div className="flex flex-col gap-6 justify-center items-center">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            {selectedAdType ? (
              <a
                href={getMailtoLink(adTypes.find(ad => ad.id === selectedAdType))}
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-white font-bold uppercase tracking-widest border-2 border-text-primary shadow-[4px_4px_0px_0px_var(--color-text-primary)] hover:shadow-[2px_2px_0px_0px_var(--color-text-primary)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <IconEnvelopePlus size="20px" strokeWidth={3} />
                Email Us About {adTypes.find(ad => ad.id === selectedAdType)?.title}
              </a>
            ) : (
              <a
                href="mailto:bonyuglen@gmail.com?subject=AgentDropkit Advertising Inquiry&body=Hi Glen,%0D%0A%0D%0AI'm interested in advertising on AgentDropkit.%0D%0A%0D%0A[Please describe what you'd like to advertise and your goals]%0D%0A%0D%0ABest regards,%0D%0A[Your Name]"
                className="inline-flex items-center gap-3 px-8 py-4 bg-accent text-white font-bold uppercase tracking-widest border-2 border-text-primary shadow-[4px_4px_0px_0px_var(--color-text-primary)] hover:shadow-[2px_2px_0px_0px_var(--color-text-primary)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <IconEnvelopePlus size="20px" strokeWidth={3} />
                Email Us
              </a>
            )}
          </div>

          <div className="flex items-center gap-2 justify-center font-mono text-sm mt-4">
            <span className="text-text-primary font-bold">bonyuglen@gmail.com</span>
            <button
              onClick={handleCopyEmail}
              className="p-1 hover:bg-bg-surface transition-colors"
              title={copiedEmail ? "Copied!" : "Copy email"}
            >
              {copiedEmail ? (
                <svg className="w-4 h-4 text-green" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-text-muted hover:text-text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
                  <path d="m4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </svg>
              )}
            </button>
          </div>

          <div className="text-text-muted text-sm font-mono">
            We respond within 24 hours
          </div>
        </div>
      </div>
    </div>
  );
}