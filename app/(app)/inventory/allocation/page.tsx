import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { AllocationTab } from "@/features/inventory/inventory-snapshot-tabs";
import { planningQueries } from "@/lib/queries/planning";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Allocation — Inventory Analyst" };
export const dynamic = "force-dynamic";

// Allocation tab (SPEC-220). Header + tab bar come from the persistent inventory
// shell (SPEC-085). No date range — this is what the stock is doing right now.
// The plan streams into the client cache (SPEC-230).
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, planningQueries.allocation());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AllocationTab />
    </HydrationBoundary>
  );
}
