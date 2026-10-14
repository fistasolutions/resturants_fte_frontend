import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SegmentsPageView } from "@/features/customers/segments-page-view";
import { customerQueries } from "@/lib/queries/customers";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Customer Segments" };
export const dynamic = "force-dynamic";

export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, customerQueries.segments());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SegmentsPageView />
    </HydrationBoundary>
  );
}
