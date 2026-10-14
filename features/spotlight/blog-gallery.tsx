import Image from "next/image";
import { ArrowUpRight } from "lucide-react";

import { cn } from "@/lib/utils";
import { shopifyImageUrl } from "@/lib/spotlight";
import type { BlogDraftProduct } from "@/types/spotlight";

/**
 * Editorial image band (SPEC-150) — the "wow" that turns the Spotlight blog
 * detail from a text wall into a magazine spread. Built ONLY from the real
 * products the agent grounded on (`grounding.products[]`); never invents an image
 * (Rule 8). {@link planBlogGalleries} weaves these bands between the article's
 * text sections so prose and photography alternate.
 *
 * Layout adapts to how many images the band holds: a single full-bleed frame, a
 * portrait pair, a triptych, or a quad — each image linking to its
 * `/products/{handle}` storefront page (`url`) in a new tab (a plain frame when
 * the backend gave no url). Motion is CSS-only (Rule 9): a subtle cover-zoom and a
 * caption scrim that reveal on hover/focus — no entrance animation, no
 * framer-motion. App tokens only; correct in both themes.
 */

/** Grid + aspect + responsive `sizes` per image count (1–4; 4 covers 4+). */
const LAYOUTS: Record<number, { grid: string; aspect: string; sizes: string }> = {
  1: {
    grid: "grid-cols-1",
    aspect: "aspect-[16/10]",
    sizes: "(min-width: 768px) 720px, 100vw",
  },
  2: {
    grid: "grid-cols-2",
    aspect: "aspect-[4/5]",
    sizes: "(min-width: 768px) 360px, 50vw",
  },
  3: {
    grid: "grid-cols-1 sm:grid-cols-3",
    aspect: "aspect-[4/5]",
    sizes: "(min-width: 768px) 240px, 100vw",
  },
  4: {
    grid: "grid-cols-2 sm:grid-cols-4",
    aspect: "aspect-[4/5]",
    sizes: "(min-width: 768px) 180px, 45vw",
  },
};

export function BlogGallery({ products }: { products: BlogDraftProduct[] }) {
  // Defensive: a band should only ever be built from imaged products, but never
  // render an empty/broken frame if a null slips through (Rule 6).
  const items = products.filter((product) => Boolean(product.imageUrl));
  if (items.length === 0) return null;

  const layout = LAYOUTS[Math.min(items.length, 4)] ?? LAYOUTS[4];

  return (
    <figure className="my-10 md:my-12">
      <div className={cn("grid gap-3 md:gap-4", layout.grid)}>
        {items.map((product) => {
          const frame = (
            <div
              className={cn(
                "relative overflow-hidden rounded-lg border border-border bg-muted",
                layout.aspect,
              )}
            >
              <Image
                src={shopifyImageUrl(product.imageUrl as string, 900)}
                alt=""
                aria-hidden
                fill
                unoptimized
                loading="lazy"
                sizes={layout.sizes}
                className="object-cover transition-transform duration-300 ease-out group-hover:scale-[1.04]"
              />
              {product.url && (
                <span
                  className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
                  aria-hidden
                >
                  <span className="flex items-center gap-1 p-3 text-xs font-medium text-white">
                    <span className="truncate">Shop {product.title}</span>
                    <ArrowUpRight className="size-3.5 shrink-0" />
                  </span>
                </span>
              )}
            </div>
          );
          return product.url ? (
            <a
              key={product.productId}
              href={product.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`Shop ${product.title}`}
              className="group block rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              {frame}
            </a>
          ) : (
            <div key={product.productId} className="group block">
              {frame}
            </div>
          );
        })}
      </div>
    </figure>
  );
}
