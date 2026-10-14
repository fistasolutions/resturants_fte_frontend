import type { Metadata } from "next";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { EmailMarketingView } from "@/features/email-marketing/email-marketing-view";
import { TabSkeleton } from "@/features/email-marketing/skeletons";
import { EMAIL_MARKETING_TITLE } from "@/lib/email-marketing";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: EMAIL_MARKETING_TITLE };
export const dynamic = "force-dynamic";

/** Content only — header, strip and tabs live in the persistent shell (SPEC-232). The page
 * does not read the URL: the tab is read in the browser and moved with shallow links
 * (SPEC-301), so the morning view is the one read started here. */
export default function EmailMarketingPage() {
  const queryClient = getQueryClient();
  prefetch(queryClient, emailMarketingQueries.overview());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<TabSkeleton />}>
        <EmailMarketingView />
      </Suspense>
    </HydrationBoundary>
  );
}
