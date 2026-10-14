import { perHundred } from "@/lib/contact-rate";
import { formatChange, formatNumber } from "@/utils/format";
import type { GorgiasOverview } from "@/types/gorgias";

/** Contact-rate card (SPEC-096 ②) — support contacts per 100 orders, the
 * "is support getting cheaper to run?" signal. A raw ticket count can't answer
 * that (more orders → more tickets); normalizing by orders can. Lower is
 * healthier, so a negative vs-previous-period delta is good. */
export function OverviewContactRate({ overview }: { overview: GorgiasOverview }) {
  const rate = perHundred(overview.metrics.contact_rate);
  const pct = overview.change_pct.contact_rate ?? null;
  const tone =
    pct === null || pct === 0
      ? "text-muted-foreground"
      : pct < 0
        ? "text-success" // fewer contacts per order = better
        : "text-destructive";
  return (
    <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <p className="text-xs font-medium text-muted-foreground">Contact rate</p>
      <div className="mt-2 flex items-baseline gap-2">
        <p className="font-heading text-2xl tracking-wide tabular-nums">
          {rate === null ? "—" : rate}
        </p>
        <span className="text-sm text-muted-foreground">per 100 orders</span>
        {pct !== null ? (
          <span className={`text-xs font-medium tabular-nums ${tone}`}>{formatChange(pct)}</span>
        ) : null}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        {formatNumber(overview.metrics.conversations)} conversations across{" "}
        {formatNumber(overview.metrics.orders)} orders · lower is healthier
      </p>
    </div>
  );
}
