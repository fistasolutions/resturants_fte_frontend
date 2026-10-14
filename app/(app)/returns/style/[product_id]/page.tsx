import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { StyleDetailView } from "@/features/returns/style-detail-view";
import { resolveDateRange } from "@/lib/date-range";
import { returnQueries } from "@/lib/queries/returns";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = {
  title: "Style returns",
};

export const dynamic = "force-dynamic";

interface StyleDetailPageProps {
  params: Promise<{ product_id: string }>;
  searchParams: Promise<{ range?: string; from?: string; to?: string }>;
}

export default async function StyleDetailPage({
  params,
  searchParams,
}: StyleDetailPageProps) {
  const { product_id } = await params;
  const productId = Number(product_id);
  if (!Number.isFinite(productId)) notFound();

  const sp = await searchParams;
  const range = resolveDateRange(sp, dateToISO(new Date()));
  const queryClient = getQueryClient();
  prefetch(queryClient, returnQueries.styleDetail(productId, { from: range.from, to: range.to }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <StyleDetailView productId={productId} range={range} />
    </HydrationBoundary>
  );
}
