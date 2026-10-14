import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BundlesTab } from "@/features/products/product-analysis-tabs";
import { resolveDateRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Bundles" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string; period?: string }>;
}

/** Products → Bundles (SPEC-191). 90 days by default: pair co-occurrence needs volume to mean anything. Renders inside the persistent product shell; the data streams into the
 * client cache (SPEC-230). */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const todayISO = new Date().toISOString().slice(0, 10);
  const range = resolveDateRange(
    { range: params.range ?? params.period ?? "90d", from: params.from, to: params.to },
    todayISO,
  );
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.bundles({ from: range.from, to: range.to }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BundlesTab range={range} />
    </HydrationBoundary>
  );
}
