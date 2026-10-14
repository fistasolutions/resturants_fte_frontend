"use client";

import { ShieldCheck } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { TONE_DOT } from "@/features/integrations/hub/hub-status-pill";
import {
  clockTime,
  healthSegments,
  hubHref,
  type HubFilter,
  type HubLayout,
} from "@/lib/integration-hub";
import { cn } from "@/lib/utils";
import type { HubOverview } from "@/types/integrations";

interface Tile {
  filter: HubFilter;
  label: string;
  count: number;
  note: string;
  dot: string | null;
}

/** The page's summary (SPEC-328): how many apps are connected and how they are doing. Each
 * tile is a link to the Connected tab filtered to it, so the numbers are also the way in. */
export function HealthStrip({
  overview,
  active,
  view,
}: {
  overview: HubOverview;
  /** The filter currently open, or null when another tab is. */
  active: HubFilter | null;
  view: HubLayout;
}) {
  const { summary } = overview;
  const needYou = summary.attention + summary.warning;
  const moving = summary.syncing + summary.pending;
  const tiles: Tile[] = [
    { filter: "all", label: "All connected", count: summary.connected, note: "Everything you have linked", dot: null },
    { filter: "healthy", label: "Healthy", count: summary.healthy, note: "Synced on schedule", dot: TONE_DOT.success },
    {
      filter: "syncing",
      label: "Syncing",
      count: moving,
      note: moving ? "Running or about to" : "Nothing running",
      dot: TONE_DOT.neutral,
    },
    {
      filter: "attention",
      label: "Need you",
      count: needYou,
      note: needYou ? "Fix to keep data fresh" : "All clear",
      dot: needYou ? TONE_DOT.destructive : TONE_DOT.muted,
    },
  ];
  const segments = healthSegments(summary);

  return (
    <section
      aria-label="Connection health"
      className="grid overflow-hidden rounded-2xl border bg-card shadow-xs lg:grid-cols-[minmax(0,1.2fr)_minmax(0,2fr)]"
    >
      <div className="flex flex-col gap-3 border-b p-5 lg:border-r lg:border-b-0">
        <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Connection health
        </p>
        <p className="flex items-baseline gap-2">
          <span className="font-heading text-4xl leading-none tabular-nums">{summary.connected}</span>
          <span className="text-sm text-muted-foreground">
            {summary.connected === 1 ? "app connected" : "apps connected"}
          </span>
        </p>
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          {segments.map((segment) => (
            <span key={segment.tone} className={TONE_DOT[segment.tone]} style={{ width: `${segment.percent}%` }} />
          ))}
        </div>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5" aria-hidden />
          Read-only everywhere · checked {clockTime(overview.checkedAt)}
        </p>
      </div>
      <div className="grid grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile, index) => {
          const on = active === tile.filter;
          return (
            <ShallowLink
              key={tile.filter}
              href={hubHref({ tab: "connected", filter: tile.filter, view })}
              aria-current={on ? "true" : undefined}
              className={cn(
                "relative flex flex-col gap-1.5 p-4 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset md:p-5",
                index % 2 === 0 && "border-r",
                index < 2 && "border-b xl:border-b-0",
                index === 1 && "xl:border-r",
                on && "bg-muted/50 after:absolute after:inset-x-5 after:bottom-0 after:h-0.5 after:rounded-full after:bg-foreground",
              )}
            >
              <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                {tile.dot ? <span className={cn("size-2 rounded-full", tile.dot)} aria-hidden /> : null}
                {tile.label}
              </span>
              <span className="text-2xl leading-none font-semibold tabular-nums">{tile.count}</span>
              <span className="text-xs text-muted-foreground">{tile.note}</span>
            </ShallowLink>
          );
        })}
      </div>
    </section>
  );
}
