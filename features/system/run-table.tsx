import { Activity } from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { aiTraceHref, formatDuration, formatOutcome, statusTone } from "@/lib/system-trace";
import type { JobRun, RunPage } from "@/types/system";

function when(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Row({ run, showJob }: { run: JobRun; showJob: boolean }) {
  const tone = statusTone(run.status);
  const produced = formatOutcome(run.outcome);

  return (
    <TableRow>
      <TableCell className="align-top whitespace-nowrap tabular-nums">
        {when(run.startedAt)}
      </TableCell>
      {showJob && (
        <TableCell className="align-top">
          <Link
            href={`/system/${run.jobId}`}
            className="font-medium underline-offset-2 hover:underline"
          >
            {run.title ?? run.jobId}
          </Link>
        </TableCell>
      )}
      <TableCell className="align-top">
        <span
          className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-semibold ${tone.chip}`}
        >
          {tone.label}
        </span>
      </TableCell>
      <TableCell className="align-top tabular-nums">
        {formatDuration(run.durationMs)}
      </TableCell>
      <TableCell className="align-top">
        {produced || <span className="text-muted-foreground">—</span>}
        {run.detail && (
          <span className="mt-0.5 block text-xs text-muted-foreground italic">
            {run.detail}
          </span>
        )}
        {run.error && (
          // The message only, never a stack (root Rule 6). Wrapped rather than
          // truncated: a half-shown error is a support ticket.
          <span className="mt-0.5 block text-xs break-words text-destructive">
            {run.error}
          </span>
        )}
      </TableCell>
      <TableCell className="align-top">
        {run.traceId ? (
          // The AI trace is a link, never a duplicate — the step-by-step record
          // lives on /ai and only a handful of these jobs run an agent at all.
          <Link
            href={aiTraceHref(run.traceId)}
            className="inline-flex items-center gap-1 text-xs text-primary underline-offset-2 hover:underline"
          >
            <Activity className="size-3.5" aria-hidden />
            AI trace
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>
    </TableRow>
  );
}

export function RunTable({
  page,
  showJob = true,
  emptyHint,
}: {
  page: RunPage;
  showJob?: boolean;
  emptyHint: string;
}) {
  if (page.runs.length === 0) {
    return (
      <Card className="gap-1 p-8 text-center">
        <p className="text-sm font-medium">No runs match these filters</p>
        {/* Say which filter to clear — an empty table with no reason why is a
            dead end, and the reader cannot tell a quiet night from a wrong filter. */}
        <p className="text-sm text-muted-foreground">{emptyHint}</p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-hidden py-0">
      {/* Scrolls inside itself so the page never scrolls sideways on mobile. */}
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Started</TableHead>
              {showJob && <TableHead>Job</TableHead>}
              <TableHead>Outcome</TableHead>
              <TableHead>Took</TableHead>
              <TableHead>What happened</TableHead>
              <TableHead>Trace</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {page.runs.map((run) => (
              <Row key={run.id} run={run} showJob={showJob} />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}
