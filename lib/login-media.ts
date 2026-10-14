import { toBrandColor, type ApiBrandColor } from "@/lib/brand-color";

/**
 * The organization's login screen (SPEC-312 over backend SPEC-318) — pure.
 * The backend's public branding read names assets under `/api/v1/…`; the
 * browser reaches the backend only through `/api/proxy`, so every URL is
 * rewritten here.
 */

export interface BrandingAsset {
  id: string;
  media_type: string;
  width: number | null;
  height: number | null;
  url: string;
}

export interface PublicBranding {
  name: string;
  slug: string;
  logo: { light: BrandingAsset | null; dark: BrandingAsset | null };
  login: {
    kind: "none" | "image" | "video" | "carousel";
    items: BrandingAsset[];
    poster: BrandingAsset | null;
  };
  /** The brand colour (backend SPEC-323); absent on an older backend, null when unset. */
  color?: ApiBrandColor | null;
}

export interface LoginMedia {
  name: string;
  logoLight: string | null;
  logoDark: string | null;
  kind: "none" | "image" | "video" | "carousel";
  sources: string[];
  mediaType: string | null;
  poster: string | null;
  /** The brand colour as `#rrggbb` (SPEC-322), or null for the platform's own. */
  color: string | null;
}

const API_PREFIX = "/api/v1/";

export function viaProxy(url: string | null | undefined): string | null {
  if (!url) return null;
  return url.startsWith(API_PREFIX) ? `/api/proxy/${url.slice(API_PREFIX.length)}` : null;
}

export function loginMedia(branding: PublicBranding | null): LoginMedia | null {
  if (!branding) return null;
  const sources = branding.login.items
    .map((item) => viaProxy(item.url))
    .filter((url): url is string => url !== null);
  const kind = sources.length === 0 ? "none" : branding.login.kind;
  return {
    name: branding.name,
    logoLight: viaProxy(branding.logo.light?.url),
    logoDark: viaProxy(branding.logo.dark?.url),
    kind,
    sources,
    mediaType: branding.login.items[0]?.media_type ?? null,
    poster: viaProxy(branding.login.poster?.url),
    color: toBrandColor(branding.color)?.hex ?? null,
  };
}

export const CAROUSEL_SECONDS = 6;

export function nextSlide(index: number, count: number): number {
  return count <= 0 ? 0 : (index + 1) % count;
}
