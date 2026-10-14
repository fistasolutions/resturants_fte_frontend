import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { CampaignDetailView } from "@/features/email-marketing/campaigns/campaign-detail-view";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Campaign — Email Marketing Manager" };
export const dynamic = "force-dynamic";

/** One campaign (SPEC-345) — its own header; the reads start together (SPEC-230). */
export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, emailMarketingQueries.campaign(id));
  prefetch(queryClient, emailMarketingQueries.audiences());
  prefetch(queryClient, emailMarketingQueries.content());
  prefetch(queryClient, emailMarketingQueries.seedTests());
  prefetch(queryClient, emailMarketingQueries.deliverability());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <CampaignDetailView id={id} />
    </HydrationBoundary>
  );
}
