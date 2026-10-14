import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ByLocationTab } from "@/features/inventory/inventory-snapshot-tabs";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "By Location — Inventory Analyst" };
export const dynamic = "force-dynamic";

// By Location tab (SPEC-100): a per-store inventory dashboard — value on hand,
// out-of-stock/low-stock counts, and value share. A stock snapshot (no date
// range); header + tab bar come from the persistent shell (SPEC-085). Streams
// into the client cache (SPEC-230).
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.inventoryByLocation());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ByLocationTab />
    </HydrationBoundary>
  );
}
