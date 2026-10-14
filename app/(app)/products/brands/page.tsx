import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BrandsTab } from "@/features/products/product-analysis-tabs";
import { resolveDateRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Brands" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string; period?: string }>;
}

/** Products → Brands (SPEC-239). Renders inside the persistent product shell; the data
 * streams into the client cache (SPEC-230). Same range default as every product tab
 * (the shell's picker owns the label — a page-level 90-day default would show 90-day
 * figures under a "Last 30 days" header); pick 90 days for a buying-season view. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const todayISO = new Date().toISOString().slice(0, 10);
  const range = resolveDateRange(
    { range: params.range ?? params.period ?? "30d", from: params.from, to: params.to },
    todayISO,
  );
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.brandVerdicts({ from: range.from, to: range.to }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BrandsTab range={range} />
    </HydrationBoundary>
  );
}
