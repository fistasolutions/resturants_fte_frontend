import Link from "next/link";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration } from "@/lib/format-duration";
import { initials } from "@/lib/initials";
import { formatCurrency } from "@/utils/format";
import type { GorgiasAgentMetric } from "@/types/team-performance";

function CsatBadge({ csat }: { csat: number | null }) {
  if (csat === null) return <span className="text-muted-foreground">—</span>;
  const cls =
    csat >= 4.5
      ? "bg-success/10 text-success border-success/20"
      : csat >= 3.5
        ? "bg-warning/10 text-warning border-warning/20"
        : "bg-destructive/10 text-destructive border-destructive/20";
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-xs font-semibold border ${cls}`}
    >
      {csat.toFixed(1)}
    </span>
  );
}

/** Rank pill — top three get a tinted "medal" chip, the rest a muted number. */
function RankBadge({ rank }: { rank: number }) {
  const medal =
    rank === 1
      ? "bg-warning/15 text-warning ring-1 ring-warning/25"
      : rank <= 3
        ? "bg-muted text-foreground ring-1 ring-border"
        : "text-muted-foreground";
  return (
    <span
      className={`inline-flex size-6 items-center justify-center rounded-full text-xs font-semibold tabular-nums ${medal}`}
    >
      {rank}
    </span>
  );
}

const HEAD = "text-right text-xs font-medium uppercase tracking-wide text-muted-foreground";

/** Agent leaderboard (SPEC-094) — one row per agent, each a stretched link to
 * the agent-detail page (the whole row is one accessible link; cmd-click and
 * new-tab work, no client JS). Shared by the Overview and Agents tabs. */
export function LeaderboardTable({
  agents,
  returnTo,
}: {
  agents: GorgiasAgentMetric[];
  returnTo: string;
}) {
  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h2 className="text-sm font-semibold text-foreground">Agent leaderboard</h2>
        <span className="text-xs text-muted-foreground tabular-nums">
          {agents.length} agent{agents.length === 1 ? "" : "s"}
        </span>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-10 text-center text-xs font-medium uppercase tracking-wide text-muted-foreground">
                #
              </TableHead>
              <TableHead className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Agent
              </TableHead>
              <TableHead className={HEAD}>Answered</TableHead>
              <TableHead className={HEAD}>Resolved</TableHead>
              <TableHead className={HEAD}>Avg 1st Response</TableHead>
              <TableHead className={HEAD}>Avg Resolution</TableHead>
              <TableHead className={HEAD}>CSAT</TableHead>
              <TableHead className={HEAD}>Open (EOD)</TableHead>
              <TableHead
                className={HEAD}
                title="Refund $ (in the selected range) for the distinct customers this agent handled — association, not causation"
              >
                Refund exposure
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {agents.map((metric, index) => {
              const href = `/team-performance/agents/${metric.gorgias_agent_id}?returnTo=${encodeURIComponent(
                returnTo,
              )}`;
              const displayName = metric.staff_name ?? metric.name ?? "Unknown";
              return (
                <TableRow key={metric.gorgias_agent_id} className="relative hover:bg-accent/50">
                  <TableCell className="text-center">
                    <RankBadge rank={index + 1} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="text-[0.625rem] font-medium">
                          {initials(displayName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={href}
                          className="font-medium text-foreground outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {displayName}
                        </Link>
                        {!metric.mapped ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {metric.name} · unmapped
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {metric.tickets_answered}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {metric.tickets_resolved}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDuration(metric.avg_first_response_seconds)}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatDuration(metric.avg_resolution_seconds)}
                  </TableCell>
                  <TableCell className="text-right">
                    <CsatBadge csat={metric.csat} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {metric.open_backlog_eod > 0 ? (
                      <span className="font-semibold text-warning">
                        {metric.open_backlog_eod}
                      </span>
                    ) : (
                      metric.open_backlog_eod
                    )}
                  </TableCell>
                  <TableCell className="text-right tabular-nums text-muted-foreground">
                    {metric.refund_exposure === undefined
                      ? "—"
                      : formatCurrency(metric.refund_exposure)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
