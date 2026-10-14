"use client";

import { useState } from "react";
import { CheckCircle2, TriangleAlert, X } from "lucide-react";

import { connectReason } from "@/lib/connect-reasons";

/**
 * Return banner for the Google Search Console connect flow (backend SPEC-119).
 * The callback route redirects to `/integrations/gsc?tab=settings&google=connected|error` (SPEC-328); the
 * server page passes that value here. Dismissible; renders nothing otherwise.
 */
export function GoogleConnectBanner({
  state,
  reason = null,
}: {
  state: "connected" | "error";
  /** `?reason=` — why the backend refused the connect (SPEC-336); only a known code shows. */
  reason?: string | null;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;

  const connected = state === "connected";
  const refused = connected ? null : connectReason(reason);
  const Icon = connected ? CheckCircle2 : TriangleAlert;

  return (
    <div
      role="status"
      className={`flex items-start gap-3 rounded-card border p-4 ${
        connected
          ? "border-success/30 bg-success/10"
          : "border-destructive/30 bg-destructive/10"
      }`}
    >
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${connected ? "text-success" : "text-destructive"}`}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">
          {connected
            ? "Google Search Console connected"
            : (refused?.title ?? "Couldn’t connect Google Search Console")}
        </p>
        <p className="text-xs text-muted-foreground">
          {connected
            ? "Measured reach will appear on the Visibility tab in Search Visibility after the next sync."
            : (refused?.detail ?? "The connection was cancelled or failed. Please try connecting again.")}
        </p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
