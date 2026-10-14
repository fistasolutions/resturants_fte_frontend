import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { WatchingView } from "@/features/settings/watching-view";
import { watchQueries } from "@/lib/queries/watches";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Watching — Settings",
};

/** Watching tab (SPEC-262). Tab body only — chrome lives in the persistent shell
 * (SPEC-097); the list is prefetched into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, watchQueries.list());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WatchingView />
    </HydrationBoundary>
  );
}
