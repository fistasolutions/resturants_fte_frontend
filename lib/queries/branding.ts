/** Branding (SPEC-317): the organization's logos and login screen, one read — and the colours
 * suggested from its logo (SPEC-322 over backend SPEC-323). */
import { toBrandPalette, type ApiBrandPalette, type BrandPalette } from "@/lib/brand-color";
import { toBranding, type Branding } from "@/lib/branding";
import type { PublicBranding } from "@/lib/login-media";
import { defineQuery } from "@/lib/query-def";

export const brandingPaths = {
  current: (): string => "/organizations/current/branding",
  palette: (): string => "/organizations/current/branding/palette",
} as const;

export const brandingQueries = {
  current: () =>
    defineQuery<Branding>(["branding"], async (api) =>
      toBranding(await api<PublicBranding>(brandingPaths.current())),
    ),
  palette: () =>
    defineQuery<BrandPalette>(["branding", "palette"], async (api) =>
      toBrandPalette(await api<ApiBrandPalette>(brandingPaths.palette())),
    ),
} as const;
