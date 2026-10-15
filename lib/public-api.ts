/**
 * Public reads for the brand's own site (frontend SPEC-386): server-side, no cookie, straight to the
 * backend origin. A 404 is `null` so the page can render Next's not-found; anything else throws to
 * the route's error boundary.
 */
import "server-only";

import { PRODUCT } from "@/lib/product";
import { fromApi } from "@/lib/restaurant-api";

const API_URL = process.env.API_URL ?? "http://localhost:8000";

/** Location pages change when the brand edits them; five minutes keeps search crawls cheap. */
export const PUBLIC_REVALIDATE_SECONDS = 300;

export async function publicGet<T>(path: string): Promise<T | null> {
  const response = await fetch(`${API_URL}/api/v1${path}`, {
    next: { revalidate: PUBLIC_REVALIDATE_SECONDS },
  });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`The page could not be loaded (${response.status}).`);
  return fromApi<T>(await response.json());
}

/** The site's own origin, for canonical links, JSON-LD and the sitemap. */
export function siteOrigin(): string {
  return (process.env.APP_URL ?? PRODUCT.appUrl).replace(/\/$/, "");
}
