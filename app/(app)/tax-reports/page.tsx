import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TaxReportsView } from "@/features/tax-reports/tax-reports-view";
import { taxReportQueries } from "@/lib/queries/tax-reports";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Sales & Tax Reports" };
export const dynamic = "force-dynamic";

/** The list streams into the client cache (SPEC-230); the newest report's detail +
 * rows are fetched by the view the moment the list names it. */
export default function TaxReportsPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, taxReportQueries.list());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaxReportsView />
    </HydrationBoundary>
  );
}
