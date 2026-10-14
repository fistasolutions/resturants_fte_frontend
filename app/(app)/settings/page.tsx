import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SettingsGeneralTab } from "@/features/settings/settings-tab-views";
import { storeQueries } from "@/lib/queries/store";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Settings",
};

/** Store → General tab (SPEC-324). Tab body only — chrome lives in the persistent shell (SPEC-097); the data
 * is the shared settings-overview answer in the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, storeQueries.settingsOverview());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsGeneralTab />
    </HydrationBoundary>
  );
}
