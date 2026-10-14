import type { Metadata } from "next";

import { ProductPageContent } from "@/features/products/product-page-content";

export const metadata: Metadata = {
  title: "Product Catalog",
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ProductsCatalogPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

export default function ProductCatalogPage({ searchParams }: ProductsCatalogPageProps) {
  return <ProductPageContent tab="catalog" searchParams={searchParams} />;
}
