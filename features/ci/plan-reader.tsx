"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";

import { PageHeader } from "@/components/shared/page-header";
import { Panel, PanelRow } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { StatusPill } from "@/features/ci/plan-card";
import { PlanDecision } from "@/features/ci/plan-decision";
import { PlanDialog } from "@/features/ci/plan-dialog";
import { PlanReaderSkeleton } from "@/features/ci/plans-skeleton";
import { useCiPlansRefresh } from "@/features/ci/use-ci-plans-refresh";
import { useApiQuery } from "@/hooks/use-api-query";
import { PLAN_STATUS_LABEL, formatEffort } from "@/lib/ci-plans";
import { ciPlanQueries } from "@/lib/queries/ci-plans";
import { planImageHref, removePlan, updatePlan, uploadPlanImage } from "@/services/ci-plans-actions";
import type { CiPlan, PlanDraft } from "@/types/ci-plans";
import { formatDate } from "@/utils/format";

/** A labelled row of the plan — the label above, the body below, as every panel row. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <PanelRow>
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <div className="mt-1 text-sm leading-relaxed">{children}</div>
    </PanelRow>
  );
}

/** The rail: one fact per row, the value on the right. */
function Fact({ label, value }: { label: string; value: string }) {
  return (
    <PanelRow align="center" trailing={<span className="text-sm font-semibold">{value}</span>}>
      <span className="text-sm text-muted-foreground">{label}</span>
    </PanelRow>
  );
}

/**
 * One plan (SPEC-272 → SPEC-278, in the house style): the page header, the plan
 * in panels — in one line, why now, what you get; effort, where it lives, the
 * value; what it looks like — the rail beside it, and the decision at the end.
 * Edit and Remove exist only while the plan is awaiting.
 */
export function PlanReader({ id }: { id: number }) {
  const router = useRouter();
  const refresh = useCiPlansRefresh();
  const query = useApiQuery(ciPlanQueries.plan(id));
  const [editing, setEditing] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [removeError, setRemoveError] = useState<string | null>(null);

  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <PlanReaderSkeleton />;
  const plan: CiPlan = query.data;
  const awaiting = plan.status === "awaiting";

  async function save(draft: PlanDraft, image: File | null) {
    await updatePlan(plan.id, draft);
    if (image) await uploadPlanImage(plan.id, image);
    refresh();
  }

  async function remove() {
    try {
      await removePlan(plan.id);
      refresh();
      router.push("/ci/plans");
    } catch (failure) {
      setRemoveError(failure instanceof Error ? failure.message : "Removing the plan failed.");
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-6 pb-16">
      <Link href="/ci/plans" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" aria-hidden /> All plans
      </Link>

      <PageHeader
        title={plan.title}
        description={`Proposed ${plan.createdAt ? formatDate(plan.createdAt) : "—"} · effort ${formatEffort(plan.effortDays)}`}
        actions={
          awaiting ? (
            <>
              <RoleGate need="ci.manage">
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                  <Pencil className="size-3.5" aria-hidden /> Edit
                </Button>
              </RoleGate>
              <RoleButton need="ci.manage" variant="outline" size="sm" onClick={() => setRemoving(true)} className="text-destructive hover:text-destructive">
                <Trash2 className="size-3.5" aria-hidden /> Remove
              </RoleButton>
            </>
          ) : undefined
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-4" data-plan-paper>
          <Panel title="The plan" aside={<StatusPill status={plan.status} />}>
            <Field label="In one line">{plan.memo}</Field>
            <Field label="Why now">
              <span className="whitespace-pre-line">{plan.why}</span>
            </Field>
            <Field label="What you get">
              <ul className="list-disc space-y-1 pl-5">
                {plan.gets.map((g, i) => (
                  <li key={`${i}-${g}`}>{g}</li>
                ))}
              </ul>
            </Field>
          </Panel>

          <Panel title="Effort · where it lives · the value">
            <Field label="Effort">{`${formatEffort(plan.effortDays)} — spec → build → tests → live, as every report shows.`}</Field>
            <Field label="Where it lives">{plan.whereItLives || "Where it fits best — decided with you."}</Field>
            {plan.value ? <Field label="The value">{plan.value}</Field> : null}
          </Panel>

          {plan.hasImage ? (
            <Panel title="What it looks like">
              <PanelRow>
                {/* Served through the proxy with the session; the browser cache is per plan id. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={planImageHref(plan.id, plan.createdAt)} alt={`What ${plan.title} looks like`} className="w-full rounded-xl border border-border" />
              </PanelRow>
            </Panel>
          ) : null}

          <PlanDecision key={`${plan.status}-${plan.decidedAt ?? ""}`} plan={plan} onDecided={refresh} />
        </div>

        <Panel title="About this plan" className="h-fit lg:sticky lg:top-4">
          <Fact label="Status" value={PLAN_STATUS_LABEL[plan.status]} />
          <Fact label="Proposed" value={plan.createdAt ? formatDate(plan.createdAt) : "—"} />
          <Fact label="By" value={plan.createdByName ?? "—"} />
          <Fact label="Effort" value={formatEffort(plan.effortDays)} />
          <Fact label="Decided by" value={plan.decidedByName ?? "—"} />
          <Fact label="Decided" value={plan.decidedAt ? formatDate(plan.decidedAt) : "—"} />
        </Panel>
      </div>

      {awaiting ? <PlanDialog key={editing ? "open" : "closed"} open={editing} onOpenChange={setEditing} initial={plan} onSubmit={save} /> : null}

      <AlertDialog
        open={removing}
        onOpenChange={(next) => {
          setRemoving(next);
          if (!next) setRemoveError(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove this plan?</AlertDialogTitle>
            <AlertDialogDescription>It has not been decided yet, so nothing is lost but the text. This cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          {removeError ? (
            <p role="alert" className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {removeError}
            </p>
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void remove();
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
