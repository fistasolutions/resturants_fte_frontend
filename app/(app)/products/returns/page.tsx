import type { Metadata } from "next";

import { ProductPageContent } from "@/features/products/product-page-content";
import { ReturnsHubLink } from "@/components/shared/returns-hub-link";

export const metadata: Metadata = {
  title: "Product Returns",
};

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface ProductsReturnsPageProps {
  searchParams: Promise<{
    range?: string;
    from?: string;
    to?: string;
    period?: string;
  }>;
}

export default function ProductReturnsPage({ searchParams }: ProductsReturnsPageProps) {
  // SPEC-154 — product-level return-leak slice; point users at the canonical hub.
  return (
    <>
      <ReturnsHubLink />
      <ProductPageContent tab="returns" searchParams={searchParams} />
    </>
  );
}
