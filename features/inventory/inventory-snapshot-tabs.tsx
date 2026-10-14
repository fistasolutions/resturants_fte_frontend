"use client";

import ByLocationLoading from "@/app/(app)/inventory/by-location/loading";
import DeadStockLoading from "@/app/(app)/inventory/dead-stock/loading";
import { Skeleton } from "@/components/ui/skeleton";
import { DeadStockSection } from "@/features/analysis/dead-stock-section";
import { AllocationView } from "@/features/inventory/allocation-view";
import { BuyPlanView } from "@/features/inventory/buy-plan-view";
import { ByLocationDashboard } from "@/features/inventory/by-location-dashboard";
import { CashReleaseView } from "@/features/inventory/cash-release-view";
import { DataTrustView } from "@/features/inventory/data-trust-view";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";
import { dataTrustQueries } from "@/lib/queries/data-trust";
import { planningQueries } from "@/lib/queries/planning";
import { QueryErrorState } from "@/components/shared/query-error-state";

/**
 * The snapshot Inventory Analyst tabs — Allocation, Cash Release, Data Trust, By
 * Location, Dead Stock, Buy Plan — read from the client cache (SPEC-230). Header +
 * tab bar come from the persistent inventory shell (SPEC-085); each of these is only
 * its content. The null-on-failure loaders hand null straight to views that already
 * render their own error/empty state for it.
 */

function TabSkeleton() {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </>
  );
}

export function AllocationTab() {
  const plan = useApiQuery(planningQueries.allocation());
  if (plan.isPending) return <TabSkeleton />;
  return <AllocationView data={plan.data ?? null} />;
}

export function CashReleaseTab() {
  const plan = useApiQuery(planningQueries.cashRelease());
  if (plan.isPending) return <TabSkeleton />;
  return <CashReleaseView data={plan.data ?? null} />;
}

export function DataTrustTab() {
  const report = useApiQuery(dataTrustQueries.report());
  if (report.isPending) return <TabSkeleton />;
  return <DataTrustView data={report.data ?? null} />;
}

export function ByLocationTab() {
  const dashboard = useApiQuery(analysisQueries.inventoryByLocation());
  if (dashboard.isPending) return <ByLocationLoading />;
  return <ByLocationDashboard data={dashboard.data ?? null} />;
}

/** Fixed 365-day lookback — dead stock is an aging concept, not a date-range one. */
export function DeadStockTab({ from, to }: { from: string; to: string }) {
  const aged = useApiQuery(analysisQueries.deadStockAged({ from, to }));
  if (aged.isPending) return <DeadStockLoading />;
  // DeadStockSection renders its own empty/loading-safe states and carries the
  // built-in CTA into the AI Markdown Plan.
  return <DeadStockSection data={aged.data ?? null} query={`start=${from}&end=${to}`} />;
}

export function BuyPlanTab({ range }: { range: ResolvedRange }) {
  const plan = useApiQuery(analysisQueries.buyPlan({ from: range.from, to: range.to }));
  if (plan.isPending) return <TabSkeleton />;
  if (plan.isError) return <QueryErrorState error={plan.error} onRetry={() => void plan.refetch()} />;
  return <BuyPlanView data={plan.data} />;
}
