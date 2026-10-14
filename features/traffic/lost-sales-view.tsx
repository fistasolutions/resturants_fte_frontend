import Link from "next/link";
import { ArrowUpRight, ChevronRight, TrendingUp } from "lucide-react";

import { Card } from "@/components/ui/card";
import { TrafficEmpty } from "@/features/traffic/traffic-empty";
import { formatConversion } from "@/lib/conversion";
import type { TrafficLostSalesStore, TrafficOverview } from "@/types/traffic";
import { formatCurrency, formatNumber } from "@/utils/format";

/** Is this store's conversion gap widening or narrowing week-over-week? A
 * positive delta = converting better = gap shrinking (good). */
function GapTrend({ delta }: { delta: number | null }) {
  if (delta == null || Math.abs(delta) < 0.005) return null;
  const narrowing = delta > 0;
  return (
    <span className={`text-xs font-medium ${narrowing ? "text-success" : "text-warning"}`}>
      {narrowing ? "▼" : "▲"} gap {narrowing ? "narrowing" : "widening"} (
      {Math.abs(delta * 100).toFixed(1)} pts)
    </span>
  );
}

function StoreRow({ s, benchmarkRate }: { s: TrafficLostSalesStore; benchmarkRate: number | null }) {
  const inner = (
    <>
      <div className="min-w-0">
        <p className="font-medium">{s.location}</p>
        <p className="text-xs text-muted-foreground">
          converting at {formatConversion(s.current_rate)} vs {formatConversion(benchmarkRate)}{" "}
          benchmark
        </p>
        <GapTrend delta={s.conversion_delta} />
      </div>
      <div className="flex items-center gap-1.5 text-right">
        <ArrowUpRight className="size-4 text-success" aria-hidden />
        <span className="text-sm font-semibold text-success tabular-nums">
          +{formatCurrency(s.uplift_sales)}
        </span>
        <span className="text-xs text-muted-foreground tabular-nums">
          (+{formatNumber(s.uplift_transactions)} sales)
        </span>
        {s.location_id != null && (
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
        )}
      </div>
    </>
  );

  if (s.location_id != null) {
    return (
      <li>
        <Link
          href={`/traffic/stores/${s.location_id}`}
          className="-mx-2 flex flex-wrap items-center justify-between gap-2 rounded-lg px-2 py-3 transition-colors hover:bg-muted/50"
        >
          {inner}
        </Link>
      </li>
    );
  }
  return <li className="flex flex-wrap items-center justify-between gap-2 py-3">{inner}</li>;
}

export function LostSalesView({ data }: { data: TrafficOverview | null }) {
  if (!data || !data.has_data) return <TrafficEmpty connected={Boolean(data?.last_sync)} />;
  const ls = data.lost_sales;

  if (!ls.benchmark_store || ls.stores.length === 0 || ls.total_opportunity <= 0) {
    return (
      <Card className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <TrendingUp className="size-8 text-success" aria-hidden />
        <p className="text-sm font-medium">No gap to close right now.</p>
        <p className="max-w-md text-sm text-muted-foreground">
          {ls.benchmark_store
            ? `Every reliable store is converting at or near your best rate (${ls.benchmark_store}). Nothing left on the table.`
            : "Need at least two stores with a trustworthy sensor to compare conversion."}
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hero — the money shot */}
      <Card className="gap-2 bg-gradient-to-br from-success/[0.06] to-transparent px-5 py-6">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Revenue on the table this period
        </p>
        <p className="text-4xl font-bold tracking-tight text-success tabular-nums">
          {formatCurrency(ls.total_opportunity)}
        </p>
        <p className="text-sm text-muted-foreground">
          If every store converted like{" "}
          <span className="font-semibold text-foreground">{ls.benchmark_store}</span> (
          {formatConversion(ls.benchmark_rate)}), that&apos;s the extra revenue your
          in-store traffic would have produced — figures are{" "}
          <span className="font-medium text-foreground">net of sales tax</span>.
        </p>
      </Card>

      {/* Per-store gaps */}
      <Card className="gap-3 px-4 py-4 md:px-6 md:py-5">
        <div>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Where it&apos;s leaking
          </p>
          <h2 className="text-sm font-semibold">Each store vs the benchmark</h2>
        </div>
        <ul className="divide-y divide-border/60">
          {ls.stores.map((s) => (
            <StoreRow key={s.location} s={s} benchmarkRate={ls.benchmark_rate} />
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">
          Uplift = the conversion gap × that store&apos;s visitors × its average order
          value, against your best store (a stretch ceiling, not a guarantee). Stores whose
          sensor is under-counting are excluded. Click a store to see where it&apos;s leaking.
        </p>
      </Card>
    </div>
  );
}
