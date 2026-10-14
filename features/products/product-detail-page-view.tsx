"use client";

import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import ProductDetailLoading from "@/app/(app)/products/[productId]/loading";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { ProductDetailView } from "@/features/products/product-detail-view";
import { useApiQuery } from "@/hooks/use-api-query";
import { isNotFound } from "@/lib/api-error";
import type { ResolvedRange } from "@/lib/date-range";
import { analysisQueries } from "@/lib/queries/analysis";

/** One product (SPEC-146), read from the client cache (SPEC-230). A 404 from the
 * backend becomes the route's not-found page, as before. */
export function ProductDetailPageView({ productId, range }: { productId: number; range: ResolvedRange }) {
  const product = useApiQuery(analysisQueries.productDetail(productId, { from: range.from, to: range.to }));

  if (product.isPending) return <ProductDetailLoading />;
  if (product.isError) {
    if (isNotFound(product.error)) notFound();
    return <QueryErrorState error={product.error} onRetry={() => void product.refetch()} />;
  }

  const backHref = `/products/catalog${range.preset ? `?range=${range.preset}` : ""}`;
  return (
    <main className="min-w-0 flex-1 space-y-6 p-4 md:p-6">
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
        <Link href="/products" className="transition-colors hover:text-foreground">
          Product Analyst
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <Link href={backHref} className="transition-colors hover:text-foreground">
          Catalog
        </Link>
        <ChevronRight className="size-3.5" aria-hidden />
        <span className="font-medium text-foreground" aria-current="page">
          {product.data.title}
        </span>
      </nav>

      <ProductDetailView product={product.data} />
    </main>
  );
}
