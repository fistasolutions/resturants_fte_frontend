"use client";

import ProductsLoading from "@/app/(app)/products/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { AiCommentary } from "@/features/analysis/ai-commentary";
import { AiCommentarySkeleton } from "@/features/analysis/ai-commentary-skeleton";
import { CategoryChart } from "@/features/analysis/category-chart";
import { MoneyLeakList } from "@/features/analysis/money-leak-list";
import { MoneyLeakSkeleton } from "@/features/analysis/money-leak-skeleton";
import { VerdictTiles } from "@/features/analysis/verdict-tiles";
import { CatalogSummaryTiles } from "@/features/products/catalog-summary-tiles";
import { CatalogView } from "@/features/products/catalog-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { CATALOG_PAGE_SIZE } from "@/lib/catalog-pagination";
import type { ResolvedRange } from "@/lib/date-range";
import type { ProductTabKey } from "@/lib/product-tabs";
import { analysisApiQuery, analysisQueries } from "@/lib/queries/analysis";

interface ProductTabContentProps {
  tab: ProductTabKey;
  range: ResolvedRange;
}

/**
 * Shared body for every Product Analyst tab (SPEC-090), read from the client cache
 * (SPEC-230). The fast analysis query is shared by all three tabs, so switching tabs
 * never refetches it; each tab observes ONLY the LLM-backed query it shows
 * (Overview → commentary, Returns → return-verdicts, Catalog → cached verdicts), and
 * those keep their own skeletons so the fast data never waits on them.
 */
export function ProductTabContent({ tab, range }: ProductTabContentProps) {
  const q = { from: range.from, to: range.to };
  const query = analysisApiQuery(q);
  const analysis = useApiQuery(analysisQueries.products(q));
  const commentary = useApiQuery(tab === "overview" ? analysisQueries.productCommentary(q) : null);
  const verdicts = useApiQuery(tab === "returns" ? analysisQueries.productReturnVerdicts(q) : null);
  // Catalog tab: the FIRST page's already-cached verdicts (cache_only → no LLM call)
  // so cached notes paint with no skeleton flash; `CatalogView` seeds from them at
  // mount, so it is mounted only once they have resolved (SPEC-105).
  const firstPageIds = analysis.data?.catalog.slice(0, CATALOG_PAGE_SIZE).map((r) => r.product_id);
  const catalogVerdicts = useApiQuery(
    tab === "catalog" && firstPageIds ? analysisQueries.catalogVerdicts(q, firstPageIds, true) : null,
  );

  if (analysis.isPending) return <ProductsLoading />;
  if (analysis.isError) {
    return <QueryErrorState error={analysis.error} onRetry={() => void analysis.refetch()} />;
  }
  const data = analysis.data;

  return (
    <>
      {tab === "overview" && (
        <>
          <VerdictTiles verdicts={data.verdicts} />
          {/* CatalogSummaryTiles lives on the Catalog tab (SPEC-154 Patches, dedup) —
              Overview's snapshot is VerdictTiles, so the same tiles no longer repeat here. */}
          {commentary.isPending ? (
            <AiCommentarySkeleton />
          ) : (
            <AiCommentary page="products" query={query} initialCommentary={commentary.data ?? null} />
          )}
          <CategoryChart categories={data.categories} />
        </>
      )}

      {tab === "catalog" && (
        <>
          <CatalogSummaryTiles rows={data.catalog} />
          {catalogVerdicts.isPending ? (
            <Skeleton className="h-96 rounded-2xl" />
          ) : (
            <CatalogView rows={data.catalog} query={query} initialVerdicts={catalogVerdicts.data ?? null} />
          )}
        </>
      )}

      {tab === "returns" &&
        (verdicts.isPending ? (
          <MoneyLeakSkeleton />
        ) : (
          <MoneyLeakList products={data.top_returns} verdicts={verdicts.data ?? null} />
        ))}
    </>
  );
}
