import Link from "next/link";
import { ChevronRight, TriangleAlert } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";
import type { BacklogAging, WarehouseBacklog } from "@/types/warehouse";

const SEGMENTS = [
  { key: "d0_2", label: "0–2d", tone: "bg-success" },
  { key: "d3_7", label: "3–7d", tone: "bg-primary/60" },
  { key: "d8_30", label: "8–30d", tone: "bg-warning" },
  { key: "d30_plus", label: "30d+", tone: "bg-destructive" },
] as const;

/** Unfulfilled backlog with age distribution + burn-down ETA (SPEC-097). The
 * aging buckets replace a single "oldest order" headline — so a 5-year-old ghost
 * shows as ">30d", while the real signal (recent orders getting stuck) stands out. */
const EMPTY_AGING: BacklogAging = { d0_2: 0, d3_7: 0, d8_30: 0, d30_plus: 0 };

export function BacklogPanel({ backlog }: { backlog: WarehouseBacklog }) {
  // Tolerate an older/partial backend payload (pre-enrichment) without crashing
  // the page — the aging block just renders empty until the new shape arrives.
  const aging = backlog.aging ?? EMPTY_AGING;
  const total = backlog.waiting_to_pack || 1;
  const aged = aging.d8_30 + aging.d30_plus;

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
            Waiting to pack
          </p>
          <p className="font-heading text-3xl tabular-nums">
            {formatNumber(backlog.waiting_to_pack)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Burn-down at current pace</p>
          <p className="font-heading text-xl tabular-nums">
            {backlog.burn_down_days !== null ? `≈ ${backlog.burn_down_days} days` : "—"}
          </p>
          <p className="text-xs text-muted-foreground">
            packing {formatNumber(backlog.daily_pack_rate)}/day
          </p>
        </div>
      </div>

      {/* Age distribution */}
      <div className="space-y-2">
        <div className="flex h-2.5 overflow-hidden rounded-full bg-muted">
          {SEGMENTS.map((s) => {
            const n = aging[s.key];
            return n > 0 ? (
              <div
                key={s.key}
                className={cn("h-full", s.tone)}
                style={{ width: `${(n / total) * 100}%` }}
                title={`${s.label}: ${n}`}
              />
            ) : null;
          })}
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {SEGMENTS.map((s) => (
            <Link
              key={s.key}
              href={`/warehouse/backlog?bucket=${s.key}`}
              className="inline-flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-muted hover:text-foreground"
            >
              <span className={cn("size-2 rounded-full", s.tone)} />
              {s.label}
              <span className="font-medium tabular-nums text-foreground">
                {formatNumber(aging[s.key])}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <Link
        href="/warehouse/backlog?bucket=aged"
        className="flex items-center gap-1.5 border-t border-border pt-3 text-xs text-muted-foreground hover:text-foreground"
      >
        {aged > 0 && <TriangleAlert className="size-3.5 text-warning" aria-hidden />}
        <span>
          {aged > 0
            ? `${formatNumber(aged)} orders older than a week — worth chasing.`
            : "No orders older than a week."}
          {backlog.oldest_unfulfilled_order && (
            <>
              {" "}Oldest: <span className="tabular-nums">{backlog.oldest_unfulfilled_order}</span>
              {backlog.oldest_unfulfilled_age_days !== null &&
                ` · ${backlog.oldest_unfulfilled_age_days}d`}
              .
            </>
          )}
        </span>
        <ChevronRight className="size-3.5 shrink-0" aria-hidden />
      </Link>
    </Card>
  );
}
