import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { AuditTab } from "@/features/settings/audit-view";
import { teamQueries } from "@/lib/queries/team";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Audit log — Settings",
};

/** Audit log (SPEC-316, its own tab since SPEC-324). Tab body only — chrome lives in the persistent shell (SPEC-097, SPEC-324); the
 * reads start together and stream into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, teamQueries.audit(null));
  prefetch(queryClient, teamQueries.members());
  prefetch(queryClient, teamQueries.roles());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <AuditTab />
    </HydrationBoundary>
  );
}
