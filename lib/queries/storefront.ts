/**
 * The brand's public online ordering and tracker reads (frontend SPEC-379 / backend SPEC-394).
 * No sign-in: the proxy forwards them without a token.
 */
import { defineQuery } from "@/lib/query-def";
import { fromApi } from "@/lib/restaurant-api";
import type { DriverApp, PublicBrand, PublicBranch, PublicMenu, TrackedOrder } from "@/types/restaurant-os";

export const STOREFRONT_KEY = ["storefront"] as const;

export const storefrontPaths = {
  brand: (slug: string): string => `/storefront/${encodeURIComponent(slug)}`,
  locate: (slug: string, postalCode: string): string =>
    `/storefront/${encodeURIComponent(slug)}/locate?postal_code=${encodeURIComponent(postalCode)}`,
  locateAt: (slug: string, lat: number, lng: number): string =>
    `/storefront/${encodeURIComponent(slug)}/locate?lat=${lat}&lng=${lng}`,
  driver: (token: string): string => `/storefront/driver/${encodeURIComponent(token)}`,
  menu: (slug: string, branchId: number): string =>
    `/storefront/${encodeURIComponent(slug)}/branches/${branchId}/menu`,
  track: (token: string): string => `/storefront/track/${encodeURIComponent(token)}`,
} as const;

export const storefrontQueries = {
  brand: (slug: string) =>
    defineQuery<PublicBrand>([...STOREFRONT_KEY, "brand", slug], async (api) =>
      fromApi<PublicBrand>(await api(storefrontPaths.brand(slug))),
    ),
  locate: (slug: string, postalCode: string) =>
    defineQuery<PublicBranch[]>([...STOREFRONT_KEY, "locate", slug, postalCode], async (api) =>
      fromApi<{ branches: PublicBranch[] }>(await api(storefrontPaths.locate(slug, postalCode))).branches,
    ),
  menu: (slug: string, branchId: number) =>
    defineQuery<PublicMenu>([...STOREFRONT_KEY, "menu", slug, branchId], async (api) =>
      fromApi<PublicMenu>(await api(storefrontPaths.menu(slug, branchId))),
    ),
  locateAt: (slug: string, lat: number, lng: number) =>
    defineQuery<PublicBranch[]>([...STOREFRONT_KEY, "locate-at", slug, lat, lng], async (api) =>
      fromApi<{ branches: PublicBranch[] }>(await api(storefrontPaths.locateAt(slug, lat, lng))).branches,
    ),
  driver: (token: string) =>
    defineQuery<DriverApp>([...STOREFRONT_KEY, "driver", token], async (api) =>
      fromApi<DriverApp>(await api(storefrontPaths.driver(token))),
    ),
  track: (token: string) =>
    defineQuery<TrackedOrder>([...STOREFRONT_KEY, "track", token], async (api) =>
      fromApi<TrackedOrder>(await api(storefrontPaths.track(token))),
    ),
};
