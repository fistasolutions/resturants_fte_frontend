import Image from "next/image";
import { ArrowUpRight, ShoppingBag } from "lucide-react";

import { shopifyImageUrl } from "@/lib/spotlight";
import type { BlogDraftProduct } from "@/types/spotlight";

/**
 * "Shop the edit" (backend SPEC-124; L5 restyle SPEC-153) — the in-article
 * conversion surface built from the real products the agent grounded on (never
 * invented; root Rule 8). The Minimal-Luxury card grid: a centered `font-heading`
 * tracked heading over 3-up bordered cards, each a 4:5 product photo + title
 * linking to its storefront `/products/{handle}` page (`url`) in a new tab.
 * `BlogDraftProduct` carries no price, so none is shown (never faked). Hidden when
 * there are no products. CSS-only hover lift (Rule 9); tokens only, both themes.
 */
export function ShopTheLook({ products }: { products: BlogDraftProduct[] }) {
  if (products.length === 0) return null;
  return (
    <section className="mt-16 border-t border-border pt-12 md:mt-20 md:pt-16">
      <p className="font-heading text-center text-sm tracking-[0.18em] text-muted-foreground uppercase">
        Shop the edit
      </p>
      <div className="mx-auto mt-8 grid max-w-5xl grid-cols-2 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => {
          const media = (
            <div className="relative aspect-[4/5] overflow-hidden bg-muted">
              {product.imageUrl ? (
                <Image
                  src={shopifyImageUrl(product.imageUrl, 600)}
                  alt=""
                  aria-hidden
                  fill
                  unoptimized
                  loading="lazy"
                  sizes="(min-width: 1024px) 300px, 45vw"
                  className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.03]"
                />
              ) : (
                <span className="flex size-full items-center justify-center text-muted-foreground">
                  <ShoppingBag className="size-5" aria-hidden />
                </span>
              )}
            </div>
          );
          const body = (
            <div className="p-4">
              <p className="text-sm font-medium text-foreground">
                <span className="line-clamp-2">{product.title}</span>
              </p>
              {product.url && (
                <p className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground">
                  View in store
                  <ArrowUpRight className="size-3 shrink-0" aria-hidden />
                </p>
              )}
            </div>
          );
          const cardClass =
            "group block overflow-hidden rounded-lg border border-border bg-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md";
          return product.url ? (
            <a
              key={product.productId}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${cardClass} outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background`}
            >
              {media}
              {body}
            </a>
          ) : (
            <div key={product.productId} className={cardClass}>
              {media}
              {body}
            </div>
          );
        })}
      </div>
    </section>
  );
}
