import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BillingTab } from "@/features/settings/billing-view";
import { billingQueries } from "@/lib/queries/billing";
import { teamQueries } from "@/lib/queries/team";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = {
  title: "Billing & plan — Settings",
};

/** Billing & plan (SPEC-324). Tab body only — chrome lives in the persistent shell (SPEC-097, SPEC-324); the
 * reads start together and stream into the client cache (SPEC-230). */
export default function Page() {
  const queryClient = getQueryClient();
  prefetch(queryClient, billingQueries.plans());
  prefetch(queryClient, billingQueries.subscription());
  prefetch(queryClient, billingQueries.allowance());
  // Invoices come from Stripe and can be unreachable; they load client-side where the panel
  // degrades gracefully, so a Stripe outage never rejects the page's hydration (SPEC-324 patch).
  prefetch(queryClient, teamQueries.access());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BillingTab />
    </HydrationBoundary>
  );
}
