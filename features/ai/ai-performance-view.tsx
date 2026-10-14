"use client";

import AiLoading from "@/app/(app)/ai/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { AgentActivity, Anomalies } from "@/features/ai/agent-activity";
import { BudgetPanel } from "@/features/ai/budget-panel";
import { KpiRow } from "@/features/ai/kpi-row";
import { SurfaceTable } from "@/features/ai/surface-table";
import { useApiQuery } from "@/hooks/use-api-query";
import { formatUsd, historicNote } from "@/lib/ai-value";
import { aiValueQueries } from "@/lib/queries/ai-value";
import type { AiValuePeriod } from "@/types/ai-value";

function Section({ children, note }: { children: string; note?: string }) {
  return (
    <div className="mt-6 mb-2.5 flex items-baseline gap-3">
      <h2 className="text-[11px] font-bold tracking-[0.12em] text-muted-foreground uppercase">
        {children}
      </h2>
      {note && <span className="ml-auto text-xs text-muted-foreground">{note}</span>}
    </div>
  );
}

/** AI Performance (SPEC-226/237), read from the client cache (SPEC-230). Content only —
 * the header and period picker live in the persistent shell (SPEC-229). */
export function AiPerformanceView({ period }: { period: AiValuePeriod }) {
  const valueQ = useApiQuery(aiValueQueries.overview(period));
  const capsQ = useApiQuery(aiValueQueries.caps());
  if (valueQ.isPending || capsQ.isPending) return <AiLoading />;
  if (valueQ.isError) return <QueryErrorState error={valueQ.error} onRetry={() => void valueQ.refetch()} />;
  if (capsQ.isError) return <QueryErrorState error={capsQ.error} onRetry={() => void capsQ.refetch()} />;
  const data = valueQ.data;
  const caps = capsQ.data;
  const note = historicNote(data.totals);

  return (
    // Content only — the header and period picker live in the persistent shell
    // (SPEC-229), so they no longer remount on every period change.
    <div className="space-y-2">
      <Section note={data.periodLabel}>How the agents performed</Section>
      <KpiRow kpis={data.kpis} totals={data.totals} />

      <Section note={`${data.periodLabel} · busiest first`}>Every AI surface</Section>
      <SurfaceTable surfaces={data.surfaces} categories={data.categories} />
      <p className="mt-2 text-xs text-muted-foreground">
        Value is claimed only where it is genuinely traceable — {data.totals.measuredSurfaces}{" "}
        of {data.totals.totalSurfaces} surfaces, worth{" "}
        <b className="text-foreground">{formatUsd(data.totals.attributableValueUsd)}</b>.
        Everywhere else the page states why it cannot be measured rather than inventing a
        number.
        {note ? ` ${note}` : ""}
      </p>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <div>
          <Section>What the agents did</Section>
          <AgentActivity tools={data.topTools} kpis={data.kpis} />
        </div>
        <div>
          <Section>Attention</Section>
          <Anomalies anomalies={data.anomalies} />
        </div>
      </div>

      <Section>Spending limits</Section>
      <BudgetPanel caps={caps} surfaces={data.surfaces} />
    </div>
  );
}
