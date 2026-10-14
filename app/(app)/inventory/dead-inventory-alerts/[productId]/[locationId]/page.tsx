import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DeadInventoryAlertDetailView } from "@/features/inventory/dead-inventory-alert-detail-view";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Misplaced Stock" };
export const dynamic = "force-dynamic";

interface DeadInventoryAlertDetailPageProps {
  params: Promise<{ productId: string; locationId: string }>;
}

/** Sub-page for one flagged (style, location) pair — SPEC-064.
 * The backend's windowed alert endpoint is the contract; we select the pair
 * from its payload (no new endpoint needed — root Rule 8, view selection only). */
export default async function DeadInventoryAlertDetailPage({
  params,
}: DeadInventoryAlertDetailPageProps) {
  const { productId, locationId } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.deadInventoryAlerts());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DeadInventoryAlertDetailView productId={productId} locationId={locationId} />
    </HydrationBoundary>
  );
}
