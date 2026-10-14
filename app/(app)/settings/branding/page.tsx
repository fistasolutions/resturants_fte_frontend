import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BrandingView } from "@/features/settings/branding-view";
import { brandingQueries } from "@/lib/queries/branding";
import { teamQueries } from "@/lib/queries/team";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Branding — Settings",
};

/** Branding tab (SPEC-317). Tab body only — chrome lives in the persistent shell (SPEC-097);
 * the reads start together and stream into the client cache (SPEC-230) — the logo's suggested
 * colours too (SPEC-322), so the Brand colour card never waits on a second round trip. */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, brandingQueries.current());
  prefetch(queryClient, brandingQueries.palette());
  prefetch(queryClient, teamQueries.access());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BrandingView />
    </HydrationBoundary>
  );
}
