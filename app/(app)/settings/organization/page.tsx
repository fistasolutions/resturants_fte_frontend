import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { OrganizationTab } from "@/features/settings/organization-view";
import { organizationQueries } from "@/lib/queries/organization";
import { teamQueries } from "@/lib/queries/team";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Organization — Settings",
};

/** Organization → General (SPEC-324). Tab body only — chrome lives in the persistent shell (SPEC-097, SPEC-324); the
 * reads start together and stream into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, organizationQueries.settings());
  prefetch(queryClient, teamQueries.access());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrganizationTab />
    </HydrationBoundary>
  );
}
