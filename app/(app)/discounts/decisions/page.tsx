import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { DiscountsDecisionsTab } from "@/features/discounts/discount-tab-views";
import { resolveDateRange } from "@/lib/date-range";
import { withDiscountDefaultRange } from "@/lib/discount-tabs";
import { discountQueries } from "@/lib/queries/discounts";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PageProps {
  searchParams: Promise<Record<string, string | undefined>>;
}

/** Discounts → Decisions (SPEC-244). Renders inside the persistent discount shell; the data streams into the
 * client cache (SPEC-230). */
export default async function Page({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = resolveDateRange(withDiscountDefaultRange(params), todayISO());
  const queryClient = getQueryClient();
  prefetch(queryClient, discountQueries.decisions(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <DiscountsDecisionsTab range={range} />
    </HydrationBoundary>
  );
}
