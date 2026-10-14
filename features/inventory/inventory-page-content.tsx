import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import {
  InventoryTabContent,
  type SharedInventoryTab,
} from "@/features/inventory/inventory-tab-content";
import { resolveDateRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

interface InventoryPageContentProps {
  tab: SharedInventoryTab;
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

/** Shared body for the range Inventory Analyst tabs (SPEC-083; SPEC-100 split).
 * Each tab starts ONLY the slice it renders — the analysis tabs hit `/inventory`;
 * the transfers tab hits transfers + transfer-plan; Overview also pulls by-location
 * and the LLM commentary — and streams them into the client cache (SPEC-230)
 * without waiting. Dead Stock + By Location are their own pages entirely. */
export async function InventoryPageContent({ tab, searchParams }: InventoryPageContentProps) {
  const params = await searchParams;
  const todayISO = new Date().toISOString().slice(0, 10);
  const range = resolveDateRange(
    { range: params.range ?? params.period ?? "30d", from: params.from, to: params.to },
    todayISO,
  );
  const q = { from: range.from, to: range.to };
  const isTransfers = tab === "transfers";
  const isOverview = tab === "overview";

  const queryClient = getQueryClient();
  if (isTransfers) {
    prefetch(queryClient, analysisQueries.inventoryTransfers(q, 1));
    prefetch(queryClient, analysisQueries.transferPlan(q));
  } else {
    prefetch(queryClient, analysisQueries.inventory(q));
  }
  if (isOverview) {
    prefetch(queryClient, analysisQueries.inventoryByLocation());
    prefetch(queryClient, analysisQueries.inventoryCommentary(q));
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <InventoryTabContent tab={tab} range={range} />
    </HydrationBoundary>
  );
}
