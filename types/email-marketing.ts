/**
 * Email Marketing Manager (SPEC-345, backend SPEC-354) — the provider-neutral view model.
 * The backend answers in exactly these shapes (camelCase), so no adapter sits between the
 * wire and the page.
 *
 * Every object that lives in the store's email platform carries `provider` and
 * `externalId` (the platform's own id, null until it exists there), so a second platform
 * is one adapter and one capability row, never new screens. Money is in minor units with
 * its currency, like the rest of the app's API.
 */

export type EmailProviderKey =
  | "klaviyo"
  | "mailchimp"
  | "omnisend"
  | "shopify_email"
  | "hubspot"
  | "attentive"
  | "postscript";

export interface ProviderCapabilities {
  emailChannel: boolean;
  smsChannel: boolean;
  campaigns: boolean;
  flowsCreate: boolean;
  segmentsCreate: boolean;
  listsWrite: boolean;
  templatesWrite: boolean;
  uniqueCoupons: boolean;
  smartSendTime: boolean;
  throttledSend: boolean;
  reporting: boolean;
  catalogSync: boolean;
  customEvents: boolean;
}

export type Capability = keyof ProviderCapabilities;

export interface EmailProviderInfo {
  key: EmailProviderKey;
  name: string;
  /** What the platform is, in a few words. */
  kind: string;
  /** Only an available provider can be connected; the rest are named as coming. */
  available: boolean;
  capabilities: ProviderCapabilities;
  /** The scopes a private key must carry for this employee. */
  scopes: readonly string[];
  /** Platform limits the UI must be honest about. */
  limits: readonly string[];
  /** How the platform's private keys begin, and what to say when one does not. */
  keyPrefix: { prefix: string; wrong: string } | null;
}

export interface Money {
  /** Minor units (cents). */
  amount: number;
  currency: string;
}

export type ConnectionStatus = "connected" | "not_connected" | "needs_attention";

export interface EmailConnection {
  provider: EmailProviderKey;
  status: ConnectionStatus;
  accountName: string | null;
  accountId: string | null;
  /** Scopes the stored key was checked for, each granted or missing. */
  scopes: { scope: string; granted: boolean }[];
  connectedAt: string | null;
  /** Why it needs attention, in the owner's words. */
  problem: string | null;
  /** While not connected: the Integrations page already holds a key Connect can use. Never the key. */
  keyOnFile: boolean;
}

export type AutonomyLevel = "suggest" | "draft" | "approve" | "autopilot";

export interface Guardrails {
  /** Most marketing emails one profile may get in seven days. */
  frequencyCapPerWeek: number;
  /** Quiet hours in the customer's own timezone, 24h clock, start inclusive. */
  quietHours: { start: number; end: number };
  /** Above this many recipients a send needs a second, typed approval. */
  maxAudienceWithoutSecondApproval: number;
  maxDiscountPercent: number;
  /** A discounted product must keep at least this gross margin %. */
  marginFloorPercent: number;
  /** FTE segment keys never sent marketing. */
  excludedSegments: string[];
  dailySendCeiling: number;
  /** Seed addresses every campaign is tested on first. */
  seedList: string[];
  requireSeedTest: boolean;
}

export interface SenderDefaults {
  fromName: string;
  fromEmail: string;
  replyTo: string;
}

export interface EmailWorkspace {
  connection: EmailConnection;
  autonomy: AutonomyLevel;
  /** Program id → its own level, where the owner overrode the employee's. */
  programAutonomy: Record<string, AutonomyLevel>;
  guardrails: Guardrails;
  sender: SenderDefaults;
  killSwitch: { active: boolean; at: string | null; by: string | null; reason: string | null };
  /** When the nightly reporting snapshot was taken (reports are rate-limited); null before
   * the first one. */
  snapshotAt: string | null;
  /** Recipients already sent to today, for the daily ceiling. */
  sentToday: number;
  /** What the Klaviyo key may do (backend SPEC-362); absent from an older backend. */
  access?: EmailAccess;
}

export type EmailAccessMode = "full" | "partial" | "read_only";
export type EmailAccessAction = "send" | "flows" | "audiences";

export interface EmailAccess {
  mode: EmailAccessMode;
  canSend: boolean;
  canBuildFlows: boolean;
  canSyncAudiences: boolean;
  /** The write scopes the key lacks, e.g. "flows:write". */
  missing: string[];
  /** The whole-key sentence; null for a full key. */
  reason: string | null;
  /** Per action: why it is refused, or null when allowed. */
  reasons: Record<EmailAccessAction, string | null>;
}

export type CampaignStatus =
  | "draft"
  | "in_review"
  | "scheduled"
  | "sending"
  | "sent"
  | "cancelled"
  | "failed";

export type CampaignGoal =
  | "sell_through"
  | "launch"
  | "win_back"
  | "vip_early_access"
  | "newsletter"
  | "back_in_stock"
  | "custom";

export type Channel = "email" | "sms";

export type AudienceSource = "fte" | "provider_list" | "provider_segment";

export interface ConsentBreakdown {
  emailSubscribed: number;
  smsSubscribed: number;
  neverSubscribed: number;
  suppressed: number;
}

export interface Audience {
  key: string;
  name: string;
  source: AudienceSource;
  provider: EmailProviderKey;
  externalId: string | null;
  /** Why the employee keeps this group, in one line. */
  description: string;
  size: number;
  consent: ConsentBreakdown;
  /** Profiles also found in the provider (by email), for an FTE segment. */
  overlap: number | null;
  sync: { at: string | null; direction: "to_provider" | "from_provider" | null; as: "list" | "segment" | null };
  /** True for a group that must never receive a discount send (bracketers, complainers). */
  protective: boolean;
}

export interface Exclusion {
  reason: string;
  count: number;
}

export type OfferKind = "none" | "discount" | "unique_codes" | "free_shipping";

export interface Offer {
  kind: OfferKind;
  /** The existing Shopify code the email carries — ftes reads Shopify and never creates one. */
  code: string | null;
  /** Percent off for a discount or unique codes. */
  percent: number | null;
  /** Gross margin % of the products in the offer, before the discount. */
  productMarginPercent: number | null;
  /** The code's past verdict from Discounts → Decisions, when it has one. */
  history: string | null;
}

export type SendStrategy =
  | { kind: "immediate" }
  /** `at` is a wall-clock time with no zone (`YYYY-MM-DDTHH:MM`): it lands at that hour in
   * each customer's own timezone. */
  | { kind: "static"; at: string }
  | { kind: "smart"; date: string }
  /** Klaviyo throttles by the share of the audience sent each hour — one of `THROTTLE_PERCENTS`. */
  | { kind: "throttled"; at: string; percent: number }
  /** SPEC-368 (backend SPEC-378): on `date`, at the hour this audience orders most — resolved
   * by the server at approval and sent like a set time, in each customer's own timezone. */
  | { kind: "best_time"; date: string };

export type BlockKind =
  | "hero"
  | "product_grid"
  | "size_advice"
  | "blog_teaser"
  | "ugc"
  | "text"
  /** SPEC-368: one product per customer, picked by the server; `productIds[0]` is the
   * required fallback anyone without a pick (and every test send) sees. */
  | "picked_for_you"
  | "footer";

export interface ContentBlock {
  id: string;
  kind: BlockKind;
  title: string;
  body: string;
  /** Product ids for a grid, from the real catalog; for Picked for you, the one fallback. */
  productIds?: number[];
}

export interface SubjectVariant {
  id: string;
  subject: string;
  preview: string;
  /** 0–100 from `scoreSubject` and the store's learnings. */
  score: number;
  notes: string[];
}

export interface CampaignMessage {
  channel: Channel;
  subject: string;
  previewText: string;
  blocks: ContentBlock[];
  templateId: string | null;
}

export interface CampaignResults {
  recipients: number;
  delivered: number;
  opens: number;
  clicks: number;
  conversions: number;
  unsubscribes: number;
  spamComplaints: number;
  bounces: number;
  /** Revenue the provider attributes to the send. */
  attributedRevenue: Money;
  /** Revenue above the holdout group's rate: what the send caused. */
  incrementalRevenue: Money | null;
  /** Incremental revenue less product cost, discount cost and sending cost. */
  profit: Money | null;
  holdoutSize: number;
}

export interface ProfitEstimate {
  low: Money;
  high: Money;
  basis: string;
}

export interface EmailCampaign {
  id: string;
  provider: EmailProviderKey;
  externalId: string | null;
  name: string;
  goal: CampaignGoal;
  status: CampaignStatus;
  message: CampaignMessage;
  audienceKeys: string[];
  excludedKeys: string[];
  recipientEstimate: number;
  exclusions: Exclusion[];
  offer: Offer;
  strategy: SendStrategy;
  holdoutPercent: number;
  variants: number;
  brandVoiceScore: number;
  expectedProfit: ProfitEstimate;
  discountCost: Money;
  results: CampaignResults | null;
  createdAt: string;
  sendAt: string | null;
  /** Who made it: the employee or the owner. */
  createdBy: "employee" | "owner";
  /** Plain-English verdict once results are in. */
  verdict: string | null;
  /** Built here, or read from the email platform (built outside this employee). */
  source: "fte" | "provider";
  /** Why the last send attempt failed, in the owner's words; null when it did not. */
  lastError: string | null;
}

/** `GET /campaigns/{id}/checks` — the server's own verdict, the one approve is gated on. */
export interface CampaignChecks {
  recipients: number;
  heldOut: number;
  exclusions: Exclusion[];
  checks: { key: string; label: string; status: "pass" | "warn" | "block"; reason: string }[];
  /** SPEC-368 (backend SPEC-378): the hour this audience orders most, whatever strategy is
   * chosen; null when there is not enough order history. Absent from an older backend. */
  bestTime?: BestTime | null;
  /** The five products most often picked for this audience, for a Picked for you block. */
  picks?: CampaignPick[];
}

/** When an audience orders: a store-local hour (0–23), from its members' own best hours
 * (`audience`) or, with too few of them, the store's busiest ordering hour (`store`). */
export interface BestTime {
  hour: number;
  basis: "audience" | "store";
  /** Members with a best hour of their own (the audience basis). */
  customers: number;
}

/** One product the server picked for some of the audience, and for how many of them. */
export interface CampaignPick {
  productId: number;
  title: string;
  customers: number;
}

/** An active Shopify discount code — the only codes an email can carry. */
export interface DiscountCode {
  code: string;
  /** Percent off for a percentage code; null for a fixed amount. */
  percent: number | null;
  kind: "percentage" | "fixed_amount";
  value: number;
  endsAt: string | null;
}

/** `POST /kill-switch` — what pulling (or releasing) it changed in the email platform. */
export interface KillSwitchResult {
  active: boolean;
  cancelled: number;
  paused: number;
  failed: string[];
}

export type FlowStatus = "live" | "manual" | "draft" | "missing";

export type FlowKey =
  | "welcome"
  | "browse_abandon"
  | "cart_abandon"
  | "checkout_abandon"
  | "post_purchase"
  | "cross_sell"
  | "replenishment"
  | "back_in_stock"
  | "price_drop"
  | "win_back"
  | "sunset"
  | "birthday"
  | "review_request"
  | "fit_check";

export type FlowStep =
  | { id: string; kind: "trigger"; label: string; detail: string }
  | { id: string; kind: "delay"; label: string; hours: number }
  | { id: string; kind: "split"; label: string; yes: FlowStep[]; no: FlowStep[] }
  | {
      id: string;
      kind: "message";
      label: string;
      channel: Channel;
      subject: string;
      previewText: string;
      blocks: ContentBlock[];
      status: "live" | "draft";
    }
  /** A step the journey view names but does not draw in detail (an A/B, an update, a webhook). */
  | { id: string; kind: "other"; label: string; detail: string };

export type FlowHealth = "healthy" | "weak" | "broken" | "missing";

export interface Flow {
  /** The flow's id here, or `missing-<key>` for a lifecycle flow not built yet. */
  id: string;
  /** The lifecycle it serves; null for a flow built in the platform that matches none. */
  key: FlowKey | null;
  provider: EmailProviderKey;
  externalId: string | null;
  name: string;
  /** What the flow is for, in one line. */
  purpose: string;
  /** What the platform knows that makes this flow better than the email platform's own. */
  edge: string;
  status: FlowStatus;
  health: FlowHealth;
  healthNote: string;
  /** Revenue per recipient over 30 days, null when missing. */
  rpr: Money | null;
  recipients30d: number;
  revenue30d: Money;
  /** Revenue the flow caused over 30 days, from its always-on holdout; null without one. */
  incremental30d: Money | null;
  steps: FlowStep[];
  createdByEmployee: boolean;
}

export interface FlowGap {
  flowKey: FlowKey;
  /** The flow page to open: the existing flow's id, or `missing-<key>`. */
  flowId: string;
  title: string;
  why: string;
  /** Estimated profit per month once built, and how it was priced. */
  monthly: Money;
  basis: string;
}

export interface Template {
  id: string;
  name: string;
  source: "fte" | "provider";
  provider: EmailProviderKey;
  externalId: string | null;
  updatedAt: string;
  blocks: ContentBlock[];
}

export interface ReusableSection {
  id: string;
  kind: "header" | "footer" | "signature";
  name: string;
  body: string;
  updatedAt: string;
}

export interface VoiceRules {
  bannedWords: string[];
  claims: string[];
  voiceNotes: string[];
}

export interface CatalogProduct {
  id: number;
  title: string;
  price: Money;
  marginPercent: number;
  stock: number;
  /** From Foresight: true when the product is at stockout risk. */
  stockoutRisk: boolean;
  /** From Fit: how the product runs, when known. */
  fit: "true_to_size" | "runs_small" | "runs_large" | null;
}

export interface EmailContent {
  templates: Template[];
  sections: ReusableSection[];
  voice: VoiceRules;
  catalog: CatalogProduct[];
  /** The latest Search Visibility post, offered as a newsletter section. */
  latestPost: { title: string; url: string; publishedAt: string } | null;
  /** SPEC-350: the advice block in the store's trade (backend SPEC-360); absent on an older
   * backend, where the builder falls back to its own label. */
  adviceBlock?: AdviceBlock;
}

/** The advice block's label and starter text, from the store's Brand Brain store type. */
export interface AdviceBlock {
  label: string;
  title: string;
  body: string;
}

export type ApprovalKind = "campaign" | "flow_activation" | "flow_message";

export interface Approval {
  id: string;
  kind: ApprovalKind;
  title: string;
  /** Why the employee wants this, in one line. */
  why: string;
  campaignId: string | null;
  flowId: string | null;
  requestedAt: string;
}

export interface MetricRow {
  id: string;
  name: string;
  kind: "campaign" | "flow";
  recipients: number;
  attributedRevenue: Money;
  incrementalRevenue: Money | null;
  profit: Money | null;
  clicks: number;
  opens: number;
  delivered: number;
  unsubscribes: number;
  spamComplaints: number;
  bounces: number;
}

/** One week of email money, in whole currency units (a chart, not a ledger). */
export interface TrendPoint {
  date: string;
  attributed: number;
  incremental: number;
  profit: number;
}

export interface SubjectLearning {
  finding: string;
  evidence: string;
  lift: number;
}

export interface PerformanceSnapshot {
  /** When the nightly report read ran; null before the first. */
  takenAt: string | null;
  currency: string;
  rows: MetricRow[];
  trend: TrendPoint[];
  learnings: SubjectLearning[];
}

export type AuthStatus = "pass" | "fail" | "missing" | "unknown";

export interface DeliverabilityHealth {
  /** When the nightly read ran; null before the first. */
  takenAt: string | null;
  /** The sending domain checked in DNS; null until a from-email is set. */
  domain: string | null;
  spf: AuthStatus;
  dkim: AuthStatus;
  dmarc: AuthStatus;
  dmarcPolicy: string | null;
  /** Weekly rates, newest last. */
  weeks: { week: string; spamRate: number; bounceRate: number; delivered: number }[];
  /** Profiles in the engaged / unengaged segments the employee keeps in the platform; null
   * until the platform has counted them. */
  engaged: number | null;
  unengaged: number | null;
  sunsetCandidates: number | null;
}

export type ActivityActor = "owner" | "employee" | "provider";

export interface ActivityEntry {
  id: string;
  at: string;
  actor: ActivityActor;
  actorName: string;
  action: string;
  /** What changed in the email platform, when anything did. */
  providerChange: string | null;
}

export type PlanSlotKind = "campaign" | "flow_change";
export type PlanSlotState = "proposed" | "accepted" | "rejected";

export interface PlanSlot {
  id: string;
  date: string;
  kind: PlanSlotKind;
  title: string;
  reason: string;
  reasonKind: "occasion" | "season" | "stock" | "repeat_clock" | "rhythm" | "content" | "health";
  audience: string;
  expectedProfit: Money;
  state: PlanSlotState;
  rejectReason: string | null;
  goal: CampaignGoal | null;
}

export interface EmailPlan {
  from: string;
  to: string;
  slots: PlanSlot[];
}

export interface MoneyStrip {
  attributed30d: Money;
  incremental30d: Money;
  profit30d: Money;
  revenuePerRecipient: Money;
  listSize: number;
  listGrowth30d: number;
  unsubscribeRate: number;
  spamRate: number;
}

export interface NeedsYouItem {
  id: string;
  tone: "warning" | "destructive" | "info";
  title: string;
  detail: string;
  href: string;
}

export interface EmailOverview {
  strip: MoneyStrip;
  needsYou: NeedsYouItem[];
  gaps: FlowGap[];
  week: PlanSlot[];
  recent: ActivityEntry[];
}
