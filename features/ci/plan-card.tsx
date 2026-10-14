"use client";

import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PLAN_STATUS_LABEL, decisionLine, formatEffort } from "@/lib/ci-plans";
import { cn } from "@/lib/utils";
import type { CiPlan, PlanStatus } from "@/types/ci-plans";
import { formatDate } from "@/utils/format";

const LABEL = "text-[10px] font-semibold tracking-widest text-muted-foreground uppercase";

/** Status → the semantic tokens (never brand red): amber while awaiting, green, red. */
const PILL: Record<PlanStatus, string> = {
  awaiting: "bg-warning/15 text-warning",
  accepted: "bg-success text-success-foreground",
  rejected: "bg-destructive text-destructive-foreground",
};

const CARD: Record<PlanStatus, string> = {
  awaiting: "",
  accepted: "border-success bg-success/5",
  rejected: "border-destructive bg-destructive/5",
};

export function StatusPill({ status, className }: { status: PlanStatus; className?: string }) {
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold tracking-widest whitespace-nowrap uppercase", PILL[status], className)}>
      {PLAN_STATUS_LABEL[status]}
    </span>
  );
}

/** The CEO's words on a rejected card, or the acceptance line on a green one. */
function Verdict({ plan }: { plan: CiPlan }) {
  if (plan.status === "rejected") {
    return (
      <div className="rounded-lg bg-destructive/10 p-3 text-[13px] leading-relaxed">
        <p>
          <b>Why not:</b> {plan.rejectReason}
        </p>
        <p className="mt-1">
          <b>Instead:</b> {plan.rejectInstead}
        </p>
      </div>
    );
  }
  if (plan.status === "accepted") {
    return (
      <div className="rounded-lg bg-success/10 p-3 text-[13px] leading-snug">
        <p className="flex items-center gap-2">
          <Check className="size-4 shrink-0 text-success" aria-hidden />
          <span>{decisionLine(plan, formatDate)} — in the build queue</span>
        </p>
        {plan.acceptNote ? (
          <p className="mt-1.5 leading-relaxed">
            <b>Note:</b> {plan.acceptNote}
          </p>
        ) : null}
      </div>
    );
  }
  return null;
}

/** The verdict block already says who; the foot only dates it. */
function footLine(plan: CiPlan): string {
  if (plan.status === "awaiting") return "Open to decide";
  return plan.decidedAt ? `Decided ${formatDate(plan.decidedAt)}` : "Decided";
}

/**
 * One plan on the list (SPEC-272): reads like a proposal cover, coloured by the
 * decision. Awaiting is neutral; accepted goes green with who and when; rejected
 * goes red and carries the two texts the next version answers.
 */
export function PlanCard({ plan }: { plan: CiPlan }) {
  return (
    <Link
      href={`/ci/plans/${plan.id}`}
      className="group rounded-card outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      data-plan-status={plan.status}
    >
      <Card
        className={cn(
          "h-full gap-3 p-5 transition-[transform,box-shadow] duration-150 group-hover:-translate-y-0.5 group-hover:shadow-md",
          CARD[plan.status],
        )}
      >
        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
          <span>
            {plan.createdAt ? formatDate(plan.createdAt) : "—"} · {formatEffort(plan.effortDays)}
          </span>
          <StatusPill status={plan.status} />
        </div>
        <h3 className="font-heading text-xl leading-snug tracking-wide text-foreground">{plan.title}</h3>
        <p className="line-clamp-3 text-[13px] leading-relaxed text-muted-foreground">{plan.memo}</p>
        {plan.value ? (
          <div className="border-t border-border pt-3">
            <p className={LABEL}>The value</p>
            <p className="mt-1 line-clamp-2 text-[13px] leading-snug">{plan.value}</p>
          </div>
        ) : null}
        <Verdict plan={plan} />
        <div className="mt-auto flex items-center justify-between gap-2 pt-2 text-[11px] text-muted-foreground">
          <span className="truncate">{footLine(plan)}</span>
          <span className="inline-flex shrink-0 items-center gap-1 text-foreground group-hover:underline">
            Read the plan <ArrowRight className="size-3.5" aria-hidden />
          </span>
        </div>
      </Card>
    </Link>
  );
}
