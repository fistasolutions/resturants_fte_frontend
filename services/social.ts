/**
 * Social Growth data service (SPEC-110) — server transport. Since SPEC-230 the
 * paths, keys and loaders live in `lib/queries/social.ts` so the client cache
 * refetches the same definitions through `/api/proxy`; this module is their
 * `serverApi` face. The mock fixtures in `@/lib/mock/social` remain ONLY as Vitest
 * fixture data — nothing here or in the components imports them (root Rule 6 / 8).
 */
import { serverApi } from "@/lib/api";
import { socialQueries } from "@/lib/queries/social";
import { DEFAULT_CATEGORY } from "@/lib/social-catalog";
import type {
  ApprovalsData,
  CalendarData,
  OverviewData,
  PerformanceData,
  SocialCategory,
  StudioProductsPage,
} from "@/types/social";

export async function getSocialOverview(): Promise<OverviewData> {
  return socialQueries.overview().load(serverApi);
}

/** SSR seed for the Content Studio left panel (SPEC-134). */
export async function getStudioProducts(
  category: SocialCategory = DEFAULT_CATEGORY,
): Promise<StudioProductsPage> {
  return socialQueries.studioProducts(category).load(serverApi);
}

export async function getSocialApprovals(): Promise<ApprovalsData> {
  return socialQueries.approvals().load(serverApi);
}

export async function getSocialCalendar(): Promise<CalendarData> {
  return socialQueries.calendar().load(serverApi);
}

export async function getSocialPerformance(): Promise<PerformanceData> {
  return socialQueries.performance().load(serverApi);
}
