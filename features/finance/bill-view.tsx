"use client";

import { useMemo } from "react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { BillPageView } from "@/features/finance/bill-page-view";
import { BillSkeleton } from "@/features/finance/bill-skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { financeQueries } from "@/lib/queries/finance";

/** The bill page's client half (SPEC-299, SPEC-301): reads the bill, its lines, its
 * payments and the vendor's other bills from the cache and hands them to the
 * presentational view. A bill paid since the list was drawn is the backend's 404 —
 * `QueryErrorState` shows that honestly rather than an empty page. */
export function BillView({ billId }: { billId: string }) {
  const query = useApiQuery(financeQueries.bill(billId));
  const todayISO = useMemo(() => new Date().toISOString(), []);

  if (query.isError) {
    return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  }
  if (!query.data) return <BillSkeleton />;
  return <BillPageView detail={query.data} todayISO={todayISO} />;
}
