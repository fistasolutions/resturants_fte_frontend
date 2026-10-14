"use client";

import { BarChart3, Lightbulb } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { EmptyPanel } from "@/features/email-marketing/empty-panel";
import { TrendChart } from "@/features/email-marketing/performance/trend-chart";
import { ListSkeleton } from "@/features/email-marketing/skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { band, formatMoney, formatRate, rate, snapshotAge } from "@/lib/email-marketing";
import { providerInfo } from "@/lib/email-providers";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { cn } from "@/lib/utils";
import type { MetricRow } from "@/types/email-marketing";
import { formatNumber, formatTime } from "@/utils/format";

const BAND_CLASS = { good: "", warn: "text-warning", bad: "text-destructive" } as const;

function Table({ title, rows, providerName }: { title: string; rows: MetricRow[]; providerName: string }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing sent in the snapshot window.</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[880px] text-sm">
            <thead className="border-b border-border text-left text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
              <tr>
                <th scope="col" className="px-3 py-2">Name</th>
                <th scope="col" className="px-3 py-2 text-right">Recipients</th>
                <th scope="col" className="px-3 py-2 text-right">{providerName} attributes</th>
                <th scope="col" className="px-3 py-2 text-right">Caused</th>
                <th scope="col" className="px-3 py-2 text-right">Profit</th>
                <th scope="col" className="px-3 py-2 text-right">RPR</th>
                <th scope="col" className="px-3 py-2 text-right">CTR</th>
                <th scope="col" className="px-3 py-2 text-right">CTOR</th>
                <th scope="col" className="px-3 py-2 text-right">Unsub</th>
                <th scope="col" className="px-3 py-2 text-right">Spam</th>
                <th scope="col" className="px-3 py-2 text-right">Bounce</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border tabular-nums">
              {rows.map((r) => {
                const unsub = rate(r.unsubscribes, r.delivered);
                const spam = rate(r.spamComplaints, r.delivered);
                const bounce = rate(r.bounces, r.recipients);
                return (
                  <tr key={r.id}>
                    <th scope="row" className="px-3 py-2 text-left font-medium">{r.name}</th>
                    <td className="px-3 py-2 text-right">{formatNumber(r.recipients)}</td>
                    <td className="px-3 py-2 text-right">{formatMoney(r.attributedRevenue)}</td>
                    <td className="px-3 py-2 text-right">{r.incrementalRevenue ? formatMoney(r.incrementalRevenue) : "—"}</td>
                    <td className={cn("px-3 py-2 text-right font-semibold", r.profit && r.profit.amount < 0 && "text-destructive")}>{r.profit ? formatMoney(r.profit) : "—"}</td>
                    <td className="px-3 py-2 text-right">{formatMoney({ ...r.attributedRevenue, amount: r.recipients > 0 ? r.attributedRevenue.amount / r.recipients : 0 })}</td>
                    <td className="px-3 py-2 text-right">{formatRate(rate(r.clicks, r.delivered))}</td>
                    <td className="px-3 py-2 text-right">{formatRate(rate(r.clicks, r.opens))}</td>
                    <td className={cn("px-3 py-2 text-right", BAND_CLASS[band("unsubscribe", unsub)])}>{formatRate(unsub)}</td>
                    <td className={cn("px-3 py-2 text-right", BAND_CLASS[band("spam", spam)])}>{formatRate(spam)}</td>
                    <td className={cn("px-3 py-2 text-right", BAND_CLASS[band("bounce", bounce)])}>{formatRate(bounce)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

/** Performance (SPEC-345): campaigns and flows side by side — what the platform attributes,
 * what email caused, and the profit — with the trend, the best and worst sends and what the
 * store's subject lines have taught. Every figure is from the nightly snapshot, dated. */
export function PerformanceTab() {
  const perf = useApiQuery(emailMarketingQueries.performance());
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  if (perf.isPending || workspace.isPending) return <ListSkeleton rows={6} />;
  if (perf.isError) return <QueryErrorState error={perf.error} onRetry={() => void perf.refetch()} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;
  const p = perf.data;
  const provider = providerInfo(workspace.data.connection.provider).name;
  const age = p.takenAt ? snapshotAge(p.takenAt) : null;
  const ranked = [...p.rows].filter((r) => r.profit).sort((a, b) => (b.profit?.amount ?? 0) - (a.profit?.amount ?? 0));
  const top = ranked.slice(0, 3);
  const bottom = ranked.slice(-2).reverse().filter((r) => !top.includes(r));
  // A just-connected store has no snapshot and no sends — one clean empty state, not a blank
  // chart over empty tables (SPEC-345 patch). The nightly report fills it in.
  const empty = !p.takenAt && p.rows.length === 0 && p.trend.length === 0;

  return (
    <div className="space-y-6">
      <p className={cn("text-xs", age?.stale ? "text-warning" : "text-muted-foreground")}>
        {p.takenAt && age ? `Snapshot taken ${formatTime(p.takenAt)}${age.stale ? ` — ${age.hours} hours old` : ""}.` : "No snapshot yet — the first is read tonight."} {provider} allows about 2 report reads a minute and 225 a day, so figures refresh nightly rather than live.
      </p>
      {empty ? (
        <EmptyPanel icon={BarChart3} title="No results yet">
          The first nightly report runs tonight. It reads {provider}&rsquo;s campaign and flow results and
          measures the profit each send caused against its holdout, so the chart, the rankings and the
          tables fill in here after it runs — and after the employee has sent its first campaigns.
        </EmptyPanel>
      ) : (
        <>
      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Weekly email money</h2>
        <TrendChart trend={p.trend} />
      </section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Made the most profit</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card text-sm">
            {top.map((r) => (
              <li key={r.id} className="flex justify-between gap-3 px-3 py-2"><span>{r.name}</span><span className="font-semibold tabular-nums text-success">{r.profit ? formatMoney(r.profit) : "—"}</span></li>
            ))}
          </ul>
        </section>
        <section className="space-y-2">
          <h2 className="text-sm font-semibold">Made the least</h2>
          <ul className="divide-y divide-border rounded-xl border border-border bg-card text-sm">
            {bottom.map((r) => (
              <li key={r.id} className="flex justify-between gap-3 px-3 py-2"><span>{r.name}</span><span className={cn("font-semibold tabular-nums", r.profit && r.profit.amount < 0 && "text-destructive")}>{r.profit ? formatMoney(r.profit) : "—"}</span></li>
            ))}
          </ul>
        </section>
      </div>
      <Table title="Campaigns" rows={p.rows.filter((r) => r.kind === "campaign")} providerName={provider} />
      <Table title="Flows · last 30 days" rows={p.rows.filter((r) => r.kind === "flow")} providerName={provider} />
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="size-4 text-muted-foreground" aria-hidden />What wins for this store</h2>
        <ul className="grid gap-2 md:grid-cols-3">
          {p.learnings.map((l) => (
            <li key={l.finding} className="rounded-xl border border-border bg-card p-3 text-sm">
              <p className="font-medium">{l.finding}</p>
              <p className="mt-1 text-xs text-muted-foreground">{l.evidence}</p>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Open rates are inflated by Apple Mail privacy, so wins are judged on clicks and sales caused.</p>
      </section>
        </>
      )}
    </div>
  );
}
