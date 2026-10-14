import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TaxReportDetailView } from "@/features/tax-reports/tax-report-detail-view";
import { taxReportQueries } from "@/lib/queries/tax-reports";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Sales & Tax Report" };
export const dynamic = "force-dynamic";

export default async function TaxReportDetailPage({
  params,
}: {
  params: Promise<{ reportId: string }>;
}) {
  const { reportId } = await params;
  const id = Number(reportId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  // Parallel, never waterfalled (Rule 5); streamed into the client cache (SPEC-230).
  const queryClient = getQueryClient();
  prefetch(queryClient, taxReportQueries.detail(id));
  prefetch(queryClient, taxReportQueries.rows(id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TaxReportDetailView reportId={id} />
    </HydrationBoundary>
  );
}
