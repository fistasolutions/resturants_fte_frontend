import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { PosOrders } from "@/features/restaurant-os/pos-orders";
import { PosView } from "@/features/restaurant-os/pos-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { readPosTab } from "@/lib/restaurant-os";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Order Taking" };
export const dynamic = "force-dynamic";

/** Order Taking (SPEC-379/380): the branch list starts here; the branch's menu or its day's orders
 * follow in the browser. */
export default async function PosPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.branches());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      {readPosTab(tab) === "orders" ? <PosOrders /> : <PosView />}
    </HydrationBoundary>
  );
}
