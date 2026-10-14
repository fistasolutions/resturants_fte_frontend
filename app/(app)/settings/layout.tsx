import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { SettingsSection } from "@/features/settings/settings-section";
import { storeQueries } from "@/lib/queries/store";
import { teamQueries } from "@/lib/queries/team";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Settings",
};

/**
 * Persistent shell for the Settings tabs (SPEC-097, SPEC-324). A layout is not unmounted
 * when navigating between its child routes, so the header + tab bar (in `SettingsShell`) stay
 * painted across tab switches — only the tab body swaps. The member's access (which tabs are
 * theirs) and the one `/settings/status` answer the store tabs share are prefetched here and
 * streamed into the client cache (SPEC-230).
 */
export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const queryClient = getQueryClient();
  prefetch(queryClient, teamQueries.access());
  prefetch(queryClient, storeQueries.settingsOverview());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <SettingsSection>{children}</SettingsSection>
    </HydrationBoundary>
  );
}
