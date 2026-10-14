"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronRight, LoaderCircle, Send } from "lucide-react";
import Link from "next/link";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { OutcomeRow } from "@/features/results/results-tabs";
import { ReportCardDialog } from "@/features/results/report-card-dialog";
import {
  actRateCell,
  firstMoveText,
  hasReportCard,
  lastNudgeText,
  sendResultSentence,
  summaryTiles,
  type Tone,
} from "@/lib/manager-accountability";
import { cn } from "@/lib/utils";
import { sendReportCard } from "@/services/manager-report-card";
import type { ManagerAccountability, ManagerRow } from "@/types/results";
import { formatNumber } from "@/utils/format";

const HEAD =
  "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums";

const TONE_CLASS: Record<Tone | "plain", string> = {
  plain: "text-foreground",
  good: "text-success",
  warn: "text-warning",
  muted: "text-muted-foreground",
};

const CATEGORY_LABEL: Record<string, string> = {
  overdue: "Overdue",
  transfers: "Transfers",
  dead_inventory: "Dead inventory",
  orders: "Orders",
  store_traffic: "Store traffic",
  discount_review: "Discount review",
  warehouse: "Warehouse",
  support: "Support",
  returns: "Returns",
};

/**
 * Results → Managers (SPEC-241, backend SPEC-248): every store and configured contact
 * as a row — nudges, worked, no change, measuring, act rate, first move, last nudge —
 * in the backend's order (acts least first, unassigned last). Expand a row for its
 * latest outcomes; Preview card opens the Monday card; Send all now sends to everyone
 * configured. Nothing here is computed (root Rule 8).
 */
export function ManagersTab({ data }: { data: ManagerAccountability }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<Set<string>>(new Set());
  const [preview, setPreview] = useState<number | null>(null);
  const [sendAll, setSendAll] = useState<{ busy: boolean; text: string | null }>({
    busy: false,
    text: null,
  });

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSendAll() {
    setSendAll({ busy: true, text: null });
    try {
      const result = await sendReportCard(null, false);
      setSendAll({ busy: false, text: sendResultSentence(result) });
      void queryClient.invalidateQueries({ queryKey: ["results", "managers"] });
    } catch (error) {
      setSendAll({
        busy: false,
        text: error instanceof Error ? error.message : "Could not send the report cards.",
      });
    }
  }

  const tiles = summaryTiles(data.summary);

  return (
    <div className="space-y-4">
      <section aria-label="Manager accountability summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tiles.map((tile) => (
          <Card key={tile.key} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p className={cn("mt-1 text-xl font-bold tabular-nums", TONE_CLASS[tile.tone])}>
              {tile.value}
            </p>
            {tile.sub ? <p className="mt-0.5 text-[11px] text-muted-foreground">{tile.sub}</p> : null}
          </Card>
        ))}
      </section>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-xs text-muted-foreground">
          Acts = worked ÷ (worked + no change). First move = hours until the first order on a
          list shipped after the nudge — only overdue and orders lists can measure it; the
          platform sees outcomes, not replies. The Monday card goes out automatically when
          switched on in{" "}
          <Link
            href="/settings/automatic-sending"
            className="rounded text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
          >
            Settings → Automatic sending
          </Link>
          .
        </p>
        <div className="flex flex-col items-end gap-1">
          <RoleButton
            need={["messages.send", "results.view"]}
            size="sm"
            onClick={() => void handleSendAll()}
            disabled={sendAll.busy}
          >
            {sendAll.busy ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            Send all Monday cards now
          </RoleButton>
          {sendAll.text ? (
            <p className="max-w-md text-right text-[11px] text-muted-foreground" role="status">
              {sendAll.text}
            </p>
          ) : null}
        </div>
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className={cn(HEAD, "text-left")}>Manager / store</th>
                <th className={cn(HEAD, "text-left")}>Email</th>
                <th className={HEAD}>Nudges</th>
                <th className={HEAD}>Worked</th>
                <th className={HEAD}>No change</th>
                <th className={HEAD}>Measuring</th>
                <th className={HEAD}>Acts</th>
                <th className={HEAD}>First move</th>
                <th className={HEAD}>Last nudge</th>
                <th className={cn(HEAD, "text-left")}></th>
              </tr>
            </thead>
            <tbody>
              {data.managers.map((m) => (
                <ManagerRows
                  key={m.key}
                  row={m}
                  expanded={open.has(m.key)}
                  onToggle={() => toggle(m.key)}
                  onPreview={() => setPreview(m.roles[0]?.locationId ?? null)}
                />
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <ReportCardDialog locationId={preview} onClose={() => setPreview(null)} />
    </div>
  );
}

function ManagerRows({
  row,
  expanded,
  onToggle,
  onPreview,
}: {
  row: ManagerRow;
  expanded: boolean;
  onToggle: () => void;
  onPreview: () => void;
}) {
  const acts = actRateCell(row);
  const unassigned = row.email === null;
  const Chevron = expanded ? ChevronDown : ChevronRight;
  const roleLine = row.roles
    .map((r) => (r.role === "location" ? "Store" : r.role))
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .join(" · ");

  return (
    <>
      <tr className={cn("border-b border-border hover:bg-accent/40", unassigned && "bg-warning/5")}>
        <td className="px-3 py-2.5 text-left text-sm">
          <button
            type="button"
            onClick={onToggle}
            aria-expanded={expanded}
            disabled={row.latest.length === 0}
            className="flex items-center gap-1.5 rounded text-left outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-default"
          >
            <Chevron
              className={cn("size-3.5 shrink-0 text-muted-foreground", row.latest.length === 0 && "invisible")}
              aria-hidden
            />
            <span>
              <span className="font-medium text-foreground">{row.name}</span>
              <span className="mt-0.5 block text-[11px] text-muted-foreground">{roleLine}</span>
            </span>
          </button>
        </td>
        <td className="max-w-[220px] px-3 py-2.5 text-left text-sm">
          {row.email ? (
            <span className="block truncate text-muted-foreground" title={row.email}>
              {row.email}
            </span>
          ) : (
            <Link
              href={row.settingsHref}
              className="rounded text-xs font-semibold text-warning underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              No email set → Settings
            </Link>
          )}
        </td>
        <td className={`${CELL} text-foreground`}>{formatNumber(row.nudges)}</td>
        <td className={`${CELL} ${row.worked > 0 ? "text-success" : "text-muted-foreground"}`}>
          {row.nudges ? formatNumber(row.worked) : "—"}
        </td>
        <td className={`${CELL} ${row.none > 0 ? "text-warning" : "text-muted-foreground"}`}>
          {row.nudges ? formatNumber(row.none) : "—"}
        </td>
        <td className={`${CELL} text-muted-foreground`}>{row.nudges ? formatNumber(row.early) : "—"}</td>
        <td className={cn(CELL, "font-semibold", TONE_CLASS[acts.tone])}>{acts.text}</td>
        <td className={`${CELL} text-muted-foreground`}>{firstMoveText(row)}</td>
        <td className={`${CELL} whitespace-nowrap text-muted-foreground`}>{lastNudgeText(row)}</td>
        <td className="px-3 py-2.5 text-left">
          {hasReportCard(row) ? (
            <Button variant="outline" size="sm" onClick={onPreview}>
              Preview card
            </Button>
          ) : null}
        </td>
      </tr>
      {expanded && row.latest.length > 0 ? (
        <tr className="border-b border-border bg-muted/30">
          <td colSpan={10} className="px-3 py-3">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {Object.entries(row.byCategory).map(([category, count]) => (
                <span
                  key={category}
                  className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                >
                  {CATEGORY_LABEL[category] ?? category} · {formatNumber(count)}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-1 gap-2 lg:grid-cols-3">
              {row.latest.map((entry, i) => (
                <OutcomeRow key={`${entry.headline}-${i}`} entry={entry} />
              ))}
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
