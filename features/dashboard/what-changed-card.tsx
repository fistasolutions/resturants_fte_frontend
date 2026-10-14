"use client";

import { ArrowDownRight, ArrowUpRight, ChevronDown } from "lucide-react";
import { useState } from "react";

import { Panel, PanelRow, StatusDot } from "@/components/shared/panel";
import { MOVERS_LIMIT, foldItems, showMoreLabel } from "@/lib/fold";
import { cn } from "@/lib/utils";
import type { RevenueMover, WhatChanged } from "@/types/dashboard";
import { formatCurrency, formatNumber } from "@/utils/format";

function signalTone(signal: string): string {
  if (signal === "Sold out") return "bg-destructive/10 text-destructive";
  if (signal === "Sold cheaper") return "bg-warning/10 text-warning";
  if (signal === "More units sold" || signal === "Sold dearer")
    return "bg-success/10 text-success";
  return "bg-muted text-muted-foreground";
}

function MoverRow({ mover }: { mover: RevenueMover }) {
  const up = mover.delta >= 0;
  return (
    <PanelRow
      leading={<StatusDot tone={up ? "ok" : "error"} />}
      trailing={
        <p
          className={cn(
            "text-sm font-bold tabular-nums",
            up ? "text-success" : "text-destructive",
          )}
        >
          {up ? "+" : "−"}
          {formatCurrency(Math.abs(mover.delta))}
        </p>
      }
    >
      <p className="truncate text-sm font-semibold leading-snug">{mover.title}</p>
      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
        <span>
          {formatNumber(mover.unitsPrev)} → {formatNumber(mover.unitsNow)} units
          {mover.onHand > 0 && ` · ${formatNumber(mover.onHand)} in stock`}
        </span>
        <span className={cn("rounded-md px-1.5 py-0 font-semibold", signalTone(mover.signal))}>
          {mover.signal}
        </span>
      </p>
    </PanelRow>
  );
}

/**
 * Dashboard → What changed, and why (SPEC-190), as a rail panel (SPEC-233): the
 * store's delta in the header, the concentration sentence as the first row, the
 * movers folded at five.
 *
 * A decomposition, not a causal claim: every product's delta sums exactly to the
 * store's delta, which is arithmetic. Each `signal` describes only what was
 * observed — units moved, price moved, stock is zero. "Sold out" is the one that
 * behaves like a cause and it is a fact, not an inference from the revenue drop.
 */
export function WhatChangedCard({ data }: { data: WhatChanged }) {
  const [open, setOpen] = useState(false);
  const { summary, movers } = data;

  if (movers.length === 0) {
    return null;
  }

  const up = summary.totalDelta >= 0;
  const Arrow = up ? ArrowUpRight : ArrowDownRight;
  const { shown, hidden } = foldItems(movers, MOVERS_LIMIT);

  return (
    <Panel
      title="What changed"
      count="vs the previous period"
      aside={
        <span className="flex items-center gap-1.5">
          <Arrow
            className={cn("size-3.5", up ? "text-success" : "text-destructive")}
            aria-hidden
          />
          <span
            className={cn(
              "text-sm font-bold tabular-nums",
              up ? "text-success" : "text-destructive",
            )}
          >
            {up ? "+" : "−"}
            {formatCurrency(Math.abs(summary.totalDelta))}
          </span>
          {summary.totalDeltaPct !== null && (
            <span className="text-[11px] font-semibold text-muted-foreground">
              {summary.totalDeltaPct > 0 ? "+" : ""}
              {summary.totalDeltaPct}%
            </span>
          )}
        </span>
      }
    >
      <p className="bg-muted/40 px-4 py-2 text-xs leading-snug text-muted-foreground">
        {formatNumber(summary.productsMoved)} products moved. The five biggest carry{" "}
        <span className="font-medium text-foreground">{summary.concentrationPct}%</span> of
        all movement
        {summary.concentrationPct < 25
          ? " — the change is broad, not driven by a handful of products."
          : " — the change is concentrated in a few products."}
      </p>
      {(open ? movers : shown).map((mover) => (
        <MoverRow key={mover.productId} mover={mover} />
      ))}
      {hidden.length > 0 ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          {open ? "Show fewer" : showMoreLabel(hidden.length, "product")}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      ) : null}
    </Panel>
  );
}
