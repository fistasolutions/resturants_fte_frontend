import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The panel-and-rows vocabulary (SPEC-231, shared in SPEC-233). Every section of a
 * compact page is one `Panel` — a compact uppercase header, then `PanelRow`s divided
 * by hairlines — so sections cannot drift apart and nothing nests a card in a card.
 * The Brief and the Dashboard both compose from these three.
 */

interface PanelProps {
  title: string;
  /** Small count beside the title — "3", "5 of 9 checks fired", "6/6 live". */
  count?: string;
  /** Right-aligned header content — a link, a timestamp. */
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Classes for the body under the header — a panel that fills a flex column and
   * scrolls its rows (SPEC-287) passes `min-h-0 flex-1 overflow-y-auto` here. */
  bodyClassName?: string;
}

export function Panel({ title, count, aside, children, className, bodyClassName }: PanelProps) {
  return (
    <section className={cn("overflow-hidden rounded-2xl border border-border bg-card", className)}>
      <div className="flex min-h-10 flex-wrap items-center gap-x-3 gap-y-1 border-b border-border px-4 py-2">
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
          {title}
        </h2>
        {count ? (
          <span className="text-[11px] font-semibold tabular-nums text-muted-foreground/70">
            {count}
          </span>
        ) : null}
        {aside ? (
          <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
            {aside}
          </div>
        ) : null}
      </div>
      <div className={cn("divide-y divide-border", bodyClassName)}>{children}</div>
    </section>
  );
}

interface PanelRowProps {
  /** A status dot or icon, in the left gutter. */
  leading?: ReactNode;
  /** A number or label, right-aligned. */
  trailing?: ReactNode;
  /** Makes the whole row a link. */
  href?: string;
  /** Vertical alignment of the gutters against a multi-line body. */
  align?: "start" | "center";
  children: ReactNode;
  className?: string;
}

export function PanelRow({
  leading,
  trailing,
  href,
  align = "start",
  children,
  className,
}: PanelRowProps) {
  const body = (
    <>
      {leading ? (
        <span className={cn("flex shrink-0", align === "start" ? "pt-1" : "")}>{leading}</span>
      ) : null}
      <div className="min-w-0 flex-1">{children}</div>
      {trailing ? <div className="shrink-0 text-right">{trailing}</div> : null}
    </>
  );
  const rowClass = cn(
    "flex gap-3 px-4 py-3",
    align === "start" ? "items-start" : "items-center",
    className,
  );
  if (href) {
    return (
      <Link
        href={href}
        className={cn(
          rowClass,
          "outline-none transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
        )}
      >
        {body}
      </Link>
    );
  }
  return <div className={rowClass}>{body}</div>;
}

export type DotTone = "ok" | "warn" | "error" | "ai" | "neutral";

const DOT_CLASS: Record<DotTone, string> = {
  ok: "bg-success",
  warn: "bg-warning",
  error: "bg-destructive",
  ai: "bg-ai",
  neutral: "bg-muted-foreground/40",
};

const DOT_LABEL: Record<DotTone, string> = {
  ok: "OK",
  warn: "Warning",
  error: "Error",
  ai: "AI signal",
  neutral: "",
};

/** A 8px status dot; `live` adds the pulsing halo the coverage list has always had. */
export function StatusDot({ tone, live = false }: { tone: DotTone; live?: boolean }) {
  return (
    <span className="relative flex size-2">
      {live ? (
        <span
          className={cn(
            "absolute inline-flex size-full animate-ping rounded-full opacity-60",
            DOT_CLASS[tone],
          )}
        />
      ) : null}
      <span className={cn("relative inline-flex size-2 rounded-full", DOT_CLASS[tone])} />
      {DOT_LABEL[tone] ? <span className="sr-only">{DOT_LABEL[tone]}</span> : null}
    </span>
  );
}
