import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CostsTab } from "@/features/products/product-analysis-tabs";
import { resolveDateRange } from "@/lib/date-range";
import { costsQueries } from "@/lib/queries/costs";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Costs" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string; period?: string }>;
}

/** Products → Costs (SPEC-251): the owner's landed-cost entry, coverage and
 * reconciliation on the SPEC-256 engine. Renders inside the persistent product shell;
 * the summary streams into the client cache (SPEC-230). Same range contract as every
 * product tab — the shell's picker owns the label. */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const todayISO = new Date().toISOString().slice(0, 10);
  const range = resolveDateRange(
    { range: params.range ?? params.period ?? "30d", from: params.from, to: params.to },
    todayISO,
  );
  const queryClient = getQueryClient();
  prefetch(queryClient, costsQueries.summary({ from: range.from, to: range.to }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CostsTab range={range} />
    </HydrationBoundary>
  );
}
