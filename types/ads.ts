/**
 * Performance Ads (AI Media Buyer) — the future API contract (SPEC-111). The
 * MVP ships frontend-only on mock data; these interfaces are what the backend
 * campaign / creative / attribution / guardrail services will return, so
 * components bind to them now and the data source swaps in a later phase.
 * `store_id`-scoped by construction, like the rest of the platform.
 *
 * Third Digital FTE — sibling of Spotlight (SPEC-109) & Social Growth
 * (SPEC-110), same shell + mock discipline. This one spends money, so every
 * type carries the trust story: caps, profit alongside revenue, gated actions.
 */

/** The paid channels the media buyer runs. Identity is conveyed by name + a
 * lucide icon only — never a platform brand color (root Rule 9). */
export type AdChannel = "meta" | "google";

/** For metrics where a *lower* number is better (e.g. CAC) the tile flips
 * delta colors. */
export type DeltaKind = "up-good" | "down-good";

export interface AdKpi {
  id: string;
  label: string;
  /** Pre-formatted for display — the backend owns the calculation (Rule 8). */
  value: string;
  /** Signed percent change vs the prior period; omitted when there's no baseline. */
  delta?: number;
  deltaKind?: DeltaKind;
  hint?: string;
}

/* ── Budget strip (persistent) ────────────────────────────────────────── */

/**
 * The always-visible budget/guardrail summary rendered in the shell. Every
 * number is pre-computed by the backend (Rule 8 — the UI never divides
 * `spent / cap` itself), including `utilization` for the bar.
 */
export interface BudgetSummary {
  /** e.g. "This month". */
  periodLabel: string;
  /** Total approved spend cap for the period. */
  totalCap: number;
  spent: number;
  remaining: number;
  /** spent ÷ cap, 0–1+ (may exceed 1 if a cap was overrun). */
  utilization: number;
  /** Count of live campaigns, for the strip's at-a-glance line. */
  liveCampaigns: number;
  /** Count of spend decisions awaiting human sign-off. */
  pendingApprovals: number;
  /** The REAL stop state from the backend (SPEC-199). Previously local React state,
   * which forgot on reload — unacceptable on the control that halts all spending. */
  killSwitchActive: boolean;
  /** Whether a monthly ceiling exists at all, so the UI can prompt for one instead of
   * showing a confusing $0 cap. */
  monthlyCapSet: boolean;
}

/** The store's spend policy (backend SPEC-199). */
export interface AdsSettings {
  monthlyCap: number;
  killSwitchActive: boolean;
  killSwitchReason: string | null;
}

/* ── Overview ─────────────────────────────────────────────────────────── */

export type RecommendationKind =
  | "scale_winner"
  | "clear_dead_stock"
  | "defend_branded";

export type ActivityKind =
  | "launch"
  | "approval"
  | "optimize"
  | "guardrail"
  | "measure";

export interface ActivityItem {
  id: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  timestamp: string;
}

/** One period of the blended spend-vs-profit trend (rendered as div bars). */
export interface TrendPoint {
  label: string;
  spend: number;
  profit: number;
}

/** The data-picked "what to run next" recommendation (Overview + Campaigns). */
export interface NextCampaign {
  name: string;
  channel: AdChannel;
  objective: string;
  reason: RecommendationKind;
  reasonDetail: string;
  /** Pre-formatted projected spend, e.g. "$45 / day". */
  projectedSpend: string;
  /** In-app deep link (e.g. the Campaigns tab). */
  href: string;
}

export interface OverviewData {
  kpis: AdKpi[];
  blendedTrend: TrendPoint[];
  nextCampaign: NextCampaign;
  activity: ActivityItem[];
}

/* ── Campaigns ────────────────────────────────────────────────────────── */

export type CampaignStatus =
  | "draft"
  | "pending_approval"
  | "live"
  | "paused"
  | "capped";

export interface Campaign {
  id: string;
  name: string;
  channel: AdChannel;
  objective: string;
  /** Target persona / ICP. */
  persona: string;
  /** The product or offer the campaign promotes. */
  offer: string;
  status: CampaignStatus;
  dailyCap: number;
  totalCap: number;
  spent: number;
  /** Profit-aware ROAS on real margin (0 for not-yet-live campaigns). */
  roas: number;
  cac: number;
  /** Attributed profit (real margin) — may be negative for underperformers. */
  profit: number;
  /** Attributed revenue, shown alongside profit for the real-margin story. */
  revenue: number;
  /** SPEC-387 (backend SPEC-404), restaurant brands: the branch the campaign promotes. */
  branchId?: number | null;
  branchName?: string | null;
  /** The path the ad must point at, with its tracking tokens (restaurant brands). */
  trackingLink?: string | null;
}

/** A branch campaign's branch sales in its live days against the same days before. */
export interface BranchLift {
  branchId: number;
  days: number;
  before: { from: string; to: string; netSales: number; orders: number };
  during: { from: string; to: string; netSales: number; orders: number };
  /** (during − before) ÷ before; null when before had no sales. */
  change: number | null;
}

export interface CampaignsData {
  campaigns: Campaign[];
  recommended: NextCampaign;
}

/* ── Creative ─────────────────────────────────────────────────────────── */

/** Where a creative came from — reused Social Growth posts or Spotlight search. */
export type CreativeSource = "social" | "spotlight";

/** Paid-social aspect ratios reuse Social Growth's three formats; `search` is a
 * text ad sourced from Spotlight keywords/headlines. */
export type AdCreativeFormat = "feed" | "story" | "square" | "search";

export interface AdCreative {
  id: string;
  source: CreativeSource;
  channel: AdChannel;
  format: AdCreativeFormat;
  productName: string;
  /** On-image headline (social) or the search ad headline (spotlight). */
  headline: string;
  /** Present for `search` creatives: the query the ad bids on. */
  keyword?: string;
  spent: number;
  roas: number;
}

export interface CreativeData {
  creatives: AdCreative[];
}

/* ── Spend Gates (the star) ───────────────────────────────────────────── */

export type GateActionKind =
  | "launch_campaign"
  | "raise_budget"
  | "expand_audience";

export interface SpendGate {
  id: string;
  action: GateActionKind;
  title: string;
  channel: AdChannel;
  /** Plain-language rationale grounded in Shopify data. */
  rationale: string;
  /** Pre-formatted projected spend, e.g. "$45 / day". */
  projectedSpend: string;
  /** The cap this action fits within, pre-formatted for display. */
  capContext: string;
  /** Expected profit impact, pre-formatted (real-margin story). */
  expectedProfit: string;
  /** Projected profit-aware ROAS if approved. */
  expectedRoas: number;
}

export interface SpendGatesData {
  gates: SpendGate[];
}

/* ── Accountability ───────────────────────────────────────────────────── */

export interface LedgerRow {
  id: string;
  date: string;
  campaign: string;
  channel: AdChannel;
  amount: number;
  attributedProfit: number;
}

export interface CampaignCapUtil {
  id: string;
  campaign: string;
  channel: AdChannel;
  spent: number;
  cap: number;
  /** spent ÷ cap, 0–1+ — backend-computed. */
  utilization: number;
}

export type GuardrailKind = "auto_pause" | "cap_hit" | "anomaly_halt";

export interface GuardrailEvent {
  id: string;
  kind: GuardrailKind;
  title: string;
  detail: string;
  timestamp: string;
}

export interface AccountabilityData {
  /** False until an ad account is connected — drives the setup nudge (MVP). */
  connected: boolean;
  ledger: LedgerRow[];
  capUtilization: CampaignCapUtil[];
  guardrails: GuardrailEvent[];
}
