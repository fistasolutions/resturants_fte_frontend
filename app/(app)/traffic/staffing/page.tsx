import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { StaffingTab } from "@/features/traffic/staffing-tab";
import { planningQueries } from "@/lib/queries/planning";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { resolveTrafficRange } from "@/lib/traffic-tabs";

export const metadata: Metadata = { title: "Staffing — Store Traffic" };
export const dynamic = "force-dynamic";

// Staffing tab (SPEC-219). Resolves the range through the SAME helper the shell's
// picker uses, so the label above the page and the data inside it always describe
// the same window. Defaults to 90 days: a rota change cannot rest on one week.
export default async function StaffingPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}) {
  const params = await searchParams;
  const range = resolveTrafficRange(params, "staffing");
  const queryClient = getQueryClient();
  prefetch(queryClient, planningQueries.staffing(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StaffingTab range={range} />
    </HydrationBoundary>
  );
}
