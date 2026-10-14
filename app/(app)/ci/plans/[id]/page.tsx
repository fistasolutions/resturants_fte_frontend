import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { PlanReader } from "@/features/ci/plan-reader";
import { ciPlanQueries } from "@/lib/queries/ci-plans";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

function planId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return { title: planId(id) ? "Plan · Continuous Innovation" : "Continuous Innovation" };
}

/** One plan (SPEC-272): the paper, the rail and the decision — one read, prefetched. */
export default async function Page({ params }: PageProps) {
  const { id } = await params;
  const numeric = planId(id);
  if (numeric === null) notFound();
  const queryClient = getQueryClient();
  prefetch(queryClient, ciPlanQueries.plan(numeric));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PlanReader id={numeric} />
    </HydrationBoundary>
  );
}
