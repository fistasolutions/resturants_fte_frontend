import Link from "next/link";

import { DeltaBadge } from "@/components/shared/delta-badge";
import { ExplainButton } from "@/features/chat/explain-button";
import type { StripTile, StripTone } from "@/lib/kpi-strip";
import { cn } from "@/lib/utils";

interface KpiStripProps {
  tiles: StripTile[];
  /** Accessible name of the strip — "Yesterday at a glance", "Key performance indicators". */
  label: string;
  /** Whether each tile carries the ✦ Explain button (SPEC-242). Default on; a strip
   * whose figures no analyst tool can recompute (SPEC-251 Costs) turns it off. */
  explain?: boolean;
}

const TONE_CLASS: Record<StripTone, string> = {
  neutral: "text-foreground",
  good: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
};

/**
 * A KPI strip (SPEC-231, shared in SPEC-233): one row of small tiles under a page
 * header. Everything shown is decided by a `lib/*-strip.ts` builder; this only lays
 * the tiles out. A tile with an `href` is a link. Every tile carries a ✦ Explain
 * button (SPEC-242) — a sibling of the link, never nested inside it.
 */
export function KpiStrip({ tiles, label, explain: explainable = true }: KpiStripProps) {
  if (tiles.length === 0) return null;
  return (
    <div
      className={cn(
        "grid grid-cols-2 gap-2 sm:grid-cols-3",
        tiles.length >= 6 ? "lg:grid-cols-6" : "lg:grid-cols-5",
      )}
      aria-label={label}
    >
      {tiles.map((tile) => {
        const body = (
          <>
            <p className="truncate text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              {tile.label}
            </p>
            <p
              className={cn(
                "truncate text-lg font-bold leading-tight tracking-tight tabular-nums",
                TONE_CLASS[tile.tone],
              )}
            >
              {tile.value}
              {tile.suffix ? (
                <span className="text-sm font-semibold text-muted-foreground/70">
                  {tile.suffix}
                </span>
              ) : null}
            </p>
            {/* Wraps rather than truncates: the compare label carries real dates
                (SPEC-076) and a cut-off date is worse than a taller tile. */}
            <div className="flex min-w-0 flex-wrap items-center gap-x-1.5 text-[11px] leading-snug text-muted-foreground">
              <DeltaBadge delta={tile.delta} invertDelta={tile.invertDelta} />
              <span>{tile.sub}</span>
            </div>
          </>
        );
        const tileClass = cn(
          "block min-w-0 rounded-xl border border-border bg-card px-3 py-2",
          explainable && "pr-8",
        );
        const explain = explainable ? (
          <ExplainButton
            target={{ metric: tile.label, value: tile.value + (tile.suffix ?? ""), delta: tile.delta, detail: tile.sub }}
          />
        ) : null;
        return tile.href ? (
          <div key={tile.key} className="relative min-w-0">
            <Link
              href={tile.href}
              className={cn(
                tileClass,
                "outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              {body}
            </Link>
            {explain}
          </div>
        ) : (
          <div key={tile.key} className={cn("relative", tileClass)}>
            {body}
            {explain}
          </div>
        );
      })}
    </div>
  );
}
