import { ImageIcon } from "lucide-react";

/**
 * The framed product/editorial image tile used inside every native social
 * preview (SPEC-138 — extracted from Content Studio's per-platform card so the
 * `PostDetail` view, the Content Studio ghost preview, and any future surface
 * share one definition). Real photo or a labeled neutral placeholder; no invented
 * data. Tokens only (Rule 9).
 */
export function PreviewImage({
  imageUrl,
  productName,
  ratio,
}: {
  imageUrl: string | null;
  productName: string;
  /** CSS `aspect-ratio` value, e.g. "4 / 5" (IG) or "1.91 / 1" (FB). */
  ratio: string;
}) {
  return (
    <div
      className="relative w-full overflow-hidden bg-secondary"
      style={{ aspectRatio: ratio }}
    >
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageUrl}
          alt={productName}
          loading="lazy"
          className="size-full object-cover object-top"
        />
      ) : (
        <span className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 text-muted-foreground">
          <ImageIcon className="size-6" aria-hidden />
          <span className="px-3 text-center text-[0.6875rem] font-medium">
            {productName}
          </span>
        </span>
      )}
    </div>
  );
}
