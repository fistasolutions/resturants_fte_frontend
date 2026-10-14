"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ComposerView } from "@/features/report-fte/composer-view";
import { DeliveredView } from "@/features/report-fte/delivered-view";
import { DeskView } from "@/features/report-fte/desk-view";
import { HistoryView } from "@/features/report-fte/history-view";
import { PlanningSkeleton } from "@/features/report-fte/planning-skeleton";
import { ReportPageView } from "@/features/report-fte/report-page-view";
import { ProfileView } from "@/features/report-fte/profile-view";
import {
  ComposerSkeleton,
  DeliveredSkeleton,
  DeskSkeleton,
  HistorySkeleton,
  ProfileSkeleton,
  ReportPageSkeleton,
  TemplateEditorSkeleton,
  TemplatesSkeleton,
} from "@/features/report-fte/skeletons";
import { TemplateEditorView } from "@/features/report-fte/template-editor-view";
import { TemplatesView } from "@/features/report-fte/templates-view";
import { useReportFteActions } from "@/features/report-fte/use-report-fte-actions";
import { useApiQuery } from "@/hooks/use-api-query";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { REPORT_FTE_BASE, composerRunHref } from "@/lib/report-fte-tabs";

/** The six tabs + the editor (SPEC-256), each read from the client cache (SPEC-230)
 * and rendered inside the persistent shell with its own skeleton and error state. */

export function DeskTab() {
  const desk = useApiQuery(reportFteQueries.desk());
  if (desk.isPending) return <DeskSkeleton />;
  if (desk.isError) return <QueryErrorState error={desk.error} onRetry={() => void desk.refetch()} />;
  return <DeskView data={desk.data} />;
}

export function ComposerTab({ runId, autorun = false }: { runId: number; autorun?: boolean }) {
  const composer = useApiQuery(reportFteQueries.composer(runId));
  const desk = useApiQuery(reportFteQueries.desk());
  if (composer.isPending || desk.isPending) return <ComposerSkeleton />;
  if (composer.isError) return <QueryErrorState error={composer.error} onRetry={() => void composer.refetch()} />;
  if (desk.isError) return <QueryErrorState error={desk.error} onRetry={() => void desk.refetch()} />;
  return <ComposerView key={runId} data={composer.data} templates={desk.data.templates} autorun={autorun} />;
}

export function HistoryTab() {
  const history = useApiQuery(reportFteQueries.history());
  if (history.isPending) return <HistorySkeleton />;
  if (history.isError) return <QueryErrorState error={history.error} onRetry={() => void history.refetch()} />;
  return <HistoryView data={history.data} />;
}

/** The bare document page (SPEC-286) — the shell passes it through unframed. */
export function ReportPageTab({ runId }: { runId: number }) {
  const composer = useApiQuery(reportFteQueries.composer(runId));
  if (composer.isPending) return <ReportPageSkeleton />;
  if (composer.isError) return <QueryErrorState error={composer.error} onRetry={() => void composer.refetch()} />;
  return <ReportPageView data={composer.data} />;
}

/**
 * The composer opened without a run (SPEC-285): with an ask it creates the run and
 * moves to `?run=`; without one it points back to the Desk. A write on arrival, not a
 * read — the plan is a row the moment it exists.
 */
export function ComposerStarter({ ask }: { ask: string | null }) {
  const router = useRouter();
  const actions = useReportFteActions();
  const [error, setError] = useState<string | null>(null);
  const started = useRef(false);
  useEffect(() => {
    if (!ask || started.current) return;
    started.current = true;
    actions
      .createRun({ ask })
      .then((run) => router.replace(composerRunHref(run.runId)))
      .catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Building the plan failed."));
  }, [actions, ask, router]);
  if (!ask) return <ComposerEmpty />;
  if (error) {
    return (
      <Card className="items-center gap-2 p-10 text-center">
        <p className="text-sm font-medium text-foreground">The plan could not be built.</p>
        <p className="text-xs text-muted-foreground">{error}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href={REPORT_FTE_BASE}>Back to the Desk</Link>
        </Button>
      </Card>
    );
  }
  return <PlanningSkeleton ask={ask} />;
}

function ComposerEmpty() {
  return (
    <Card className="items-center gap-2 p-10 text-center">
      <p className="text-sm font-medium text-foreground">No report is open.</p>
      <p className="max-w-sm text-xs text-muted-foreground">
        Type an ask on the Desk, or open a template and choose Run now — the plan the FTE
        understood opens here.
      </p>
      <Button size="sm" asChild>
        <Link href={REPORT_FTE_BASE}>Go to the Desk</Link>
      </Button>
    </Card>
  );
}

export function TemplatesTab() {
  const templates = useApiQuery(reportFteQueries.templates());
  if (templates.isPending) return <TemplatesSkeleton />;
  if (templates.isError) return <QueryErrorState error={templates.error} onRetry={() => void templates.refetch()} />;
  return <TemplatesView data={templates.data} />;
}

export function TemplateEditorTab({ templateId }: { templateId: string }) {
  const template = useApiQuery(reportFteQueries.template(templateId));
  if (template.isPending) return <TemplateEditorSkeleton />;
  if (template.isError) return <QueryErrorState error={template.error} onRetry={() => void template.refetch()} />;
  return <TemplateEditorView key={templateId} data={template.data} />;
}

export function DeliveredTab() {
  const delivered = useApiQuery(reportFteQueries.delivered());
  if (delivered.isPending) return <DeliveredSkeleton />;
  if (delivered.isError) return <QueryErrorState error={delivered.error} onRetry={() => void delivered.refetch()} />;
  return <DeliveredView data={delivered.data} />;
}

export function ProfileTab() {
  const profile = useApiQuery(reportFteQueries.profile());
  if (profile.isPending) return <ProfileSkeleton />;
  if (profile.isError) return <QueryErrorState error={profile.error} onRetry={() => void profile.refetch()} />;
  return <ProfileView data={profile.data} />;
}
