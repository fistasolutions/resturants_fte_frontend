import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { RepeatClockData } from "@/types/customers";
import { formatNumber } from "@/utils/format";

/** The bucket a day-count falls into, so the median can be highlighted. */
function containsMedian(
  bucket: RepeatClockData["buckets"][number],
  median: number | null,
): boolean {
  if (median === null) return false;
  return median >= bucket.low && (bucket.high === null || median <= bucket.high);
}

/**
 * Customers → Repeat Clock (SPEC-189). When customers actually come back.
 *
 * Leads with the median, not the mean: repeat gaps are heavily right-skewed and a
 * mean lands weeks past where most people buy — which is exactly the error that
 * makes a winback email arrive after the customer has already rebought.
 */
export function RepeatClockView({ data }: { data: RepeatClockData }) {
  const { summary, buckets } = data;

  if (summary.customersMeasured === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          No customer has placed a second order yet
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          The clock needs a first and a second order to measure a gap.
        </p>
      </Card>
    );
  }

  const widest = Math.max(...buckets.map((b) => b.sharePct), 1);

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Median gap
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {summary.medianDays}
            <span className="ml-1 text-sm font-normal text-muted-foreground">days</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">to the second order</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Earliest quarter
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {summary.p25Days}
            <span className="ml-1 text-sm font-normal text-muted-foreground">days</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">25% have returned by here</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Latest quarter
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {summary.p75Days}
            <span className="ml-1 text-sm font-normal text-muted-foreground">days</span>
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">75% have returned by here</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Customers measured
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.customersMeasured)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">with a second order</p>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">
          When the second order arrives
        </h2>
        <ul className="mt-4 flex flex-col gap-3">
          {buckets.map((bucket) => {
            const isMedian = containsMedian(bucket, summary.medianDays);
            return (
              <li key={bucket.label} className="flex flex-col gap-1">
                <div className="flex items-baseline justify-between gap-3 text-sm">
                  <span
                    className={cn(
                      isMedian ? "font-semibold text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {bucket.label}
                    {isMedian && (
                      <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        MEDIAN
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums text-muted-foreground">
                    {formatNumber(bucket.customers)} · {bucket.sharePct}%
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full",
                      isMedian ? "bg-primary" : "bg-primary/40",
                    )}
                    style={{ width: `${(bucket.sharePct / widest) * 100}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </div>
  );
}
