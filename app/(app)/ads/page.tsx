import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { AdsTabContent } from "@/features/ads/ads-tab-content";
import { normalizeAdsTab } from "@/lib/ads";
import { adsQueries } from "@/lib/queries/ads";
import { clarityQueries } from "@/lib/queries/clarity";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Paid Ads Manager",
};

export const dynamic = "force-dynamic";

interface AdsPageProps {
  searchParams: Promise<{ tab?: string }>;
}

/** Header, budget strip, and tab bar are rendered by the persistent shell (ads
 * layout.tsx). The active tab's query starts here and streams into the client cache
 * (SPEC-230): a tab change is a different key — skeleton the first time, instant
 * thereafter. */
export default async function AdsPage({ searchParams }: AdsPageProps) {
  const { tab } = await searchParams;
  const activeTab = normalizeAdsTab(tab);

  const queryClient = getQueryClient();
  if (activeTab === "audit") prefetch(queryClient, adsQueries.platforms());
  else if (activeTab === "campaigns") prefetch(queryClient, adsQueries.campaigns());
  else if (activeTab === "creative") prefetch(queryClient, adsQueries.creative());
  else if (activeTab === "spend-gates") prefetch(queryClient, adsQueries.spendGates());
  else if (activeTab === "accountability") prefetch(queryClient, adsQueries.accountability());
  else {
    // Independent reads, in parallel (root Rule 5). Clarity is best-effort.
    prefetch(queryClient, adsQueries.overview());
    prefetch(queryClient, clarityQueries.campaigns());
  }

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdsTabContent activeTab={activeTab} />
    </HydrationBoundary>
  );
}
