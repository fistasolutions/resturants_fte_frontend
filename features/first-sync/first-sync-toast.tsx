"use client";

import { useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, CheckCircle2, Circle, LoaderCircle, X } from "lucide-react";

import { useWorkspace } from "@/features/workspace/workspace-provider";
import { isGuided } from "@/lib/company-switches";
import { toastView } from "@/lib/first-sync";
import { cn } from "@/lib/utils";

import { useFirstSync } from "./first-sync-provider";

const HOST_ID = "media-toast-host";
const NEVER_CHANGES = () => () => {};

function useToastHost(): HTMLElement | null {
  const mounted = useSyncExternalStore(NEVER_CHANGES, () => true, () => false);
  return mounted ? document.getElementById(HOST_ID) : null;
}

/** The first sync's live progress (SPEC-314), in the shared toast host. A guided organization
 * follows it in Setup instead (SPEC-362); a full one keeps this toast. */
export function FirstSyncToast() {
  const { payload, dismissed, dismiss, retry } = useFirstSync();
  const { visibility } = useWorkspace();
  const [retrying, setRetrying] = useState(false);
  const host = useToastHost();
  if (!payload || dismissed || !host || isGuided(visibility)) return null;
  const view = toastView(payload);

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "w-full rounded-xl border bg-card p-3 shadow-lg",
        view.tone === "failed" ? "border-destructive/40" : "border-border",
      )}
    >
      <div className="flex items-start gap-3">
        <span className="mt-0.5 shrink-0">
          {view.tone === "running" ? (
            <LoaderCircle className="size-4 animate-spin text-primary" aria-hidden />
          ) : view.tone === "failed" ? (
            <AlertTriangle className="size-4 text-destructive" aria-hidden />
          ) : (
            <CheckCircle2 className="size-4 text-success" aria-hidden />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{view.title}</p>
          <ul className="mt-2 space-y-1">
            {view.lines.map((line) => (
              <li
                key={line.key}
                className={cn(
                  "flex items-start gap-2 text-xs",
                  line.state === "waiting" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                <span className="mt-0.5 shrink-0">
                  {line.state === "done" ? (
                    <Check className="size-3 text-success" aria-hidden />
                  ) : line.state === "running" ? (
                    <Circle className="size-3 fill-primary text-primary" aria-hidden />
                  ) : (
                    <Circle className="size-3 text-border" aria-hidden />
                  )}
                </span>
                <span className="min-w-0">{line.title}</span>
              </li>
            ))}
          </ul>
          {view.tone === "running" ? (
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-300"
                style={{ width: `${Math.round(view.fraction * 100)}%` }}
              />
            </div>
          ) : null}
          <p className={cn("mt-1.5 text-xs", view.tone === "failed" ? "text-destructive" : "text-muted-foreground")}>
            {view.detail}
          </p>
          {view.tone === "failed" ? (
            <button
              type="button"
              disabled={retrying}
              onClick={async () => {
                setRetrying(true);
                try {
                  await retry();
                } finally {
                  setRetrying(false);
                }
              }}
              className="mt-2 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground outline-none hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60"
            >
              {retrying ? <LoaderCircle className="size-3 animate-spin" aria-hidden /> : null}
              Try again
            </button>
          ) : null}
        </div>
        {view.tone !== "running" ? (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Hide"
            className="shrink-0 rounded-md p-1 text-muted-foreground outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-4" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>,
    host,
  );
}
