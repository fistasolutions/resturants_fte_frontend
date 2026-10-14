import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ProductDetailPageView } from "@/features/products/product-detail-page-view";
import { resolveDateRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";
import { dateToISO } from "@/utils/date";

export const metadata: Metadata = { title: "Product detail" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ productId: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}

export default async function ProductDetailPage({ params, searchParams }: PageProps) {
  const [{ productId }, sp] = await Promise.all([params, searchParams]);
  const id = Number(productId);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const range = resolveDateRange(
    { range: sp.range ?? sp.period ?? "30d", from: sp.from, to: sp.to },
    dateToISO(new Date()),
  );

  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.productDetail(id, { from: range.from, to: range.to }));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductDetailPageView productId={id} range={range} />
    </HydrationBoundary>
  );
}
