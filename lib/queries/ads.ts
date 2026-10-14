/** Performance Ads queries (backend SPEC-198, wired by SPEC-182) — defined once for
 * both transports (SPEC-230). Every number — `utilization` included — is computed by
 * the backend; the UI never divides `spent / cap` itself (SPEC-111). Client
 * mutations stay in `services/ads-actions.ts`. */
import {
  adaptAdsAccountability,
  adaptAdsBudget,
  adaptAdsCampaigns,
  adaptAdsCreative,
  adaptAdsOverview,
  adaptAdsSpendGates,
} from "@/lib/adapters";
import {
  toAudit,
  toPerformance,
  toPlatformsStatus,
  type ApiAudit,
  type ApiPerformance,
  type ApiPlatformsStatus,
} from "@/lib/ad-platforms-api";
import { defineQuery } from "@/lib/query-def";
import type { AdAudit, AdPerformance, AdPlatformsStatus } from "@/types/ad-platforms";
import type {
  AccountabilityData,
  BudgetSummary,
  CampaignsData,
  CreativeData,
  OverviewData,
  SpendGatesData,
} from "@/types/ads";

type Payload = Record<string, unknown>;

export const adsPaths = {
  budget: (): string => "/ads/budget",
  overview: (): string => "/ads/overview",
  campaigns: (): string => "/ads/campaigns",
  creatives: (): string => "/ads/creatives",
  gates: (): string => "/ads/gates",
  accountability: (): string => "/ads/accountability",
  // SPEC-333 / backend SPEC-342: the real ad accounts, read-only.
  platforms: (): string => "/ads/platforms",
  platformPerformance: (days: number): string => `/ads/platforms/performance?days=${days}`,
  platformAudit: (days: number): string => `/ads/platforms/audit?days=${days}`,
} as const;

export const adsQueries = {
  budget: () =>
    defineQuery<BudgetSummary>(["ads", "budget"], async (api) => adaptAdsBudget(await api<Payload>(adsPaths.budget()))),
  overview: () =>
    defineQuery<OverviewData>(["ads", "overview"], async (api) =>
      adaptAdsOverview(await api<Payload>(adsPaths.overview())),
    ),
  campaigns: () =>
    defineQuery<CampaignsData>(["ads", "campaigns"], async (api) =>
      adaptAdsCampaigns(await api<Payload>(adsPaths.campaigns())),
    ),
  creative: () =>
    defineQuery<CreativeData>(["ads", "creative"], async (api) =>
      adaptAdsCreative(await api<Payload>(adsPaths.creatives())),
    ),
  spendGates: () =>
    defineQuery<SpendGatesData>(["ads", "spend-gates"], async (api) =>
      adaptAdsSpendGates(await api<Payload>(adsPaths.gates())),
    ),
  accountability: () =>
    defineQuery<AccountabilityData>(["ads", "accountability"], async (api) =>
      adaptAdsAccountability(await api<Payload>(adsPaths.accountability())),
    ),
  platforms: () =>
    defineQuery<AdPlatformsStatus>(["ads", "platforms"], async (api) =>
      toPlatformsStatus(await api<ApiPlatformsStatus>(adsPaths.platforms())),
    ),
  platformPerformance: (days: number) =>
    defineQuery<AdPerformance>(["ads", "platforms", "performance", days], async (api) =>
      toPerformance(await api<ApiPerformance>(adsPaths.platformPerformance(days))),
    ),
  platformAudit: (days: number) =>
    defineQuery<AdAudit>(["ads", "platforms", "audit", days], async (api) =>
      toAudit(await api<ApiAudit>(adsPaths.platformAudit(days))),
    ),
} as const;
