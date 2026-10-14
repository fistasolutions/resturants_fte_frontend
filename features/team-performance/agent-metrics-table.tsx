import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration } from "@/lib/format-duration";
import type { GorgiasAgentMetric } from "@/types/team-performance";
import { formatCurrency } from "@/utils/format";

function CsatBadge({ csat }: { csat: number | null }) {
  if (csat === null) return <span className="text-muted-foreground">—</span>;
  const cls =
    csat >= 4.5
      ? "bg-success/10 text-success border-success/20"
      : csat >= 3.5
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold border ${cls}`}>
      {csat.toFixed(1)}
    </span>
  );
}

function AgentNameCell({ metric }: { metric: GorgiasAgentMetric }) {
  return (
    <div>
      <p className="text-sm font-medium text-foreground">{metric.staff_name ?? metric.name}</p>
      {!metric.mapped ? (
        <p className="text-xs text-muted-foreground">{metric.name} · unmapped</p>
      ) : null}
    </div>
  );
}

/** Pure display (SPEC-081) — one row per Gorgias agent, mapped or not (A-06
 * never drops an unmapped agent from view). */
export function AgentMetricsTable({ agents }: { agents: GorgiasAgentMetric[] }) {
  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent</TableHead>
              <TableHead className="text-right">Answered</TableHead>
              <TableHead className="text-right">Resolved</TableHead>
              <TableHead className="text-right">Avg 1st Response</TableHead>
              <TableHead className="text-right">Avg Resolution</TableHead>
              <TableHead className="text-right">Reopened</TableHead>
              <TableHead className="text-right">CSAT</TableHead>
              <TableHead className="text-right">Open (EOD)</TableHead>
              <TableHead className="text-right">Upsell $</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((metric) => (
              <TableRow key={metric.gorgias_agent_id}>
                <TableCell>
                  <AgentNameCell metric={metric} />
                </TableCell>
                <TableCell className="text-right tabular-nums">{metric.tickets_answered}</TableCell>
                <TableCell className="text-right tabular-nums">{metric.tickets_resolved}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDuration(metric.avg_first_response_seconds)}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {formatDuration(metric.avg_resolution_seconds)}
                </TableCell>
                <TableCell className="text-right tabular-nums">{metric.reopened_count}</TableCell>
                <TableCell className="text-right">
                  <CsatBadge csat={metric.csat} />
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {metric.open_backlog_eod > 0 ? (
                    <span className="font-semibold text-warning">{metric.open_backlog_eod}</span>
                  ) : (
                    metric.open_backlog_eod
                  )}
                </TableCell>
                <TableCell className="text-right tabular-nums text-muted-foreground">
                  {metric.upsell_amount !== null ? formatCurrency(metric.upsell_amount) : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
