import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { WebsiteTab } from "@/features/traffic/website-tab";
import { clarityQueries } from "@/lib/queries/clarity";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Website · Traffic" };
export const dynamic = "force-dynamic";

/**
 * The digital half of Traffic (SPEC-214). V-Count counts who walked into the shop;
 * Clarity counts who walked onto the site — same page, same question. Both reads
 * stream into the client cache in parallel (root Rule 5, SPEC-230).
 */
export default function TrafficWebsitePage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, clarityQueries.friction());
  prefetch(queryClient, clarityQueries.status());
  prefetch(queryClient, clarityQueries.campaigns());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WebsiteTab />
    </HydrationBoundary>
  );
}
