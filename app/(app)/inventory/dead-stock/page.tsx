import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DeadStockTab } from "@/features/inventory/inventory-snapshot-tabs";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Dead Stock — Inventory Analyst" };
export const dynamic = "force-dynamic";

// Dead Stock tab (SPEC-089): stock that isn't selling ANYWHERE — aged inventory
// + markdown candidates. Distinct from Transfers (which moves stock that IS
// selling elsewhere). Header + tab bar come from the persistent inventory shell
// (SPEC-085); this page renders only the content. Fixed 365-day lookback — dead
// stock is an aging concept, not a date-range one, so this tab has no picker.
export default function DeadStockPage() {
  const now = new Date();
  const to = now.toISOString().slice(0, 10);
  const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.deadStockAged({ from, to }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DeadStockTab from={from} to={to} />
    </HydrationBoundary>
  );
}
