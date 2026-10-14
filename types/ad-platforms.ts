/** Performance Ads ← a store's real ad accounts, read-only (SPEC-333 / backend SPEC-342).
 * Adapters in `lib/ad-platforms-api.ts`. Every figure arrives computed by the backend. */

export interface AdAccountChoice {
  id: string;
  name: string;
  currency: string;
  timezone: string;
  active: boolean;
  selected: boolean;
}

export interface AdPlatformLink {
  platform: "meta";
  status: "connected" | "needs_reconnect";
  connectedBy: string;
  lastSyncedAt: string | null;
  lastError: string | null;
  accounts: AdAccountChoice[];
}

export interface AdPlatformsStatus {
  /** Whether the server has a Meta app at all — the Connect button depends on it. */
  configured: boolean;
  platforms: AdPlatformLink[];
}

/** One level's figures (account, campaign or ad); null where the ratio has no base. */
export interface AdFigures {
  spend: number;
  impressions: number;
  clicks: number;
  purchases: number;
  revenue: number;
  roas: number | null;
  cpa: number | null;
  ctr: number | null;
  cpc: number | null;
  cpm: number | null;
  frequency: number | null;
  hookRate: number | null;
}

export interface AdCampaignRow extends AdFigures {
  id: string;
  name: string;
  status: string;
  objective: string;
}

export interface AdRow extends AdFigures {
  id: string;
  name: string;
  campaign: string;
  status: string;
  title: string | null;
  body: string | null;
  thumbnail: string | null;
  isVideo: boolean;
}

export interface AdPerformance {
  days: number;
  since: string;
  until: string;
  currency: string;
  accounts: { id: string; name: string }[];
  totals: AdFigures;
  /** Store net sales ÷ ad spend; `reason` says why it is missing when `value` is null. */
  mer: { value: number | null; sales: number | null; reason: string | null };
  campaigns: AdCampaignRow[];
  ads: AdRow[];
}

export type AuditSeverity = "high" | "medium" | "low";

export type AuditRule =
  | "spend_no_purchases"
  | "roas_below_breakeven"
  | "cpa_over_target"
  | "creative_fatigue"
  | "below_par_creative"
  | "hook_rate_low"
  | "learning_limited"
  | "no_purchase_tracking";

export interface AuditFinding {
  rule: AuditRule;
  severity: AuditSeverity;
  level: "ad" | "adset" | "account";
  name: string;
  campaignName: string | null;
  title: string;
  evidence: string;
  wasted: number;
  action: string;
}

export interface AdAudit {
  days: number;
  spend: number;
  atRisk: number;
  findings: AuditFinding[];
}
