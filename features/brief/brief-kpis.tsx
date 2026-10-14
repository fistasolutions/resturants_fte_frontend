import { DeltaBadge } from "@/components/shared/delta-badge";
import { ExplainButton } from "@/features/chat/explain-button";
import type { BriefYesterdayKpis } from "@/types/brief";
import { formatCurrency, formatNumber } from "@/utils/format";

/** `DeltaBadge` lives in `components/shared/delta-badge.tsx` since SPEC-233; Returns and
 * the Brief keep importing it from here. */
export { DeltaBadge } from "@/components/shared/delta-badge";

interface BriefKpisProps {
  kpis: BriefYesterdayKpis;
  title?: string;
  deltaLabel?: string;
}

interface KpiTileProps {
  label: string;
  value: string;
  delta: number | null;
  deltaLabel?: string;
  invertDelta?: boolean;
}

function KpiTile({ label, value, delta, deltaLabel, invertDelta }: KpiTileProps) {
  return (
    <div className="relative rounded-xl border border-border bg-card p-4 space-y-1">
      <p className="pr-6 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
        {label}
      </p>
      <ExplainButton target={{ metric: label, value, delta, detail: deltaLabel }} />
      <p className="text-xl font-semibold tabular-nums">{value}</p>
      <div className="flex items-center gap-1.5">
        <DeltaBadge delta={delta} invertDelta={invertDelta} />
        {deltaLabel && (
          <span className="text-[11px] text-muted-foreground">{deltaLabel}</span>
        )}
      </div>
    </div>
  );
}

export function BriefKpis({
  kpis,
  title = "Yesterday at a Glance",
  deltaLabel = "vs last week",
}: BriefKpisProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <KpiTile
          label="Revenue"
          value={formatCurrency(kpis.revenue)}
          delta={kpis.revenue_delta_pct}
          deltaLabel={deltaLabel}
        />
        <KpiTile
          label="Orders"
          value={formatNumber(kpis.orders)}
          delta={kpis.orders_delta_pct}
          deltaLabel={deltaLabel}
        />
        <KpiTile
          label="Avg Order Value"
          value={formatCurrency(kpis.aov)}
          delta={kpis.aov_delta_pct}
          deltaLabel={deltaLabel}
        />
        <KpiTile
          label="New Customers"
          value={formatNumber(kpis.new_customers)}
          delta={
            kpis.new_customers_delta !== null
              ? kpis.new_customers_delta
              : null
          }
          deltaLabel={deltaLabel}
        />
        <KpiTile
          label="Refunds"
          value={formatCurrency(kpis.refunds_total)}
          delta={kpis.refunds_pct_of_revenue}
          deltaLabel="of revenue"
          invertDelta
        />
      </div>
    </section>
  );
}
