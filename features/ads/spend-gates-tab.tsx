"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  Ban,
  CheckCircle2,
  Loader2,
  Lock,
  ShieldCheck,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleButton } from "@/components/shared/role-gate";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { formatRoas } from "@/lib/ads";
import type { SpendGate, SpendGatesData } from "@/types/ads";

import { approveGate, rejectGate } from "@/services/ads-actions";

import { ChannelBadge, GateActionPill } from "./ads-pills";

/** Only the outcomes the backend actually has (SPEC-198: pending → approved | rejected).
 * The mock MVP also offered "Hold" and "Undo"; both were local-only state that survived
 * nothing. A pending gate IS on hold, and an approved gate cannot be un-approved — the
 * backend returns 409 on a second decision — so buttons implying otherwise were removed
 * rather than left lying on a page that authorises spending. */
type Decision = "pending" | "approved" | "rejected";

const DECIDED: Record<
  Exclude<Decision, "pending">,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  approved: {
    label: "Approved — spend authorized within its cap.",
    className: "border-success/30 bg-success/10 text-success",
    Icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected — this spend will not run.",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    Icon: Ban,
  },
};

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.6875rem] font-medium text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-foreground tabular-nums">{value}</span>
    </div>
  );
}

function GateCard({ gate }: { gate: SpendGate }) {
  const router = useRouter();
  const [decision, setDecision] = useState<Decision>("pending");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  /** Send the decision to the backend and reflect what ACTUALLY happened.
   *
   * The refusals matter as much as the approvals: the backend blocks an approval when
   * the kill switch is active or the monthly cap would be breached, and returns a 409
   * explaining why. That message is shown and the gate stays pending — a refused
   * approval must never render as approved. */
  const decide = (next: Exclude<Decision, "pending">) => {
    setError(null);
    startTransition(async () => {
      try {
        await (next === "approved" ? approveGate(gate.id) : rejectGate(gate.id));
        setDecision(next);
        // Re-fetch: the approval may have launched a campaign and moved the budget
        // strip, so the whole page's numbers are now stale.
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That decision failed.");
      }
    });
  };

  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <GateActionPill action={gate.action} />
          <ChannelBadge channel={gate.channel} />
        </div>
        <CardTitle className="text-lg">{gate.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <p className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <ShieldCheck className="size-3.5" aria-hidden />
            Why the media buyer is asking
          </p>
          <p className="text-sm text-foreground">{gate.rationale}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Projected spend" value={gate.projectedSpend} />
          <Stat label="Expected profit" value={gate.expectedProfit} />
          <Stat label="Projected ROAS" value={formatRoas(gate.expectedRoas)} />
          <div className="flex flex-col">
            <span className="text-[0.6875rem] font-medium text-muted-foreground">
              Cap it fits within
            </span>
            <span className="flex items-start gap-1 text-xs text-foreground">
              <Lock className="mt-0.5 size-3 shrink-0 text-muted-foreground" aria-hidden />
              {gate.capContext}
            </span>
          </div>
        </div>

        <Separator />

        {decision === "pending" ? (
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <RoleButton need="ads.approve" onClick={() => decide("approved")} disabled={pending}>
                {pending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <ThumbsUp className="size-4" aria-hidden />
                )}
                Approve spend
              </RoleButton>
              <RoleButton
                need="ads.approve"
                variant="outline"
                onClick={() => decide("rejected")}
                disabled={pending}
              >
                <Ban className="size-4" aria-hidden />
                Reject
              </RoleButton>
              <span className="text-xs text-muted-foreground">
                Or leave it — an undecided request stays here and spends nothing.
              </span>
            </div>
            {error && (
              <p
                role="alert"
                className="flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            )}
          </div>
        ) : (
          <DecisionBanner decision={decision} />
        )}
      </CardContent>
    </Card>
  );
}

function DecisionBanner({ decision }: { decision: Exclude<Decision, "pending"> }) {
  const meta = DECIDED[decision];
  const Icon = meta.Icon;
  return (
    <div
      role="status"
      className={cn(
        "flex items-center gap-2 rounded-lg border p-3 text-sm font-medium",
        meta.className,
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden />
      {meta.label}
    </div>
  );
}

export function SpendGatesTab({ data }: { data: SpendGatesData }) {
  const count = data.gates.length;
  const projectedTotalNote = useMemo(
    () =>
      `${count} spend ${count === 1 ? "decision" : "decisions"} waiting on you`,
    [count],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3 rounded-card border border-border bg-muted/40 p-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <ShieldCheck className="size-4" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{projectedTotalNote}</p>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="size-3" aria-hidden />
            Every dollar is gated. The AI optimizes only within caps you&apos;ve
            already approved — launching a campaign or raising a budget always stops
            here first.
          </p>
        </div>
        <span className="inline-flex items-center gap-1 rounded-4xl bg-warning/10 px-2 py-1 text-xs font-medium text-warning">
          <TrendingUp className="size-3" aria-hidden />
          {count} pending
        </span>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {data.gates.map((gate) => (
          <GateCard key={gate.id} gate={gate} />
        ))}
      </div>
    </div>
  );
}
