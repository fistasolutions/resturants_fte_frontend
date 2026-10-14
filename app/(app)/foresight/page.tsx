import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ProfitLensTab } from "@/features/foresight/foresight-tab-views";
import { resolveForesightRange } from "@/lib/foresight-tabs";
import { foresightQueries } from "@/lib/queries/foresight";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Profit Lens — Foresight" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

export default async function ForesightProfitPage({ searchParams }: PageProps) {
  const range = resolveForesightRange(await searchParams);
  const queryClient = getQueryClient();
  prefetch(queryClient, foresightQueries.profit({ from: range.from, to: range.to }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfitLensTab range={range} />
    </HydrationBoundary>
  );
}
