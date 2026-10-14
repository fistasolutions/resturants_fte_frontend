import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BuilderView } from "@/features/email-marketing/campaigns/builder/builder-view";
import { isGoal } from "@/lib/email-marketing";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Campaign builder — Email Marketing Manager" };
export const dynamic = "force-dynamic";

/** The campaign builder (SPEC-345). `?goal=` and `?audience=` prefill a new one; `?edit=<id>`
 * opens a saved draft. The reads every send is judged by start here, in parallel (SPEC-230). */
export default async function NewCampaignPage({ searchParams }: { searchParams: Promise<{ goal?: string; audience?: string; edit?: string }> }) {
  const { goal, audience, edit } = await searchParams;
  const editId = edit && /^\d{1,12}$/.test(edit) ? edit : null;
  const queryClient = getQueryClient();
  prefetch(queryClient, emailMarketingQueries.workspace());
  prefetch(queryClient, emailMarketingQueries.discountCodes());
  if (editId) prefetch(queryClient, emailMarketingQueries.campaign(editId));
  prefetch(queryClient, emailMarketingQueries.audiences());
  prefetch(queryClient, emailMarketingQueries.content());
  prefetch(queryClient, emailMarketingQueries.seedTests());
  prefetch(queryClient, emailMarketingQueries.deliverability());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BuilderView
        goal={isGoal(goal) ? goal : "custom"}
        audience={audience && /^[a-z0-9-]{1,40}$/.test(audience) ? audience : null}
        editId={editId}
      />
    </HydrationBoundary>
  );
}
