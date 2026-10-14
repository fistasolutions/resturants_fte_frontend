/**
 * Customer Support Agent — the pure half (SPEC-346).
 *
 * What the screens decide lives here so Vitest can prove it: the tab model, topic routing, the
 * guardrail check that both lists the reasons and disables Send, the hand-off decision, the SLA
 * clock, an offer priced against the order's margin, confidence bands, send states, the agent
 * vs human comparison, and the wording that describes a customer's behaviour without accusing
 * them. Every figure arrives computed (Rule 8); this module compares and words it.
 */

import type { StatusTone } from "@/components/shared/status-badge";
import type {
  Assignee,
  AutonomyLevel,
  Channel,
  ChannelSla,
  DraftReply,
  GoodwillOffer,
  Guardrails,
  HandoffTarget,
  Money,
  OfferKind,
  OutsideKind,
  Priority,
  QueueKey,
  SendState,
  SensitiveFlag,
  Sentiment,
  SupportTicket,
  SupportWorkspace,
  TicketBracketing,
  TicketContext,
  TicketFulfilment,
  TicketReturn,
  TicketStock,
  TopicKey,
} from "@/types/customer-support";

// ── Tabs ─────────────────────────────────────────────────────────────────────

export const CS_ROOT = "/customer-support";
/** The sidebar title, verbatim — the doc is pinned to it (Rule 11). */
export const CUSTOMER_SUPPORT_TITLE = "Customer Support Agent";

export type SupportTab =
  | "overview"
  | "inbox"
  | "approvals"
  | "topics"
  | "knowledge"
  | "insights"
  | "performance"
  | "chat"
  | "settings";

export const SUPPORT_TAB_IDS: readonly SupportTab[] = [
  "overview",
  "inbox",
  "approvals",
  "topics",
  "knowledge",
  "insights",
  "performance",
  "chat",
  "settings",
];

export const SUPPORT_TAB_LABELS: Record<SupportTab, string> = {
  overview: "Overview",
  inbox: "Inbox",
  approvals: "Approvals",
  topics: "Topics & playbooks",
  knowledge: "Knowledge",
  insights: "Insights",
  performance: "Performance",
  chat: "Chat",
  settings: "Settings",
};

export function normalizeSupportTab(value: string | null | undefined): SupportTab {
  return SUPPORT_TAB_IDS.includes(value as SupportTab) ? (value as SupportTab) : "overview";
}

/** The page's href for a tab plus its own params; the default tab is left out. */
export function supportHref(tab: SupportTab, params: Record<string, string | null | undefined> = {}): string {
  const query = new URLSearchParams();
  if (tab !== "overview") query.set("tab", tab);
  for (const [key, value] of Object.entries(params)) if (value) query.set(key, value);
  const text = query.toString();
  return text ? `${CS_ROOT}?${text}` : CS_ROOT;
}

// ── Topics ───────────────────────────────────────────────────────────────────

export interface TopicMeta {
  label: string;
  /** The facts the agent checks before it answers. */
  checks: string[];
  /** Words that route a message here, lower-case. */
  keywords: string[];
}

export const TOPIC_ORDER: TopicKey[] = [
  "where_is_my_order",
  "delivery_problem",
  "return_exchange",
  "refund_status",
  "size_fit",
  "product_question",
  "back_in_stock",
  "discount_price",
  "damaged_wrong",
  "change_cancel",
  "account",
  "wholesale",
  "complaint",
  "spam",
];

export const TOPICS: Record<TopicKey, TopicMeta> = {
  where_is_my_order: {
    label: "Where is my order",
    checks: ["Order and its fulfilment", "Warehouse status against handling time", "Carrier tracking"],
    keywords: ["where is my order", "where's my order", "tracking", "not arrived", "hasn't arrived", "order status", "when will"],
  },
  delivery_problem: {
    label: "Delivery problem",
    checks: ["Carrier events", "Shipping address on the order", "Prior delivery tickets"],
    keywords: ["delivered but", "lost", "stolen", "wrong address", "delivery attempt", "returned to sender"],
  },
  return_exchange: {
    label: "Return or exchange",
    checks: ["Return policy (Brand Brain)", "Loop return state", "Fit verdict for the item"],
    keywords: ["return", "exchange", "send it back", "swap"],
  },
  refund_status: {
    label: "Refund status",
    checks: ["Loop return state and refund timing", "Shopify refunds on the order"],
    keywords: ["refund", "money back", "credited", "reimburse"],
  },
  size_fit: {
    label: "Size or fit advice",
    checks: ["Fit Intelligence verdict for the style", "Size guide", "What customers exchanged to"],
    keywords: ["size", "sizing", "fit", "too small", "too big", "runs small", "runs large", "measurements"],
  },
  product_question: {
    label: "Product question",
    checks: ["Product page and Brand Brain facts", "Care and material claims allowed"],
    keywords: ["material", "fabric", "care", "wash", "made of", "colour", "color", "lining"],
  },
  back_in_stock: {
    label: "Back in stock",
    checks: ["Stock by location", "Incoming transfers and purchase orders", "Foresight stockout risk"],
    keywords: ["back in stock", "restock", "sold out", "out of stock", "available again"],
  },
  discount_price: {
    label: "Discount or price issue",
    checks: ["Discount codes on the order", "Code rules", "Order margin"],
    keywords: ["discount", "promo", "code", "coupon", "price", "price match", "sale"],
  },
  damaged_wrong: {
    label: "Damaged or wrong item",
    checks: ["Order lines", "Warehouse that packed it", "Carrier", "Photos on the ticket"],
    keywords: ["damaged", "broken", "torn", "stain", "wrong item", "wrong size sent", "missing item"],
  },
  change_cancel: {
    label: "Change or cancel order",
    checks: ["Fulfilment status (can it still change?)", "Order lines"],
    keywords: ["cancel", "change my order", "change the address", "update address", "change size"],
  },
  account: {
    label: "Subscription or account",
    checks: ["Customer record", "Marketing consent"],
    keywords: ["account", "password", "login", "unsubscribe", "subscription", "log in"],
  },
  wholesale: {
    label: "Wholesale",
    checks: ["Wholesale contact route"],
    keywords: ["wholesale", "bulk order", "stockist", "retailer", "b2b"],
  },
  complaint: {
    label: "Complaint",
    checks: ["Customer value and health", "Prior tickets", "Order history"],
    keywords: ["disappointed", "unacceptable", "terrible", "complaint", "worst", "never again"],
  },
  spam: {
    label: "Spam",
    checks: ["Sender history"],
    keywords: ["seo services", "guest post", "backlinks", "crypto", "partnership opportunity"],
  },
};

export function topicLabel(topic: TopicKey): string {
  return TOPICS[topic].label;
}

/**
 * Deterministic topic routing over the customer's words: the topic whose keywords match most
 * often as whole words, ties broken by `TOPIC_ORDER` — the same rule as the backend's
 * `services/customer_support/classify.py`, which decides; this one previews it on the page.
 */
/** A whole-word match — "sale" is not in "wholesale" (the backend's `classify._has`). */
function hasWord(haystack: string, keyword: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![a-z])${escaped}(?![a-z])`).test(haystack);
}

export function routeTopic(text: string): { topic: TopicKey; matched: string[] } | null {
  const haystack = text.toLowerCase();
  let best: { topic: TopicKey; matched: string[] } | null = null;
  for (const topic of TOPIC_ORDER) {
    const matched = TOPICS[topic].keywords.filter((keyword) => hasWord(haystack, keyword));
    if (matched.length > 0 && (best === null || matched.length > best.matched.length)) {
      best = { topic, matched };
    }
  }
  return best;
}

export const SENSITIVE_LABELS: Record<SensitiveFlag, string> = {
  chargeback: "Chargebacks",
  legal_threat: "Legal threats",
  injury: "Allergic reactions or injuries",
  harassment: "Harassment",
  press: "Press",
};

export const SENSITIVE_ORDER: SensitiveFlag[] = ["chargeback", "legal_threat", "injury", "harassment", "press"];

/** Topics never answered automatically whatever the owner saves — the backend's
 * `rules.ALWAYS_NEVER_AUTO_TOPICS` (SPEC-347 / backend SPEC-356). Every sensitive flag is
 * mandatory too. */
export const ALWAYS_NEVER_AUTO_TOPICS: readonly TopicKey[] = ["wholesale"];

/** The guardrails with the mandatory topics and flags folded back in, as the server stores
 * them — so the form never shows a box the server will tick again. */
export function withMandatory<G extends Pick<Guardrails, "neverAuto" | "neverAutoFlags">>(guardrails: G): G {
  return {
    ...guardrails,
    neverAuto: [...guardrails.neverAuto, ...ALWAYS_NEVER_AUTO_TOPICS.filter((t) => !guardrails.neverAuto.includes(t))],
    neverAutoFlags: [...guardrails.neverAutoFlags, ...SENSITIVE_ORDER.filter((f) => !guardrails.neverAutoFlags.includes(f))],
  };
}

/** The sensitive subjects on a ticket that the guardrails say a person must handle. */
export function blockedFlags(flags: SensitiveFlag[], guardrails: Pick<Guardrails, "neverAutoFlags">): SensitiveFlag[] {
  return flags.filter((flag) => guardrails.neverAutoFlags.includes(flag));
}

// ── Autonomy ─────────────────────────────────────────────────────────────────

export const AUTONOMY_ORDER: AutonomyLevel[] = ["suggest", "draft", "approve", "autopilot"];

export const AUTONOMY_META: Record<AutonomyLevel, { label: string; description: string }> = {
  suggest: { label: "Suggest", description: "Classifies and summarises. Writes nothing to the customer." },
  draft: { label: "Draft", description: "Leaves a draft as an internal note for a person to send." },
  approve: { label: "Approve to send", description: "Every reply waits for one click in Approvals." },
  autopilot: { label: "Autopilot", description: "Sends on its own, only inside the guardrails." },
};

/** The highest level a topic may be set to: never-auto topics stop at Draft. */
export function maxAutonomyFor(topic: TopicKey, guardrails: Guardrails): AutonomyLevel {
  return guardrails.neverAuto.includes(topic) ? "draft" : "autopilot";
}

function capAt(level: AutonomyLevel, cap: AutonomyLevel): AutonomyLevel {
  return AUTONOMY_ORDER.indexOf(level) > AUTONOMY_ORDER.indexOf(cap) ? cap : level;
}

/** What the agent may actually do on a topic right now: the topic's override or the employee's
 * level, capped for never-auto topics, and Suggest for everything while it is paused. */
export function effectiveAutonomy(
  topic: TopicKey,
  workspace: Pick<SupportWorkspace, "autonomy" | "topicAutonomy" | "guardrails" | "killSwitch">,
): AutonomyLevel {
  if (workspace.killSwitch.active) return "suggest";
  const level = workspace.topicAutonomy[topic] ?? workspace.autonomy;
  return capAt(level, maxAutonomyFor(topic, workspace.guardrails));
}

/** The levels the owner may pick for a topic. */
export function allowedAutonomy(topic: TopicKey, guardrails: Guardrails): AutonomyLevel[] {
  const cap = AUTONOMY_ORDER.indexOf(maxAutonomyFor(topic, guardrails));
  return AUTONOMY_ORDER.filter((_, index) => index <= cap);
}

// ── Money ────────────────────────────────────────────────────────────────────

const moneyFormatters = new Map<string, Intl.NumberFormat>();

/** Minor units → "$1,234.50" in the money's own currency. */
export function formatMoney(money: Money, whole = false): string {
  const key = `${money.currency}:${whole}`;
  let formatter = moneyFormatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: money.currency,
      ...(whole ? { minimumFractionDigits: 0, maximumFractionDigits: 0 } : {}),
    });
    moneyFormatters.set(key, formatter);
  }
  return formatter.format(money.amountMinor / 100);
}

// ── Confidence ───────────────────────────────────────────────────────────────

export type ConfidenceBand = "high" | "medium" | "low";

export function confidenceBand(confidence: number): ConfidenceBand {
  if (confidence >= 0.85) return "high";
  if (confidence >= 0.65) return "medium";
  return "low";
}

export const CONFIDENCE_META: Record<ConfidenceBand, { label: string; tone: StatusTone }> = {
  high: { label: "High confidence", tone: "success" },
  medium: { label: "Medium confidence", tone: "warning" },
  low: { label: "Low confidence", tone: "destructive" },
};

export function percent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

// ── Offers against margin ────────────────────────────────────────────────────

export const OFFER_LABELS: Record<OfferKind, string> = {
  discount_code: "Discount code",
  free_shipping: "Free shipping on the next order",
  partial_refund: "Partial refund",
};

export type CheckResult = "pass" | "warn" | "block";

export interface OfferCheck {
  /** The order's margin left after the offer, in minor units. */
  marginAfterMinor: number;
  /** Margin left as % of the order total. */
  marginAfterPercent: number;
  /** The offer as % of the order total. */
  percentOfOrder: number;
  result: CheckResult;
  reasons: string[];
}

/** An offer priced against the order's true margin, under the owner's ceilings. */
export function offerCheck(offer: GoodwillOffer, guardrails: Guardrails): OfferCheck {
  const total = offer.orderTotal.amountMinor;
  const marginAfterMinor = offer.orderMargin.amountMinor - offer.amount.amountMinor;
  const marginAfterPercent = total > 0 ? (marginAfterMinor / total) * 100 : 0;
  const percentOfOrder = total > 0 ? (offer.amount.amountMinor / total) * 100 : 0;
  const reasons: string[] = [];
  let result: CheckResult = "pass";
  if (offer.amount.amountMinor > guardrails.maxOfferAmount.amountMinor) {
    result = "block";
    reasons.push(`Above the ${formatMoney(guardrails.maxOfferAmount)} ceiling.`);
  }
  if (percentOfOrder > guardrails.maxOfferPercent) {
    result = "block";
    reasons.push(`${Math.round(percentOfOrder)}% of the order — the ceiling is ${guardrails.maxOfferPercent}%.`);
  }
  if (marginAfterPercent < guardrails.marginFloorPercent) {
    result = "block";
    reasons.push(
      `Leaves ${Math.round(marginAfterPercent)}% margin — under the ${guardrails.marginFloorPercent}% floor.`,
    );
  } else if (marginAfterPercent < guardrails.marginFloorPercent + 5 && result === "pass") {
    result = "warn";
    reasons.push(`Leaves ${Math.round(marginAfterPercent)}% margin — close to the ${guardrails.marginFloorPercent}% floor.`);
  }
  if (reasons.length === 0) {
    reasons.push(`Costs ${formatMoney(offer.amount)}; the order keeps ${formatMoney({ amountMinor: marginAfterMinor, currency: offer.amount.currency })} margin.`);
  }
  return { marginAfterMinor, marginAfterPercent, percentOfOrder, result, reasons };
}

// ── Guardrails ───────────────────────────────────────────────────────────────

export interface GuardrailCheck {
  key: string;
  label: string;
  result: CheckResult;
  reason: string;
}

export interface GuardrailInput {
  ticket: SupportTicket;
  draft: DraftReply;
  guardrails: Guardrails;
  killSwitch: boolean;
}

/**
 * Every check a reply passes before it can go, each with its reason. The pre-send panel lists
 * them and `canSend` folds them — the same function disables the button.
 */
export function guardrailCheck({ ticket, draft, guardrails, killSwitch }: GuardrailInput): GuardrailCheck[] {
  const checks: GuardrailCheck[] = [];
  // SPEC-375 patch: no kill switch on screen any more; a paused agent says so, otherwise no row.
  if (killSwitch) {
    checks.push({ key: "kill", label: "Paused", result: "block", reason: "The agent is paused — nothing is sent. Resume it on Settings." });
  }
  checks.push(
    guardrails.neverAuto.includes(ticket.topic)
      ? {
          key: "topic",
          label: "Topic",
          result: "warn",
          reason: `${topicLabel(ticket.topic)} is never answered automatically — a person must read this first.`,
        }
      : { key: "topic", label: "Topic", result: "pass", reason: `${topicLabel(ticket.topic)} may be answered.` },
  );
  const sensitive = blockedFlags(ticket.flags, guardrails);
  if (sensitive.length > 0) {
    checks.push({
      key: "sensitive",
      label: "Sensitive subject",
      result: "block",
      reason: `${sensitive.map((flag) => SENSITIVE_LABELS[flag]).join(", ")} — always handled by a person.`,
    });
  }
  checks.push(
    ticket.anger >= guardrails.angerHandoff
      ? {
          key: "anger",
          label: "Customer mood",
          result: "block",
          reason: `Anger ${percent(ticket.anger)} is at or over the ${percent(guardrails.angerHandoff)} hand-off line.`,
        }
      : { key: "anger", label: "Customer mood", result: "pass", reason: `${SENTIMENT_META[ticket.sentiment].label}.` },
  );
  if (ticket.customer.vip) {
    checks.push({
      key: "vip",
      label: "VIP",
      result: guardrails.vipHandling === "always_human" ? "block" : "warn",
      reason:
        guardrails.vipHandling === "always_human"
          ? "VIPs are always answered by a person."
          : "VIP — a person reviews before it goes.",
    });
  }
  checks.push(
    ticket.agentReplies >= guardrails.maxRepliesPerTicket
      ? {
          key: "replies",
          label: "Replies on this ticket",
          result: "block",
          reason: `Already ${ticket.agentReplies} agent replies — the limit is ${guardrails.maxRepliesPerTicket}.`,
        }
      : {
          key: "replies",
          label: "Replies on this ticket",
          result: "pass",
          reason: `${ticket.agentReplies} of ${guardrails.maxRepliesPerTicket}.`,
        },
  );
  checks.push(
    guardrails.languages.includes(draft.language)
      ? { key: "language", label: "Language", result: "pass", reason: `Answers in ${draft.language.toUpperCase()}.` }
      : {
          key: "language",
          label: "Language",
          result: "block",
          reason: `${draft.language.toUpperCase()} is not a language it may answer in.`,
        },
  );
  checks.push(
    draft.bannedHits.length > 0
      ? {
          key: "voice",
          label: "Brand voice",
          result: "block",
          reason: `Uses words Brand Brain forbids: ${draft.bannedHits.join(", ")}.`,
        }
      : draft.voiceScore < 70
        ? { key: "voice", label: "Brand voice", result: "warn", reason: `Voice score ${draft.voiceScore} — under 70.` }
        : { key: "voice", label: "Brand voice", result: "pass", reason: `Voice score ${draft.voiceScore}.` },
  );
  const band = confidenceBand(draft.confidence);
  checks.push({
    key: "confidence",
    label: "Confidence",
    result: band === "low" ? "warn" : "pass",
    reason: `${CONFIDENCE_META[band].label} (${percent(draft.confidence)}).`,
  });
  if (draft.offer) {
    const offer = offerCheck(draft.offer, guardrails);
    checks.push({ key: "offer", label: "Goodwill offer", result: offer.result, reason: offer.reasons.join(" ") });
  }
  return checks;
}

/** Brand Brain's never-use words and claims found in a reply, case-insensitive, in list order.
 * An owner's edit is re-checked with this, so removing a banned word clears the block. */
export function bannedHitsIn(body: string, bannedWords: string[]): string[] {
  const text = body.toLowerCase();
  return bannedWords.filter((word) => word.trim() && text.includes(word.toLowerCase()));
}

export function canSend(checks: GuardrailCheck[]): { allowed: boolean; blockers: GuardrailCheck[] } {
  const blockers = checks.filter((check) => check.result === "block");
  return { allowed: blockers.length === 0, blockers };
}

/** Whether autopilot could have sent this on its own: no block, no warn, confident enough. */
export function autopilotEligible(checks: GuardrailCheck[], draft: DraftReply, guardrails: Guardrails): boolean {
  return checks.every((check) => check.result === "pass") && draft.confidence >= guardrails.autopilotConfidence;
}

// ── Hand-off ─────────────────────────────────────────────────────────────────

export interface HandoffDecision {
  handoff: boolean;
  reasons: string[];
}

/** Whether a ticket must go to a person, and every reason it must. */
export function handoffDecision(ticket: SupportTicket, draft: DraftReply | null, guardrails: Guardrails): HandoffDecision {
  const reasons: string[] = [];
  if (guardrails.neverAuto.includes(ticket.topic)) reasons.push(`${topicLabel(ticket.topic)} always goes to a person.`);
  for (const flag of blockedFlags(ticket.flags, guardrails)) reasons.push(`${SENSITIVE_LABELS[flag]} always go to a person.`);
  if (ticket.anger >= guardrails.angerHandoff) reasons.push("The customer is angry.");
  if (ticket.customer.vip && guardrails.vipHandling === "always_human") reasons.push("VIP customer.");
  if (ticket.agentReplies >= guardrails.maxRepliesPerTicket) reasons.push("The agent has replied as often as it may.");
  if (!guardrails.languages.includes(ticket.language)) reasons.push(`Written in ${ticket.language.toUpperCase()}, which it does not answer.`);
  if (draft === null) reasons.push("No draft it is confident enough to offer.");
  else if (confidenceBand(draft.confidence) === "low") reasons.push("Its draft is low confidence.");
  return { handoff: reasons.length > 0, reasons };
}

export interface HandoffSuggestion {
  to: Assignee;
  summary: [string, string, string];
  nextStep: string;
  priority: Priority;
}

/**
 * What the agent proposes when it hands a ticket over: the team the owner mapped to the topic
 * (or Support), a three-line summary a person can act on without re-reading the thread, a next
 * step, and a priority raised for VIPs, angry customers and sensitive subjects.
 */
export function suggestHandoff(
  ticket: SupportTicket,
  context: TicketContext,
  guardrails: Guardrails,
  handoffMap: HandoffTarget[],
): HandoffSuggestion {
  const to = handoffMap.find((target) => target.topic === ticket.topic)?.to ?? { kind: "team", name: "Support" };
  const c = ticket.customer;
  const order = context.order;
  const f = context.fulfilment;
  const what = `${c.name} writes about ${topicLabel(ticket.topic).toLowerCase()}: "${ticket.subject}".`;
  const facts = order
    ? `Order ${order.name} (${formatMoney(order.total)})${f ? ` — ${FULFILMENT_LABELS[f.status].toLowerCase()} at ${f.location}${isLate(f) ? ", over its handling time" : ""}` : ""}.`
    : "No order is linked to this ticket.";
  const who = `${c.orders} orders, ${formatMoney(c.lifetimeValue, true)} lifetime${c.vip ? ", VIP" : ""}; customer is ${SENTIMENT_META[ticket.sentiment].label.toLowerCase()}.`;
  const sensitive = blockedFlags(ticket.flags, guardrails).length > 0;
  const priority: Priority = sensitive || ticket.anger >= guardrails.angerHandoff ? "critical" : c.vip ? "high" : ticket.priority;
  const nextStep = sensitive
    ? "Reply personally today; do not offer anything before reading the thread."
    : f && isLate(f)
      ? "Ask the warehouse to pack it today, then reply with the tracking."
      : "Reply personally with the facts above.";
  return { to, summary: [what, facts, who], nextStep, priority };
}

/** A three-line summary always has three lines. */
export function handoffSummaryValid(summary: string[]): boolean {
  return summary.length === 3 && summary.every((line) => line.trim().length >= 3);
}

// ── SLA ──────────────────────────────────────────────────────────────────────

export type SlaStatus = "met" | "ok" | "due_soon" | "breached";

export interface SlaClock {
  status: SlaStatus;
  dueAt: string;
  /** Minutes until due (negative once breached); for a met SLA, how long the reply took. */
  minutes: number;
}

/** The first-response clock on wall time. The backend counts business minutes; the preview
 * counts the clock, which is the stricter reading. */
export function slaClock(ticket: Pick<SupportTicket, "channel" | "createdAt" | "firstResponseAt">, slas: ChannelSla[], now: Date): SlaClock {
  const target = slas.find((sla) => sla.channel === ticket.channel)?.firstResponseMinutes ?? 24 * 60;
  const created = new Date(ticket.createdAt).getTime();
  const due = created + target * 60_000;
  const dueAt = new Date(due).toISOString();
  if (ticket.firstResponseAt) {
    const took = Math.round((new Date(ticket.firstResponseAt).getTime() - created) / 60_000);
    return { status: took <= target ? "met" : "breached", dueAt, minutes: took };
  }
  const minutes = Math.round((due - now.getTime()) / 60_000);
  if (minutes < 0) return { status: "breached", dueAt, minutes };
  if (minutes <= Math.max(15, target * 0.25)) return { status: "due_soon", dueAt, minutes };
  return { status: "ok", dueAt, minutes };
}

export const SLA_META: Record<SlaStatus, { label: string; tone: StatusTone }> = {
  met: { label: "SLA met", tone: "success" },
  ok: { label: "Within SLA", tone: "neutral" },
  due_soon: { label: "Due soon", tone: "warning" },
  breached: { label: "SLA breached", tone: "destructive" },
};

/** 95 → "1h 35m", 30 → "30m", 3000 → "2d 2h". */
export function formatMinutes(total: number): string {
  const minutes = Math.abs(Math.round(total));
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 48) {
    const rest = minutes % 60;
    return rest ? `${hours}h ${rest}m` : `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  const restHours = hours % 24;
  return restHours ? `${days}d ${restHours}h` : `${days}d`;
}

export function slaText(clock: SlaClock): string {
  switch (clock.status) {
    case "met":
      return `Answered in ${formatMinutes(clock.minutes)}`;
    case "breached":
      return clock.minutes >= 0 ? `Answered late, in ${formatMinutes(clock.minutes)}` : `${formatMinutes(clock.minutes)} over`;
    default:
      return `${formatMinutes(clock.minutes)} left`;
  }
}

// ── Send state ───────────────────────────────────────────────────────────────

export const SEND_STATE_META: Record<SendState, { label: string; tone: StatusTone; retryable: boolean }> = {
  queued: { label: "Queued", tone: "info", retryable: false },
  sent: { label: "Sent", tone: "success", retryable: false },
  failed: { label: "Failed", tone: "destructive", retryable: true },
  cancelled: { label: "Cancelled", tone: "neutral", retryable: true },
};

/** The helpdesk sends asynchronously: a created message is queued until it carries a sent
 * time, failed when it carries a failure, cancelled when the kill switch withdrew it. */
export function sendStateOf(message: { sentAt: string | null; failureReason: string | null; cancelled?: boolean }): SendState {
  if (message.cancelled) return "cancelled";
  if (message.failureReason) return "failed";
  if (message.sentAt) return "sent";
  return "queued";
}

// ── Queues, priority, sentiment ──────────────────────────────────────────────

export const QUEUE_ORDER: QueueKey[] = [
  "needs_approval",
  "auto_answered",
  "handed_off",
  "waiting_customer",
  "snoozed",
  "closed",
  "spam",
];

export const QUEUE_LABELS: Record<QueueKey, string> = {
  needs_approval: "Needs approval",
  auto_answered: "Auto-answered",
  handed_off: "Handed off",
  waiting_customer: "Waiting on customer",
  snoozed: "Snoozed",
  closed: "Closed",
  spam: "Spam",
};

export const PRIORITY_META: Record<Priority, { label: string; tone: StatusTone; rank: number }> = {
  critical: { label: "Critical", tone: "destructive", rank: 0 },
  high: { label: "High", tone: "warning", rank: 1 },
  normal: { label: "Normal", tone: "neutral", rank: 2 },
  low: { label: "Low", tone: "neutral", rank: 3 },
};

export const PRIORITIES: Priority[] = ["critical", "high", "normal", "low"];

export const SENTIMENT_META: Record<Sentiment, { label: string; tone: StatusTone }> = {
  calm: { label: "Calm", tone: "neutral" },
  frustrated: { label: "Frustrated", tone: "warning" },
  angry: { label: "Angry", tone: "destructive" },
};

// ── Agent vs human ───────────────────────────────────────────────────────────

export interface Comparison {
  /** Who is better on this figure; null when either side has no figure. */
  better: "agent" | "human" | "even" | null;
  /** The agent's figure as % different from the humans'. */
  deltaPercent: number | null;
}

/** Compares the agent's figure with the human team's. `lowerIsBetter` for times and rates of
 * bad things; "even" within 2%. */
export function compareAgentHuman(agent: number | null, human: number | null, lowerIsBetter: boolean): Comparison {
  if (agent === null || human === null) return { better: null, deltaPercent: null };
  if (human === 0) return { better: agent === 0 ? "even" : lowerIsBetter ? "human" : "agent", deltaPercent: null };
  const deltaPercent = ((agent - human) / human) * 100;
  if (Math.abs(deltaPercent) < 2) return { better: "even", deltaPercent };
  const agentHigher = agent > human;
  return { better: agentHigher !== lowerIsBetter ? "agent" : "human", deltaPercent };
}

export function comparisonText(comparison: Comparison): string {
  if (comparison.better === null) return "No comparison yet";
  if (comparison.better === "even") return "Level with the team";
  const pct = comparison.deltaPercent === null ? "" : ` ${Math.abs(Math.round(comparison.deltaPercent))}%`;
  return comparison.better === "agent" ? `Agent better by${pct}` : `Team better by${pct}`;
}

// ── Context wording ──────────────────────────────────────────────────────────

/** The agent's lean in the resolved work, 0–1. */
export function agentShare(resolved: { agent: number; human: number }): number | null {
  const total = resolved.agent + resolved.human;
  return total > 0 ? resolved.agent / total : null;
}

/** Late only against the shop's own handling time, and only while it has not shipped. */
export function isLate(fulfilment: TicketFulfilment): boolean {
  if (fulfilment.status === "delivered" || fulfilment.status === "shipped") return false;
  return fulfilment.waitingDays > fulfilment.handlingDays;
}

export const FULFILMENT_LABELS: Record<TicketFulfilment["status"], string> = {
  unfulfilled: "Not yet packed",
  packing: "Being packed",
  shipped: "Shipped",
  delivered: "Delivered",
  exception: "Carrier exception",
};

export function fulfilmentLine(fulfilment: TicketFulfilment): string {
  const where = `${FULFILMENT_LABELS[fulfilment.status]} · ${fulfilment.location}`;
  if (fulfilment.status === "shipped" || fulfilment.status === "delivered" || fulfilment.status === "exception") {
    return fulfilment.carrier ? `${where} · ${fulfilment.carrier}` : where;
  }
  const day = fulfilment.waitingDays === 1 ? "day" : "days";
  return isLate(fulfilment)
    ? `${where} · ${fulfilment.waitingDays} ${day} waiting, over its ${fulfilment.handlingDays}-day handling time`
    : `${where} · ${fulfilment.waitingDays} ${day} waiting, within its ${fulfilment.handlingDays}-day handling time`;
}

export const RETURN_LABELS: Record<TicketReturn["status"], string> = {
  requested: "Return requested",
  in_transit: "On its way back",
  received: "Received at the warehouse",
  refunded: "Refunded",
  exchanged: "Exchange sent",
  closed: "Closed",
};

/** A stock line that never promises a date it cannot see. */
export function stockLine(stock: TicketStock): string {
  if (stock.available > 0) return `${stock.available} in stock`;
  if (!stock.incoming) return "Sold out · no incoming stock is visible — no restock date can be promised";
  return stock.incoming.expectedAt
    ? `Sold out · ${stock.incoming.quantity} incoming from ${stock.incoming.from}`
    : `Sold out · ${stock.incoming.quantity} incoming from ${stock.incoming.from}, no date yet`;
}

/** Only worth showing from two bracketed orders up. */
export function bracketingWorthNoting(bracketing: TicketBracketing | null): bracketing is TicketBracketing {
  return bracketing !== null && bracketing.bracketOrders >= 2;
}

/**
 * The bracketing line: a description of behaviour the team may want to know about, never an
 * accusation, and never a policy change for one customer. It must not contain "fraud",
 * "abuse", "scam" or "suspicious" — a test pins that.
 */
export function bracketingLine(bracketing: TicketBracketing): string {
  const orders = `${bracketing.bracketOrders} of ${bracketing.orders} orders`;
  return `${orders} in the last year held more than one size of the same style; ${percent(bracketing.returnRate)} of units came back. Usual policy applies — worth a size tip, not a different answer.`;
}

// ── Outside actions ──────────────────────────────────────────────────────────

export const OUTSIDE_LABELS: Record<OutsideKind, string> = {
  refund: "Refund",
  cancel: "Cancel the order",
  address_change: "Change the address",
  reship: "Re-ship",
  create_discount: "Create a discount code",
  start_return: "Start a return",
};

// ── Channels ─────────────────────────────────────────────────────────────────

export function isSocialChannel(channel: Channel): boolean {
  return channel === "facebook" || channel === "instagram" || channel === "twitter" || channel === "whatsapp";
}

// ── Staleness ────────────────────────────────────────────────────────────────

/** The helpdesk's data is stale once its last good sync is over two hours old. */
export const STALE_AFTER_MINUTES = 120;

export function isStale(lastSuccessAt: string | null, now: Date): boolean {
  if (!lastSuccessAt) return true;
  return now.getTime() - new Date(lastSuccessAt).getTime() > STALE_AFTER_MINUTES * 60_000;
}
