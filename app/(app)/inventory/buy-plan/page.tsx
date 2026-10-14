import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BuyPlanTab } from "@/features/inventory/inventory-snapshot-tabs";
import { resolveDateRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Buy Plan — Inventory Analyst" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface BuyPlanPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

/** Inventory → Buy Plan (SPEC-211). Renders inside the persistent inventory
 * shell, which supplies the header, tab bar and range picker. */
export default async function InventoryBuyPlanPage({ searchParams }: BuyPlanPageProps) {
  const params = await searchParams;
  const todayISO = new Date().toISOString().slice(0, 10);
  // Default to 90 days: a size curve needs more signal than a fortnight.
  const range = resolveDateRange(
    { range: params.range ?? params.period ?? "90d", from: params.from, to: params.to },
    todayISO,
  );
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.buyPlan({ from: range.from, to: range.to }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuyPlanTab range={range} />
    </HydrationBoundary>
  );
}
