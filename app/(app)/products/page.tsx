import type { Metadata } from "next";

import { ProductPageContent } from "@/features/products/product-page-content";

export const metadata: Metadata = {
  title: "Product Analyst",
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ProductsPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

export default function ProductAnalystPage({ searchParams }: ProductsPageProps) {
  return <ProductPageContent tab="overview" searchParams={searchParams} />;
}
