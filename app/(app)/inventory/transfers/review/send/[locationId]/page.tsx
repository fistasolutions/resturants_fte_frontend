import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ComposeTransferView } from "@/features/inventory/compose-transfer-view";
import { briefQueries } from "@/lib/queries/brief";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Send Transfer Sheet" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ locationId: string }>;
}

// SPEC-088: relocated from /brief/transfers/send/[locationId]. Backend endpoints
// stay at /brief/transfers/* — only the route moved.
export default async function Page({ params }: PageProps) {
  const { locationId } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, briefQueries.transfers());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ComposeTransferView locationId={locationId} />
    </HydrationBoundary>
  );
}
