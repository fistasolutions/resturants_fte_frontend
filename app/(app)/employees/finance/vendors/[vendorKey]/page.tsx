import type { Metadata } from "next";
import { Suspense } from "react";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { VendorSkeleton, VendorView } from "@/features/finance/vendor-view";
import { financeQueries } from "@/lib/queries/finance";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Vendor · Accounts Payable" };
export const dynamic = "force-dynamic";

/** One vendor across every company (SPEC-301) — its own page with the site's breadcrumb,
 * read through the client cache so arriving from a table is instant. */
export default async function VendorPage({ params }: { params: Promise<{ vendorKey: string }> }) {
  const { vendorKey } = await params;
  const key = decodeURIComponent(vendorKey);
  const queryClient = getQueryClient();
  prefetch(queryClient, financeQueries.vendor(key));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <Suspense fallback={<VendorSkeleton />}>
        <VendorView vendorKey={key} />
      </Suspense>
    </HydrationBoundary>
  );
}
