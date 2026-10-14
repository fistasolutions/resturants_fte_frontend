import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { OrdersSection } from "@/features/orders/orders-section";
import { reportQueries } from "@/lib/queries/reports";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

/**
 * Persistent shell for the Orders tabs (SPEC-087). A layout is not unmounted
 * when navigating between its child routes, so the header + tab bar + filters
 * (rendered inside `OrdersShell`) stay painted across tab switches — only the
 * table below swaps. The report scopes (the Location filter's options) are
 * prefetched here once for the whole section and streamed into the client cache
 * (SPEC-230), so entering the section never waits on them.
 */
export default function OrdersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const queryClient = getQueryClient();
  prefetch(queryClient, reportQueries.scopes());
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <OrdersSection>{children}</OrdersSection>
    </HydrationBoundary>
  );
}
