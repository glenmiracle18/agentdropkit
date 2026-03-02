"use client";

import { useState } from "react";

interface InstallCommandProps {
  command: string;
  slug: string;
}

export default function InstallCommand({ command, slug }: InstallCommandProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setCopied(true);
      
      // Track install
      fetch('/api/track-install', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug }),
      });

      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="bg-bg-surface border border-border rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-text-primary font-semibold">Install Command</h3>
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-accent text-bg-deep rounded-sm font-medium hover:bg-accent/90 transition-colors"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      
      <code className="block bg-bg-inset border border-border rounded p-4 text-accent font-mono text-sm overflow-x-auto">
        {command}
      </code>
      
      <p className="text-text-dim text-sm mt-3">
        Run this command in your terminal to install the skill.
      </p>
    </div>
  );
}