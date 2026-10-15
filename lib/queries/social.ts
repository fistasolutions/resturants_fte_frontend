/** Social Growth queries (SPEC-110; backend SPEC-123 + SPEC-131) — defined once for
 * both transports (SPEC-230). The backend returns the exact camelCase shapes in
 * `@/types/social`, so no adapter is needed. Byte-identical paths to `services/social.ts`. */
import { defineQuery } from "@/lib/query-def";
import { fromApi } from "@/lib/restaurant-api";
import { buildProductsQuery, DEFAULT_CATEGORY } from "@/lib/social-catalog";
import { menuItemsToStudio, type MenuPostItem } from "@/lib/social-menu";
import type {
  ApprovalsData,
  CalendarData,
  OverviewData,
  PerformanceData,
  SocialCategory,
  StudioProduct,
  StudioProductsPage,
} from "@/types/social";

export const socialPaths = {
  overview: (): string => "/social/overview",
  products: (category: SocialCategory): string => `/social/products${buildProductsQuery(category)}`,
  approvals: (): string => "/social/approvals",
  calendar: (): string => "/social/calendar",
  performance: (): string => "/social/performance",
  /** SPEC-389 / backend SPEC-406: a restaurant brand's dishes worth a post. */
  menuItems: (): string => "/social/menu/items",
} as const;

export const socialQueries = {
  menuItems: () =>
    defineQuery<StudioProduct[]>(["social", "menu-items"], async (api) =>
      menuItemsToStudio(fromApi<{ items: MenuPostItem[] }>(await api(socialPaths.menuItems())).items),
    ),
  overview: () =>
    defineQuery<OverviewData>(["social", "overview"], (api) => api<OverviewData>(socialPaths.overview())),
  /** Seed for the Content Studio left panel (SPEC-134) — the default `recommended`
   * commerce signal; category switching and search happen client-side. */
  studioProducts: (category: SocialCategory = DEFAULT_CATEGORY) =>
    defineQuery<StudioProductsPage>(["social", "studio-products", category], (api) =>
      api<StudioProductsPage>(socialPaths.products(category)),
    ),
  approvals: () =>
    defineQuery<ApprovalsData>(["social", "approvals"], (api) => api<ApprovalsData>(socialPaths.approvals())),
  calendar: () =>
    defineQuery<CalendarData>(["social", "calendar"], (api) => api<CalendarData>(socialPaths.calendar())),
  performance: () =>
    defineQuery<PerformanceData>(["social", "performance"], (api) =>
      api<PerformanceData>(socialPaths.performance()),
    ),
} as const;
