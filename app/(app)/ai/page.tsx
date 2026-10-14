import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { AiPerformanceView } from "@/features/ai/ai-performance-view";
import { aiValueQueries } from "@/lib/queries/ai-value";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import type { AiValuePeriod } from "@/types/ai-value";

export const metadata: Metadata = {
  title: "AI Performance",
};

export const dynamic = "force-dynamic";

const PERIOD_KEYS: AiValuePeriod[] = ["all", "90d", "30d", "month"];

/** Content only — the header and period picker live in the persistent shell
 * (SPEC-229). Both reads start together (root Rule 5) and stream into the client
 * cache (SPEC-230), so a period already visited paints instantly. */
export default async function AiPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const requested = (await searchParams).period as AiValuePeriod | undefined;
  const period = requested && PERIOD_KEYS.includes(requested) ? requested : "all";
  const queryClient = getQueryClient();
  prefetch(queryClient, aiValueQueries.overview(period));
  prefetch(queryClient, aiValueQueries.caps());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AiPerformanceView period={period} />
    </HydrationBoundary>
  );
}
