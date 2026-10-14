import { DeltaBadge } from "@/features/brief/brief-kpis";
import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { formatDuration } from "@/lib/format-duration";

/** Epic E-05, "the headline returns KPI" — package arrival to customer
 * refund/exchange. Distinct visual treatment from the supporting
 * `VerdictTile` grid, matching the design mockup already shown to the
 * client (front and center, not just another tile). */
export function ReturnsHeroTile({
  medianSeconds,
  avgSeconds,
  deltaPct,
  compareLabel,
}: {
  medianSeconds: number | null;
  avgSeconds: number | null;
  deltaPct?: number | null;
  compareLabel?: string;
}) {
  return (
    <Card className="relative gap-2 px-6 py-5">
      <p className="pr-6 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        Package arrival &rarr; customer refund/exchange
      </p>
      <ExplainButton
        target={{
          metric: "Package arrival → customer refund/exchange",
          value: `${formatDuration(medianSeconds)} median`,
          delta: deltaPct,
          detail: compareLabel,
        }}
      />
      <div className="flex flex-wrap items-baseline gap-3">
        <p className="font-heading text-3xl tracking-wide tabular-nums">
          {formatDuration(medianSeconds)}
          <span className="ml-2 text-sm font-normal text-muted-foreground">median</span>
        </p>
        {deltaPct != null && (
          <div className="flex items-center gap-1.5">
            {/* Slower resolution (a higher duration) is worse — same
                invertDelta convention as Brief's Refunds tile. */}
            <DeltaBadge delta={deltaPct} invertDelta />
            {compareLabel && (
              <span className="text-[11px] text-muted-foreground">{compareLabel}</span>
            )}
          </div>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        {avgSeconds !== null
          ? `${formatDuration(avgSeconds)} average`
          : "No resolved returns with a known arrival time yet"}
      </p>
    </Card>
  );
}
