import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { IntegrationsView } from "@/features/integrations/integrations-view";
import { integrationQueries } from "@/lib/queries/integrations";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Integrations",
};

export const dynamic = "force-dynamic";

/** Both reads start together (root Rule 5) and stream into the client cache (SPEC-230):
 * the health of every connection, and the cards the Included tab edits. */
export default function IntegrationsPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, integrationQueries.overview());
  prefetch(queryClient, integrationQueries.settings());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <IntegrationsView />
    </HydrationBoundary>
  );
}
