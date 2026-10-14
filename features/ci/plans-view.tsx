"use client";

import { useCallback, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Card } from "@/components/ui/card";
import { PlanCard } from "@/features/ci/plan-card";
import { PlanDialog } from "@/features/ci/plan-dialog";
import { PlansSkeleton } from "@/features/ci/plans-skeleton";
import { useCiPlansRefresh } from "@/features/ci/use-ci-plans-refresh";
import { useApiQuery } from "@/hooks/use-api-query";
import { PLAN_FILTERS, effortAwaiting, filterPlans, formatEffortOnTable, isPlanFilter, planCounts, type PlanFilter } from "@/lib/ci-plans";
import { ciPlanQueries } from "@/lib/queries/ci-plans";
import { cn } from "@/lib/utils";
import { createPlan, uploadPlanImage } from "@/services/ci-plans-actions";
import type { CiPlan, PlanDraft } from "@/types/ci-plans";
import { formatNumber } from "@/utils/format";

const TILE_VALUE: Record<string, string> = {
  awaiting: "text-warning",
  accepted: "text-success",
  rejected: "text-destructive",
};

/**
 * The Plans list (SPEC-272): three tiles and the effort on the table, a status filter
 * in the URL, the cards newest first, and the team's New plan door. Reads one query
 * from the client cache; the filter narrows without a request.
 */
export function PlansView() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const refresh = useCiPlansRefresh();
  const [open, setOpen] = useState(false);

  const raw = params.get("status");
  const filter: PlanFilter = isPlanFilter(raw) ? raw : "all";
  const query = useApiQuery(ciPlanQueries.list());

  const setFilter = useCallback(
    (next: PlanFilter) => {
      router.replace(next === "all" ? pathname : `${pathname}?status=${next}`, { scroll: false });
    },
    [pathname, router],
  );

  async function submit(draft: PlanDraft, image: File | null) {
    const created: CiPlan = await createPlan(draft);
    if (image) await uploadPlanImage(created.id, image);
    refresh();
  }

  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <PlansSkeleton />;

  const plans = query.data.plans;
  const counts = planCounts(plans);
  const rows = filterPlans(plans, filter);

  return (
    // Bottom padding keeps the last row clear of the Ask Glisp pill.
    <div className="space-y-6 pb-16">
      <section aria-label="Plans summary" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["awaiting", "Awaiting decision", formatNumber(counts.awaiting)],
          ["accepted", "Accepted", formatNumber(counts.accepted)],
          ["rejected", "Rejected — with notes", formatNumber(counts.rejected)],
          ["effort", "Effort on the table", formatEffortOnTable(effortAwaiting(plans))],
        ].map(([key, label, value]) => (
          <Card key={key} className="gap-1 p-4">
            <p className="text-[11px] font-medium tracking-wide text-muted-foreground uppercase">{label}</p>
            <p className={cn("text-lg font-bold tracking-tight tabular-nums", TILE_VALUE[key])}>{value}</p>
          </Card>
        ))}
      </section>

      <section aria-label="Filter plans" className="flex flex-wrap items-center gap-3">
        <div role="group" aria-label="Status" className="flex rounded-lg border border-border bg-card p-0.5">
          {PLAN_FILTERS.map((f) => {
            const on = filter === f.key;
            return (
              <button
                key={f.key}
                type="button"
                aria-pressed={on}
                onClick={() => setFilter(f.key)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {f.label}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground tabular-nums">
          {formatNumber(rows.length)} {rows.length === 1 ? "plan" : "plans"}
        </p>
        <RoleButton need="ci.manage" className="ml-auto" onClick={() => setOpen(true)}>
          <Plus className="size-4" aria-hidden /> New plan
        </RoleButton>
      </section>

      <PlanDialog open={open} onOpenChange={setOpen} onSubmit={submit} />

      {plans.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">No plans yet.</p>
          <p className="mt-1 text-xs text-muted-foreground">
            The team writes the next proposal here; you open it, read it, and decide at the end.
          </p>
        </Card>
      ) : rows.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium">Nothing {filter} right now.</p>
          <button type="button" onClick={() => setFilter("all")} className="mt-1 text-xs text-muted-foreground underline-offset-2 hover:underline">
            Show all plans
          </button>
        </Card>
      ) : (
        <section aria-label="Plans" className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </section>
      )}
      <p className="text-xs text-muted-foreground">
        Newest first. An accepted plan goes into the build queue and appears on Reports when it ships; a rejected plan
        keeps your notes so the next version answers them.
      </p>
    </div>
  );
}
