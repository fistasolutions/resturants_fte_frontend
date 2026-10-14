"use client";

import Link from "next/link";
import { useState } from "react";

import { confirmCopy } from "@/lib/confirm";
import { useConfirm } from "@/components/shared/confirm-provider";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreTiles } from "@/features/report-fte/score-tiles";
import { useReportFteActions } from "@/features/report-fte/use-report-fte-actions";
import { authorityLabel, splitLead } from "@/lib/report-fte";
import { REPORT_FTE_BASE, templateEditorHref } from "@/lib/report-fte-tabs";
import { cn } from "@/lib/utils";
import type { DeliveredData } from "@/types/report-fte";
import { formatCurrency, formatDateTime } from "@/utils/format";
import { PRODUCT } from "@/lib/product";

type Pane = "scheduled" | "delivered" | "email";

const PANES: Array<{ key: Pane; label: string }> = [
  { key: "scheduled", label: "Scheduled" },
  { key: "delivered", label: "Delivered" },
  { key: "email", label: "What the recipient receives" },
];

const HEAD = "px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const CELL = "px-3 py-2.5 text-sm";

/**
 * Report FTE → Delivered & scheduled (SPEC-256, live since SPEC-285): every recurring
 * report with the authority it runs under, what was sent and whether it was acted on,
 * and the email the last recipient received — rows from the backend's schedules and
 * deliveries. Pause · Approve each · Sends alone patch the schedule; the kill switch
 * turns every schedule off.
 */
export function DeliveredView({ data }: { data: DeliveredData }) {
  const confirm = useConfirm();
  const [pane, setPane] = useState<Pane>("scheduled");
  const actions = useReportFteActions();

  return (
    <div className="flex flex-col gap-4">
      <nav aria-label="Delivery sections" className="flex items-center gap-1 overflow-x-auto border-b border-border">
        {PANES.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPane(p.key)}
            aria-current={pane === p.key ? "page" : undefined}
            className={cn(
              "shrink-0 border-b-2 px-3 py-2 text-sm font-medium transition-colors",
              pane === p.key
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            {p.label}
          </button>
        ))}
      </nav>

      {pane === "scheduled" ? (
        <>
          <Card className="overflow-hidden p-0">
            {data.scheduled.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">No schedule yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className={HEAD}>Report</th>
                      <th className={HEAD}>Runs</th>
                      <th className={HEAD}>Who</th>
                      <th className={HEAD}>Formats</th>
                      <th className={HEAD}>Authority</th>
                      <th className={cn(HEAD, "text-right")}>Last</th>
                      <th className={HEAD} aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {data.scheduled.map((row) => {
                      const authority = authorityLabel(row.authority);
                      return (
                        <tr key={row.id} className="border-t border-border">
                          <td className={cn(CELL, "font-medium text-foreground")}>{row.name}</td>
                          <td className={CELL}>{row.runs}</td>
                          <td className={CELL}>{row.who}</td>
                          <td className={cn(CELL, "text-muted-foreground")}>{row.formats}</td>
                          <td className={CELL}>
                            <StatusBadge tone={authority.tone}>{authority.label}</StatusBadge>
                          </td>
                          <td className={cn(CELL, "text-right tabular-nums")}>{row.last ?? "—"}</td>
                          <td className={cn(CELL, "text-right")}>
                            {row.authority === "off" ? (
                              <Button size="sm" variant="outline" onClick={() => void actions.setScheduleAuthority(row.id, "approve_each")}>
                                Turn on
                              </Button>
                            ) : (
                              <div className="flex justify-end gap-1">
                                {row.authority === "approve_each" ? (
                                  <Button size="sm" variant="ghost" onClick={() => void actions.setScheduleAuthority(row.id, "sends_alone")}>
                                    Sends alone
                                  </Button>
                                ) : (
                                  <Button size="sm" variant="ghost" onClick={() => void actions.setScheduleAuthority(row.id, "approve_each")}>
                                    Approve each
                                  </Button>
                                )}
                                <Button size="sm" variant="ghost" onClick={() => void actions.setScheduleAuthority(row.id, "off")}>
                                  Pause
                                </Button>
                                <Button size="sm" variant="outline" asChild>
                                  <Link href={templateEditorHref(row.templateId)}>Edit</Link>
                                </Button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <p>
              <span className="font-semibold text-foreground">Authority</span> is yours to give: a schedule starts at
              “Approve each” (its runs wait on the Desk for your signature); switch it to “Sends alone” and that report
              delivers itself. Pause stops one; the button on the right stops them all within one tick.
            </p>
            {data.scheduled.some((row) => row.authority !== "off") ? (
              <Button
                size="sm"
                variant="outline"
                className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={async () => {
                  if (await confirm(confirmCopy("schedules"))) {
                    void actions.pauseAll();
                  }
                }}
              >
                Pause every schedule
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {pane === "delivered" ? (
        <>
          <Card className="overflow-hidden p-0">
            {data.delivered.length === 0 ? (
              <p className="p-8 text-center text-sm text-muted-foreground">Nothing delivered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[820px]">
                  <thead className="bg-muted/40">
                    <tr>
                      <th className={HEAD}>Report</th>
                      <th className={HEAD}>Kind</th>
                      <th className={HEAD}>To</th>
                      <th className={HEAD}>Delivered</th>
                      <th className={HEAD}>Opened</th>
                      <th className={HEAD}>Acted on</th>
                      <th className={cn(HEAD, "text-right")}>Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.delivered.map((row) => (
                      <tr key={row.id} className="border-t border-border">
                        <td className={cn(CELL, "font-medium text-foreground")}>
                          {row.href ? (
                            <Link href={row.href} className="underline-offset-2 hover:underline">
                              {row.title}
                            </Link>
                          ) : (
                            row.title
                          )}
                        </td>
                        <td className={cn(CELL, "capitalize text-muted-foreground")}>{row.kind}</td>
                        <td className={CELL}>{row.to}</td>
                        <td className={cn(CELL, "text-muted-foreground")}>{formatDateTime(row.deliveredAt)}</td>
                        <td className={cn(CELL, "text-muted-foreground")}>{row.openedAt ? formatDateTime(row.openedAt) : "not yet"}</td>
                        <td className={CELL}>
                          {row.actedOn ? (
                            <StatusBadge tone="success">{row.actedOn}</StatusBadge>
                          ) : (
                            <StatusBadge tone="neutral">—</StatusBadge>
                          )}
                        </td>
                        <td className={cn(CELL, "text-right tabular-nums")}>{formatCurrency(row.costUsd)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
          <p className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">Acted on</span> comes from the Results ledger — a report is
            judged on what it changed, not on whether it was pretty. That is the FTE&apos;s number.
          </p>
        </>
      ) : null}

      {pane === "email" ? (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Card className="overflow-hidden p-0">
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 border-b border-border bg-muted/40 px-4 py-3 text-xs">
              <dt className="text-muted-foreground">From</dt>
              <dd className="font-medium text-foreground">{data.sample.from}</dd>
              <dt className="text-muted-foreground">To</dt>
              <dd className="font-medium text-foreground">{data.sample.to}</dd>
              <dt className="text-muted-foreground">Subject</dt>
              <dd className="font-medium text-foreground">{data.sample.subject}</dd>
              <dt className="text-muted-foreground">Attached</dt>
              <dd className="font-medium text-foreground">{data.sample.attachment}</dd>
            </dl>
            <div className="flex flex-col gap-3 p-4">
              <p className="text-base font-semibold text-foreground">{data.sample.heading}</p>
              <ScoreTiles tiles={data.sample.kpis} columns={2} label="Email headline figures" />
              {data.sample.lead.map((paragraph) => {
                const { lead, rest } = splitLead(paragraph);
                return (
                  <p key={paragraph} className="max-w-prose text-sm leading-relaxed text-muted-foreground">
                    {lead ? <strong className="font-semibold text-foreground">{lead} </strong> : null}
                    {rest}
                  </p>
                );
              })}
              <div className="flex flex-wrap gap-2">
                <Button size="sm" asChild>
                  <Link href={`${REPORT_FTE_BASE}/composer`}>Open in {PRODUCT.short}</Link>
                </Button>
                <Button size="sm" variant="outline" asChild>
                  <Link href="/chat">Ask Glisp about this</Link>
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">{data.sample.footer}</p>
            </div>
          </Card>
          <Card className="gap-2 p-4">
            <h3 className="text-sm font-semibold text-foreground">Also as</h3>
            <ul className="divide-y divide-border">
              {data.channels.map((channel) => (
                <li key={channel.label} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{channel.label}</p>
                    <p className="text-[11px] text-muted-foreground">{channel.sub}</p>
                  </div>
                  <StatusBadge tone={channel.state === "on" ? "success" : channel.state === "later" ? "ai" : "neutral"}>
                    {channel.state}
                  </StatusBadge>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
