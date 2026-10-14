import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DiscountsOverviewTab } from "@/features/discounts/discount-tab-views";
import { resolveDateRange } from "@/lib/date-range";
import { rangeQuery, withDiscountDefaultRange } from "@/lib/discount-tabs";
import { discountQueries } from "@/lib/queries/discounts";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Discounts → Overview. Renders inside the persistent discount shell; the data streams into the
 * client cache (SPEC-230). */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = resolveDateRange(withDiscountDefaultRange(params), todayISO());
  const rq = rangeQuery(params);
  const queryClient = getQueryClient();
  prefetch(queryClient, discountQueries.overview(range.from, range.to));
  prefetch(queryClient, discountQueries.automatic(range.from, range.to));
  prefetch(queryClient, discountQueries.employees(range.from, range.to));
  prefetch(queryClient, discountQueries.alerts(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DiscountsOverviewTab range={range} rq={rq} />
    </HydrationBoundary>
  );
}
