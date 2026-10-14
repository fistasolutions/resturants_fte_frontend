import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { OverdueReviewView } from "@/features/brief/overdue-review-view";
import { briefQueries } from "@/lib/queries/brief";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Overdue Orders" };
export const dynamic = "force-dynamic";

export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, briefQueries.overdue());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OverdueReviewView />
    </HydrationBoundary>
  );
}
