import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SecurityTab } from "@/features/settings/account-views";
import { accountQueries } from "@/lib/queries/account";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Security — Settings",
};

/** Account → Security (SPEC-324). Tab body only — chrome lives in the persistent shell (SPEC-097, SPEC-324); the
 * reads start together and stream into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, accountQueries.sessions());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SecurityTab />
    </HydrationBoundary>
  );
}
