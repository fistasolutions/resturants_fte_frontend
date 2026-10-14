"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { WebsiteFrictionView } from "@/features/traffic/website-friction-view";
import { WebsiteSourcesView } from "@/features/traffic/website-sources-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { clarityQueries } from "@/lib/queries/clarity";
import type { ClarityFriction, ClarityStatus } from "@/types/clarity";

const NO_FRICTION: ClarityFriction = {
  connected: false,
  capturedOn: null,
  windowDays: 30,
  revenueDays: 90,
  pages: [],
};
const NO_STATUS: ClarityStatus = {
  configured: false,
  connected: false,
  capturedOn: null,
  sync: null,
  budget: { used: 0, limit: 10, remaining: 10 },
  nextRunUtc: "04:15",
};

/**
 * The digital half of Traffic (SPEC-214), read from the client cache (SPEC-230).
 * Both reads degrade rather than fail: a missing Clarity connection renders an honest
 * empty state, never an error page.
 */
export function WebsiteTab() {
  const friction = useApiQuery(clarityQueries.friction());
  const status = useApiQuery(clarityQueries.status());
  const campaigns = useApiQuery(clarityQueries.campaigns());
  if (friction.isPending || status.isPending) {
    return (
      <>
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </>
    );
  }
  return (
    <>
      <WebsiteFrictionView
        data={friction.data ?? NO_FRICTION}
        configured={(status.data ?? NO_STATUS).configured}
      />
      {/* SPEC-284: the sources with their verdict — only once Clarity has data */}
      {campaigns.data && campaigns.data.connected ? <WebsiteSourcesView data={campaigns.data} /> : null}
    </>
  );
}
