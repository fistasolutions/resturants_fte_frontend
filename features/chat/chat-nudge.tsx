"use client";

import Link from "next/link";
import { ArrowUpRight, X } from "lucide-react";

import { splitLine } from "@/lib/nudge";
import { cn } from "@/lib/utils";
import type { Nudge } from "@/types/nudge";
import { GlispIcon } from "@/components/shared/glisp-icon";

interface ChatNudgeCardProps {
  nudge: Nudge;
  onExplain: () => void;
  onDismiss: () => void;
  className?: string;
}

/**
 * The nudge card (SPEC-246): one line worth a look on this page, above the Ask Glisp
 * pill. Everything in it was computed by the backend; Explain hands the figure to
 * the analyst, Not now puts it away until the figure changes.
 */
export function ChatNudgeCard({ nudge, onExplain, onDismiss, className }: ChatNudgeCardProps) {
  const [before, figure, after] = splitLine(nudge);
  return (
    <aside
      role="status"
      aria-label={`Worth a look on ${nudge.page}`}
      data-nudge
      className={cn(
        "w-[340px] max-w-[calc(100vw-3rem)] rounded-card border bg-card p-3.5 text-card-foreground shadow-md",
        className,
      )}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-widest text-ai uppercase">
          <GlispIcon className="size-3" aria-hidden />
          Worth a look · {nudge.page}
        </span>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={onDismiss}
          className="inline-flex size-6 items-center justify-center rounded-md text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="size-3.5" aria-hidden />
        </button>
      </div>
      <p className="mb-2.5 text-sm leading-relaxed text-foreground">
        {before}
        {figure && <b className="font-semibold">{figure}</b>}
        {after}
      </p>
      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onExplain}
          className="rounded-md border border-ai/35 bg-ai/10 px-3 py-1.5 text-xs font-semibold text-ai outline-none transition-colors hover:bg-ai/20 focus-visible:ring-2 focus-visible:ring-ring"
        >
          {nudge.action}
        </button>
        {nudge.href && (
          // SPEC-262: the page behind the figure, one click away.
          <Link
            href={nudge.href}
            onClick={onDismiss}
            className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1.5 text-xs font-medium outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            data-nudge-open
          >
            Open
            <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        )}
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-md px-2.5 py-1.5 text-xs text-muted-foreground outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          Not now
        </button>
        <span className="ml-auto text-[10.5px] text-muted-foreground">
          {nudge.page === "Watchlist" ? "your watch" : "from the analytics engine"}
        </span>
      </div>
    </aside>
  );
}

/** The dot on a trigger: `--ai`, ringed with the surface it sits on. */
export function NudgeDot({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      data-nudge-dot
      className={cn("absolute size-3 rounded-full bg-ai ring-2 ring-background", className)}
    />
  );
}
