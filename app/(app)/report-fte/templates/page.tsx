import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TemplatesTab } from "@/features/report-fte/report-fte-tab-pages";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Templates" };
export const dynamic = "force-dynamic";

/** Report FTE → Templates (SPEC-256). Renders inside the persistent shell; the data
 * streams into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, reportFteQueries.templates());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TemplatesTab />
    </HydrationBoundary>
  );
}
