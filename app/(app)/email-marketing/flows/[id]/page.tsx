import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { FlowDetailView } from "@/features/email-marketing/flows/flow-detail-view";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Flow — Email Marketing Manager" };
export const dynamic = "force-dynamic";

/** One flow (SPEC-345) — its own header; the reads start together (SPEC-230). */
export default async function FlowPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, emailMarketingQueries.flow(id));
  prefetch(queryClient, emailMarketingQueries.content());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FlowDetailView id={id} />
    </HydrationBoundary>
  );
}
