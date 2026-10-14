import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ComposeDeadInventoryView } from "@/features/inventory/compose-dead-inventory-view";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Send Dead-Inventory Alert" };
export const dynamic = "force-dynamic";

interface ComposeDeadInventoryPageProps {
  params: Promise<{ productId: string; locationId: string }>;
}

export default async function ComposeDeadInventoryPage({
  params,
}: ComposeDeadInventoryPageProps) {
  const { productId, locationId } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.deadInventoryAlerts());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ComposeDeadInventoryView productId={productId} locationId={locationId} />
    </HydrationBoundary>
  );
}
