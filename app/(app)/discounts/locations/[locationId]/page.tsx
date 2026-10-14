import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { LocationEmployeesView } from "@/features/discounts/discount-detail-views";
import { resolveDateRange } from "@/lib/date-range";
import { rangeQuery, withDiscountDefaultRange } from "@/lib/discount-tabs";
import { discountQueries } from "@/lib/queries/discounts";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PageProps {
  params: Promise<{ locationId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function LocationEmployeesPage({ params, searchParams }: PageProps) {
  const { locationId } = await params;
  const sp = await searchParams;
  const range = resolveDateRange(withDiscountDefaultRange(sp), todayISO());
  const rq = rangeQuery(sp);
  const id = Number(locationId);
  const queryClient = getQueryClient();
  prefetch(queryClient, discountQueries.employees(range.from, range.to, id));
  prefetch(queryClient, discountQueries.overview(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <LocationEmployeesView locationId={id} range={range} rq={rq} />
    </HydrationBoundary>
  );
}
