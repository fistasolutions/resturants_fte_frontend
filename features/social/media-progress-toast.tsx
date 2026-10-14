"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Loader2, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { mediaProgressLabel } from "@/lib/social-media";

const HOST_ID = "media-toast-host";

const NEVER_CHANGES = () => () => {};

/**
 * The ONE place every media toast is rendered (SPEC-178 patch).
 *
 * The Studio mounts a `PostDetail` per draft, so Instagram and Facebook are two
 * independent panels. Each rendering its own `fixed top-4 right-4` box put both
 * in the same pixel position, and the owner watched one apparent job flip
 * between "Generation failed" and "Writing the script…" — it was two jobs, two
 * toasts, one corner.
 *
 * So every toast portals into one flex column declared in `app/(app)/layout.tsx`.
 * Any number stack instead of overlapping, without needing a provider above two
 * sibling components.
 */
function useToastHost(): HTMLElement | null {
  // The host only exists in the browser, so the portal has to wait for mount —
  // via the store rather than a setState-in-effect, which cascades a render.
  const mounted = useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
  return mounted ? document.getElementById(HOST_ID) : null;
}

export function MediaProgressToast({
  title,
  channel,
  status,
  stage,
  error,
  onDismiss,
}: {
  /** What is being made — "Reel" or "Image". */
  title: string;
  /** Which channel this job belongs to. With two panels running at once the
   * owner cannot otherwise tell which toast is which. */
  channel?: string | null;
  status: string;
  stage?: string | null;
  error?: string | null;
  onDismiss: () => void;
}) {
  const host = useToastHost();
  const done = status === "ready";
  const failed = status === "failed";

  if (!host) return null; // nothing to portal into until the client has mounted

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl border bg-card p-3 shadow-lg",
        failed ? "border-destructive/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-2.5">
        {failed ? (
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" aria-hidden />
        ) : done ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        ) : (
          <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-muted-foreground" aria-hidden />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold">
            {title}
            {channel && (
              <span className="font-normal text-muted-foreground"> · {channel}</span>
            )}
          </p>
          <p
            className={cn(
              "mt-0.5 text-xs break-words",
              failed ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {mediaProgressLabel(status, stage, error)}
          </p>
        </div>
        {/* Only dismissible once it has landed — a running job's toast is the
            only place its progress is reported, so it must not be closable into
            silence. */}
        {(done || failed) && (
          <Button
            variant="ghost"
            size="icon"
            className="size-6 shrink-0"
            onClick={onDismiss}
            aria-label={`Dismiss ${channel ?? title} status`}
          >
            <X className="size-3.5" aria-hidden />
          </Button>
        )}
      </div>
    </div>,
    host,
  );
}
