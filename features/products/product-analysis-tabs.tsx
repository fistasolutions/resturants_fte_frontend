"use client";

import ProductsLoading from "@/app/(app)/products/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { BrandVerdictsView } from "@/features/products/brand-verdicts-view";
import { BundlesView } from "@/features/products/bundles-view";
import { ContentGapsView } from "@/features/products/content-gaps-view";
import { CostsView } from "@/features/products/costs-view";
import { TrueProfitView } from "@/features/products/true-profit-view";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";
import { costsQueries } from "@/lib/queries/costs";

/** The Bundles / Content Gaps / True Profit / Brands / Costs tabs (SPEC-191/213/185/239/251), read from the
 * client cache (SPEC-230). Each renders inside the persistent product shell. */
interface TabProps {
  range: ResolvedRange;
}

export function BundlesTab({ range }: TabProps) {
  const bundles = useApiQuery(analysisQueries.bundles({ from: range.from, to: range.to }));
  if (bundles.isPending) return <ProductsLoading />;
  if (bundles.isError) return <QueryErrorState error={bundles.error} onRetry={() => void bundles.refetch()} />;
  return <BundlesView data={bundles.data} />;
}

export function ContentGapsTab({ range }: TabProps) {
  const gaps = useApiQuery(analysisQueries.contentGaps({ from: range.from, to: range.to }));
  if (gaps.isPending) return <ProductsLoading />;
  if (gaps.isError) return <QueryErrorState error={gaps.error} onRetry={() => void gaps.refetch()} />;
  return <ContentGapsView data={gaps.data} />;
}

export function TrueProfitTab({ range }: TabProps) {
  const profit = useApiQuery(analysisQueries.trueProfit({ from: range.from, to: range.to }));
  if (profit.isPending) return <ProductsLoading />;
  if (profit.isError) return <QueryErrorState error={profit.error} onRetry={() => void profit.refetch()} />;
  return <TrueProfitView data={profit.data} />;
}

export function BrandsTab({ range }: TabProps) {
  const brands = useApiQuery(analysisQueries.brandVerdicts({ from: range.from, to: range.to }));
  if (brands.isPending) return <ProductsLoading />;
  if (brands.isError) return <QueryErrorState error={brands.error} onRetry={() => void brands.refetch()} />;
  return <BrandVerdictsView data={brands.data} />;
}

export function CostsTab({ range }: TabProps) {
  const query = { from: range.from, to: range.to };
  const costs = useApiQuery(costsQueries.summary(query));
  if (costs.isPending) return <ProductsLoading />;
  if (costs.isError) return <QueryErrorState error={costs.error} onRetry={() => void costs.refetch()} />;
  return <CostsView data={costs.data} queryKey={costsQueries.summary(query).queryKey} />;
}
