export type DecisionSentiment = "risk" | "opportunity";
export type DecisionState = "approved" | "skipped" | null;
export type WatchStatus = "ok" | "warn" | "error";
export type CoverageStatus = "live" | "delayed" | "error" | "off";

export interface BriefEvidenceItem {
  label: string;
  value: string;
  detail: string;
}

export interface BriefDecision {
  type: string;
  headline: string;
  amount: number;
  amount_label: string;
  sentiment: DecisionSentiment;
  why: string;
  evidence_tag: string;
  evidence_items: BriefEvidenceItem[];
  evidence_definition: string;
  view_href: string;
  state: DecisionState;
  acted_at: string | null;
  /** vs a saved daily snapshot (SPEC-069) — absent/null on older archived
   * briefs and when compare=none. */
  amount_previous?: number | null;
  amount_delta_pct?: number | null;
}

export interface BriefWatchItem {
  key: string;
  status: WatchStatus;
  title: string;
  detail: string;
  href?: string;
}

/** SPEC-104 — "Needs Mordy's Attention" exceptions rollup (backend SPEC-102).
 * Exceptions are never "ok" — a healthy store returns an empty `items` list. */
export type AttentionSeverity = "warn" | "error";

export interface BriefAttentionItem {
  key: string;
  status: AttentionSeverity;
  title: string;
  count: number;
  detail: string;
  href?: string;
  /** ── SPEC-233, all additive ── */
  /** The integration that saw it — LOOP, GORGIAS, V-COUNT, IPACKY, SHOPIFY, TAX. */
  source?: string;
  /** What makes it unusual. A card without one has no reason to be read today. */
  delta_label?: string;
  /** What "normal" is for this signal. */
  baseline_label?: string;
  /** At stake — the ranking key. */
  money?: number;
  evidence?: string[];
}

export interface BriefAttention {
  generated_at: string;
  total: number;
  items: BriefAttentionItem[];
  /** ── SPEC-233 ── silence must be distinguishable from breakage. */
  checks_run?: number;
  checks_fired?: number;
  checks_failed?: number;
  /** How many cards to show before collapsing the rest. */
  primary_limit?: number;
}

export interface BriefYesterdayKpis {
  revenue: number;
  revenue_delta_pct: number | null;
  orders: number;
  orders_delta_pct: number | null;
  aov: number;
  aov_delta_pct: number | null;
  new_customers: number;
  new_customers_delta: number | null;
  refunds_total: number;
  refunds_pct_of_revenue: number | null;
}

export interface BriefYesterday {
  date: string;
  revenue: number;
  orders: number;
  revenue_delta_pct: number | null;
}

export interface BriefCoverageItem {
  key: string;
  name: string;
  status: CoverageStatus;
  detail: string;
  /** ISO time of the last successful sync, or null (push-only / awaiting first sync). */
  last_sync_at: string | null;
}

export interface BriefActionResult {
  decision_type: string;
  state: DecisionState;
  acted_at: string;
  already_approved?: boolean;
}

export interface BriefHistoryItem {
  snapshot_date: string;
  generated_at: string;
  decision_count: number;
  decisions_approved: number;
}

export interface BriefHistoryList {
  items: BriefHistoryItem[];
  total: number;
  page: number;
  pages: number;
}

export interface TransferSheetItem {
  title: string;
  units: number;
  from_location: string;
  weekly_velocity: number;
  value: number;
}

export interface TransferSheet {
  location_id: number;
  location_name: string;
  /** SPEC-057 — null when this location has no manager email configured yet. */
  manager_email: string | null;
  total_value: number;
  items: TransferSheetItem[];
  sheet_text: string;
  sent: boolean;
  sent_at: string | null;
}

export interface TransferSheetsResponse {
  sheets: TransferSheet[];
}

export interface TransferSendResult {
  sheets: TransferSheet[];
  email_sent: boolean;
  email_recipients: number;
  email_error: string | null;
}

export interface OverdueOrderItem {
  order_name: string;
  age: string;
  value: number;
}

export interface OverdueSheet {
  location_key: string;
  location_name: string;
  /** SPEC-057 — null when this location has no manager email configured yet. */
  manager_email: string | null;
  total_value: number;
  orders: OverdueOrderItem[];
  sheet_text: string;
  sent: boolean;
  sent_at: string | null;
}

export interface OverdueSheetsResponse {
  sheets: OverdueSheet[];
}

export interface TrafficNudgeBusyHour {
  hour: number;
  visitors: number;
  conversion_rate: number;
}

/** SPEC-114 — one under-performing store's staffing nudge: its in-store
 * conversion vs the best store, the $ opportunity of closing the gap, and the
 * busy hours converting below its own average. */
export interface TrafficNudgeSheet {
  location_id: number;
  location: string;
  location_name: string;
  visitors: number;
  transactions: number;
  conversion_rate: number | null;
  benchmark_store: string;
  benchmark_rate: number | null;
  gap_pts: number;
  opportunity: number;
  avg_order_value: number | null;
  busy_hours: TrafficNudgeBusyHour[];
  /** null when this location has no manager email configured yet. */
  manager_email: string | null;
  sent: boolean;
  sent_at: string | null;
}

export interface TrafficNudgeSheetsResponse {
  sheets: TrafficNudgeSheet[];
}

export interface OverdueSendResult {
  sheets: OverdueSheet[];
  email_sent: boolean;
  email_recipients: number;
  email_error: string | null;
}

export interface WinbackCustomer {
  customer_id: number;
  first_name: string | null;
  last_name: string | null;
  email: string;
  orders_count: number;
  total_spent: number;
  avg_gap_days: number;
  days_silent: number;
}

export interface WinbackListResponse {
  customers: WinbackCustomer[];
  total: number;
  /** Full qualifying-list count, unaffected by `q` — what "Sync to
   * Klaviyo" actually acts on, regardless of the active search/page. */
  total_candidates: number;
  page: number;
  pages: number;
  sent: boolean;
  sent_at: string | null;
  /** What the store's Klaviyo key may do (backend SPEC-365); absent from an older backend. */
  klaviyo?: WinbackKlaviyoAccess;
}

export interface WinbackKlaviyoAccess {
  can_sync: boolean;
  /** Why the win-back cannot sync; null when it can. */
  reason: string | null;
}

export interface WinbackSendResult {
  customers: WinbackCustomer[];
  klaviyo_synced: number;
  klaviyo_error: string | null;
}

export interface BriefData {
  generated_at: string;
  yesterday: BriefYesterday;
  decisions: BriefDecision[];
  overnight_watch: BriefWatchItem[];
  yesterday_kpis: BriefYesterdayKpis;
  coverage: BriefCoverageItem[];
}

export interface BriefRangeKpisResponse {
  period: {
    start: string;
    end: string;
    compare: { mode: string; start: string; end: string } | null;
  };
  kpis: BriefYesterdayKpis;
}
