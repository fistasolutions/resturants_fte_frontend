/**
 * Email Marketing Manager queries (SPEC-345, backend SPEC-354) — defined once for both
 * transports (SPEC-230). The backend answers in camelCase, exactly `types/email-marketing.ts`,
 * so no adapter sits between the wire and the page. Every read is local Postgres on the
 * backend: no read here reaches Klaviyo.
 */
import { defineQuery } from "@/lib/query-def";
import { fromApi } from "@/lib/restaurant-api";
import type { GuestAudience } from "@/types/guest-audiences";
import type {
  ActivityEntry,
  Approval,
  Audience,
  CampaignChecks,
  DeliverabilityHealth,
  DiscountCode,
  EmailCampaign,
  EmailContent,
  EmailOverview,
  EmailPlan,
  EmailWorkspace,
  Flow,
  PerformanceSnapshot,
} from "@/types/email-marketing";

const BASE = "/email-marketing";

export const emailMarketingPaths = {
  workspace: (): string => `${BASE}/workspace`,
  overview: (): string => `${BASE}/overview`,
  plan: (): string => `${BASE}/plan`,
  campaigns: (): string => `${BASE}/campaigns`,
  campaign: (id: string): string => `${BASE}/campaigns/${encodeURIComponent(id)}`,
  checks: (id: string): string => `${BASE}/campaigns/${encodeURIComponent(id)}/checks`,
  flows: (): string => `${BASE}/flows`,
  flow: (id: string): string => `${BASE}/flows/${encodeURIComponent(id)}`,
  audiences: (): string => `${BASE}/audiences`,
  /** SPEC-388 / backend SPEC-405: a restaurant brand's guest audiences. */
  guestAudiences: (): string => `${BASE}/guest-audiences`,
  content: (): string => `${BASE}/content`,
  discountCodes: (): string => `${BASE}/discount-codes`,
  approvals: (): string => `${BASE}/approvals`,
  performance: (): string => `${BASE}/performance`,
  deliverability: (): string => `${BASE}/deliverability`,
  activity: (): string => `${BASE}/activity`,
  seedTests: (): string => `${BASE}/seed-tests`,
} as const;

/** The domain's key prefix: one invalidation refreshes every read after a write. */
export const EMAIL_MARKETING_KEY = ["email-marketing"] as const;

const key = (...rest: string[]) => [...EMAIL_MARKETING_KEY, ...rest];

export const emailMarketingQueries = {
  workspace: () => defineQuery<EmailWorkspace>(key("workspace"), (api) => api<EmailWorkspace>(emailMarketingPaths.workspace())),
  overview: () => defineQuery<EmailOverview>(key("overview"), (api) => api<EmailOverview>(emailMarketingPaths.overview())),
  plan: () => defineQuery<EmailPlan>(key("plan"), (api) => api<EmailPlan>(emailMarketingPaths.plan())),
  campaigns: () => defineQuery<EmailCampaign[]>(key("campaigns"), (api) => api<EmailCampaign[]>(emailMarketingPaths.campaigns())),
  campaign: (id: string) => defineQuery<EmailCampaign>(key("campaign", id), (api) => api<EmailCampaign>(emailMarketingPaths.campaign(id))),
  checks: (id: string) => defineQuery<CampaignChecks>(key("checks", id), (api) => api<CampaignChecks>(emailMarketingPaths.checks(id))),
  flows: () => defineQuery<Flow[]>(key("flows"), (api) => api<Flow[]>(emailMarketingPaths.flows())),
  flow: (id: string) => defineQuery<Flow>(key("flow", id), (api) => api<Flow>(emailMarketingPaths.flow(id))),
  audiences: () => defineQuery<Audience[]>(key("audiences"), (api) => api<Audience[]>(emailMarketingPaths.audiences())),
  guestAudiences: () =>
    defineQuery<GuestAudience[]>(key("guest-audiences"), async (api) =>
      fromApi<{ audiences: GuestAudience[] }>(await api(emailMarketingPaths.guestAudiences())).audiences,
    ),
  content: () => defineQuery<EmailContent>(key("content"), (api) => api<EmailContent>(emailMarketingPaths.content())),
  discountCodes: () => defineQuery<DiscountCode[]>(key("discount-codes"), (api) => api<DiscountCode[]>(emailMarketingPaths.discountCodes())),
  approvals: () => defineQuery<Approval[]>(key("approvals"), (api) => api<Approval[]>(emailMarketingPaths.approvals())),
  performance: () => defineQuery<PerformanceSnapshot>(key("performance"), (api) => api<PerformanceSnapshot>(emailMarketingPaths.performance())),
  deliverability: () =>
    defineQuery<DeliverabilityHealth>(key("deliverability"), (api) => api<DeliverabilityHealth>(emailMarketingPaths.deliverability())),
  activity: () => defineQuery<ActivityEntry[]>(key("activity"), (api) => api<ActivityEntry[]>(emailMarketingPaths.activity())),
  seedTests: () => defineQuery<string[]>(key("seed-tests"), (api) => api<string[]>(emailMarketingPaths.seedTests())),
} as const;
