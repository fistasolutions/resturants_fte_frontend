"use client";

import type { ReactNode } from "react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { compactMoney, flagLabel } from "@/lib/finance";
import { cn } from "@/lib/utils";
import type { BillFlag, WeekVerdict } from "@/types/finance";

/**
 * The few shapes every Finance Oversight tab is built from (SPEC-301), so eight tabs read
 * as one page: the app's compact tile scale (the KpiStrip's), one section card, the flag
 * and verdict chips. Presentational only — every figure arrives computed.
 */

export const LABEL =
  "truncate text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground";
export const VALUE = "truncate text-lg font-bold leading-tight tracking-tight tabular-nums";
export const TILE =
  "block min-w-0 rounded-xl border border-border bg-card px-3 py-2 text-left outline-none transition-colors";
export const TILE_LINK = "hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring";
export const TILE_ON = "border-foreground ring-1 ring-foreground";
export const SUB = "block truncate text-[11px] leading-snug text-muted-foreground";

/** Header cells: right-aligned for figures, left for words — the column's own alignment. */
export const TH =
  "border-b border-border px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap text-muted-foreground";
export const TD = "px-3 py-2 whitespace-nowrap";
export const NUM = "text-right tabular-nums";

export function Tile({
  label,
  value,
  sub,
  tone,
  href,
  active,
  children,
}: {
  label: string;
  value: ReactNode;
  sub?: ReactNode;
  tone?: "bad" | "warn" | "good" | null;
  href?: string;
  active?: boolean;
  children?: ReactNode;
}) {
  const body = (
    <>
      <span className={cn(LABEL, "block")}>{label}</span>
      <span
        className={cn(
          VALUE,
          "block",
          tone === "bad" && "text-destructive",
          tone === "warn" && "text-warning",
          tone === "good" && "text-success",
        )}
      >
        {value}
      </span>
      {children}
      {sub != null && <span className={SUB}>{sub}</span>}
    </>
  );
  if (!href) return <div className={TILE}>{body}</div>;
  return (
    <ShallowLink
      href={href}
      aria-current={active ? "true" : undefined}
      className={cn(TILE, TILE_LINK, active && TILE_ON)}
    >
      {body}
    </ShallowLink>
  );
}

export function Section({
  title,
  meta,
  actions,
  children,
  className,
  id,
}: {
  title: string;
  meta?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section
      id={id}
      data-slot="card"
      className={cn("relative min-w-0 overflow-hidden rounded-card border border-border bg-card", className)}
    >
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 border-b border-border px-3 py-2">
        <h2 className="text-[11px] font-extrabold uppercase tracking-widest text-foreground">{title}</h2>
        {meta != null && <span className="text-[11px] text-muted-foreground tabular-nums">{meta}</span>}
        {actions != null && <span className="ml-auto flex flex-wrap items-center gap-2">{actions}</span>}
      </div>
      {children}
    </section>
  );
}

const FLAG_TONE: Record<"bad" | "warn" | "ai" | "good", StatusTone> = {
  bad: "destructive",
  warn: "warning",
  ai: "ai",
  good: "success",
};

export function FlagChips({ flags, amount }: { flags: BillFlag[]; amount: number }) {
  if (!flags.length) return null;
  return (
    <span className="inline-flex flex-wrap gap-1">
      {flags.map((flag, i) => {
        const label = flagLabel(flag, amount);
        return (
          <StatusBadge key={`${flag.kind}-${i}`} tone={FLAG_TONE[label.tone]}>
            {label.text}
          </StatusBadge>
        );
      })}
    </span>
  );
}

const VERDICT: Record<WeekVerdict, { tone: StatusTone; text: (left: number | null) => string }> = {
  short: { tone: "destructive", text: (left) => `Short ${compactMoney(Math.abs(left ?? 0))} this week` },
  tight: { tone: "warning", text: (left) => `Tight · ${compactMoney(left ?? 0)} left` },
  covered: { tone: "success", text: (left) => `Covered · ${compactMoney(left ?? 0)} left` },
  no_bank: { tone: "neutral", text: () => "No bank account in QuickBooks" },
};

export function VerdictChip({ verdict, left }: { verdict: WeekVerdict; left: number | null }) {
  const v = VERDICT[verdict];
  return <StatusBadge tone={v.tone}>{v.text(left)}</StatusBadge>;
}

/** A thin share bar, token-coloured. `parts` are [width %, colour class]. */
export function ShareBar({ parts, className }: { parts: [number, string][]; className?: string }) {
  return (
    <span className={cn("flex h-1 overflow-hidden rounded-full bg-muted", className)} aria-hidden>
      {parts.map(([width, colour], i) => (
        <span key={i} className={cn("block h-full", colour)} style={{ width: `${Math.max(0, Math.min(100, width))}%` }} />
      ))}
    </span>
  );
}

/** Each aging band's colours; `cell` tints a heat-grid cell, `strong` the heaviest ones. */
export const AGING_TONE: Record<string, { bar: string; text: string; cell: string; strong: string }> = {
  current: { bar: "bg-success", text: "text-success", cell: "bg-success/10", strong: "bg-success/20" },
  "1-30": { bar: "bg-warning", text: "text-warning", cell: "bg-warning/10", strong: "bg-warning/25" },
  "31-60": { bar: "bg-destructive/70", text: "text-destructive", cell: "bg-destructive/10", strong: "bg-destructive/20" },
  "61-90": { bar: "bg-destructive", text: "text-destructive", cell: "bg-destructive/15", strong: "bg-destructive/25" },
  "90+": { bar: "bg-destructive", text: "text-destructive", cell: "bg-destructive/20", strong: "bg-destructive/30" },
};

export function EmptyLine({ children }: { children: ReactNode }) {
  return <p className="px-3 py-10 text-center text-sm text-muted-foreground">{children}</p>;
}
