import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ProfileTab } from "@/features/settings/account-views";
import { storeQueries } from "@/lib/queries/store";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Profile — Settings",
};

/** Account → Profile (SPEC-324). Tab body only — chrome lives in the persistent shell (SPEC-097, SPEC-324); the
 * reads start together and stream into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, storeQueries.currentUser());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProfileTab />
    </HydrationBoundary>
  );
}
