import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { EmployeeTransactionsView } from "@/features/discounts/discount-detail-views";
import { resolveDateRange } from "@/lib/date-range";
import { rangeQuery, withDiscountDefaultRange } from "@/lib/discount-tabs";
import { discountQueries } from "@/lib/queries/discounts";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

interface PageProps {
  params: Promise<{ staffUserId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function EmployeeTransactionsPage({ params, searchParams }: PageProps) {
  const { staffUserId } = await params;
  const sp = await searchParams;
  const range = resolveDateRange(withDiscountDefaultRange(sp), todayISO());
  const rq = rangeQuery(sp);
  const id = Number(staffUserId);
  const queryClient = getQueryClient();
  prefetch(queryClient, discountQueries.employeeTransactions(id, range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <EmployeeTransactionsView staffUserId={id} range={range} rq={rq} />
    </HydrationBoundary>
  );
}
