/**
 * Customer Support Agent — the provider-neutral contract (SPEC-346).
 *
 * Nothing here names a helpdesk's own objects: a Gorgias ticket, a Zendesk ticket and a
 * Re:amaze conversation all arrive as a `SupportTicket`. Every helpdesk-side object carries
 * the `provider` it came from and, where the helpdesk has one, its `externalId`, so the
 * backend can write back to the right record. Money is minor units plus a currency.
 */

import type { FitVerdict } from "@/types/fit";

// ── Providers and channels ───────────────────────────────────────────────────

export type HelpdeskProviderKey =
  | "gorgias"
  | "zendesk"
  | "freshdesk"
  | "reamaze"
  | "helpscout"
  | "intercom"
  | "kustomer"
  | "richpanel"
  | "shopify_inbox";

export type Channel =
  | "email"
  | "chat"
  | "sms"
  | "facebook"
  | "instagram"
  | "whatsapp"
  | "twitter"
  | "phone"
  | "contact_form"
  | "help_center";

export interface HelpdeskCapabilities {
  /** Reply on the channel the customer wrote on. */
  replyOnChannel: boolean;
  internalNotes: boolean;
  tags: boolean;
  customFields: boolean;
  /** Assign to a team as well as a person. */
  assignTeams: boolean;
  snooze: boolean;
  macros: boolean;
  /** The helpdesk's own automation rules can be read, so ours never fight them. */
  rulesRead: boolean;
  csat: boolean;
  /** Ticket and message events pushed to us — intake without polling. */
  realtimeWebhooks: boolean;
  /** A panel inside the helpdesk's own ticket view for human agents. */
  sidebarWidget: boolean;
  /** Calls listed (read-only). */
  voice: boolean;
  channels: Channel[];
}

export type HelpdeskAuth = "api_key" | "oauth";

export interface HelpdeskProvider {
  key: HelpdeskProviderKey;
  name: string;
  /** `available` can be connected today; `coming_soon` is shown by name only. */
  status: "available" | "coming_soon";
  /** Auth methods, and whether each is live or still to come. */
  auth: { method: HelpdeskAuth; live: boolean }[];
  /** The helpdesk's documented request budget, when it publishes one. */
  rateLimit: { requests: number; windowSeconds: number; note: string } | null;
  capabilities: HelpdeskCapabilities;
}

/** Where a helpdesk-side record came from. */
export interface ProviderRef {
  provider: HelpdeskProviderKey;
  externalId?: string;
}

export interface Money {
  /** Minor units (cents). */
  amountMinor: number;
  currency: string;
}

// ── Topics, autonomy, guardrails ─────────────────────────────────────────────

export type TopicKey =
  | "where_is_my_order"
  | "delivery_problem"
  | "return_exchange"
  | "refund_status"
  | "size_fit"
  | "product_question"
  | "back_in_stock"
  | "discount_price"
  | "damaged_wrong"
  | "change_cancel"
  | "account"
  | "wholesale"
  | "complaint"
  | "spam";

/** Subjects that cut across topics and are never answered automatically when listed in the
 * guardrails — the classifier flags them on the ticket. */
export type SensitiveFlag = "chargeback" | "legal_threat" | "injury" | "harassment" | "press";

/** Suggest → Draft → Approve to send → Autopilot within guardrails. */
export type AutonomyLevel = "suggest" | "draft" | "approve" | "autopilot";

export interface Topic {
  key: TopicKey;
  volume7d: number;
  /** Signed % change of volume against the previous 7 days; null with no baseline. */
  trend: number | null;
  /** The owner's override for this topic; null follows the employee level. */
  autonomy: AutonomyLevel | null;
  /** Mean draft confidence on this topic, 0–1; null before the agent has drafted any. */
  confidence: number | null;
  /** CSAT on this topic's agent-handled tickets, 1–5; null with too few surveys. */
  csat: number | null;
  /** Share of this topic's tickets resolved without a human, 0–1. */
  resolutionRate: number;
  /** The owner marked it safe to approve in bulk. */
  bulkSafe: boolean;
}

export interface Playbook {
  topic: TopicKey;
  steps: string[];
  mustCheck: string[];
  mayOffer: string[];
  handoffWhen: string[];
  tone: string;
  updatedAt: string;
}

export type VipHandling = "always_human" | "human_reviewed";

export interface ChannelSla {
  channel: Channel;
  /** First-response target in business minutes. */
  firstResponseMinutes: number;
}

export interface BusinessHours {
  timezone: string;
  /** Mon–Sun, `null` closed. */
  days: ({ open: string; close: string } | null)[];
  /** Days an order may wait before it ships (1–30); absent on an older row, which reads 2
   * (backend SPEC-373). The context's late-order line counts against it. */
  handlingDays?: number;
}

export interface Guardrails {
  /** Topics never answered automatically (wholesale by default). */
  neverAuto: TopicKey[];
  /** Sensitive subjects never answered automatically, whatever the topic. */
  neverAutoFlags: SensitiveFlag[];
  /** 0–1 anger score at or above which a ticket goes to a human. */
  angerHandoff: number;
  vipHandling: VipHandling;
  /** A customer is a VIP from this lifetime value. */
  vipThreshold: Money;
  /** Goodwill ceiling as % of the order total. */
  maxOfferPercent: number;
  /** Goodwill ceiling in money, whichever is lower wins. */
  maxOfferAmount: Money;
  /** The order must keep at least this margin % after the offer. */
  marginFloorPercent: number;
  /** Autopilot sends only at or above this confidence, 0–1. */
  autopilotConfidence: number;
  /** Agent replies on one ticket before it must go to a human. */
  maxRepliesPerTicket: number;
  languages: string[];
  /** From Brand Brain: never-use words and claims. */
  bannedWords: string[];
  signOff: string;
  signature: string;
}

// ── Customers, tickets, messages ─────────────────────────────────────────────

export type HealthTone = "good" | "neutral" | "warn" | "bad";

export interface SupportCustomer extends ProviderRef {
  id: string;
  name: string;
  email: string;
  lifetimeValue: Money;
  orders: number;
  vip: boolean;
  /** Customers → Health's verdict for this customer. */
  health: { verdict: string; tone: HealthTone };
  priorTickets: number;
  language: string;
  /** Our customer record, for the "open in Customers" link. */
  shopifyCustomerId: number | null;
}

export type TicketStatus = "open" | "closed";
export type Priority = "critical" | "high" | "normal" | "low";
export type QueueKey =
  | "needs_approval"
  | "auto_answered"
  | "handed_off"
  | "waiting_customer"
  | "snoozed"
  | "closed"
  | "spam";
export type Sentiment = "calm" | "frustrated" | "angry";
export type SendState = "queued" | "sent" | "failed" | "cancelled";
/** The backend's revenue-at-risk states (Team Performance, backend SPEC-098). */
export type RiskKind = "unanswered" | "over_24h" | "unhappy";

export interface Assignee {
  kind: "agent" | "person" | "team";
  name: string;
}

export interface SupportTicket extends ProviderRef {
  id: string;
  subject: string;
  channel: Channel;
  customer: SupportCustomer;
  topic: TopicKey;
  status: TicketStatus;
  queue: QueueKey;
  priority: Priority;
  tags: string[];
  assignee: Assignee | null;
  sentiment: Sentiment;
  /** Sensitive subjects the classifier found. */
  flags: SensitiveFlag[];
  /** 0–1 anger score from the classifier. */
  anger: number;
  createdAt: string;
  updatedAt: string;
  /** When the first response was sent; null while unanswered. */
  firstResponseAt: string | null;
  snoozedUntil: string | null;
  /** Agent replies on this ticket so far. */
  agentReplies: number;
  /** Customer lifetime value while the ticket is at risk — the backend's figure. */
  atRisk: { amount: Money; kind: RiskKind } | null;
  preview: string;
  unread: boolean;
  /** The ticket's language, ISO 639-1. */
  language: string;
}

/** A file on a helpdesk message (backend SPEC-357) — https only. */
export interface MessageAttachment {
  name: string;
  url: string;
  /** Bytes; null when the helpdesk did not say. */
  size: number | null;
  contentType: string | null;
}

export interface SupportMessage extends ProviderRef {
  id: string;
  ticketId: string;
  channel: Channel;
  direction: "inbound" | "outbound";
  visibility: "public" | "internal";
  author: { kind: "customer" | "agent" | "person" | "rule"; name: string };
  body: string;
  /** The helpdesk's own copy with the quoted history removed; null when it gave none
   * (backend SPEC-357). Optional so an older backend still type-checks. */
  strippedBody?: string | null;
  attachments?: MessageAttachment[];
  createdAt: string;
  /** Outbound only; null for inbound and for notes. */
  sendState: SendState | null;
  sentAt: string | null;
  failureReason: string | null;
}

// ── Context ──────────────────────────────────────────────────────────────────

export interface OrderLine {
  productId: number;
  title: string;
  variant: string;
  quantity: number;
}

export interface TicketOrder {
  name: string;
  placedAt: string;
  total: Money;
  /** Gross margin on the order after landed cost — the backend's figure. */
  margin: Money;
  lines: OrderLine[];
  /** Our order page. */
  href: string;
}

export type FulfilmentStatus = "unfulfilled" | "packing" | "shipped" | "delivered" | "exception";

export interface TicketFulfilment {
  status: FulfilmentStatus;
  location: string;
  carrier: string | null;
  tracking: string | null;
  /** The shop's own handling time for this location, in days. */
  handlingDays: number;
  /** Days since the order was placed. */
  waitingDays: number;
  eta: string | null;
  /** A carrier event worth knowing ("Delivery attempted", "Held at depot"). */
  lastEvent: string | null;
}

export type ReturnStatus = "requested" | "in_transit" | "received" | "refunded" | "exchanged" | "closed";

export interface TicketReturn {
  status: ReturnStatus;
  outcome: "refund" | "exchange" | "store_credit";
  /** The size or variant the customer exchanged to. */
  exchangeTo: string | null;
  refund: Money | null;
  /** When the refund is expected to land, by the store's own processing time. */
  refundExpectedAt: string | null;
  updatedAt: string;
}

export interface TicketFit {
  productId: number;
  title: string;
  verdict: FitVerdict;
  /** Per-size advice, as Fit Intelligence words it. */
  advice: string;
}

export interface TicketStock {
  productId: number;
  title: string;
  variant: string;
  available: number;
  /** An incoming transfer or purchase order; null when none is visible. */
  incoming: { quantity: number; from: string; expectedAt: string | null } | null;
}

export interface TicketBracketing {
  /** Orders in the last 12 months holding two or more sizes of one style. */
  bracketOrders: number;
  orders: number;
  /** Units returned of units bought, 0–1. */
  returnRate: number;
}

export interface PriorTicket {
  id: string;
  subject: string;
  topic: TopicKey;
  createdAt: string;
  csat: number | null;
}

export interface MacroSuggestion extends ProviderRef {
  id: string;
  name: string;
  usedThisMonth: number;
}

export interface TicketContext {
  order: TicketOrder | null;
  fulfilment: TicketFulfilment | null;
  return: TicketReturn | null;
  fit: TicketFit[];
  stock: TicketStock[];
  bracketing: TicketBracketing | null;
  history: PriorTicket[];
  macros: MacroSuggestion[];
}

// ── Drafts, offers, hand-offs, outside actions ───────────────────────────────

export type SourceSystem =
  | "Shopify"
  | "Loop Returns"
  | "iPacky"
  | "Fit Intelligence"
  | "Inventory"
  | "Brand Brain"
  | "Customers"
  | "Helpdesk";

/** One fact the reply states, and where it came from. */
export interface SourceChip {
  id: string;
  system: SourceSystem;
  label: string;
  /** The fact itself, as the tool returned it. */
  fact: string;
  href: string | null;
}

export type OfferKind = "discount_code" | "free_shipping" | "partial_refund";

export interface GoodwillOffer {
  kind: OfferKind;
  amount: Money;
  /** The order's margin before the offer. */
  orderMargin: Money;
  orderTotal: Money;
}

export interface DraftReply {
  id: string;
  ticketId: string;
  channel: Channel;
  body: string;
  sources: SourceChip[];
  /** 0–1. */
  confidence: number;
  reasons: string[];
  /** Brand Brain's voice score, 0–100. */
  voiceScore: number;
  bannedHits: string[];
  offer: GoodwillOffer | null;
  generatedAt: string;
  language: string;
}

export type OutsideKind = "refund" | "cancel" | "address_change" | "reship" | "create_discount" | "start_return";

/** An action the product may not take (read-only toward Shopify and Loop). The agent prepares
 * it; a human does it in the system that owns it and marks it done. */
export interface OutsideAction {
  id: string;
  ticketId: string;
  kind: OutsideKind;
  system: "Shopify" | "Loop Returns";
  summary: string;
  details: string[];
  href: string;
  state: "prepared" | "done";
}

export interface Handoff {
  ticketId: string;
  to: Assignee;
  summary: [string, string, string];
  nextStep: string;
  priority: Priority;
  reason: string;
  at: string;
}

export interface TicketDetail {
  ticket: SupportTicket;
  messages: SupportMessage[];
  context: TicketContext;
  draft: DraftReply | null;
  handoff: Handoff | null;
  outsideActions: OutsideAction[];
  /** The owner sent the last draft back; the agent redrafts with this note. */
  returned: { reason: string; at: string } | null;
  /** Why the agent could not draft (no AI provider, a refused call); null when it could. */
  draftError?: string | null;
}

/** One page of Approvals (backend SPEC-358): `counts` are over every waiting reply, before
 * any filter, so a filter always shows how many it holds. */
export interface ApprovalsPage {
  items: Approval[];
  total: number;
  page: number;
  pageSize: number;
  counts: {
    all: number;
    topics: Partial<Record<TopicKey, number>>;
    channels: Partial<Record<Channel, number>>;
    confidence: Partial<Record<"high" | "medium" | "low", number>>;
  };
}

export interface Approval {
  id: string;
  ticket: SupportTicket;
  draft: DraftReply;
  /** The customer's latest message, as the panel shows it. */
  customerMessage: string;
  context: TicketContext;
  waitingSince: string;
}

// ── Workspace, overview, knowledge, insights, performance, activity ──────────

export interface HandoffTarget {
  topic: TopicKey;
  to: Assignee;
}

export interface SupportWorkspace {
  provider: HelpdeskProviderKey;
  autonomy: AutonomyLevel;
  topicAutonomy: Partial<Record<TopicKey, AutonomyLevel>>;
  guardrails: Guardrails;
  hours: BusinessHours;
  slas: ChannelSla[];
  handoffMap: HandoffTarget[];
  teams: string[];
  /** The helpdesk's people a ticket can be assigned to. */
  people: string[];
  killSwitch: { active: boolean; at: string | null; by: string | null };
  intake: { lastEventAt: string; rateLimitedAt: string | null; delayedSeconds: number };
  snapshotAt: string;
}

export interface AgentHumanPair {
  agent: number | null;
  human: number | null;
}

export interface SupportOverview {
  snapshotAt: string;
  tickets24h: number;
  tickets7d: number;
  /** Tickets resolved in 7 days, by who resolved them. */
  resolved: { agent: number; human: number };
  firstResponseMinutes: AgentHumanPair;
  resolutionHours: AgentHumanPair;
  csat: AgentHumanPair;
  revenueAtRisk: { amount: Money; tickets: number };
  hoursSaved: { hours: number; basis: string };
  needsYou: { approvals: number; handoffs: number; slaBreaches: number; failedSends: number };
  topics: { key: TopicKey; tickets: number; trend: number | null }[];
  recent: ActivityEntry[];
}

export interface QueueCounts {
  needs_approval: number;
  auto_answered: number;
  handed_off: number;
  waiting_customer: number;
  snoozed: number;
  closed: number;
  spam: number;
}

export interface KnowledgeItem extends ProviderRef {
  id: string;
  kind: "policy" | "fact" | "article" | "macro";
  area: "shipping" | "returns" | "warranty" | "sizing" | "orders" | "products";
  title: string;
  body: string;
  source: { system: "Brand Brain" | "Help centre" | "Helpdesk macros"; label: string; href: string | null };
  checkedAt: string;
  used7d: number;
  status: "ok" | "stale" | "conflict";
  /** The other item that says something different. */
  conflictWith: string | null;
}

export interface KnowledgeGap {
  id: string;
  question: string;
  asked: number;
  lastAskedAt: string;
  topic: TopicKey;
  ticketId: string;
  /** Approve-first: an answer here becomes a pending fact or a draft macro. */
  answer: { target: "fact" | "macro"; text: string; state: "pending" } | null;
}

export type InsightKind = "size_chart" | "damage" | "late" | "policy" | "product";

export interface Insight {
  id: string;
  kind: InsightKind;
  title: string;
  detail: string;
  tickets: number;
  trend: number | null;
  money: Money;
  moneyBasis: string;
  owner: string;
  evidence: { label: string; href: string };
  sendTo: { label: string; href: string };
}

export interface AgentFigures {
  tickets: number;
  firstResponseMinutes: number;
  resolutionHours: number;
  /** 0–1. */
  oneTouchRate: number;
  reopenRate: number;
  csat: number | null;
  handoffRate: number;
}

export interface PerformanceSnapshot {
  snapshotAt: string;
  periodDays: number;
  agent: AgentFigures;
  humans: AgentFigures;
  people: { name: string; figures: AgentFigures }[];
  trend: { date: string; agentCsat: number | null; humanCsat: number | null; agentFrt: number; humanFrt: number }[];
  /** `accuracy`: the share of the topic's decided drafts that were sent; null with none decided. */
  topics: { topic: TopicKey; accuracy: number | null; handoffRate: number; csat: number | null; tickets: number }[];
}

export type ActivityAction =
  | "tag"
  | "assign"
  | "reply"
  | "note"
  | "close"
  | "snooze"
  | "priority"
  | "handoff"
  | "kill_switch"
  | "setting";

export interface ActivityEntry extends ProviderRef {
  id: string;
  at: string;
  actor: { kind: "agent" | "person" | "rule"; name: string };
  action: ActivityAction;
  ticketId: string | null;
  ticketSubject: string | null;
  detail: string;
}

export interface SupportKnowledge {
  items: KnowledgeItem[];
  gaps: KnowledgeGap[];
  rules: { id: string; name: string; effect: string; conflict: string | null }[];
}

export interface InboxPage {
  tickets: SupportTicket[];
  counts: QueueCounts;
  total: number;
}

export interface BenchResult {
  topic: TopicKey;
  ticketId: string;
  customerMessage: string;
  draft: DraftReply;
  /** What the store actually sent back then, for comparison. */
  sentThen: string | null;
}

export interface TopicsData {
  topics: Topic[];
  playbooks: Record<TopicKey, Playbook>;
  /** Past tickets the test bench can replay, per topic. */
  benchTickets: Partial<Record<TopicKey, { id: string; subject: string }[]>>;
}

export interface ActivityPage {
  entries: ActivityEntry[];
  total: number;
}
