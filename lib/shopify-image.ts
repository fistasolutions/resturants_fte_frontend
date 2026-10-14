/** Shopify CDN images accept a `width` query param that returns a resized copy —
 * so thumbnails fetch small files, not the full-resolution photo (SPEC-146).
 * Pure + unit-tested; falls back to the original url when it isn't parseable. */
export function shopifyImageWidth(url: string, width: number): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    return parsed.toString();
  } catch {
    return url;
  }
}
