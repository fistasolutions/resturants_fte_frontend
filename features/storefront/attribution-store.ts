/**
 * Keeps the ad's `utm_*` tokens for the visit (SPEC-387): read from the landing URL once, kept in
 * `sessionStorage` per brand so they survive moving around the site, sent with the order.
 * Storage can be unavailable (private mode, blocked); the order then simply carries none.
 */
import {
  parseStoredAttribution,
  readAttribution,
  serializeAttribution,
  type Attribution,
} from "@/lib/attribution";

const key = (slug: string) => `ftes-attribution:${slug}`;

export function rememberAttribution(slug: string): void {
  if (typeof window === "undefined") return;
  const found = readAttribution(window.location.search);
  if (!found) return;
  try {
    window.sessionStorage.setItem(key(slug), serializeAttribution(found));
  } catch {
    // Storage unavailable: the order falls back to the current URL.
  }
}

export function currentAttribution(slug: string): Attribution | null {
  if (typeof window === "undefined") return null;
  const fromUrl = readAttribution(window.location.search);
  if (fromUrl) return fromUrl;
  try {
    return parseStoredAttribution(window.sessionStorage.getItem(key(slug)));
  } catch {
    return null;
  }
}
