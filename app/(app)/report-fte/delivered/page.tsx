import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DeliveredTab } from "@/features/report-fte/report-fte-tab-pages";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Delivered & scheduled" };
export const dynamic = "force-dynamic";

/** Report FTE → Delivered & scheduled (SPEC-256). Renders inside the persistent shell; the data
 * streams into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, reportFteQueries.delivered());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DeliveredTab />
    </HydrationBoundary>
  );
}
