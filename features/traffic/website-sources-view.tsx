"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SOURCE_MIN_SESSIONS, mergedFrom, sourceVerdictLine, type SourceTone } from "@/lib/clarity";
import { cn } from "@/lib/utils";
import type { ClarityCampaigns, ClaritySource } from "@/types/clarity";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

const TONE: Record<SourceTone, string> = {
  ok: "bg-success/12 text-success",
  warn: "bg-warning/15 text-warning",
  bad: "bg-destructive/10 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

function SourceRow({ s }: { s: ClaritySource }) {
  const v = sourceVerdictLine(s);
  const qb = s.sessions > 0 ? Math.round((s.quickBacks / s.sessions) * 100) : 0;
  return (
    <tr data-source={s.source}>
      <td className="px-4 py-2 font-medium">
        {s.label}
        {mergedFrom(s) ? <span className="block text-[11px] font-normal text-muted-foreground">{mergedFrom(s)}</span> : null}
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(s.sessions)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{Math.round(s.avgScrollDepth * 100)}%</td>
      <td className="px-3 py-2 text-right tabular-nums">
        {formatNumber(s.quickBacks)} <span className="text-muted-foreground">· {qb}%</span>
      </td>
      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(s.attributedOrders)}</td>
      <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(s.attributedRevenue)}</td>
      <td className="max-w-[34ch] px-4 py-2">
        <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", TONE[v.tone])}>{v.label}</span>
        {v.tone !== "muted" || s.internal ? <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{v.why}</p> : null}
      </td>
    </tr>
  );
}

/**
 * Where the traffic came from, and what it did (SPEC-284, backend SPEC-219's
 * campaign join): Clarity's sessions, scroll and quick-backs per source beside
 * Shopify's orders and revenue from the same `utm_source` over the same days,
 * with a verdict chip — the pair that separates a wrong audience from a broken
 * page. Sources under the judging floor fold behind one line. Compact by design.
 */
export function WebsiteSourcesView({ data }: { data: ClarityCampaigns }) {
  const [tail, setTail] = useState(false);
  const sorted = [...data.sources].sort((a, b) => b.sessions - a.sessions);
  const judged = sorted.filter((s) => s.sessions >= SOURCE_MIN_SESSIONS || s.internal);
  const rest = sorted.filter((s) => !(s.sessions >= SOURCE_MIN_SESSIONS || s.internal));
  const span = data.daysCaptured === 1 && data.fromDay
    ? `Clarity has one day so far (${formatDate(data.fromDay)}); orders are matched on that day.`
    : data.fromDay
      ? `Clarity's ${data.daysCaptured} days from ${formatDate(data.fromDay)}; orders matched on the same days.`
      : `Last ${data.windowDays} days.`;
  return (
    <Card className="gap-0 overflow-hidden p-0" data-website-sources>
      <CardHeader className="p-4 pb-2 md:p-6 md:pb-2">
        <CardTitle>Where the traffic came from, and what it did</CardTitle>
        <p className="text-sm text-muted-foreground">
          Sessions, scroll and quick-backs from Clarity; orders and revenue from Shopify, matched on the channel (Facebook and Instagram are one, Meta). {span}
        </p>
      </CardHeader>
      <CardContent className="p-0">
        {sorted.length === 0 ? (
          <p className="m-4 rounded-card border border-dashed border-border p-6 text-sm text-muted-foreground">Clarity has not reported a traffic source in this window yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[13px]">
              <thead>
                <tr className="border-y border-border text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  <th className="px-4 py-2 text-left">Source</th>
                  <th className="px-3 py-2 text-right">Sessions</th>
                  <th className="px-3 py-2 text-right">Scroll</th>
                  <th className="px-3 py-2 text-right">Quick-backs</th>
                  <th className="px-3 py-2 text-right">Orders</th>
                  <th className="px-3 py-2 text-right">Revenue</th>
                  <th className="px-4 py-2 text-left">Verdict</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {judged.map((s) => (
                  <SourceRow key={s.source} s={s} />
                ))}
                {tail ? rest.map((s) => <SourceRow key={s.source} s={s} />) : null}
              </tbody>
            </table>
            {rest.length > 0 ? (
              <button
                type="button"
                onClick={() => setTail((open) => !open)}
                aria-expanded={tail}
                className="flex w-full items-center justify-center gap-1.5 border-t border-border px-4 py-2 text-xs font-medium text-muted-foreground outline-none transition-colors hover:bg-muted/50 hover:text-foreground focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                data-sources-tail
              >
                {tail ? "Hide" : "Show"} {rest.length} {rest.length === 1 ? "source" : "sources"} under {SOURCE_MIN_SESSIONS} sessions
                <ChevronDown className={cn("size-3.5 transition-transform duration-200", tail && "rotate-180")} aria-hidden />
              </button>
            ) : null}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
