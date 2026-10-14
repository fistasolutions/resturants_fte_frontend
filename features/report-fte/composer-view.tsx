"use client";

import Link from "next/link";
import { useEffect, useReducer, useRef, useState } from "react";
import { Check, Download, LoaderCircle, Play } from "lucide-react";


import { GlispIcon } from "@/components/shared/glisp-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ReportDocument } from "@/features/report-fte/report-document";
import { RevisionChat } from "@/features/report-fte/revision-chat";
import { useReportFteActions } from "@/features/report-fte/use-report-fte-actions";
import {
  composerReducer,
  formatMs,
  hydrateComposerState,
  mergeSections,
  mergeTrace,
  templateForAsk,
  traceProgress,
} from "@/lib/report-fte";
import { REPORT_FTE_BASE, reportPageHref, templateEditorHref } from "@/lib/report-fte-tabs";
import { cn } from "@/lib/utils";
import { runExcelHref, runPdfHref } from "@/services/report-fte-actions";
import { ScheduleReportDialog } from "@/features/report-fte/schedule-report-dialog";
import { SendReportDialog } from "@/features/report-fte/send-report-dialog";
import { cadenceFromRuns, savedScheduleLabel } from "@/lib/report-fte-delivery";
import type {
  ComposerData,
  PlanParam,
  PlanSection,
  ReportDraft,
  ReportTemplateSummary,
  ScheduleResult,
  SendResult,
} from "@/types/report-fte";
import { formatCurrency } from "@/utils/format";

interface Props {
  data: ComposerData;
  templates: ReportTemplateSummary[];
  /** Start the run on arrival — set after a revision (SPEC-286). */
  autorun?: boolean;
}

/**
 * Report FTE → Composer (SPEC-256, live since SPEC-285). Three columns: what the FTE
 * understood (the plan, every section bound to its tool), the report as it composes,
 * and the tool-call trace beside the Deliver panel. "Run the plan" opens the backend's
 * SSE: each frame drops its sections into the report and its calls, with their
 * measured time, into the trace. A pure reducer in `lib/report-fte.ts` owns the phases
 * — idle → running → ready → sent / scheduled — so the buttons can never send an
 * unrun draft; a run reopens in the phase the backend recorded.
 */
export function ComposerView({ data, templates, autorun = false }: Props) {
  const { plan, runId } = data;
  const [revisions, setRevisions] = useState(data.revisions);
  const ask = plan.ask || null;
  const routed = templateForAsk(plan.ask, templates);
  const title = plan.title;
  const [draft, setDraft] = useState<ReportDraft>(data.draft);
  const [state, dispatch] = useReducer(
    composerReducer,
    hydrateComposerState(
      data.status,
      data.draft.sections.map((s) => s.id),
      plan.authorityNote,
      data.draft.computedAt,
    ),
  );
  const actions = useReportFteActions();
  const [dialog, setDialog] = useState<"send" | "schedule" | null>(null);
  const [sentCount, setSentCount] = useState<number | null>(null);
  const [savedSchedule, setSavedSchedule] = useState<string | null>(null);
  const cancel = useRef({ cancelled: false });

  useEffect(() => {
    const token = cancel.current;
    return () => {
      token.cancelled = true;
    };
  }, []);

  const autorunStarted = useRef(false);
  useEffect(() => {
    if (!autorun || autorunStarted.current || data.status !== "draft") return;
    autorunStarted.current = true;
    void run();
    // `run` reads the latest state through refs and dispatch; it is stable enough to call once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autorun, data.status]);

  async function run() {
    dispatch({ type: "run" });
    cancel.current = { cancelled: false };
    const token = cancel.current;
    try {
      const done = await actions.executeRun(runId, (event) => {
        if (token.cancelled) return;
        if (event.event === "section" || event.event === "narrative") {
          setDraft((current) => ({
            ...current,
            sections: mergeSections(current.sections, event.sections),
            trace: mergeTrace(current.trace, event.calls),
          }));
          dispatch({ type: "sections_done", sectionIds: event.sections.map((s) => s.id) });
        }
      });
      if (token.cancelled) return;
      setDraft(done.draft);
      dispatch({ type: "sections_done", sectionIds: done.draft.sections.map((s) => s.id) });
      const total = done.draft.trace.reduce((sum, call) => sum + call.ms, 0);
      const tools = done.draft.trace.filter((c) => c.tool !== "write_narrative").length;
      const ungrounded = done.draft.sections.filter((s) => !s.grounded).length;
      dispatch({
        type: "finish",
        toolCount: tools,
        elapsed: formatMs(total),
        status: ungrounded
          ? `Plan ran · ${tools} tools · ${formatMs(total)} — ${ungrounded} section${ungrounded === 1 ? "" : "s"} could not be grounded and say so. Ready for your signature.`
          : undefined,
      });
    } catch (cause) {
      if (token.cancelled) return;
      dispatch({ type: "fail", message: cause instanceof Error ? cause.message : "The run failed." });
    }
  }

  function applyRevision(result: { run: ComposerData }) {
    setDraft(result.run.draft);
    setRevisions(result.run.revisions);
    dispatch({ type: "reset", status: result.run.plan.authorityNote });
    void run();
  }

  // SPEC-335: both buttons open a dialog; the dialog keeps its own error, so a failed
  // send never loses the chosen people.
  async function send(to: string[]): Promise<SendResult> {
    const result = await actions.approveSend(runId, to);
    setSentCount(result.recipients.length);
    dispatch({ type: "send", to: to.join(", "), at: "", status: result.status });
    return result;
  }

  async function schedule(body: Record<string, unknown>): Promise<ScheduleResult> {
    const result = await actions.approveSchedule(runId, body);
    setSavedSchedule(savedScheduleLabel(result));
    dispatch({ type: "schedule", runs: result.runs, status: result.status });
    return result;
  }

  const doneCalls = draft.trace.filter((call) => state.completed.includes(call.sectionId)).length;
  const progress = traceProgress(doneCalls, draft.trace.length);
  const running = state.phase === "running";
  const canDeliver = state.phase === "ready" || state.phase === "sent" || state.phase === "scheduled";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <StatusBadge tone="ai">Run #{runId}</StatusBadge>
          </div>
          <p className="max-w-3xl text-xs text-muted-foreground">
            {plan.audience.label} · {plan.delivery.label}
            {ask ? ` · from: “${ask}”` : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href={REPORT_FTE_BASE}>Edit the ask</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={routed.templateId ? templateEditorHref(routed.templateId) : `${REPORT_FTE_BASE}/templates`}>
              Save as template
            </Link>
          </Button>
        </div>
      </div>

      {/* At xl the three columns are one viewport-high workspace (SPEC-286 patch): each
          column scrolls on its own, so the report scrolls while the plan and the deliver
          panel stay where they are. */}
      <div className="grid grid-cols-1 gap-4 xl:h-[calc(100dvh-2rem)] xl:min-h-[36rem] xl:grid-cols-[280px_minmax(0,1fr)_280px]">
        {/* plan — fixed beside the scrolling report at xl (SPEC-286) */}
        <Card className="gap-3 p-4 xl:h-full xl:overflow-y-auto scrollbar-subtle">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">What I understood</h3>
            <StatusBadge tone="ai">plan</StatusBadge>
          </div>
          <div className="flex flex-col gap-2">
            <PlanBlock
              label="Audience"
              value={plan.audience.label}
              params={plan.audience.params}
              open={state.editing === "audience"}
              disabled={running}
              onToggle={() => dispatch({ type: "edit", sectionId: state.editing === "audience" ? null : "audience" })}
            />
            <PlanBlock
              label="Period"
              value={plan.period.label}
              params={plan.period.params}
              open={state.editing === "period"}
              disabled={running}
              onToggle={() => dispatch({ type: "edit", sectionId: state.editing === "period" ? null : "period" })}
            />
            <PlanBlock
              label="Delivery"
              value={plan.delivery.label}
              params={plan.delivery.params}
              open={state.editing === "delivery"}
              disabled={running}
              onToggle={() => dispatch({ type: "edit", sectionId: state.editing === "delivery" ? null : "delivery" })}
            />
            <p className="pt-1 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              Sections · the tool each one calls
            </p>
            {plan.sections.map((section) => (
              <PlanSectionBlock
                key={section.id}
                section={section}
                open={state.editing === section.id}
                done={state.completed.some((id) => id === section.id || id.startsWith(`${section.id}-`))}
                disabled={running}
                onToggle={() => dispatch({ type: "edit", sectionId: state.editing === section.id ? null : section.id })}
              />
            ))}
            <p className="text-[11px] text-muted-foreground">
              Click any section to adjust it. Change a section and only that section re-runs.
            </p>
            <Button
              onClick={() => void run()}
              disabled={running}
              className={cn("w-full bg-ai text-ai-foreground hover:bg-ai/90", state.phase !== "idle" && state.phase !== "running" && "bg-success hover:bg-success/90")}
            >
              {running ? (
                <>
                  <LoaderCircle className="size-4 animate-spin" aria-hidden /> Running…
                </>
              ) : state.phase === "idle" ? (
                <>
                  <Play className="size-4" aria-hidden /> Run the plan
                </>
              ) : (
                <>
                  <Check className="size-4" aria-hidden /> Plan ran · re-run
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* report — arranged like a document, skeletons where sections are coming; the
            only column that scrolls with the reading */}
        <div className="min-w-0 xl:h-full xl:overflow-y-auto xl:pb-4 scrollbar-subtle">
          {state.phase === "idle" && state.completed.length === 0 ? (
            <Card className="items-center gap-2 p-10 text-center">
              <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground">
                <Play className="size-5" aria-hidden />
              </span>
              <p className="text-sm font-medium text-foreground">The plan is on the left.</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Run the plan and the report composes here — headline figures, charts, tables, then
                what to do — each section landing as its tool returns. Nothing is estimated; a section
                whose tool fails says so.
              </p>
            </Card>
          ) : (
            <Card className="p-5">
              <ReportDocument
                draft={draft}
                completed={new Set(state.completed)}
                running={running}
                fullHref={canDeliver ? reportPageHref(runId) : undefined}
              />
            </Card>
          )}
        </div>

        {/* trace + deliver + ask for a change — fixed beside the report at xl */}
        {/* `*:shrink-0`: in a height-capped column the cards (overflow-hidden) shrank and
            clipped their own bottoms — Deliver's last button and the change box. */}
        <div className="flex flex-col gap-4 *:shrink-0 xl:h-full xl:overflow-y-auto xl:pb-24 scrollbar-subtle">
          <Card className="gap-3 p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Tool calls</h3>
              <StatusBadge tone={progress.tone}>{progress.label}</StatusBadge>
            </div>
            <ol className="flex flex-col gap-1.5">
              {draft.trace.map((call) => {
                const done = state.completed.includes(call.sectionId);
                return (
                  <li
                    key={`${call.sectionId}:${call.tool}`}
                    className={cn("rounded-lg border border-border px-2.5 py-1.5 transition-opacity", !done && "opacity-40")}
                  >
                    <div className="flex items-baseline justify-between gap-2">
                      <code className="truncate font-mono text-[11px] text-foreground">{call.tool}</code>
                      <span className="shrink-0 font-mono text-[10px] text-muted-foreground">
                        {done ? formatMs(call.ms) : "…"}
                      </span>
                    </div>
                    <p className="break-words font-mono text-[10px] text-muted-foreground">
                      {call.args}
                      {call.costUsd !== undefined ? ` · ${formatCurrency(call.costUsd)}` : ""}
                    </p>
                  </li>
                );
              })}
            </ol>
            <p className="text-[11px] text-muted-foreground">
              Every number in the report links back to one of these calls. A failed tool leaves
              its section saying so — nothing is estimated.
            </p>
          </Card>

          <Card className="gap-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Deliver</h3>
            <div className="flex flex-col gap-2">
              <Button
                onClick={() => setDialog("send")}
                disabled={!canDeliver}
                className={cn(state.phase === "sent" && "bg-success text-success-foreground hover:bg-success")}
              >
                {state.phase === "sent" ? (
                  <>
                    <Check className="size-4" aria-hidden /> Sent{sentCount ? ` to ${sentCount} ${sentCount === 1 ? "person" : "people"}` : ""} · send again
                  </>
                ) : (
                  "Approve & send"
                )}
              </Button>
              <Button
                onClick={() => setDialog("schedule")}
                disabled={!canDeliver}
                className={cn(
                  "bg-ai text-ai-foreground hover:bg-ai/90",
                  state.phase === "scheduled" && "bg-success text-success-foreground hover:bg-success",
                )}
              >
                {state.phase === "scheduled" ? (
                  <>
                    <Check className="size-4 shrink-0" aria-hidden />
                    <span className="truncate">{savedSchedule ?? data.schedule?.runs ?? "Scheduled"}</span>
                  </>
                ) : (
                  "Approve & schedule"
                )}
              </Button>
              {canDeliver ? (
                <>
                  <Button variant="outline" asChild>
                    <a href={runPdfHref(runId)} download>
                      <Download className="size-4" aria-hidden /> Download PDF
                    </a>
                  </Button>
                  <Button variant="outline" asChild>
                    <a href={runExcelHref(runId)} download>
                      <Download className="size-4" aria-hidden /> Download Excel (tables)
                    </a>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" disabled>
                    <Download className="size-4" aria-hidden /> Download PDF
                  </Button>
                  <Button variant="outline" disabled>
                    <Download className="size-4" aria-hidden /> Download Excel (tables)
                  </Button>
                </>
              )}
              <Button variant="ghost" asChild>
                <Link href={REPORT_FTE_BASE}>Back to the Desk</Link>
              </Button>
            </div>
            <p
              role="status"
              className={cn(
                "rounded-lg border px-3 py-2 text-[11px]",
                state.statusTone === "sent"
                  ? "border-success/30 bg-success/10 text-success"
                  : "border-border bg-muted/40 text-muted-foreground",
              )}
            >
              {state.status}
            </p>
            {state.phase === "sent" || state.phase === "scheduled" ? (
              <OutcomeNote runId={runId} onRecord={actions.recordOutcome} />
            ) : null}
          </Card>

          <RevisionChat
            revisions={revisions}
            disabled={running}
            onRevise={(message) => actions.reviseRun(runId, message)}
            onApplied={applyRevision}
          />
        </div>
      </div>

      <SendReportDialog
        open={dialog === "send"}
        onOpenChange={(open) => setDialog(open ? "send" : null)}
        title={title}
        formats="the PDF and Excel attached"
        scheduledRecipients={data.schedule?.recipients}
        onSend={send}
      />
      <ScheduleReportDialog
        open={dialog === "schedule"}
        onOpenChange={(open) => setDialog(open ? "schedule" : null)}
        title={title}
        suggestedCadence={cadenceFromRuns(plan.delivery.params.find((p) => p.label === "Runs")?.value)}
        scheduledRecipients={data.schedule?.recipients}
        onSchedule={schedule}
      />

      <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <GlispIcon className="size-3.5" aria-hidden />
        The narrative is written by the AI on the figures above and cites each one; the figures
        themselves come from the analytics engine.
      </p>
    </div>
  );
}

/** What decision followed — the one line the FTE's scorecard counts (SPEC-283). */
function OutcomeNote({
  runId,
  onRecord,
}: {
  runId: number;
  onRecord: (runId: number, actedOn: string) => Promise<{ actedOn: string | null }>;
}) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="flex flex-col gap-1.5 border-t border-border pt-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (!note.trim() || busy) return;
        setBusy(true);
        onRecord(runId, note.trim())
          .then((result) => setSaved(result.actedOn))
          .catch(() => setSaved(null))
          .finally(() => setBusy(false));
      }}
    >
      <label htmlFor={`outcome-${runId}`} className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
        What did you decide?
      </label>
      <div className="flex gap-2">
        <Input
          id={`outcome-${runId}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="e.g. MIRAGE reorder held"
          className="h-8 text-xs"
          maxLength={300}
        />
        <Button type="submit" size="sm" variant="outline" disabled={!note.trim() || busy}>
          Record
        </Button>
      </div>
      {saved ? (
        <p role="status" className="text-[11px] text-success">
          Recorded — “{saved}” counts on the FTE&apos;s scorecard.
        </p>
      ) : (
        <p className="text-[11px] text-muted-foreground">
          One line. This is the number the employee is judged on.
        </p>
      )}
    </form>
  );
}

function PlanBlock({
  label,
  value,
  params,
  open,
  disabled,
  onToggle,
}: {
  label: string;
  value: string;
  params: PlanParam[];
  open: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-expanded={open}
      className={cn(
        "rounded-lg border border-border bg-card px-2.5 py-2 text-left outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
        open && "border-ai ring-4 ring-ai/10",
      )}
    >
      <span className="block text-xs font-semibold text-foreground">{label}</span>
      <span className="block text-[11px] text-muted-foreground">{value}</span>
      {open && <Params params={params} />}
    </button>
  );
}

function PlanSectionBlock({
  section,
  open,
  done,
  disabled,
  onToggle,
}: {
  section: PlanSection;
  open: boolean;
  done: boolean;
  disabled: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-expanded={open}
      className={cn(
        "rounded-lg border border-border bg-card px-2.5 py-2 text-left outline-none transition-colors hover:border-foreground/40 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60",
        open && "border-ai ring-4 ring-ai/10",
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-foreground">
          {section.index} · {section.title}
        </span>
        {done ? <Check className="size-3.5 shrink-0 text-success" aria-label="Computed" /> : null}
      </span>
      <code className="block break-words font-mono text-[10.5px] text-ai">{section.tool}</code>
      <span className="block text-[11px] text-muted-foreground">{section.viz}</span>
      {open && <Params params={section.params} />}
    </button>
  );
}

function Params({ params }: { params: PlanParam[] }) {
  return (
    <span className="mt-2 grid grid-cols-2 gap-1.5 border-t border-border pt-2">
      {params.map((param) => (
        <span key={param.label} className="min-w-0">
          <span className="block text-[9.5px] font-extrabold uppercase tracking-widest text-muted-foreground">
            {param.label}
          </span>
          <span className="block truncate rounded-md border border-border bg-card px-2 py-1 text-[11px] text-foreground">
            {param.value}
          </span>
        </span>
      ))}
    </span>
  );
}
