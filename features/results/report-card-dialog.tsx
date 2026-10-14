"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LoaderCircle, Send } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { verdictBadge } from "@/features/results/results-tabs";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { scoreboardRows, sendResultSentence } from "@/lib/manager-accountability";
import { resultQueries } from "@/lib/queries/results";
import { sendReportCard } from "@/services/manager-report-card";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

interface ReportCardDialogProps {
  locationId: number | null;
  onClose: () => void;
}

type SendState = { kind: "idle" } | { kind: "sending" } | { kind: "done"; text: string; again: boolean };

/**
 * The Monday card for one store, as the manager would receive it (SPEC-241): the
 * scoreboard for the last completed week, what is open now, last week's notes, the
 * subject line — and Send now. A second send of the same week is a "Send again"
 * (backend `force`); the result is reported in words, never as a bare status code.
 */
export function ReportCardDialog({ locationId, onClose }: ReportCardDialogProps) {
  const queryClient = useQueryClient();
  const [send, setSend] = useState<SendState>({ kind: "idle" });
  const card = useApiQuery(resultQueries.reportCard(locationId ?? 0), {
    enabled: locationId !== null,
  });

  async function handleSend(force: boolean) {
    if (locationId === null) return;
    setSend({ kind: "sending" });
    try {
      const result = await sendReportCard(locationId, force);
      const skippedThisWeek = result.skipped.some((s) => s.reason === "already sent this week");
      setSend({ kind: "done", text: sendResultSentence(result), again: skippedThisWeek });
      void queryClient.invalidateQueries({ queryKey: ["results", "managers"] });
    } catch (error) {
      setSend({
        kind: "done",
        text: error instanceof Error ? error.message : "Could not send the report card.",
        again: false,
      });
    }
  }

  const data = card.data;
  const noEmail = data ? data.location.managerEmail === null : false;

  return (
    <Dialog open={locationId !== null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{data ? `${data.location.name} — Monday report card` : "Monday report card"}</DialogTitle>
          <DialogDescription>
            {data
              ? `Week of ${formatDate(data.week.start)} – ${formatDate(data.week.end)} — the last completed week, as the manager receives it.`
              : "The last completed week, as the manager receives it."}
          </DialogDescription>
        </DialogHeader>

        {card.isPending && locationId !== null ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-full" />
            ))}
          </div>
        ) : card.isError ? (
          <p className="text-sm text-destructive">
            {card.error instanceof ApiError
              ? `Could not load the card (${card.error.status}).`
              : "Could not load the card."}
          </p>
        ) : data ? (
          <div className="space-y-4 text-sm">
            <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">
              Subject: <span className="font-medium text-foreground">{data.subject}</span>
            </p>
            <table className="w-full text-sm">
              <tbody>
                {scoreboardRows(data.scoreboard).map((row) => (
                  <tr key={row.label} className="border-b border-border last:border-0">
                    <td className="py-1.5 text-muted-foreground">{row.label}</td>
                    <td className="py-1.5 text-right font-semibold tabular-nums text-foreground">
                      {row.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p>
              <span className="font-semibold text-foreground">Open right now:</span>{" "}
              {formatNumber(data.openNow.unfulfilled48h)} paid orders unshipped over 48h
              {data.openNow.unfulfilled48hValue > 0
                ? ` (${formatCurrency(data.openNow.unfulfilled48hValue)})`
                : ""}
            </p>
            <div>
              <p className="font-semibold text-foreground">Last week&apos;s notes</p>
              {data.nudges.length === 0 ? (
                <p className="mt-1 text-xs text-muted-foreground">No notes went to this manager last week.</p>
              ) : (
                <ul className="mt-1 space-y-1.5">
                  {data.nudges.map((n, i) => (
                    <li key={`${n.headline}-${i}`} className="flex items-start justify-between gap-2">
                      <span className="min-w-0 text-xs text-foreground">{n.headline}</span>
                      {verdictBadge(n.verdict)}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {noEmail ? (
              <p className="text-xs text-warning">
                No manager email is set for this store — the card cannot be sent until one is.
              </p>
            ) : null}
            {send.kind === "done" ? (
              <p className="text-xs text-muted-foreground" role="status">
                {send.text}
              </p>
            ) : null}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <RoleButton
            need={["messages.send", "results.view"]}
            onClick={() => void handleSend(send.kind === "done" && send.again)}
            disabled={!data || noEmail || send.kind === "sending"}
          >
            {send.kind === "sending" ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <Send className="size-4" aria-hidden />
            )}
            {send.kind === "done" && send.again ? "Send again" : "Send now"}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
