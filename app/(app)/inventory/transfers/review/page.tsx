import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TransferReviewView } from "@/features/inventory/transfer-review-view";
import { briefQueries } from "@/lib/queries/brief";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Transfer Review — Inventory Analyst" };
export const dynamic = "force-dynamic";

// Warehouse → store transfer review + send (SPEC-088: relocated from
// /brief/transfers so all transfer actions live under Inventory Analyst).
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, briefQueries.transfers());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TransferReviewView />
    </HydrationBoundary>
  );
}
