"use client";

import { AlertTriangle, KeyRound, RotateCw, SearchX, Store, WifiOff } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { ErrorKind, ErrorPresentation } from "@/lib/error-boundary";

const ICONS: Record<ErrorKind, typeof AlertTriangle> = {
  store: Store,
  session: KeyRound,
  offline: WifiOff,
  missing: SearchX,
  unknown: AlertTriangle,
};

interface ErrorStateProps {
  presentation: ErrorPresentation;
  /** Next's error digest — the only honest link to the server log (SPEC-227). */
  reference?: string | null;
  onRetry?: () => void;
}

/**
 * The one failure panel every boundary renders (SPEC-227).
 *
 * Semantic tokens only and no entrance animation (root Rule 9). Destructive, not
 * brand: `--brand` is identity, and tinting a failure with it would collide with
 * the token that means "this went wrong".
 */
export function ErrorState({ presentation, reference, onRetry }: ErrorStateProps) {
  const Icon = ICONS[presentation.kind];
  const showRetry = presentation.retryable && onRetry !== undefined;
  // SPEC-342: no store yet is a step to take, not a failure — drawn calm, not red.
  const calm = presentation.kind === "store";

  return (
    <div
      role={calm ? "status" : "alert"}
      className={cn(
        "mx-auto flex w-full max-w-lg flex-col items-center gap-3 rounded-2xl border p-8 text-center",
        calm ? "border-border bg-card" : "border-destructive/25 bg-destructive/5",
      )}
    >
      <Icon
        className={cn("size-7", calm ? "text-muted-foreground" : "text-destructive")}
        aria-hidden
      />

      <h2 className="font-heading text-xl tracking-wide">{presentation.title}</h2>
      <p className="text-sm text-muted-foreground">{presentation.body}</p>

      <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
        {showRetry && (
          <Button onClick={onRetry}>
            <RotateCw className="size-4" aria-hidden />
            Try again
          </Button>
        )}
        {presentation.href && (
          <Button asChild variant={showRetry ? "outline" : "default"}>
            <Link href={presentation.href}>{presentation.hrefLabel}</Link>
          </Button>
        )}
      </div>

      {reference && (
        // Never the message and never a stack (root Rule 6) — the digest alone,
        // so a report can be matched to what the server actually logged.
        <p className="mt-1 text-xs text-muted-foreground">
          Reference{" "}
          <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono">
            {reference}
          </code>
        </p>
      )}
    </div>
  );
}
