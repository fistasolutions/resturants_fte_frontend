import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { WarehouseView } from "@/features/warehouse/warehouse-view";
import { resolveDateRange } from "@/lib/date-range";
import { warehouseQueries } from "@/lib/queries/warehouse";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Warehouse" };
export const dynamic = "force-dynamic";

interface PageProps {
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

export default async function WarehousePage({ searchParams }: PageProps) {
  const params = await searchParams;
  const now = new Date();
  const todayISO = dateToISO(now);
  const yesterdayISO = dateToISO(new Date(now.getTime() - 86_400_000));
  // Default to yesterday — the finalized day with complete packing data (today
  // is still filling in). An explicit picker choice always wins.
  const hasExplicitRange = Boolean(params.range || params.from || params.to);
  const range = resolveDateRange(
    hasExplicitRange ? params : { from: yesterdayISO, to: yesterdayISO },
    todayISO,
  );
  const live = range.to >= todayISO; // the selected range includes today → live-syncing

  const queryClient = getQueryClient();
  prefetch(queryClient, warehouseQueries.overview(range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <WarehouseView range={range} live={live} />
    </HydrationBoundary>
  );
}
