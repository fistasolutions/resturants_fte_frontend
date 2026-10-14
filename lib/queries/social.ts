/** Social Growth queries (SPEC-110; backend SPEC-123 + SPEC-131) — defined once for
 * both transports (SPEC-230). The backend returns the exact camelCase shapes in
 * `@/types/social`, so no adapter is needed. Byte-identical paths to `services/social.ts`. */
import { defineQuery } from "@/lib/query-def";
import { buildProductsQuery, DEFAULT_CATEGORY } from "@/lib/social-catalog";
import type {
  ApprovalsData,
  CalendarData,
  OverviewData,
  PerformanceData,
  SocialCategory,
  StudioProductsPage,
} from "@/types/social";

export const socialPaths = {
  overview: (): string => "/social/overview",
  products: (category: SocialCategory): string => `/social/products${buildProductsQuery(category)}`,
  approvals: (): string => "/social/approvals",
  calendar: (): string => "/social/calendar",
  performance: (): string => "/social/performance",
} as const;

export const socialQueries = {
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
