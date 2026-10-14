import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { ProductTabContent } from "@/features/products/product-tab-content";
import { resolveDateRange } from "@/lib/date-range";
import type { ProductTabKey } from "@/lib/product-tabs";
import { analysisQueries } from "@/lib/queries/analysis";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

interface ProductPageContentProps {
  tab: ProductTabKey;
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

/**
 * Shared body for every Product Analyst tab (SPEC-090) — mirrors the
 * Inventory/Orders tab-content pattern. The range resolution is identical across
 * tabs, so it lives here once; the fast analysis fetch and ONLY the LLM call the
 * tab shows (Overview → commentary, Returns → return-verdicts, Catalog → neither)
 * are started here and streamed into the client cache (SPEC-230) — never awaited.
 *
 * The page header + tab bar live in the persistent product shell (SPEC-090) —
 * this renders only the active tab's content.
 */
export async function ProductPageContent({ tab, searchParams }: ProductPageContentProps) {
  const params = await searchParams;
  const todayISO = new Date().toISOString().slice(0, 10);
  const range = resolveDateRange(
    { range: params.range ?? params.period ?? "30d", from: params.from, to: params.to },
    todayISO,
  );
  const q = { from: range.from, to: range.to };

  const queryClient = getQueryClient();
  prefetch(queryClient, analysisQueries.products(q));
  if (tab === "overview") prefetch(queryClient, analysisQueries.productCommentary(q));
  if (tab === "returns") prefetch(queryClient, analysisQueries.productReturnVerdicts(q));

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProductTabContent tab={tab} range={range} />
    </HydrationBoundary>
  );
}
