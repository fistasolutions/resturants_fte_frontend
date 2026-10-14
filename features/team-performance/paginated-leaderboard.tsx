"use client";

import Link from "next/link";
import { useState } from "react";

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
import { cn } from "@/lib/utils";
import { formatCurrency } from "@/utils/format";
import type { GorgiasAgentMetric } from "@/types/team-performance";

const PAGE_SIZE = 10;
const HEAD = "text-right text-xs font-medium uppercase tracking-wide text-muted-foreground";

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

/** The rest of the team (rank 4+) as a paginated table (SPEC-094 patch) — 10
 * rows/page, client-side: clicking a page re-renders only the body, instantly,
 * no navigation. Rows are stretched links to the agent-detail page. */
export function PaginatedLeaderboard({
  agents,
  startRank,
  returnTo,
}: {
  agents: GorgiasAgentMetric[];
  startRank: number;
  returnTo: string;
}) {
  const [page, setPage] = useState(0);
  if (agents.length === 0) return null;
  const pageCount = Math.ceil(agents.length / PAGE_SIZE);
  const safePage = Math.min(page, pageCount - 1);
  const rows = agents.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <div className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
      <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">The rest of the team</h3>
        <span className="text-xs text-muted-foreground tabular-nums">
          {agents.length} more agent{agents.length === 1 ? "" : "s"}
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
            {rows.map((metric, i) => {
              const rank = startRank + safePage * PAGE_SIZE + i;
              const name = metric.staff_name ?? metric.name ?? "Unknown";
              const href = `/team-performance/agents/${metric.gorgias_agent_id}?returnTo=${encodeURIComponent(returnTo)}`;
              return (
                <TableRow key={metric.gorgias_agent_id} className="relative hover:bg-accent/50">
                  <TableCell className="text-center text-xs font-semibold tabular-nums text-muted-foreground">
                    {rank}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        <AvatarFallback className="text-[0.625rem] font-medium">
                          {initials(name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <Link
                          href={href}
                          className="font-medium text-foreground outline-none after:absolute after:inset-0 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          {name}
                        </Link>
                        {!metric.mapped ? (
                          <p className="truncate text-xs text-muted-foreground">
                            {metric.name} · unmapped
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{metric.tickets_answered}</TableCell>
                  <TableCell className="text-right tabular-nums">{metric.tickets_resolved}</TableCell>
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
                      <span className="font-semibold text-warning">{metric.open_backlog_eod}</span>
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

      {pageCount > 1 ? (
        <nav
          aria-label="Leaderboard pages"
          className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3"
        >
          <span className="text-xs text-muted-foreground">
            Page {safePage + 1} of {pageCount}
          </span>
          <div className="flex items-center gap-1">
            <PageButton disabled={safePage === 0} onClick={() => setPage(safePage - 1)}>
              Prev
            </PageButton>
            {Array.from({ length: pageCount }, (_, i) => (
              <PageButton key={i} active={i === safePage} onClick={() => setPage(i)}>
                {i + 1}
              </PageButton>
            ))}
            <PageButton disabled={safePage === pageCount - 1} onClick={() => setPage(safePage + 1)}>
              Next
            </PageButton>
          </div>
        </nav>
      ) : null}
    </div>
  );
}

function PageButton({
  children,
  onClick,
  active,
  disabled,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-current={active ? "page" : undefined}
      className={cn(
        "inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-xs font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-foreground",
        disabled && "pointer-events-none opacity-40",
      )}
    >
      {children}
    </button>
  );
}
