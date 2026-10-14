import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TraceView } from "@/features/ai/trace-view";
import { aiValueQueries } from "@/lib/queries/ai-value";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "AI run",
};

export const dynamic = "force-dynamic";

export default async function TracePage({
  params,
}: {
  params: Promise<{ traceId: string }>;
}) {
  const { traceId } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, aiValueQueries.trace(traceId));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TraceView traceId={traceId} />
    </HydrationBoundary>
  );
}
