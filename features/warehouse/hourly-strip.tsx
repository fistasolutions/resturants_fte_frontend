import { Card } from "@/components/ui/card";
import { formatNumber } from "@/utils/format";
import type { HourlyBucket } from "@/types/warehouse";

function label(hour: number): string {
  const period = hour < 12 ? "a" : "p";
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${h12}${period}`;
}

/** Orders packed by hour of day (packer-local) — shows the day's shape: peak
 * vs dead hours (SPEC-097). Pure CSS bars, no chart lib. */
export function HourlyStrip({ hourly }: { hourly: HourlyBucket[] }) {
  // Tolerate an older/partial backend payload that predates this field.
  if (!hourly || hourly.length === 0) return null;
  const peak = Math.max(...hourly.map((h) => h.orders), 1);

  return (
    <Card className="gap-3 p-5">
      <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        Orders packed by hour
      </p>
      <div className="flex items-end gap-1.5 overflow-x-auto pb-1" style={{ height: 120 }}>
        {hourly.map((h) => (
          <div key={h.hour} className="flex h-full min-w-8 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] tabular-nums text-muted-foreground">{h.orders}</span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-primary/70"
                style={{ height: `${Math.max((h.orders / peak) * 100, 4)}%` }}
                title={`${label(h.hour)}: ${formatNumber(h.orders)} orders`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{label(h.hour)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
