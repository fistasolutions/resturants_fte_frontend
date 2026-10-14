import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DataTrustTab } from "@/features/inventory/inventory-snapshot-tabs";
import { dataTrustQueries } from "@/lib/queries/data-trust";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Data Trust — Inventory Analyst" };
export const dynamic = "force-dynamic";

// Data Trust tab (SPEC-217). Header + tab bar come from the persistent inventory
// shell (SPEC-085); this page renders only the content. No date range — catalogue
// integrity is a state of the catalogue right now. Streams into the client cache
// (SPEC-230).
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, dataTrustQueries.report());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DataTrustTab />
    </HydrationBoundary>
  );
}
