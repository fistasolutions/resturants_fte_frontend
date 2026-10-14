import { KpiStrip } from "@/components/shared/kpi-strip";
import type { StripTile } from "@/lib/kpi-strip";

/** The Brief's KPI strip (SPEC-231) — the shared `KpiStrip` since SPEC-233. */
export function BriefStrip({ tiles }: { tiles: StripTile[] }) {
  return <KpiStrip tiles={tiles} label="Yesterday at a glance" />;
}
