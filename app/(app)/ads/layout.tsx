import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { AdsSection } from "@/features/ads/ads-section";
import { adsQueries } from "@/lib/queries/ads";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

/**
 * Persistent layout for the Performance Ads tabs (SPEC-111). A layout is not
 * unmounted when navigating between tab searchParams, so the header, the
 * budget/guardrail strip, and the tab bar (in `AdsShell`) stay painted across
 * tab switches — only the content below swaps. The budget summary is prefetched
 * once here and streamed into the client cache (SPEC-230). Mirrors Spotlight / Social.
 */
export default function AdsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const queryClient = getQueryClient();
  prefetch(queryClient, adsQueries.budget());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AdsSection>{children}</AdsSection>
    </HydrationBoundary>
  );
}
