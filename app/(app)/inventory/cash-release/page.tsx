import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CashReleaseTab } from "@/features/inventory/inventory-snapshot-tabs";
import { planningQueries } from "@/lib/queries/planning";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Cash Release — Inventory Analyst" };
export const dynamic = "force-dynamic";

// Cash Release tab (SPEC-218). Header + tab bar come from the persistent inventory
// shell (SPEC-085). No date range — the plan is the state of the stockroom right
// now, the same reasoning as Dead Stock and Data Trust. Streams into the client
// cache (SPEC-230).
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, planningQueries.cashRelease());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CashReleaseTab />
    </HydrationBoundary>
  );
}
