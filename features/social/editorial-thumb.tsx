"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { slotThumbnailSrcs } from "@/lib/social-plan";
import { postImageUrl } from "@/services/social-actions";

/**
 * A slot/post thumbnail (SPEC-140 fix 1) that prefers the generated editorial
 * image (`postImageUrl(postId)`) when the post exists, falling back on image load
 * error to the product photo, then to the same neutral placeholder tile
 * `ProductThumb` uses. The candidate ordering is the pure `slotThumbnailSrcs`.
 * Tokens only (Rule 9). Used in keyed lists (board slots, `PostCard`) so a
 * different post remounts it with a fresh fallback index.
 */
export function EditorialThumb({
  name,
  postId,
  imageUrl,
  className,
}: {
  name: string;
  /** The generated draft's id when one exists, else null. */
  postId: string | number | null;
  /** The product's real Shopify photo, or null. */
  imageUrl: string | null;
  className?: string;
}) {
  const srcs = slotThumbnailSrcs(postId, imageUrl, postImageUrl);
  const [index, setIndex] = useState(0);
  const src = srcs[index];

  if (!src) {
    return (
      <span
        role="img"
        aria-label={`${name} photo placeholder`}
        className={cn(
          "flex items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground",
          className,
        )}
      >
        <ImageIcon className="size-4" aria-hidden />
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setIndex((current) => current + 1)}
      className={cn("rounded-md border border-border object-cover", className)}
    />
  );
}
