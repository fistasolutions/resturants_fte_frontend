"use client";

import { cashGeometry, trendGeometry, type Box } from "@/lib/finance-charts";
import { compactMoney, shortDate } from "@/lib/finance";
import type { CashWeek } from "@/types/finance";

/**
 * Finance Oversight's two charts (SPEC-301). The geometry is `lib/finance-charts.ts`'s —
 * pure and unit-tested — so these components only draw. Colours come from the theme
 * tokens, so both charts read in light and dark.
 */

/** The last axis label ends at its tick, so it never runs off the plot. */
function edgeAnchor(i: number, n: number): "middle" | "end" {
  return i === n - 1 ? "end" : "middle";
}

const TREND_BOX: Box = { width: 520, height: 200, top: 12, right: 12, bottom: 26, left: 48 };

export function TrendChart({ points }: { points: { date: string; outstanding: number; pastDue: number }[] }) {
  const geo = trendGeometry(points, TREND_BOX);
  if (!geo) {
    return (
      <p className="px-3 py-10 text-center text-sm text-muted-foreground">
        The trend starts the day daily snapshots did — {points.length === 1 ? "one point so far" : "none yet"}. A
        second day draws the line.
      </p>
    );
  }
  const last = geo.points[geo.points.length - 1];
  return (
    <figure className="px-3 pt-2 pb-3">
      <svg viewBox={`0 0 ${TREND_BOX.width} ${TREND_BOX.height}`} className="h-auto w-full" role="img" aria-label="What is owed and what is late, week by week">
        {geo.ticks.map((t) => (
          <g key={t.value}>
            <line x1={TREND_BOX.left} x2={TREND_BOX.width - TREND_BOX.right} y1={t.y} y2={t.y} className="stroke-border" strokeWidth={1} />
            <text x={TREND_BOX.left - 6} y={t.y + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
              {compactMoney(t.value)}
            </text>
          </g>
        ))}
        <path d={geo.owedArea} className="fill-foreground/5" />
        <path d={geo.owed} className="fill-none stroke-foreground" strokeWidth={2} />
        <path d={geo.late} className="fill-none stroke-destructive" strokeWidth={2} strokeDasharray="4 3" />
        <circle cx={last.x} cy={last.owedY} r={3.5} className="fill-foreground" />
        <circle cx={last.x} cy={last.lateY} r={3.5} className="fill-destructive" />
        {geo.points.map((p, i) => (
          <text key={p.date} x={p.x} y={TREND_BOX.height - 8} textAnchor={edgeAnchor(i, geo.points.length)} className="fill-muted-foreground text-[10px]">
            {shortDate(p.date)}
          </text>
        ))}
      </svg>
      <figcaption className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-foreground" aria-hidden /> Owed</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-destructive" aria-hidden /> Past due</span>
      </figcaption>
    </figure>
  );
}

const CASH_BOX: Box = { width: 1100, height: 280, top: 12, right: 12, bottom: 28, left: 56 };

export function CashChart({ weeks, bank, cushion }: { weeks: CashWeek[]; bank: number; cushion: number }) {
  const geo = cashGeometry(weeks, bank, cushion, CASH_BOX);
  return (
    <figure className="px-3 pt-2 pb-3">
      <div className="overflow-x-auto">
        <svg viewBox={`0 0 ${CASH_BOX.width} ${CASH_BOX.height}`} className="h-auto w-full min-w-[720px]" role="img" aria-label="Cash over the next 13 weeks">
          {geo.ticks.map((t) => (
            <g key={t.value}>
              <line x1={CASH_BOX.left} x2={CASH_BOX.width - CASH_BOX.right} y1={t.y} y2={t.y} className={t.value === 0 ? "stroke-muted-foreground/40" : "stroke-border"} strokeWidth={1} />
              <text x={CASH_BOX.left - 6} y={t.y + 3} textAnchor="end" className="fill-muted-foreground text-[10px]">
                {compactMoney(t.value)}
              </text>
            </g>
          ))}
          {geo.bars.map((b) => (
            <g key={b.week}>
              <rect x={b.inX} y={b.inY} width={b.width} height={b.inH} rx={2} className="fill-success/55" />
              <rect x={b.outX} y={b.outY} width={b.width} height={b.outH} rx={2} className="fill-foreground/45" />
            </g>
          ))}
          <line x1={CASH_BOX.left} x2={CASH_BOX.width - CASH_BOX.right} y1={geo.cushionY} y2={geo.cushionY} className="stroke-destructive" strokeWidth={1} strokeDasharray="4 3" />
          <path d={geo.line} className="fill-none stroke-foreground" strokeWidth={2.2} />
          {geo.dots.map((d) => (
            <circle key={d.week} cx={d.x} cy={d.y} r={3} className={d.below ? "fill-destructive" : "fill-foreground"} />
          ))}
          {geo.labels.map((l, i) => (
            <text key={l.week} x={l.x} y={CASH_BOX.height - 8} textAnchor={edgeAnchor(i, geo.labels.length)} className="fill-muted-foreground text-[10px]">
              {i === 0 ? "This wk" : shortDate(weeks[i].start)}
            </text>
          ))}
        </svg>
      </div>
      <figcaption className="mt-1 flex flex-wrap gap-3 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-success/55" aria-hidden /> Takings</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-sm bg-foreground/45" aria-hidden /> Bills due</span>
        <span className="inline-flex items-center gap-1"><span className="size-2 rounded-full bg-foreground" aria-hidden /> Cash at week end</span>
        <span className="inline-flex items-center gap-1"><span className="h-0.5 w-3 bg-destructive" aria-hidden /> Cushion</span>
      </figcaption>
    </figure>
  );
}
