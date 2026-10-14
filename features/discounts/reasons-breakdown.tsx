import { AlertTriangle } from "lucide-react";

import type { DiscountReasons } from "@/types/discounts";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

/** Discounts-by-reason (SPEC-136, WHY). A ranked bar list of manual-discount $ per
 * reason, plus a prominent "no reason" card — the number that makes the case for a
 * POS reason prompt. Display-only; the backend classifies (Rule 8). */
export function ReasonsBreakdown({ data }: { data: DiscountReasons }) {
  const top = data.reasons[0]?.amount ?? 0;
  const noReasonPct = data.no_reason_pct ?? 0;

  return (
    <div className="space-y-4">
      {/* No-reason call-to-action */}
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-card border border-warning/30 bg-warning/5 p-4">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 text-warning">
            <AlertTriangle className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {formatPercent(noReasonPct)} of manual discount $ has no reason
            </h2>
            <p className="mt-1 max-w-xl text-xs text-muted-foreground">
              {formatCurrency(data.no_reason.amount)} across{" "}
              {formatNumber(data.no_reason.orders)} orders was discounted with no label.
              Enabling a discount-reason prompt in the POS would capture one every time.
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Total manual
          </p>
          <p className="font-heading text-xl tabular-nums">{formatCurrency(data.total_manual)}</p>
        </div>
      </div>

      {/* Ranked reasons */}
      <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-semibold text-foreground">Why discounts were given</h2>
        {data.reasons.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No labelled manual discounts in this range.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {data.reasons.map((r) => (
              <li key={r.reason} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="min-w-0 truncate font-medium text-foreground">{r.reason}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatCurrency(r.amount)}
                    <span className="ml-2 text-xs text-muted-foreground">
                      {formatNumber(r.orders)} orders
                    </span>
                  </span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/40"
                    style={{ width: `${top > 0 ? Math.max((r.amount / top) * 100, 2) : 0}%` }}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
