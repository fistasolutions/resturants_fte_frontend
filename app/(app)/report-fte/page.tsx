import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DeskTab } from "@/features/report-fte/report-fte-tab-pages";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Report Builder" };
export const dynamic = "force-dynamic";

/** Report FTE → Desk (SPEC-256). Renders inside the persistent shell; the data
 * streams into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, reportFteQueries.desk());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DeskTab />
    </HydrationBoundary>
  );
}
