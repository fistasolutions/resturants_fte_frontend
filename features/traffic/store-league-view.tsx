"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Coins, Info, PiggyBank, Target, TrendingDown, Trophy, Users } from "lucide-react";

import { Card } from "@/components/ui/card";
import { TrafficEmpty } from "@/features/traffic/traffic-empty";
import { conversionPct, formatConversion } from "@/lib/conversion";
import type { TrafficByStore, TrafficOverview } from "@/types/traffic";
import { formatCurrency, formatNumber } from "@/utils/format";

/** Reliable stores (sensor OK) rank by conversion first; suspect/unmatched sit
 * last with a flag — a bad counter never wins the league. */
function rank(stores: TrafficByStore[]): TrafficByStore[] {
  return [...stores].sort((a, b) => {
    const aOk = a.matched && !a.counter_suspect && a.conversion_rate != null;
    const bOk = b.matched && !b.counter_suspect && b.conversion_rate != null;
    if (aOk !== bOk) return aOk ? -1 : 1;
    return (b.conversion_rate ?? 0) - (a.conversion_rate ?? 0);
  });
}

const MEDAL = ["🥇", "🥈", "🥉"];

function pts(gap: number): string {
  return `${(gap * 100).toFixed(1)} pts`;
}
function sharePct(share: number | null): string {
  return share == null ? "" : `${Math.round(share * 100)}%`;
}

/** Week-over-week conversion movement (SPEC-112 Patch) — ▲/▼ points vs the
 * previous period; anything under half a point reads as flat. */
function TrendChip({ delta }: { delta: number | null }) {
  if (delta == null) return null;
  if (Math.abs(delta) < 0.005) {
    return <span className="text-[11px] text-muted-foreground">flat</span>;
  }
  const up = delta > 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${
        up ? "text-success" : "text-destructive"
      }`}
      title="vs the previous period"
    >
      {up ? "▲" : "▼"} {Math.abs(delta * 100).toFixed(1)} pts
    </span>
  );
}

function InsightTile({
  icon,
  label,
  value,
  sub,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  tone?: "default" | "success" | "warning";
}) {
  const ring =
    tone === "success"
      ? "border-success/30 bg-success/5"
      : tone === "warning"
        ? "border-warning/30 bg-warning/5"
        : "border-border bg-card";
  const iconTone =
    tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-muted-foreground";
  return (
    <Card className={`gap-1 border px-4 py-3 ${ring}`}>
      <div className="flex items-center gap-1.5">
        <span className={iconTone}>{icon}</span>
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
      </div>
      <p className="text-lg font-semibold leading-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </Card>
  );
}

export function StoreLeagueView({ data }: { data: TrafficOverview | null }) {
  const router = useRouter();
  if (!data || !data.has_data || data.by_store.length === 0) {
    return <TrafficEmpty connected={Boolean(data?.last_sync)} />;
  }
  const ranked = rank(data.by_store);
  const reliable = ranked.filter(
    (s) => s.matched && !s.counter_suspect && s.conversion_rate != null,
  );
  const champ = reliable[0] ?? null;
  const mostTraffic = [...ranked].sort((a, b) => b.visitors - a.visitors)[0];
  const bestValue = [...reliable]
    .filter((s) => s.sales_per_visitor != null)
    .sort((a, b) => (b.sales_per_visitor ?? 0) - (a.sales_per_visitor ?? 0))[0];
  // Profit-per-visitor (SPEC-131) surfaces only where COGS coverage lets the
  // backend compute it — the truest "which store makes money" signal.
  const showProfit = data.by_store.some((s) => s.profit_per_visitor != null);
  const bestProfit = [...reliable]
    .filter((s) => s.profit_per_visitor != null)
    .sort((a, b) => (b.profit_per_visitor ?? 0) - (a.profit_per_visitor ?? 0))[0];
  const laggard =
    reliable.length > 1
      ? [...reliable].sort((a, b) => (b.conversion_gap ?? 0) - (a.conversion_gap ?? 0))[0]
      : null;

  return (
    <div className="space-y-4">
      {/* Insight strip */}
      <div
        className={`grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 ${
          showProfit ? "xl:grid-cols-5" : ""
        }`}
      >
        {champ && (
          <InsightTile
            tone="success"
            icon={<Trophy className="size-4" aria-hidden />}
            label="Best converter"
            value={champ.location}
            sub={`${formatConversion(champ.conversion_rate)} of visitors buy`}
          />
        )}
        {bestValue && bestValue.sales_per_visitor != null && (
          <InsightTile
            icon={<Coins className="size-4" aria-hidden />}
            label="Value per visitor"
            value={bestValue.location}
            sub={`${formatCurrency(bestValue.sales_per_visitor)} net per walk-in`}
          />
        )}
        {showProfit && bestProfit && bestProfit.profit_per_visitor != null && (
          <InsightTile
            tone="success"
            icon={<PiggyBank className="size-4" aria-hidden />}
            label="Profit per visitor"
            value={bestProfit.location}
            sub={`${formatCurrency(bestProfit.profit_per_visitor)} margin per walk-in`}
          />
        )}
        <InsightTile
          icon={<Users className="size-4" aria-hidden />}
          label="Most footfall"
          value={mostTraffic.location}
          sub={`${formatNumber(mostTraffic.visitors)} visitors${
            mostTraffic.visitor_share ? ` · ${sharePct(mostTraffic.visitor_share)} of traffic` : ""
          }`}
        />
        {laggard && laggard.conversion_gap ? (
          <InsightTile
            tone="warning"
            icon={<TrendingDown className="size-4" aria-hidden />}
            label="Biggest gap"
            value={laggard.location}
            sub={`${pts(laggard.conversion_gap)} behind ${champ?.location}`}
          />
        ) : (
          <InsightTile
            icon={<Target className="size-4" aria-hidden />}
            label="Spread"
            value="Tightly matched"
            sub="Stores convert at similar rates"
          />
        )}
      </div>

      {/* Detailed comparison */}
      <Card className="gap-4 px-4 py-4 md:px-6 md:py-5">
        <div>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Store League
          </p>
          <h2 className="text-sm font-semibold">Which store turns footfall into money</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[880px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th className="py-2 pr-3 font-medium">#</th>
                <th className="py-2 pr-3 font-medium">Store</th>
                <th className="py-2 pl-3 text-right font-medium">Visitors</th>
                <th className="py-2 pl-3 text-right font-medium">
                  <span
                    className="inline-flex items-center gap-1"
                    title="Net of sales tax — so stores that collect tax compare fairly with those that don't. Hover a value for the gross → tax → net breakdown."
                  >
                    Net sales <Info className="size-3" aria-hidden />
                  </span>
                </th>
                <th className="py-2 pl-3 text-right font-medium">Tax</th>
                <th className="py-2 pl-3 text-right font-medium">Transactions</th>
                <th className="py-2 pl-3 text-right font-medium">Units</th>
                <th className="py-2 pl-3 text-right font-medium">AOV</th>
                <th className="py-2 pl-3 text-right font-medium">Per visitor</th>
                {showProfit && (
                  <th className="py-2 pl-3 text-right font-medium">
                    <span
                      className="inline-flex items-center gap-1"
                      title="Net sales minus cost of goods, per visitor — the true profit each walk-in generates."
                    >
                      Profit/visitor <Info className="size-3" aria-hidden />
                    </span>
                  </th>
                )}
                <th className="min-w-[180px] py-2 pl-3 text-right font-medium">Conversion</th>
              </tr>
            </thead>
            <tbody>
              {ranked.map((s, i) => {
                const isChamp = champ != null && s.store_code === champ.store_code;
                const href = s.location_id != null ? `/traffic/stores/${s.location_id}` : null;
                return (
                  <tr
                    key={s.store_code}
                    onClick={href ? () => router.push(href) : undefined}
                    className={`border-b border-border/50 transition-colors last:border-0 ${
                      isChamp ? "bg-success/5" : ""
                    } ${href ? "cursor-pointer hover:bg-muted/50" : ""}`}
                  >
                    <td className="py-3 pr-3 text-center text-base">
                      {MEDAL[i] ?? <span className="text-muted-foreground">{i + 1}</span>}
                    </td>
                    <td className="py-3 pr-3">
                      {s.location_id != null ? (
                        <Link
                          href={`/traffic/stores/${s.location_id}`}
                          className="font-medium underline-offset-4 hover:underline"
                        >
                          {s.location}
                        </Link>
                      ) : (
                        <span className="font-medium">{s.location}</span>
                      )}
                      {s.counter_suspect && (
                        <span
                          className="ml-2 inline-flex items-center rounded-full bg-warning/15 px-2 py-0.5 text-[10px] font-medium text-warning align-middle"
                          title="More sales than counted visitors — the door sensor is under-counting"
                        >
                          sensor
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums">
                      {formatNumber(s.visitors)}
                      {s.visitor_share != null && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {sharePct(s.visitor_share)}
                        </span>
                      )}
                    </td>
                    <td
                      className="py-3 pl-3 text-right tabular-nums"
                      title={
                        s.gross_sales != null && s.tax_collected != null
                          ? `Gross ${formatCurrency(s.gross_sales)} − Tax ${formatCurrency(
                              s.tax_collected,
                            )} = Net ${formatCurrency(s.sales ?? 0)}`
                          : undefined
                      }
                    >
                      {s.sales != null ? formatCurrency(s.sales) : "—"}
                      {s.sales_share != null && (
                        <span className="ml-1 text-xs text-muted-foreground">
                          {sharePct(s.sales_share)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums text-muted-foreground">
                      {s.tax_collected != null ? formatCurrency(s.tax_collected) : "—"}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums">
                      {s.transactions != null ? formatNumber(s.transactions) : "—"}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums">
                      {s.units != null ? formatNumber(s.units) : "—"}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums">
                      {s.avg_order_value != null ? formatCurrency(s.avg_order_value) : "—"}
                    </td>
                    <td className="py-3 pl-3 text-right tabular-nums">
                      {s.sales_per_visitor != null ? formatCurrency(s.sales_per_visitor) : "—"}
                    </td>
                    {showProfit && (
                      <td
                        className="py-3 pl-3 text-right tabular-nums"
                        title={
                          s.profit_margin != null
                            ? `${Math.round(s.profit_margin * 100)}% margin`
                            : "Add product costs to unlock profit"
                        }
                      >
                        {s.profit_per_visitor != null ? (
                          formatCurrency(s.profit_per_visitor)
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    )}
                    <td className="py-3 pl-3">
                      <div className="flex items-center justify-end gap-2 tabular-nums">
                        <TrendChip delta={s.conversion_delta} />
                        <span className={isChamp ? "font-semibold text-success" : "font-medium"}>
                          {formatConversion(s.conversion_rate)}
                        </span>
                      </div>
                      {!s.counter_suspect && s.conversion_rate != null ? (
                        <div className="mt-1 flex items-center justify-end gap-2">
                          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                            <div
                              className={`h-full rounded-full ${isChamp ? "bg-success" : "bg-foreground/40"}`}
                              style={{ width: `${Math.max(conversionPct(s.conversion_rate), 2)}%` }}
                            />
                          </div>
                          <span className="w-16 text-right text-[11px] text-muted-foreground">
                            {isChamp ? "leader" : s.conversion_gap ? `−${pts(s.conversion_gap)}` : ""}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-1 text-right text-[11px] text-warning">
                          sensor under-count
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground">
          Ranked by in-store conversion (that store&apos;s POS sales ÷ its counted
          visitors). <span className="font-medium text-foreground">Sales are net of
          tax</span> — so stores that collect sales tax compare fairly with those that
          don&apos;t; hover a sales figure for the gross → tax → net breakdown.
          {showProfit
            ? " Profit/visitor is net sales minus cost of goods."
            : " Profit per visitor unlocks once product costs are known."}{" "}
          A <span className="text-warning">sensor</span> flag means the door counter is
          under-reporting, so that store&apos;s rate isn&apos;t trustworthy yet. Click any
          store for its full breakdown.
        </p>
      </Card>
    </div>
  );
}
