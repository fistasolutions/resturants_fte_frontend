"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { AlertTriangle, CheckCircle2, LoaderCircle, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { elapsedLabel, progressLine, toastHref } from "@/lib/generation";

import { useGeneration } from "./generation-provider";

const HOST_ID = "media-toast-host";
const NEVER_CHANGES = () => () => {};

/** The shared top-right toast column declared once in the app layout.
 *
 * SPEC-178 created it precisely so two features do not each plant their own `fixed`
 * box in the same corner and overlap. The social media toasts portal here; so does
 * this. The host only exists in the browser, so the portal waits for mount — via the
 * store rather than a setState-in-effect, which cascades a render. */
function useToastHost(): HTMLElement | null {
  const mounted = useSyncExternalStore(
    NEVER_CHANGES,
    () => true,
    () => false,
  );
  return mounted ? document.getElementById(HOST_ID) : null;
}

/**
 * The live generation indicator (SPEC-216) — fixed top right, on every page.
 *
 * Before backend SPEC-224 this could not exist: generation ran inside the request, so
 * leaving the page killed it. Now the run outlives the page, and this is how the owner
 * knows that — and how they get back to it.
 *
 * No entrance animation (root Rule 9); the only motion is the spinner, which is
 * reporting something real.
 */
export function GenerationToast() {
  const { job, dismissed, dismiss } = useGeneration();
  // SPEC-293: on Spotlight's Chat tab the run already has a card in the thread —
  // two live reports of one job in one view is noise, not reassurance.
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const onEmployeeChat = pathname === "/spotlight" && searchParams.get("tab") === "chat";
  const [now, setNow] = useState(() => new Date());

  // Only ticks while something is running.
  useEffect(() => {
    if (job?.status !== "running") return;
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, [job?.status]);

  const host = useToastHost();

  if (!job || dismissed || !host || onEmployeeChat) return null;

  const running = job.status === "running";
  const failed = job.status === "failed";

  // Portalled into the shared host, NOT a `fixed` box of its own — SPEC-178's whole
  // reason for that host was to stop two features stacking in the same corner.
  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-card p-3 shadow-lg",
        failed ? "border-destructive/40" : "border-border",
      )}
    >
      <span className="mt-0.5 shrink-0">
        {running && <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />}
        {job.status === "succeeded" && (
          <CheckCircle2 className="size-4 text-success" aria-hidden />
        )}
        {failed && <AlertTriangle className="size-4 text-destructive" aria-hidden />}
      </span>

      <Link href={toastHref(job)} className="min-w-0 flex-1" onClick={() => dismiss()}>
        <p className="flex items-center gap-2 text-sm font-medium text-foreground">
          {running ? "Writing your blog" : failed ? "Generation failed" : "Draft ready"}
          {running && (
            <span className="text-xs font-normal tabular-nums text-muted-foreground">
              {elapsedLabel(job.startedAt, now)}
            </span>
          )}
        </p>
        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
          {progressLine(job)}
        </p>
        {running && (
          <p className="mt-1 text-xs text-muted-foreground">
            Keep working — this carries on in the background.
          </p>
        )}
      </Link>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Hide"
        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>,
    host,
  );
}
