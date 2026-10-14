"use client";

import { useState } from "react";
import { Download, Trash2 } from "lucide-react";

import { useCan } from "@/hooks/use-can";
import { cn } from "@/lib/utils";
import {
  GALLERY_THUMBNAIL_WIDTH,
  galleryImageUrl,
  type GalleryImage,
} from "@/services/social-actions";

/**
 * Every image ever made for a post, as a rail beside the preview (SPEC-176).
 *
 * It used to sit under the controls, below the fold, while the space to the
 * right of the preview stayed empty — so comparing a version against the post
 * it would appear in meant scrolling between the two. Vertical and adjacent,
 * the tile and the preview are in one glance.
 *
 * Regenerating APPENDS rather than overwriting (SPEC-188), so nothing the owner
 * liked is ever lost. The product's own Shopify photo appears here too, but only
 * while no stored copy of it exists — otherwise the same picture showed twice
 * (SPEC-190 Patches).
 */
export function VersionRail({
  postId,
  images,
  switching,
  onSelect,
  onUseOriginal,
  onDelete,
  inlineImages,
}: {
  postId: string;
  images: GalleryImage[];
  /** The id currently being applied, `-1` for the product original, else null. */
  switching: number | null;
  onSelect: (imageId: number) => void;
  onUseOriginal: () => void;
  onDelete: (imageId: number) => void;
  /** Versions already in the page as data URLs (SPEC-191) — no request needed. */
  inlineImages: Record<number, string>;
}) {
  // Root Rule 13: picking the live image and throwing a take away are "social.manage".
  const manageGate = useCan()("social.manage");
  // Delete cannot be undone, so it asks — but inline on the tile rather than in
  // a dialog: a modal for "throw away a take you did not like" is heavier than
  // the decision.
  const [confirming, setConfirming] = useState<number | null>(null);

  if (images.length === 0) return null;

  return (
    <div className="w-16 shrink-0 space-y-1.5">
      <p className="text-[0.6875rem] leading-tight text-muted-foreground">Versions</p>
      <ul className="flex flex-col gap-2">
        {images.map((image) => {
          const isProduct = image.id === null;
          return (
            <li key={isProduct ? "product" : `img-${image.id}`}>
              <button
                type="button"
                // The product photo is the original to look back at and
                // download — it is not a post image, so it cannot be "live".
                disabled={image.selected || switching !== null || !manageGate.allowed}
                title={manageGate.reason ?? undefined}
                onClick={() => {
                  if (isProduct) {
                    onUseOriginal();
                  } else if (!image.selected) {
                    onSelect(image.id!);
                  }
                }}
                aria-label={
                  isProduct
                    ? "Use the original product photo"
                    : image.selected
                      ? "Currently used image"
                      : `Use this ${image.source} image`
                }
                aria-pressed={!isProduct && image.selected}
                // The tile shows a 160px render; the preview wants the full
                // size. Warming it on hover means the click has nothing left to
                // wait for, and costs nothing until the owner shows intent.
                onPointerEnter={() => {
                  if (isProduct || image.selected) return;
                  const warm = new window.Image();
                  warm.src = galleryImageUrl(postId, image.id!, { width: 1024 });
                }}
                className={cn(
                  "relative block h-20 w-16 overflow-hidden rounded-lg border-2 transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  image.selected
                    ? "border-primary"
                    : "border-border hover:border-primary/50",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={
                    isProduct
                      ? image.url
                      : (inlineImages[image.id!] ??
                        galleryImageUrl(postId, image.id!, {
                          width: GALLERY_THUMBNAIL_WIDTH,
                        }))
                  }
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="size-full object-cover"
                />
              </button>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <a
                  href={
                    isProduct
                      ? image.url
                      : galleryImageUrl(postId, image.id!, { download: true })
                  }
                  download
                  aria-label={
                    isProduct
                      ? "Download the original product photo"
                      : "Download this version"
                  }
                  className="inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  <Download className="size-2.5" aria-hidden />
                  {isProduct
                    ? "original"
                    : image.source === "uploaded"
                      ? "yours"
                      : "save"}
                </a>
                {/* The product photo lives in Shopify — it is not ours to
                    delete. Everything else is a take the owner can throw away. */}
                {!isProduct && manageGate.allowed && (
                  <button
                    type="button"
                    disabled={switching !== null}
                    onClick={() => {
                      if (confirming === image.id) {
                        setConfirming(null);
                        onDelete(image.id!);
                      } else {
                        setConfirming(image.id!);
                      }
                    }}
                    onBlur={() => setConfirming(null)}
                    aria-label={
                      confirming === image.id
                        ? "Confirm deleting this version"
                        : "Delete this version"
                    }
                    className={cn(
                      "inline-flex items-center gap-0.5 rounded text-[10px] outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
                      confirming === image.id
                        ? "font-medium text-destructive"
                        : "text-muted-foreground hover:text-destructive",
                    )}
                  >
                    <Trash2 className="size-2.5" aria-hidden />
                    {confirming === image.id ? "sure?" : ""}
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
