import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ResultsView } from "@/features/results/results-view";
import { resultQueries } from "@/lib/queries/results";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Results",
};

export const dynamic = "force-dynamic";

export default function ResultsPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, resultQueries.results());
  prefetch(queryClient, resultQueries.ledger());
  prefetch(queryClient, resultQueries.managers());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ResultsView />
    </HydrationBoundary>
  );
}
