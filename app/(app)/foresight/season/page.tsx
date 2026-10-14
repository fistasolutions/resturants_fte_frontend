import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SeasonTab } from "@/features/foresight/foresight-tab-views";
import { foresightQueries } from "@/lib/queries/foresight";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Season Radar — Foresight" };
export const dynamic = "force-dynamic";

export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, foresightQueries.season());
  prefetch(queryClient, foresightQueries.seasonAccuracy());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SeasonTab />
    </HydrationBoundary>
  );
}
