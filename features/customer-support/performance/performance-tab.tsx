"use client";

import { useState } from "react";
import Link from "next/link";

import { Panel, PanelRow } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PerformanceChart, type TrendMetric } from "@/features/customer-support/performance/performance-chart";
import { PerformanceSkeleton } from "@/features/customer-support/skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { compareAgentHuman, comparisonText, formatMinutes, percent, topicLabel } from "@/lib/customer-support";
import { customerSupportQueries } from "@/lib/queries/customer-support";
import { cn } from "@/lib/utils";
import type { AgentFigures, PerformanceSnapshot } from "@/types/customer-support";
import { formatDateTime } from "@/utils/format";

interface Row {
  key: keyof AgentFigures;
  label: string;
  lowerIsBetter: boolean;
  format: (value: number | null) => string;
}

const ROWS: Row[] = [
  { key: "firstResponseMinutes", label: "First response", lowerIsBetter: true, format: (v) => (v === null ? "—" : formatMinutes(v)) },
  { key: "resolutionHours", label: "Resolution", lowerIsBetter: true, format: (v) => (v === null ? "—" : formatMinutes(v * 60)) },
  { key: "oneTouchRate", label: "One-touch resolution", lowerIsBetter: false, format: (v) => (v === null ? "—" : percent(v)) },
  { key: "reopenRate", label: "Reopened", lowerIsBetter: true, format: (v) => (v === null ? "—" : percent(v)) },
  { key: "csat", label: "CSAT", lowerIsBetter: false, format: (v) => (v === null ? "—" : `${v.toFixed(1)}/5`) },
  { key: "handoffRate", label: "Handed off", lowerIsBetter: true, format: (v) => (v === null ? "—" : percent(v)) },
];

function Comparison({ snapshot }: { snapshot: PerformanceSnapshot }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Figure · {snapshot.periodDays} days</TableHead>
            <TableHead className="text-right">Agent</TableHead>
            <TableHead className="text-right">Team</TableHead>
            <TableHead>Verdict</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {ROWS.map((row) => {
            const agent = snapshot.agent[row.key];
            const team = snapshot.humans[row.key];
            const comparison = row.key === "handoffRate" ? { better: null, deltaPercent: null } : compareAgentHuman(agent, team, row.lowerIsBetter);
            return (
              <TableRow key={row.key}>
                <TableCell className="font-medium">{row.label}</TableCell>
                <TableCell className="text-right tabular-nums">{row.format(agent)}</TableCell>
                <TableCell className="text-right tabular-nums">{row.key === "handoffRate" ? "—" : row.format(team)}</TableCell>
                <TableCell>
                  {row.key === "handoffRate" ? (
                    <span className="text-xs text-muted-foreground">Agent only — share it passed to a person</span>
                  ) : (
                    <StatusBadge tone={comparison.better === "agent" ? "success" : comparison.better === "human" ? "warning" : "neutral"}>
                      {comparisonText(comparison)}
                    </StatusBadge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          <TableRow>
            <TableCell className="font-medium">Tickets resolved</TableCell>
            <TableCell className="text-right tabular-nums">{snapshot.agent.tickets}</TableCell>
            <TableCell className="text-right tabular-nums">{snapshot.humans.tickets}</TableCell>
            <TableCell />
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}

function People({ snapshot }: { snapshot: PerformanceSnapshot }) {
  const rows = [{ name: "Customer Support Agent", figures: snapshot.agent, agent: true }, ...snapshot.people.map((p) => ({ ...p, agent: false }))];
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Who</TableHead>
            <TableHead className="text-right">Resolved</TableHead>
            <TableHead className="text-right">First response</TableHead>
            <TableHead className="text-right">Resolution</TableHead>
            <TableHead className="text-right">CSAT</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.name} className={cn(row.agent && "bg-ai/5")}>
              <TableCell className="font-medium">{row.name}</TableCell>
              <TableCell className="text-right tabular-nums">{row.figures.tickets}</TableCell>
              <TableCell className="text-right tabular-nums">{row.figures.tickets ? formatMinutes(row.figures.firstResponseMinutes) : "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{row.figures.tickets ? formatMinutes(row.figures.resolutionHours * 60) : "—"}</TableCell>
              <TableCell className="text-right tabular-nums">{row.figures.csat === null ? "—" : row.figures.csat.toFixed(1)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/**
 * Performance (SPEC-346): the agent measured with the same figures as the human agents —
 * first response, resolution, one-touch, reopen, CSAT, hand-off rate and accuracy by topic —
 * with the trend, the best and worst topics and the snapshot time. The humans' own page is
 * Team Performance; this links there rather than repeating it.
 */
export function PerformanceTab() {
  const performance = useApiQuery(customerSupportQueries.performance());
  const [metric, setMetric] = useState<TrendMetric>("csat");

  if (performance.isPending) return <PerformanceSkeleton />;
  if (performance.isError) return <QueryErrorState error={performance.error} onRetry={() => void performance.refetch()} />;

  const s = performance.data;
  const ranked = [...s.topics]
    .filter((t): t is typeof t & { accuracy: number } => t.tickets > 0 && t.accuracy !== null)
    .sort((a, b) => b.accuracy - a.accuracy || b.tickets - a.tickets);
  const best = ranked.slice(0, 3);
  const worst = ranked.slice(-3).reverse();

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Snapshot as of {formatDateTime(s.snapshotAt)} · last {s.periodDays} days. The human team’s own detail is in{" "}
        <Link href="/team-performance" prefetch={false} className="font-medium text-primary underline-offset-4 hover:underline">
          Team Performance
        </Link>
        .
      </p>
      <Comparison snapshot={s} />
      <Panel
        title="Trend"
        count="14 days"
        aside={
          <div role="radiogroup" aria-label="Trend figure" className="flex gap-1">
            {(["csat", "frt"] as const).map((key) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={metric === key}
                onClick={() => setMetric(key)}
                className={cn(
                  "rounded-full border px-2 py-0.5 text-[11px] transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  metric === key ? "border-foreground bg-foreground text-background" : "border-border hover:text-foreground",
                )}
              >
                {key === "csat" ? "CSAT" : "First response"}
              </button>
            ))}
          </div>
        }
      >
        <div className="p-3">
          <PerformanceChart trend={s.trend} metric={metric} />
        </div>
      </Panel>
      <div className="grid gap-4 lg:grid-cols-2">
        {[
          { title: "Best topics", rows: best },
          { title: "Worst topics", rows: worst },
        ].map((group) => (
          <Panel key={group.title} title={group.title} aside={<span>by accuracy</span>}>
            {group.rows.map((topic) => (
              <PanelRow
                key={topic.topic}
                align="center"
                trailing={<span className="text-sm font-semibold tabular-nums text-foreground">{percent(topic.accuracy)}</span>}
              >
                <p className="text-sm text-foreground">{topicLabel(topic.topic)}</p>
                <p className="text-[11px] text-muted-foreground">
                  {topic.tickets} tickets · handed off {percent(topic.handoffRate)} · CSAT {topic.csat === null ? "—" : topic.csat.toFixed(1)}
                </p>
              </PanelRow>
            ))}
          </Panel>
        ))}
      </div>
      <People snapshot={s} />
    </div>
  );
}
