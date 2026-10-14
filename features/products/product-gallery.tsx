"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { shopifyImageWidth } from "@/lib/shopify-image";
import type { ProductGalleryImage } from "@/types/analysis";

/** Product image gallery (SPEC-146): a large active image plus a thumbnail strip,
 * fed by the full `product_images` set synced from Shopify. Thumbnails are
 * keyboard-navigable buttons; the active one is ringed. No entrance animation. */
export function ProductGallery({
  images,
  title,
  fallback,
}: {
  images: ProductGalleryImage[];
  title: string;
  fallback: string | null;
}) {
  const [active, setActive] = useState(0);

  // Fall back to the single featured thumbnail if the gallery is empty, then to
  // an explicit "no photos" state — never a broken image.
  const gallery: ProductGalleryImage[] =
    images.length > 0
      ? images
      : fallback
        ? [{ id: -1, src: fallback, position: 1, alt: null, width: null, height: null }]
        : [];

  if (gallery.length === 0) {
    return (
      <div className="flex aspect-[4/5] w-full flex-col items-center justify-center gap-2 rounded-card border border-border bg-muted/40 text-muted-foreground">
        <ImageOff className="size-6" aria-hidden />
        <p className="text-sm">No photos synced for this product yet</p>
      </div>
    );
  }

  const current = gallery[Math.min(active, gallery.length - 1)];

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-[4/5] w-full overflow-hidden rounded-card border border-border bg-muted/40">
        <Image
          key={current.id}
          src={shopifyImageWidth(current.src, 900)}
          alt={current.alt ?? title}
          fill
          sizes="(max-width: 900px) 100vw, 480px"
          unoptimized
          priority
          className="object-cover object-top"
        />
        {gallery.length > 1 && (
          <span className="absolute top-3 right-3 rounded-full bg-foreground/70 px-2 py-0.5 text-xs font-medium text-background tabular-nums">
            {Math.min(active, gallery.length - 1) + 1} / {gallery.length}
          </span>
        )}
      </div>

      {gallery.length > 1 && (
        <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
          {gallery.map((img, i) => {
            const selected = i === Math.min(active, gallery.length - 1);
            return (
              <button
                key={img.id}
                type="button"
                aria-label={`${title} — photo ${i + 1}`}
                aria-current={selected}
                onClick={() => setActive(i)}
                className={`relative aspect-[4/5] overflow-hidden rounded-lg border bg-muted/40 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                  selected ? "border-primary ring-2 ring-ring" : "border-border hover:border-foreground/30"
                }`}
              >
                <Image
                  src={shopifyImageWidth(img.src, 160)}
                  alt=""
                  aria-hidden
                  fill
                  sizes="96px"
                  unoptimized
                  className="object-cover object-top"
                />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
