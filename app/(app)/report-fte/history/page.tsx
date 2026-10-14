import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { HistoryTab } from "@/features/report-fte/report-fte-tab-pages";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "History" };
export const dynamic = "force-dynamic";

/** Report FTE → History (SPEC-286): every run, newest first. */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, reportFteQueries.history());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <HistoryTab />
    </HydrationBoundary>
  );
}
