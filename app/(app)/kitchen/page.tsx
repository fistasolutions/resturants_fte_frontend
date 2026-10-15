import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { KitchenView } from "@/features/restaurant-os/kitchen-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { normalizeKitchenTab } from "@/lib/restaurant";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Kitchen & Dispatch" };
export const dynamic = "force-dynamic";

/** Kitchen & Dispatch (SPEC-379): the branch list starts here; the live board refreshes itself. */
export default async function KitchenPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.branches());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <KitchenView tab={normalizeKitchenTab(tab)} />
    </HydrationBoundary>
  );
}
