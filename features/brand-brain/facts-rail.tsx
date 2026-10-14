"use client";

import { cn } from "@/lib/utils";
import type { SectionStat } from "@/lib/brand-brain";
import { formatNumber } from "@/utils/format";

/**
 * The section rail beside the facts (SPEC-274): every section in order with its
 * count and a pending badge; a click scrolls to the group. Sticky on wide screens.
 */
export function FactsRail({ stats, active, rejected, onJump }: { stats: SectionStat[]; active: string | null; rejected: number; onJump: (section: string) => void }) {
  return (
    <nav aria-label="Sections" className="self-start rounded-card border border-border bg-card p-2 xl:sticky xl:top-4 xl:max-h-[calc(100vh-2rem)] xl:overflow-y-auto">
      <p className="px-2 pt-1 pb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">Sections</p>
      <ul className="space-y-0.5">
        {stats.map((s) => (
          <li key={s.section}>
            <button
              type="button"
              onClick={() => onJump(s.section)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                active === s.section && "bg-accent font-medium",
              )}
            >
              <span className="min-w-0 flex-1 truncate">{s.label}</span>
              {s.pending > 0 ? <span className="rounded-full bg-warning px-1.5 text-[10px] font-bold text-warning-foreground tabular-nums">{formatNumber(s.pending)}</span> : null}
              <span className={cn("text-[11px] tabular-nums", s.count === 0 ? "text-warning" : "text-muted-foreground")}>{s.count === 0 ? "empty" : formatNumber(s.count)}</span>
            </button>
          </li>
        ))}
        {rejected > 0 ? (
          <li>
            <button type="button" onClick={() => onJump("rejected")} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] text-muted-foreground outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring">
              <span className="flex-1">Rejected</span>
              <span className="text-[11px] tabular-nums">{formatNumber(rejected)}</span>
            </button>
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
