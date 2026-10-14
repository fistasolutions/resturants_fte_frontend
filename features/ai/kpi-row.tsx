import { Card } from "@/components/ui/card";
import { formatDuration, formatRate, formatUnitCost, formatUsd } from "@/lib/ai-value";
import type { AiKpis, AiValueOverview } from "@/types/ai-value";

function Kpi({
  label,
  value,
  foot,
  tone,
}: {
  label: string;
  value: string;
  foot: React.ReactNode;
  tone?: "good" | "bad";
}) {
  return (
    <Card className="gap-0 p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p
        className={`mt-1.5 text-[28px] leading-none font-semibold tracking-tight tabular-nums ${
          tone === "bad" ? "text-destructive" : tone === "good" ? "text-success" : "text-foreground"
        }`}
      >
        {value}
      </p>
      <p className="mt-2.5 text-xs text-muted-foreground">{foot}</p>
    </Card>
  );
}

/** The headline. Work done leads and cost supports — a total cost says nothing a person
 * can act on, whereas "6,000 pieces of work, 0.4% failed, 4s typical, $0.002 each" is a
 * performance review. Every figure here is measured from traces, none estimated. */
export function KpiRow({
  kpis,
  totals,
}: {
  kpis: AiKpis;
  totals: AiValueOverview["totals"];
}) {
  const failing = kpis.failureRate >= 0.05;
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Kpi
        label="Work done"
        value={kpis.runs.toLocaleString("en-US")}
        foot={
          <>
            runs across <b className="text-foreground">{kpis.surfacesActive}</b> active
            surfaces · {kpis.modelTurns.toLocaleString("en-US")} model turns
          </>
        }
      />
      <Kpi
        label="Reliability"
        value={formatRate(1 - kpis.failureRate)}
        tone={failing ? "bad" : "good"}
        foot={
          kpis.failures === 0
            ? "No run failed in this period."
            : `${kpis.failures.toLocaleString("en-US")} of ${kpis.runs.toLocaleString("en-US")} runs failed.`
        }
      />
      <Kpi
        label="Typical speed"
        value={formatDuration(kpis.medianMs)}
        foot="Median run, taken across surfaces — an average would be dragged by one long article."
      />
      <Kpi
        label="Cost per run"
        value={formatUnitCost(kpis.costPerRun)}
        foot={
          <>
            {formatUsd(totals.costUsd)} in total · {kpis.toolsPerRun} tool calls a run
          </>
        }
      />
    </div>
  );
}
