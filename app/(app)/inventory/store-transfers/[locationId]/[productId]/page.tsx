import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { StoreTransferDetailView } from "@/features/inventory/store-transfer-detail-view";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const dynamic = "force-dynamic";

interface StoreTransferDetailPageProps {
  params: Promise<{ locationId: string; productId: string }>;
}

export const metadata: Metadata = { title: "Transfer Opportunity" };

/** Sub-page for one transfer-in candidate (SPEC-081) — no new endpoint: the
 * list endpoint is the contract, we select the matching product from its
 * payload (root Rule 8, view selection only), same pattern as the Dead
 * Inventory Alerts detail page. */
export default async function StoreTransferDetailPage({
  params,
}: StoreTransferDetailPageProps) {
  const { locationId, productId } = await params;
  const id = Number(locationId);
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.locationTransfers(id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StoreTransferDetailView locationId={id} productId={productId} />
    </HydrationBoundary>
  );
}
