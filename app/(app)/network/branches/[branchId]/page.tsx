import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BranchDetailView } from "@/features/restaurant/branch-detail-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { readFilters, type RestaurantSearchParams } from "@/lib/restaurant";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Branch" };
export const dynamic = "force-dynamic";

/** A branch's scorecard (SPEC-377). It owns its header; the Network shell passes it through. */
export default async function BranchPage({
  params,
  searchParams,
}: {
  params: Promise<{ branchId: string }>;
  searchParams: Promise<RestaurantSearchParams>;
}) {
  const { branchId } = await params;
  const id = Number(branchId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const filters = readFilters(await searchParams, dateToISO(new Date()));
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.branch(id));
  prefetch(queryClient, restaurantQueries.scorecard(id, filters));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <BranchDetailView branchId={id} filters={filters} />
    </HydrationBoundary>
  );
}
