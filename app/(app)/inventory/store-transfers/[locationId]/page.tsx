import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { StoreTransfersView } from "@/features/inventory/store-transfers-view";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { getLocationTransferOpportunities } from "@/services/analysis";

export const dynamic = "force-dynamic";

interface StoreTransfersPageProps {
  params: Promise<{ locationId: string }>;
}

export async function generateMetadata({
  params,
}: StoreTransfersPageProps): Promise<Metadata> {
  const { locationId } = await params;
  try {
    const data = await getLocationTransferOpportunities(Number(locationId));
    return { title: `${data.location_name} Transfers` };
  } catch {
    return { title: "Store Transfers" };
  }
}

/** Per-store transfer-in opportunities (SPEC-081, client request: clicking a
 * store shows its shortages + what's transferable in from other stores).
 * Depends on backend SPEC-075. Streams into the client cache (SPEC-230); the
 * product sub-page reads the same cached answer. */
export default async function StoreTransfersPage({ params }: StoreTransfersPageProps) {
  const { locationId } = await params;
  const id = Number(locationId);
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.locationTransfers(id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StoreTransfersView locationId={id} />
    </HydrationBoundary>
  );
}
