import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TrafficReviewView } from "@/features/brief/traffic-review-view";
import { briefQueries } from "@/lib/queries/brief";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Store Traffic Nudges" };
export const dynamic = "force-dynamic";

export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, briefQueries.traffic());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TrafficReviewView />
    </HydrationBoundary>
  );
}
