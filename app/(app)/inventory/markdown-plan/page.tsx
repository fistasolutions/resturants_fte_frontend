import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { MarkdownPlanView } from "@/features/inventory/markdown-plan-view";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Markdown Plan" };
export const dynamic = "force-dynamic";

export default function InventoryMarkdownPlanPage() {
  const now = new Date();
  const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
    .toISOString()
    .slice(0, 10);
  const to = now.toISOString().slice(0, 10);
  // The aged data and the STORED plan start in parallel (SPEC-092) and stream into
  // the client cache (SPEC-230).
  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.deadStockAged({ from, to }));
  prefetch(queryClient, analysisQueries.deadStockPlan(true));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <MarkdownPlanView from={from} to={to} />
    </HydrationBoundary>
  );
}
