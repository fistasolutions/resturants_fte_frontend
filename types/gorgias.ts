/** Gorgias workspace read models (backend SPEC-088, frontend SPEC-094).
 * The agent leaderboard reuses `GorgiasAgentMetric` from team-performance. */

import type { GorgiasAgentMetric } from "@/types/team-performance";

export interface GorgiasOverviewMetrics {
  conversations: number;
  resolved: number;
  resolution_rate: number | null;
  avg_first_response_seconds: number | null;
  avg_resolution_seconds: number | null;
  csat: number | null;
  open_backlog: number;
  /** Shopify orders in range — the contact-rate denominator (SPEC-098). */
  orders: number;
  /** Human conversations ÷ orders; null when no orders in range. */
  contact_rate: number | null;
}

export type GorgiasRiskKind = "unanswered" | "over_24h" | "unhappy";

/** One at-risk customer: their Shopify lifetime value + representative ticket
 * (SPEC-098 ①). An association (customer in a bad/pending state), not predicted
 * lost revenue. */
export interface GorgiasRevenueAtRiskCustomer {
  customer_name: string | null;
  total_spent: number;
  gorgias_ticket_id: number;
  subject: string | null;
  contact_reason: string | null;
  status: string;
  created_at: string | null;
  risk_kind: GorgiasRiskKind;
  gorgias_url: string | null;
}

export interface GorgiasRevenueAtRisk {
  total: number;
  customer_count: number;
  customers: GorgiasRevenueAtRiskCustomer[];
}

export interface GorgiasAlertCounts {
  unanswered: number;
  unhappy: number;
  reopened: number;
  over_24h: number;
}

export interface GorgiasReasonBreakdown {
  reason: string;
  count: number;
}

export interface GorgiasChannelBreakdown {
  channel: string;
  count: number;
}

export interface GorgiasOverview {
  period: { start: string; end: string; compare: boolean };
  metrics: GorgiasOverviewMetrics;
  /** Percent change vs the compare period; null when undefined (no base). */
  change_pct: Record<string, number | null>;
  breakdowns: {
    contact_reason: GorgiasReasonBreakdown[];
    channel: GorgiasChannelBreakdown[];
  };
  alerts: GorgiasAlertCounts;
  /** Lightweight revenue-at-risk headline (SPEC-098); full list on /alerts. */
  revenue_at_risk: { total: number; customer_count: number };
  leaderboard: GorgiasAgentMetric[];
}

export interface GorgiasConversation {
  gorgias_ticket_id: number;
  created_at: string | null;
  customer_name: string | null;
  /** The customer's latest Shopify order (matched by email) — customer-level. */
  order_number: string | null;
  subject: string | null;
  contact_reason: string | null;
  channel: string | null;
  status: string;
  agent_name: string | null;
  staff_name: string | null;
  response_time_seconds: number | null;
  satisfaction_score: number | null;
  last_customer_message: string | null;
  last_agent_reply: string | null;
  /** True when the customer email matched a Shopify customer (SPEC-089). */
  customer_matched: boolean;
  customer_order_count: number | null;
  latest_order_status: string | null;
  /** The customer's total Shopify refund $ (customer-level, not ticket-exact). */
  refund_amount: number | null;
  /** The customer's Loop exchange $ (customer-level). */
  exchange_amount: number | null;
  gorgias_url: string | null;
}

export interface GorgiasReasonBreakdownItem {
  reason: string;
  count: number;
}

export interface GorgiasConversationList {
  total: number;
  page: number;
  page_size: number;
  reasons: GorgiasReasonBreakdownItem[];
  conversations: GorgiasConversation[];
}

export interface GorgiasMessage {
  gorgias_message_id: number;
  from_agent: boolean;
  sender_agent_id: number | null;
  sender_name: string | null;
  channel: string | null;
  created_at: string | null;
  body_text: string | null;
}

export interface GorgiasConversationTicket {
  gorgias_ticket_id: number;
  subject: string | null;
  status: string;
  channel: string | null;
  customer_name: string | null;
  customer_email: string | null;
  order_number: string | null;
  contact_reason: string | null;
  created_at: string | null;
  first_responded_at: string | null;
  closed_at: string | null;
  satisfaction_score: number | null;
  response_time_seconds: number | null;
  agent_name: string | null;
  staff_name: string | null;
  /** Customer's Shopify/Loop history matched by email (SPEC-089). */
  customer_matched: boolean;
  customer_order_count: number | null;
  latest_order_status: string | null;
  latest_order_total: number | null;
  refund_amount: number | null;
  exchange_amount: number | null;
  return_refund_total: number | null;
  gorgias_url: string | null;
}

export interface GorgiasConversationDetail {
  ticket: GorgiasConversationTicket;
  messages: GorgiasMessage[];
}

export interface GorgiasAlerts {
  counts: GorgiasAlertCounts;
  unanswered: GorgiasConversation[];
  unhappy: GorgiasConversation[];
  reopened: GorgiasConversation[];
  over_24h: GorgiasConversation[];
  /** LTV of customers currently in an at-risk conversation (SPEC-098). */
  revenue_at_risk: GorgiasRevenueAtRisk;
}

export type GorgiasAlertKind = keyof GorgiasAlertCounts;

/** Voice of Customer (backend SPEC-124) — ranked intent themes mined from
 * support-conversation subjects. Aggregated only, never any PII. */
export interface VoiceOfCustomerTheme {
  reason: string;
  count: number;
  share: number | null;
  avg_satisfaction: number | null;
  prev_count: number;
  delta: number;
}

export interface VoiceOfCustomer {
  total_tickets: number;
  classified: number;
  unclassified: number;
  themes: VoiceOfCustomerTheme[];
  top_rising: VoiceOfCustomerTheme | null;
  range: { start: string; end: string };
}
