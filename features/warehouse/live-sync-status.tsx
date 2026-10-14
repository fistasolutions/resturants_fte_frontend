"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

function relative(iso: string | null): string {
  if (!iso) return "not synced yet";
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (mins < 1) return "synced just now";
  if (mins < 60) return `synced ${mins} min ago`;
  const hrs = Math.round(mins / 60);
  return `synced ${hrs} h ago`;
}

/**
 * Live-sync indicator for the Warehouse page (SPEC-097). When the selected range
 * includes today, the backend re-syncs iPacky every 15 min; this shows a "Live"
 * badge + relative last-sync, and soft-refreshes the route every 90s so the
 * dashboard stays current without a manual reload.
 */
export function LiveSyncStatus({ lastSync, live }: { lastSync: string | null; live: boolean }) {
  const router = useRouter();

  useEffect(() => {
    if (!live) return;
    const id = setInterval(() => router.refresh(), 90_000);
    return () => clearInterval(id);
  }, [live, router]);

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {live && (
        <span className="inline-flex items-center gap-1.5 font-medium text-success">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-success/70" />
            <span className="relative inline-flex size-2 rounded-full bg-success" />
          </span>
          Live · updates every 15 min
        </span>
      )}
      <span>iPacky {relative(lastSync)}</span>
    </div>
  );
}
