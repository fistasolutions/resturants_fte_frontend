import type { Metadata } from "next";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { BillView } from "@/features/finance/bill-view";
import { BillSkeleton } from "@/features/finance/bill-skeleton";
import { financeQueries } from "@/lib/queries/finance";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Bill · Accounts Payable" };
export const dynamic = "force-dynamic";

/** One bill on its own page with the site's breadcrumb (SPEC-296) — the platform's
 * drill-down pattern, the same as a Knowledge Base item or a scheduler run. Read through
 * the client cache (SPEC-299), so arriving from the list is instant. */
export default async function BillPage({
  params,
}: {
  params: Promise<{ billId: string }>;
}) {
  const { billId } = await params;
  const id = decodeURIComponent(billId);
  const queryClient = getQueryClient();
  prefetch(queryClient, financeQueries.bill(id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<BillSkeleton />}>
        <BillView billId={id} />
      </Suspense>
    </HydrationBoundary>
  );
}
