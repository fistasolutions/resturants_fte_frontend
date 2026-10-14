"use client";

import { ChevronDown, ShoppingBag } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Panel, PanelRow } from "@/components/shared/panel";
import { TOP_PRODUCTS_LIMIT, foldItems, showMoreLabel } from "@/lib/fold";
import { cn } from "@/lib/utils";
import type { TopProduct } from "@/types/analytics";
import { formatCurrency, formatNumber } from "@/utils/format";

interface TopProductsProps {
  products: TopProduct[];
}

/** Shopify's CDN resizes on the fly via a `width` query param — request an
 * already-small image directly instead of round-tripping the full-resolution
 * original through Next's in-process image optimizer, which was timing out
 * under load (perf fix). 56px = 2x the 28px display size for retina. */
function shopifyThumbnail(url: string, width = 56): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}

function ProductRow({ product, rank }: { product: TopProduct; rank: number }) {
  return (
    <PanelRow
      align="center"
      className="py-2"
      leading={
        <span className="flex items-center gap-2">
          <span className="w-4 text-right text-[11px] font-bold tabular-nums text-muted-foreground/70">
            {rank}
          </span>
          {product.imageUrl ? (
            <span className="relative size-7 shrink-0 overflow-hidden rounded-md bg-secondary">
              <Image
                src={shopifyThumbnail(product.imageUrl)}
                alt=""
                aria-hidden
                fill
                sizes="28px"
                unoptimized
                className="object-cover"
              />
            </span>
          ) : (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-secondary text-muted-foreground">
              <ShoppingBag className="size-3.5" aria-hidden />
            </span>
          )}
        </span>
      }
      trailing={<p className="text-sm font-bold tabular-nums">{formatCurrency(product.revenue)}</p>}
    >
      <p className="truncate text-sm font-semibold leading-snug">{product.name}</p>
      <p className="text-[11px] leading-snug text-muted-foreground">
        {formatNumber(product.orders)} orders
      </p>
    </PanelRow>
  );
}

/** Top products by revenue as rail rows (SPEC-233), folded at five. */
export function TopProducts({ products }: TopProductsProps) {
  const [open, setOpen] = useState(false);
  const { shown, hidden } = foldItems(products, TOP_PRODUCTS_LIMIT);

  return (
    <Panel
      title="Top products"
      count="by revenue"
      aside={
        <Link
          href="/products"
          className="rounded outline-none underline-offset-2 hover:text-foreground hover:underline focus-visible:ring-2 focus-visible:ring-ring"
        >
          Product Analyst →
        </Link>
      }
    >
      {products.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">No sales in this period</p>
      ) : (
        (open ? products : shown).map((product, index) => (
          <ProductRow key={product.id} product={product} rank={index + 1} />
        ))
      )}
      {hidden.length > 0 ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground"
        >
          {open ? "Show fewer" : showMoreLabel(hidden.length, "product")}
          <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} aria-hidden />
        </button>
      ) : null}
    </Panel>
  );
}
