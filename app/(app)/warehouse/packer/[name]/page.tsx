import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { PackerDrilldownView } from "@/features/warehouse/packer-drilldown-view";
import { resolveDateRange } from "@/lib/date-range";
import { warehouseQueries } from "@/lib/queries/warehouse";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Packer" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ name: string }>;
  searchParams: Promise<{ start?: string; to?: string; end?: string; from?: string }>;
}

export default async function PackerDrilldownPage({ params, searchParams }: PageProps) {
  const { name } = await params;
  const packer = decodeURIComponent(name);
  const sp = await searchParams;
  const now = new Date();
  const todayISO = dateToISO(now);
  const yesterdayISO = dateToISO(new Date(now.getTime() - 86_400_000));
  const range = resolveDateRange(
    sp.start || sp.end ? { from: sp.start, to: sp.end } : { from: yesterdayISO, to: yesterdayISO },
    todayISO,
  );
  const queryClient = getQueryClient();
  prefetch(queryClient, warehouseQueries.packerOrders(packer, range.from, range.to));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <PackerDrilldownView packer={packer} range={range} />
    </HydrationBoundary>
  );
}
