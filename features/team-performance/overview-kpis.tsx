import { formatChange, formatNumber, formatPercent } from "@/utils/format";
import { ExplainButton } from "@/features/chat/explain-button";
import { formatDuration } from "@/lib/format-duration";
import type { GorgiasOverview } from "@/types/gorgias";

type Direction = "up" | "down" | "neutral";

function DeltaChip({ pct, better }: { pct: number | null; better: Direction }) {
  if (pct === null || better === "neutral") {
    return <span className="text-xs text-muted-foreground">{pct === null ? "" : formatChange(pct)}</span>;
  }
  const isGood = pct > 0 ? better === "up" : pct < 0 ? better === "down" : true;
  const tone =
    pct === 0
      ? "text-muted-foreground"
      : isGood
        ? "text-success"
        : "text-destructive";
  return <span className={`text-xs font-medium tabular-nums ${tone}`}>{formatChange(pct)}</span>;
}

function StatTile({
  label,
  value,
  pct,
  better,
}: {
  label: string;
  value: string;
  pct: number | null;
  better: Direction;
}) {
  return (
    <div className="relative rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <p className="pr-6 text-xs font-medium text-muted-foreground">{label}</p>
      <ExplainButton target={{ metric: label, value, delta: pct, detail: "vs previous period" }} />
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <p className="font-heading text-2xl tracking-wide tabular-nums">{value}</p>
        <DeltaChip pct={pct} better={better} />
      </div>
    </div>
  );
}

/** Overview KPI hero (SPEC-094): six tiles, each with a vs-previous-period
 * delta colored by whether the movement is good for that specific metric. */
export function OverviewKpis({ overview }: { overview: GorgiasOverview }) {
  const m = overview.metrics;
  const c = overview.change_pct;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
      <StatTile
        label="Conversations"
        value={formatNumber(m.conversations)}
        pct={c.conversations ?? null}
        better="neutral"
      />
      <StatTile
        label="Resolution rate"
        value={m.resolution_rate === null ? "—" : formatPercent(m.resolution_rate * 100)}
        pct={c.resolution_rate ?? null}
        better="up"
      />
      <StatTile
        label="Avg 1st response"
        value={formatDuration(m.avg_first_response_seconds)}
        pct={c.avg_first_response_seconds ?? null}
        better="down"
      />
      <StatTile
        label="Avg resolution"
        value={formatDuration(m.avg_resolution_seconds)}
        pct={c.avg_resolution_seconds ?? null}
        better="down"
      />
      <StatTile
        label="CSAT"
        value={m.csat === null ? "—" : m.csat.toFixed(2)}
        pct={c.csat ?? null}
        better="up"
      />
      <StatTile
        label="Open backlog"
        value={formatNumber(m.open_backlog)}
        pct={c.open_backlog ?? null}
        better="down"
      />
    </div>
  );
}
