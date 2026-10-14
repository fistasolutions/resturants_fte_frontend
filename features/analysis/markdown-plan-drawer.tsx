"use client";

import { RefreshCw, TrendingDown } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import type { DeadStockPlan } from "@/types/analysis";
import { formatCurrency } from "@/utils/format";
import { GlispIcon } from "@/components/shared/glisp-icon";

// ── Discount pill ─────────────────────────────────────────────────────────────

function DiscountPill({ pct }: { pct: number }) {
  const cls =
    pct >= 50
      ? "bg-destructive/15 text-destructive border border-destructive/25"
      : pct >= 35
        ? "bg-warning/15 text-warning border border-warning/25"
        : "bg-warning/10 text-warning/80 border border-warning/20";
  return (
    <span
      className={`inline-flex shrink-0 items-center rounded px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {pct}% off
    </span>
  );
}

// ── Skeleton loader ───────────────────────────────────────────────────────────

function PlanSkeleton() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="space-y-2 rounded-lg border border-border p-4">
          <Skeleton className="h-4 w-2/3" />
          <div className="flex gap-3">
            <Skeleton className="h-6 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

// ── Plan content ──────────────────────────────────────────────────────────────

function PlanContent({ plan, onRefresh, refreshing }: {
  plan: DeadStockPlan;
  onRefresh: () => void;
  refreshing: boolean;
}) {
  return (
    <div className="flex h-full flex-col">
      {/* Summary header */}
      <div className="space-y-1 border-b border-border px-6 pb-4 pt-2">
        <p className="text-lg font-semibold text-foreground">{plan.headline}</p>
        <p className="text-sm text-muted-foreground">
          Projected recovery:{" "}
          <span className="font-medium text-foreground">
            {formatCurrency(plan.total_projected_recovery)}
          </span>
          {plan.stale && (
            <span className="ml-2 text-xs text-muted-foreground">(cached)</span>
          )}
        </p>
      </div>

      {/* Per-product recommendations */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
        {plan.recommendations.map((rec) => (
          <div
            key={rec.product_id}
            className="rounded-lg border border-border bg-card p-4 space-y-2"
          >
            <p className="font-medium text-foreground leading-tight" title={rec.title}>
              {rec.title}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <DiscountPill pct={rec.recommended_discount_pct} />
              <span className="text-sm text-muted-foreground">
                →{" "}
                <span className="font-medium text-foreground">
                  {formatCurrency(rec.projected_recovery)}
                </span>{" "}
                projected
              </span>
            </div>
            <p className="text-xs text-muted-foreground">{rec.action}</p>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-border px-6 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          className="gap-1.5"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} aria-hidden />
          {refreshing ? "Regenerating…" : "Refresh plan"}
        </Button>
      </div>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────

interface MarkdownPlanDrawerProps {
  /** Raw query string, e.g. "start=2026-06-01&end=2026-07-01" */
  query: string;
}

/** Lazily-fetched AI markdown plan in a shadcn Sheet (SPEC-050). */
export function MarkdownPlanDrawer({ query }: MarkdownPlanDrawerProps) {
  const [open, setOpen] = useState(false);
  const [plan, setPlan] = useState<DeadStockPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  async function fetchPlan(refresh = false) {
    setLoading(true);
    setError(false);
    try {
      const url = `/api/proxy/analysis/inventory/dead-stock-plan?${query}${refresh ? "&refresh=true" : ""}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      setPlan((await res.json()) as DeadStockPlan);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (next && plan === null && !loading) {
      void fetchPlan();
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-1.5">
          <GlispIcon className="size-3.5" aria-hidden />
          Open markdown plan
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="w-full max-w-md p-0 sm:max-w-lg">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="flex items-center gap-2 text-base">
            <TrendingDown className="size-4 text-muted-foreground" aria-hidden />
            Markdown plan — frozen cash recovery
          </SheetTitle>
          <SheetDescription>
            AI-recommended discounts to free frozen inventory in 30 days.
          </SheetDescription>
        </SheetHeader>

        {loading && <PlanSkeleton />}

        {!loading && error && (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              Could not load the markdown plan. Try again.
            </p>
            <Button variant="outline" size="sm" onClick={() => void fetchPlan()}>
              Retry
            </Button>
          </div>
        )}

        {!loading && !error && plan && (
          <PlanContent
            plan={plan}
            onRefresh={() => void fetchPlan(true)}
            refreshing={loading}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
