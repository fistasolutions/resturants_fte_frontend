import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { MenuEngineerView } from "@/features/restaurant-os/menu-engineer-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Menu Engineer" };
export const dynamic = "force-dynamic";

/** The Menu Engineer (SPEC-391): the last 30 days' suggestions start here. */
export default function MenuEngineerPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.setup());
  prefetch(queryClient, restaurantQueries.menuEngineer(30));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MenuEngineerView />
    </HydrationBoundary>
  );
}
