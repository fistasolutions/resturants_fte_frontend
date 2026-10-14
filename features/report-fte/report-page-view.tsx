"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, PencilRuler } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ReportDocument } from "@/features/report-fte/report-document";
import { RevisionChat } from "@/features/report-fte/revision-chat";
import { useReportFteActions } from "@/features/report-fte/use-report-fte-actions";
import { runStatusLabel } from "@/lib/report-fte-history";
import { REPORT_FTE_BASE, composerRunHref } from "@/lib/report-fte-tabs";
import { runExcelHref, runPdfHref } from "@/services/report-fte-actions";
import type { ComposerData } from "@/types/report-fte";

/**
 * One generated report, full width (SPEC-286): its own header with the way back, the
 * files and the way into the Composer; the arranged document at reading width; the
 * revision chat beside it. A change here re-runs in the Composer (`autorun=1`).
 */
export function ReportPageView({ data }: { data: ComposerData }) {
  const router = useRouter();
  const actions = useReportFteActions();
  const status = runStatusLabel(data.status);
  const completed = new Set(data.draft.sections.map((s) => s.id));
  const hasFigures = data.status === "ready" || data.status === "sent" || data.status === "scheduled";

  return (
    <main className="min-w-0 flex-1 space-y-4 p-4 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`${REPORT_FTE_BASE}/history`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" aria-hidden /> History
          </Link>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">{data.plan.title}</h1>
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
            <StatusBadge tone="neutral">Run #{data.runId}</StatusBadge>
          </div>
          <p className="max-w-3xl text-xs text-muted-foreground">
            {data.plan.audience.label} · {data.plan.period.label} · {data.plan.delivery.label}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {hasFigures ? (
            <>
              <Button variant="outline" size="sm" asChild>
                <a href={runPdfHref(data.runId)} download>
                  <Download className="size-3.5" aria-hidden /> PDF
                </a>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <a href={runExcelHref(data.runId)} download>
                  <Download className="size-3.5" aria-hidden /> Excel
                </a>
              </Button>
            </>
          ) : null}
          <Button size="sm" asChild>
            <Link href={composerRunHref(data.runId)}>
              <PencilRuler className="size-3.5" aria-hidden /> Open in Composer
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card className="p-6 md:p-8">
          {hasFigures ? (
            <div className="mx-auto w-full max-w-4xl">
              <ReportDocument draft={data.draft} completed={completed} running={false} variant="page" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <p className="text-sm font-medium text-foreground">This report has not run yet.</p>
              <p className="max-w-sm text-xs text-muted-foreground">
                Open it in the Composer and run the plan — the document appears here once every
                tool has returned.
              </p>
              <Button size="sm" asChild>
                <Link href={composerRunHref(data.runId)}>Open in Composer</Link>
              </Button>
            </div>
          )}
        </Card>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <RevisionChat
            revisions={data.revisions}
            onRevise={(message) => actions.reviseRun(data.runId, message)}
            onApplied={() => router.push(`${composerRunHref(data.runId)}&autorun=1`)}
          />
        </div>
      </div>
    </main>
  );
}
