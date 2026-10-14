import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";
import type { ReasonCount } from "@/types/returns-intel";

const SIZING_REASONS = /too (small|big|large|tight|loose)|siz/i;

/** Return-reason breakdown as proportional bars. Sizing reasons are tinted
 * with the warning token to make the dominant failure mode obvious. */
export function ReasonBar({ reasons }: { reasons: ReasonCount[] }) {
  const total = reasons.reduce((sum, r) => sum + r.count, 0);
  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No return reasons in this period.</p>;
  }
  const sizingShare = reasons
    .filter((r) => SIZING_REASONS.test(r.reason))
    .reduce((sum, r) => sum + r.count, 0);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        <span className="font-semibold text-warning">
          {formatNumber(Math.round((sizingShare / total) * 100))}%
        </span>{" "}
        of returns are sizing-related — the dominant, fixable failure mode.
      </p>
      <ul className="space-y-2">
        {reasons.map((reason) => {
          const share = reason.count / total;
          const isSizing = SIZING_REASONS.test(reason.reason);
          return (
            <li key={reason.reason} className="grid grid-cols-[1fr_auto] items-center gap-3">
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm text-foreground">{reason.reason}</span>
                  <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                    {formatNumber(reason.count)} · {Math.round(share * 100)}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", isSizing ? "bg-warning" : "bg-primary")}
                    style={{ width: `${Math.max(share * 100, 2)}%` }}
                  />
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
