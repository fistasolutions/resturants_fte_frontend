import { signalFromCounts } from "@/lib/discount-share";
import { ExplainButton } from "@/features/chat/explain-button";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import type { DiscountOverview } from "@/types/discounts";

import { SignalBadge } from "./discount-badges";

function Tile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="relative rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <p className="pr-6 text-xs font-medium text-muted-foreground">{label}</p>
      <ExplainButton target={{ metric: label, value, detail: hint }} />
      <p className="mt-2 font-heading text-2xl tracking-wide tabular-nums">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

/** Company KPI hero + automatic/manual/code split (SPEC-098). */
export function DiscountOverviewKpis({ overview }: { overview: DiscountOverview }) {
  const c = overview.company;
  const s = overview.type_split;
  const signal = signalFromCounts(overview.alert_counts);
  const manualShare =
    c.discount > 0 ? Math.round((s.manual.amount / c.discount) * 100) : 0;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-heading text-lg tracking-wide">Company</h2>
        <SignalBadge signal={signal} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Tile label="Gross sales" value={formatCurrency(c.gross)} />
        <Tile
          label="Total discount"
          value={formatCurrency(c.discount)}
          hint={c.discount_pct === null ? undefined : `${formatPercent(c.discount_pct)} of gross`}
        />
        <Tile label="Discounted orders" value={formatNumber(c.discounted_orders)} />
        <Tile
          label="Avg discount"
          value={c.avg_discount === null ? "—" : formatCurrency(c.avg_discount)}
          hint="per discounted order"
        />
        <Tile
          label="Manual share"
          value={`${manualShare}%`}
          hint="of all discount $ was staff-entered"
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SplitCard label="Manual" tone="warning" bucket={s.manual} />
        <SplitCard label="Automatic" tone="muted" bucket={s.automatic} />
        <SplitCard label="Discount code" tone="muted" bucket={s.code} />
      </div>
    </div>
  );
}

function SplitCard({
  label,
  tone,
  bucket,
}: {
  label: string;
  tone: "warning" | "muted";
  bucket: { amount: number; orders: number };
}) {
  const accent = tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-xs font-medium text-muted-foreground">{label} discounts</p>
      <p className={`mt-2 font-heading text-xl tracking-wide tabular-nums ${accent}`}>
        {formatCurrency(bucket.amount)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {formatNumber(bucket.orders)} order{bucket.orders === 1 ? "" : "s"}
      </p>
    </div>
  );
}
