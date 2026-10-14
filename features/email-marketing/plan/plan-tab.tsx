"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { PlanCalendar } from "@/features/email-marketing/plan/plan-calendar";
import { SlotDetail } from "@/features/email-marketing/plan/slot-detail";
import { ReasonDialog } from "@/features/email-marketing/reason-dialog";
import { CalendarSkeleton } from "@/features/email-marketing/skeletons";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { formatMoney } from "@/lib/email-marketing";
import {
  anchorLabel,
  isoDate,
  moveProblem,
  planTotals,
  REJECT_MIN,
  shiftAnchor,
  type PlanView,
} from "@/lib/email-plan";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { cn } from "@/lib/utils";
import { acceptPlanSlot, movePlanSlot, refreshPlan, rejectPlanSlot } from "@/services/email-marketing-actions";

/** The plan (SPEC-345, backend SPEC-354): the employee's proposed sends — from stock, margin,
 * the repeat clock, content and the flows that are missing — that the owner accepts, rejects
 * with a reason, or moves. Each decision is one server call; the nightly job proposes the next. */
export function PlanTab() {
  const plan = useApiQuery(emailMarketingQueries.plan());
  const actions = useEmailMarketingActions();
  const today = useMemo(() => isoDate(new Date()), []);
  const [view, setView] = useState<PlanView>("month");
  const [anchor, setAnchor] = useState(today);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const can = useCan();
  // Accepting, rejecting, moving and refreshing the plan all manage it (SPEC-358).
  const planGate = can("email_marketing.manage");

  if (plan.isPending) return <CalendarSkeleton />;
  if (plan.isError) return <QueryErrorState error={plan.error} onRetry={() => void plan.refetch()} />;
  const slots = plan.data.slots;
  const totals = planTotals(slots);
  const selected = slots.find((slot) => slot.id === selectedId && slot.state !== "rejected") ?? null;

  const move = (id: string, date: string) => {
    if (moveProblem(date, today) || !planGate.allowed) return;
    void actions.run("plan", () => movePlanSlot(id, date));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1">
          <Button size="icon-sm" variant="outline" aria-label={`Previous ${view}`} onClick={() => setAnchor(shiftAnchor(anchor, view, -1))}>
            <ChevronLeft aria-hidden />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label={`Next ${view}`} onClick={() => setAnchor(shiftAnchor(anchor, view, 1))}>
            <ChevronRight aria-hidden />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAnchor(today)}>
            Today
          </Button>
        </div>
        <h2 className="text-base font-semibold" aria-live="polite">
          {anchorLabel(anchor, view)}
        </h2>
        <div className="inline-flex rounded-lg bg-muted p-1" role="group" aria-label="Calendar view">
          {(["month", "week"] as const).map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={view === option}
              onClick={() => setView(option)}
              className={cn(
                "rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                view === option ? "bg-card text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option}
            </button>
          ))}
        </div>
        <RoleButton
          need="email_marketing.manage"
          size="sm"
          variant="outline"
          disabled={actions.busy !== null}
          onClick={() => void actions.run("refresh", refreshPlan)}
        >
          <RefreshCw aria-hidden />
          Refresh the plan
        </RoleButton>
        <p className="ml-auto text-sm text-muted-foreground">
          {totals.accepted} accepted (≈ {formatMoney(totals.acceptedProfit, true)}) · {totals.proposed} proposed (≈ {formatMoney(totals.proposedProfit, true)}) ·{" "}
          {totals.rejected} rejected
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_20rem]">
        <PlanCalendar
          view={view}
          anchor={anchor}
          today={today}
          slots={slots}
          selectedId={selectedId}
          onSelect={setSelectedId}
          onMove={move}
        />
        {selected ? (
          <SlotDetail
            key={selected.id}
            slot={selected}
            today={today}
            busy={actions.busy !== null || !planGate.allowed}
            onAccept={() => void actions.run("plan", () => acceptPlanSlot(selected.id))}
            onReject={() => setRejecting(true)}
            onMove={(date) => move(selected.id, date)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <aside className="rounded-2xl border border-dashed border-border p-4 text-sm text-muted-foreground">
            {slots.length === 0
              ? "Nothing is proposed yet. The employee drafts the plan each night from stock, margin, the repeat clock and the missing flows — or press Refresh the plan."
              : "Pick a slot to see why it is there and decide. Dashed slots are proposals; solid ones are accepted. Drag a slot to another day, or move it from its panel."}
          </aside>
        )}
      </div>
      {!planGate.allowed ? <p className="text-sm text-muted-foreground">{planGate.reason}</p> : null}
      {actions.error ? (
        <p role="alert" className="text-sm text-destructive">
          {actions.error}
        </p>
      ) : null}
      {selected ? (
        <ReasonDialog
          open={rejecting}
          onOpenChange={setRejecting}
          title={`Reject “${selected.title}”?`}
          description="Say why, so the next plan the employee proposes learns from it."
          label="Why not?"
          confirmLabel="Reject"
          minLength={REJECT_MIN}
          onConfirm={(reason) => {
            void actions.run("plan", () => rejectPlanSlot(selected.id, reason));
            setSelectedId(null);
          }}
        />
      ) : null}
    </div>
  );
}
