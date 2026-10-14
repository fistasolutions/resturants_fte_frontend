/**
 * Performance Ads data service — server transport (backend SPEC-198, wired by
 * SPEC-182). SPEC-111 built this module as the feature's single data seam; since
 * SPEC-230 the paths, keys and adapters live in `lib/queries/ads.ts` so the client
 * cache refetches the same definitions through `/api/proxy`, and this module is
 * their `serverApi` face. Client mutations live in `services/ads-actions.ts`.
 */
import { serverApi } from "@/lib/api";
import { adsQueries } from "@/lib/queries/ads";
import type {
  AccountabilityData,
  BudgetSummary,
  CampaignsData,
  CreativeData,
  OverviewData,
  SpendGatesData,
} from "@/types/ads";

/** The persistent budget/guardrail strip. */
export async function getAdsBudget(): Promise<BudgetSummary> {
  return adsQueries.budget().load(serverApi);
}

export async function getAdsOverview(): Promise<OverviewData> {
  return adsQueries.overview().load(serverApi);
}

export async function getAdsCampaigns(): Promise<CampaignsData> {
  return adsQueries.campaigns().load(serverApi);
}

export async function getAdsCreative(): Promise<CreativeData> {
  return adsQueries.creative().load(serverApi);
}

export async function getAdsSpendGates(): Promise<SpendGatesData> {
  return adsQueries.spendGates().load(serverApi);
}

export async function getAdsAccountability(): Promise<AccountabilityData> {
  return adsQueries.accountability().load(serverApi);
}
