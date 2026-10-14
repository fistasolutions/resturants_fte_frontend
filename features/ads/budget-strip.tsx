"use client";

import {
  AlertTriangle,
  CircleDollarSign,
  Pause,
  Play,
  Radio,
  Settings2,
} from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { capUtilizationTone } from "@/lib/ads";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validateMonthlyCap } from "@/lib/ads-controls";
import { updateAdsSettings } from "@/services/ads-actions";
import type { BudgetSummary } from "@/types/ads";
import { formatCurrency } from "@/utils/format";

/**
 * The persistent budget/guardrail strip (SPEC-111) — the "capped" promise,
 * always visible below the header on every tab. Shows total cap, spent,
 * remaining, a cap-utilization bar tinted by `capUtilizationTone` (success →
 * warning → destructive, tokens only), and a prominent "Pause all spend"
 * kill-switch. Client component; the kill-switch state + toast live in the
 * shell and are passed in so the strip stays presentational-with-a-button.
 */

const BAR_TONE = {
  healthy: "bg-success",
  nearing: "bg-warning",
  over: "bg-destructive",
} as const;

function Figure({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-[0.6875rem] font-medium text-muted-foreground">{label}</span>
      <span
        className={cn(
          "font-heading tracking-wide tabular-nums",
          emphasis ? "text-lg text-foreground" : "text-base text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

export function BudgetStrip({
  budget,
  paused,
  onToggle,
  busy = false,
  error = null,
  toggleBlockedReason = null,
}: {
  budget: BudgetSummary;
  paused: boolean;
  onToggle: () => void;
  /** A kill-switch call is in flight (SPEC-183). */
  busy?: boolean;
  /** The stop/resume call failed. Shown here rather than swallowed — the operator
   * must know the state did NOT change. */
  error?: string | null;
  /** The member's role may not stop or resume spend (SPEC-358): the switch is disabled with
   * this reason. Null when the role allows it. */
  toggleBlockedReason?: string | null;
}) {
  // `utilization` is backend-computed (Rule 8); clamp only for the bar width.
  const pct = Math.min(Math.round(budget.utilization * 100), 100);
  const tone = capUtilizationTone(budget.utilization);

  return (
    <section
      aria-label="Ad budget and spend controls"
      className="rounded-card border border-border bg-card p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
            <CircleDollarSign className="size-4" aria-hidden />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Budget · {budget.periodLabel}
            </p>
            <p className="flex items-center gap-1 text-xs text-muted-foreground">
              <Radio className="size-3" aria-hidden />
              {budget.liveCampaigns} live · {budget.pendingApprovals} awaiting approval
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <Figure label="Total cap" value={formatCurrency(budget.totalCap)} />
          <Figure label="Spent" value={formatCurrency(budget.spent)} emphasis />
          <Figure label="Remaining" value={formatCurrency(budget.remaining)} />
        </div>

        <Button
          onClick={onToggle}
          disabled={busy || toggleBlockedReason !== null}
          title={toggleBlockedReason ?? undefined}
          variant={paused ? "outline" : "default"}
          aria-pressed={paused}
          className="shrink-0"
        >
          {paused ? (
            <>
              <Play className="size-4" aria-hidden />
              Resume spend
            </>
          ) : (
            <>
              <Pause className="size-4" aria-hidden />
              Pause all spend
            </>
          )}
        </Button>
      </div>

      <div className="mt-4 flex items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Monthly cap utilization"
        >
          <div
            className={cn("h-full rounded-full transition-[width]", BAR_TONE[tone])}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-32 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
          {budget.monthlyCapSet ? `${pct}% of cap used` : "No monthly cap set"}
        </span>
        <RoleGate need="ads.approve">
          <MonthlyCapDialog current={budget.totalCap} />
        </RoleGate>
      </div>

      {/* A failed stop/resume must be loud: the operator has to know the state did
          NOT change, or they will believe spending is halted when it is not. */}
      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-1.5 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
          {error}
        </p>
      )}
      {toggleBlockedReason && (
        <p className="mt-3 text-xs text-muted-foreground">{toggleBlockedReason}</p>
      )}
    </section>
  );
}

/** Sets the store's monthly ceiling — every approval is checked against it, and until
 * one exists the strip reads $0 and the ceiling never binds (SPEC-183). */
function MonthlyCapDialog({ current }: { current: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(current || ""));
  const [error, setError] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();

  const save = () => {
    const invalid = validateMonthlyCap(value);
    setError(invalid);
    if (invalid) return;
    startTransition(async () => {
      try {
        await updateAdsSettings(value.trim());
        setOpen(false);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That did not save.");
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="shrink-0">
          <Settings2 className="size-3.5" aria-hidden />
          Monthly cap
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Monthly spend cap</DialogTitle>
          <DialogDescription>
            The ceiling for all ad spend this month. Every approval is checked against
            it — a request that would cross it is refused. Set 0 for no store-level
            ceiling; each campaign&apos;s own caps still apply.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="monthly-cap">Amount</Label>
          <Input
            id="monthly-cap"
            inputMode="decimal"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            aria-invalid={error ? true : undefined}
          />
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <RoleButton need="ads.approve" onClick={save} disabled={busy}>
            Save cap
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
