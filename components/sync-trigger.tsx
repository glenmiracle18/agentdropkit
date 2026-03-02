"use client";

import { useState } from "react";

interface SyncResult {
  success: boolean;
  synced: number;
  errors: number;
  total: number;
}

export default function SyncTrigger() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SyncResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/admin/sync", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Sync failed");
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sync");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <button
        onClick={handleSync}
        disabled={isLoading}
        className="px-4 py-2 bg-accent text-bg-deep font-medium rounded-sm hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isLoading ? "Syncing..." : "Trigger Sync"}
      </button>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-sm">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {result && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-sm">
          <h3 className="text-green-400 font-medium mb-2">Sync Completed</h3>
          <div className="text-sm text-text-secondary space-y-1">
            <p>• Total listings: {result.total}</p>
            <p>• Successfully synced: {result.synced}</p>
            <p>• Errors: {result.errors}</p>
          </div>
        </div>
      )}

      <div className="text-xs text-text-dim">
        <p>Last sync updates:</p>
        <ul className="mt-1 space-y-1">
          <li>• GitHub stars and forks</li>
          <li>• Repository issues count</li>
          <li>• Primary language</li>
          <li>• NPM download statistics (when applicable)</li>
          <li>• Recent commit activity</li>
        </ul>
      </div>
    </div>
  );
}