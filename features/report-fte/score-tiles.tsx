import { cn } from "@/lib/utils";
import type { KpiFigure, ScorecardMetric, ValueTone } from "@/types/report-fte";

const TONE: Record<ValueTone, string> = {
  neutral: "text-foreground",
  good: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
};

interface Props {
  tiles: Array<ScorecardMetric | KpiFigure>;
  columns?: 2 | 3 | 4;
  label: string;
}

/**
 * Small figure tiles (SPEC-256) — the scorecard on the Desk and Profile, the KPI
 * strip inside a report section and the email preview. Every value arrives
 * formatted; the tile only chooses its colour from the producer's tone.
 */
export function ScoreTiles({ tiles, columns = 2, label }: Props) {
  return (
    <div
      aria-label={label}
      className={cn(
        "grid gap-2",
        columns === 2 && "grid-cols-2",
        columns === 3 && "grid-cols-2 sm:grid-cols-3",
        columns === 4 && "grid-cols-2 lg:grid-cols-4",
      )}
    >
      {tiles.map((tile) => (
        <div key={"key" in tile ? tile.key : tile.label} className="min-w-0 rounded-xl border border-border bg-card px-3 py-2">
          <p
            title={tile.label}
            className="truncate text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground"
          >
            {tile.label}
          </p>
          {/* A figure is never cut short: a long value ($1,224,480) drops a size rather
              than losing its digits. */}
          <p
            className={cn(
              "font-bold leading-tight tracking-tight tabular-nums",
              tile.value.length > 9 ? "text-sm" : tile.value.length > 7 ? "text-base" : "text-lg",
              TONE[tile.tone],
            )}
          >
            {tile.value}
          </p>
          <p className="text-[11px] leading-snug text-muted-foreground">{tile.sub}</p>
        </div>
      ))}
    </div>
  );
}
