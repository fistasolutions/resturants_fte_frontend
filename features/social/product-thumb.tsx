import { ImageIcon } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Small square placeholder standing in for a product photo thumbnail
 * (SPEC-110). No external image URLs — a neutral `bg-secondary` tile with an
 * image glyph, used in the Content Studio product picker.
 */
export function ProductThumb({
  name,
  imageUrl,
  className,
}: {
  name: string;
  imageUrl?: string | null;
  className?: string;
}) {
  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={imageUrl}
        alt={name}
        loading="lazy"
        className={cn("rounded-md border border-border object-cover", className)}
      />
    );
  }
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
