import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { FranchiseeDetailView } from "@/features/restaurant/franchisee-detail-view";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Franchisee" };
export const dynamic = "force-dynamic";

/** A franchisee, its branches and its own team (SPEC-377). It owns its header. */
export default async function FranchiseePage({ params }: { params: Promise<{ franchiseeId: string }> }) {
  const { franchiseeId } = await params;
  const id = Number(franchiseeId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const queryClient = getQueryClient();
  prefetch(queryClient, restaurantQueries.franchisee(id));
  prefetch(queryClient, restaurantQueries.branches({ franchiseeId: id }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FranchiseeDetailView franchiseeId={id} />
    </HydrationBoundary>
  );
}
