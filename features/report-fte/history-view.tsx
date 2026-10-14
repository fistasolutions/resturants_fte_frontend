"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Check, Copy, FileText, Pencil, Trash2, X } from "lucide-react";

import { confirmCopy } from "@/lib/confirm";
import { useConfirm } from "@/components/shared/confirm-provider";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useReportFteActions } from "@/features/report-fte/use-report-fte-actions";
import {
  filterRuns,
  groundedLabel,
  hasDocument,
  runStatusLabel,
  type HistoryFilter,
} from "@/lib/report-fte-history";
import { composerRunHref, reportPageHref } from "@/lib/report-fte-tabs";
import { cn } from "@/lib/utils";
import type { HistoryData, RunSummary } from "@/types/report-fte";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

const HEAD = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const CELL = "px-3 py-2.5 text-sm align-top";
const FILTERS: Array<{ key: HistoryFilter; label: string }> = [
  { key: "all", label: "All" },
  { key: "delivered", label: "Delivered" },
  { key: "drafts", label: "Drafts & ready" },
];

/**
 * Report FTE → History (SPEC-286): every run, newest first, with what it is, when,
 * what it cost and where it went — and the things you can do to one: open it in the
 * Composer, view the document, copy it into a new draft, rename or delete it.
 */
export function HistoryView({ data }: { data: HistoryData }) {
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const runs = filterRuns(data.runs, filter);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1" role="tablist" aria-label="Filter runs">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === f.key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          {data.total} report{data.total === 1 ? "" : "s"} · every run the FTE has built, asked or scheduled
        </p>
      </div>

      <Card className="overflow-hidden p-0">
        {runs.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            {data.total === 0 ? "No reports yet — ask for one on the Desk." : "Nothing matches this filter."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] table-fixed">
              <colgroup>
                <col className="w-[34%]" />
                <col className="w-[12%]" />
                <col className="w-[12%]" />
                <col className="w-[11%]" />
                <col className="w-[15%]" />
                <col className="w-[7%]" />
                <col className="w-[9%]" />
              </colgroup>
              <thead className="bg-muted/40">
                <tr>
                  <th className={HEAD}>Report</th>
                  <th className={HEAD}>Status</th>
                  <th className={HEAD}>Created</th>
                  <th className={HEAD}>Figures</th>
                  <th className={HEAD}>Delivered · acted on</th>
                  <th className={cn(HEAD, "text-right")}>AI cost</th>
                  <th className={cn(HEAD, "text-right")}>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {runs.map((run) => (
                  <HistoryRow key={run.runId} run={run} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}

function HistoryRow({ run }: { run: RunSummary }) {
  const confirm = useConfirm();
  const router = useRouter();
  const actions = useReportFteActions();
  const status = runStatusLabel(run.status);
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(run.title);
  const [busy, setBusy] = useState<"rename" | "copy" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function rename() {
    if (title.trim().length < 3 || busy) return;
    setBusy("rename");
    setError(null);
    try {
      await actions.renameRun(run.runId, title.trim());
      setEditing(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Renaming failed.");
    } finally {
      setBusy(null);
    }
  }

  async function duplicate() {
    if (busy) return;
    setBusy("copy");
    try {
      const copy = await actions.duplicateRun(run.runId);
      router.push(composerRunHref(copy.runId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Copying failed.");
      setBusy(null);
    }
  }

  async function remove() {
    if (busy) return;
    if (!(await confirm(confirmCopy("run", run.title)))) return;
    setBusy("delete");
    try {
      await actions.deleteRun(run.runId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Deleting failed.");
      setBusy(null);
    }
  }

  return (
    <tr className={cn(busy === "delete" && "opacity-50")}>
      <td className={CELL}>
        {editing ? (
          <form
            className="flex items-center gap-1"
            onSubmit={(event) => {
              event.preventDefault();
              void rename();
            }}
          >
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-8 w-56 text-sm"
              maxLength={160}
              autoFocus
            />
            <Button
              type="submit"
              size="icon"
              variant="ghost"
              aria-label="Save name"
              disabled={busy !== null || title.trim().length < 3}
            >
              <Check className="size-4" aria-hidden />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              aria-label="Cancel"
              onClick={() => {
                setEditing(false);
                setTitle(run.title);
              }}
            >
              <X className="size-4" aria-hidden />
            </Button>
          </form>
        ) : (
          <div className="min-w-0">
            <Link href={composerRunHref(run.runId)} className="block truncate font-medium text-foreground hover:underline" title={run.title}>
              {run.title}
            </Link>
            <p className="truncate text-[11px] text-muted-foreground" title={run.ask || undefined}>
              {run.kind === "scheduled" ? "Scheduled" : "Asked"}
              {run.templateId ? ` · ${run.templateId}` : ""}
              {run.ask ? ` · “${run.ask}”` : ""}
            </p>
            {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
          </div>
        )}
      </td>
      <td className={CELL}>
        <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
      </td>
      <td className={cn(CELL, "whitespace-nowrap text-muted-foreground")}>
        {run.createdAt ? (
          <>
            {formatDate(run.createdAt)}
            <span className="block text-[11px]">{formatTime(run.createdAt)}</span>
          </>
        ) : (
          "—"
        )}
      </td>
      <td className={cn(CELL, "whitespace-nowrap text-muted-foreground")}>{groundedLabel(run)}</td>
      <td className={cn(CELL, "min-w-0 text-muted-foreground")}>
        {run.deliveredAt ? (
          <span className="block truncate" title={run.deliveredTo ?? undefined}>
            {run.deliveredTo} · {formatDate(run.deliveredAt)}
          </span>
        ) : (
          <span className="block">not delivered</span>
        )}
        {run.actedOn ? (
          <span className="block truncate text-[11px] text-foreground" title={run.actedOn}>
            ✓ {run.actedOn}
          </span>
        ) : null}
      </td>
      <td className={cn(CELL, "text-right tabular-nums text-muted-foreground")}>{formatCurrency(run.costUsd)}</td>
      <td className={cn(CELL, "text-right")}>
        <div className="flex justify-end gap-0.5">
          {hasDocument(run) ? (
            <Button size="icon" variant="ghost" aria-label="View the report" asChild>
              <Link href={reportPageHref(run.runId)}>
                <FileText className="size-4" aria-hidden />
              </Link>
            </Button>
          ) : null}
          <Button size="icon" variant="ghost" aria-label="Rename" onClick={() => setEditing(true)} disabled={busy !== null}>
            <Pencil className="size-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            aria-label="Copy into a new draft"
            onClick={() => void duplicate()}
            disabled={busy !== null}
          >
            <Copy className="size-4" aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            aria-label="Delete"
            onClick={() => void remove()}
            disabled={busy !== null || run.status === "running"}
          >
            <Trash2 className="size-4" aria-hidden />
          </Button>
        </div>
      </td>
    </tr>
  );
}
