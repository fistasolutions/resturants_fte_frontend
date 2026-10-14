"use client";

import { useState } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";

import { connectReason } from "@/lib/connect-reasons";

export type MetaReturnState = "connected" | "error" | "cancelled";

/**
 * Return banner for the Meta connect flow (backend SPEC-179). The callback route
 * redirects to `/integrations/meta?tab=settings&meta=connected|error|cancelled` (SPEC-328); the server page
 * passes that value here. Dismissible; renders nothing otherwise.
 *
 * `cancelled` is its own, neutral state on purpose: backing out of Meta's consent
 * screen is a normal choice, and dressing it up as an error would read as though
 * something broke.
 */
export function MetaConnectBanner({
  state,
  reason = null,
}: {
  state: MetaReturnState;
  /** `?reason=` — why the backend refused the connect (SPEC-336); only a known code shows. */
  reason?: string | null;
}) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  const refused = state === "error" ? connectReason(reason) : null;

  const tone =
    state === "connected" ? "success" : state === "cancelled" ? "muted" : "destructive";
  const Icon =
    state === "connected" ? CheckCircle2 : state === "cancelled" ? Info : TriangleAlert;

  const shell =
    tone === "success"
      ? "border-success/30 bg-success/10"
      : tone === "muted"
        ? "border-border bg-muted/50"
        : "border-destructive/30 bg-destructive/10";
  const iconTone =
    tone === "success"
      ? "text-success"
      : tone === "muted"
        ? "text-muted-foreground"
        : "text-destructive";

  const title =
    state === "connected"
      ? "Instagram & Facebook connected"
      : state === "cancelled"
        ? "Connection cancelled"
        : (refused?.title ?? "Couldn’t connect Instagram & Facebook");
  const detail =
    state === "connected"
      ? "Approved posts can now publish from here."
      : state === "cancelled"
        ? "You backed out of Meta’s permission screen. Nothing changed."
        : (refused?.detail ?? "The connection failed. Please try connecting again.");

  return (
    <div role="status" className={`flex items-start gap-3 rounded-card border p-4 ${shell}`}>
      <Icon className={`mt-0.5 size-4 shrink-0 ${iconTone}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss"
        className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
      >
        <X className="size-4" aria-hidden />
      </button>
    </div>
  );
}
