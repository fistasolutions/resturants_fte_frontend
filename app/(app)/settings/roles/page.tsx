import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { RolesView } from "@/features/settings/roles-view";
import { teamQueries } from "@/lib/queries/team";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Roles — Settings",
};

/** Roles tab (SPEC-316). Tab body only — chrome lives in the persistent shell (SPEC-097);
 * the three reads start together and stream into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, teamQueries.roles());
  prefetch(queryClient, teamQueries.permissions());
  prefetch(queryClient, teamQueries.access());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <RolesView />
    </HydrationBoundary>
  );
}
