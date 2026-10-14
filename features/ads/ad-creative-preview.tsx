import { ImageIcon, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import type { AdCreativeFormat } from "@/types/ads";

/**
 * Aspect-ratio placeholder tile standing in for a paid-social ad creative
 * (SPEC-111) — reused from the Social Growth pattern. No external image URLs
 * (CSP + no assets) — a neutral `bg-muted`/`bg-secondary` frame sized to each
 * channel ratio, with the product name, the on-image headline, and a small
 * image glyph. `search` ads have no aspect ratio and render as a text-ad
 * placeholder instead (see `SearchAdPreview`).
 */

const FRAME: Record<
  Exclude<AdCreativeFormat, "search">,
  { label: string; ratioLabel: string; ratio: string }
> = {
  feed: { label: "Feed", ratioLabel: "4:5", ratio: "4 / 5" },
  story: { label: "Story / Reel", ratioLabel: "9:16", ratio: "9 / 16" },
  square: { label: "Square", ratioLabel: "1:1", ratio: "1 / 1" },
};

export function AdCreativePreview({
  format,
  productName,
  headline,
  className,
}: {
  format: Exclude<AdCreativeFormat, "search">;
  productName: string;
  headline: string;
  className?: string;
}) {
  const meta = FRAME[format];
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <div
        className="relative w-full overflow-hidden rounded-lg border border-border bg-muted"
        style={{ aspectRatio: meta.ratio }}
      >
        <div className="absolute inset-0 flex flex-col">
          <div className="flex flex-1 items-center justify-center bg-secondary">
            <span className="flex flex-col items-center gap-1.5 px-3 text-center text-muted-foreground">
              <ImageIcon className="size-6" aria-hidden />
              <span className="text-[0.6875rem] font-medium">{productName}</span>
            </span>
          </div>
          <div className="bg-card px-3 py-2">
            <p className="line-clamp-2 text-xs font-medium text-foreground">{headline}</p>
          </div>
        </div>
      </div>
      <figcaption className="flex items-center justify-between gap-2 text-[0.6875rem] text-muted-foreground">
        <span className="font-medium text-foreground">{meta.label}</span>
        <span className="tabular-nums">{meta.ratioLabel}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Search-ad placeholder for Spotlight-sourced creatives (SPEC-111): the bid
 * keyword plus the headline that runs against it, styled like a search result
 * with neutral tokens only.
 */
export function SearchAdPreview({
  headline,
  keyword,
  className,
}: {
  headline: string;
  keyword?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-1.5 rounded-lg border border-border bg-muted/40 p-3",
        className,
      )}
    >
      {keyword && (
        <span className="inline-flex w-fit items-center gap-1 text-[0.6875rem] text-muted-foreground">
          <Search className="size-3" aria-hidden />
          {keyword}
        </span>
      )}
      <p className="text-sm font-medium text-foreground">{headline}</p>
      <p className="text-xs text-success">examplestore.com</p>
    </div>
  );
}
