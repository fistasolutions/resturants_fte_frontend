import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { MisplacedStockView } from "@/features/inventory/misplaced-stock-view";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Misplaced Stock — Inventory Analyst" };
export const dynamic = "force-dynamic";

// SPEC-089: "Misplaced stock" — a style sitting unsold at one store while it
// sells at another (store→store). Renders bare under the shell with its OWN
// breadcrumb + header; the alerts stream into the client cache (SPEC-230), and the
// detail + send sub-pages read the same cached answer.
export default function MisplacedStockPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.deadInventoryAlerts());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MisplacedStockView />
    </HydrationBoundary>
  );
}
