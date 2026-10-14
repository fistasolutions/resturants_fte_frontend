import { describe, expect, it } from "vitest";

import {
  ALWAYS_NEVER_AUTO_TOPICS,
  SUPPORT_TAB_IDS,
  withMandatory,
  allowedAutonomy,
  autopilotEligible,
  bannedHitsIn,
  blockedFlags,
  bracketingLine,
  bracketingWorthNoting,
  canSend,
  compareAgentHuman,
  comparisonText,
  confidenceBand,
  effectiveAutonomy,
  formatMinutes,
  formatMoney,
  fulfilmentLine,
  guardrailCheck,
  handoffDecision,
  handoffSummaryValid,
  isLate,
  isStale,
  normalizeSupportTab,
  offerCheck,
  routeTopic,
  sendStateOf,
  slaClock,
  slaText,
  stockLine,
  suggestHandoff,
  supportHref,
} from "@/lib/customer-support";
import type {
  DraftReply,
  Guardrails,
  SupportTicket,
  SupportWorkspace,
  TicketContext,
  TicketFulfilment,
} from "@/types/customer-support";

const usd = (dollars: number) => ({ amountMinor: Math.round(dollars * 100), currency: "USD" });

const GUARDRAILS: Guardrails = {
  neverAuto: ["wholesale"],
  neverAutoFlags: ["chargeback", "legal_threat", "injury", "harassment", "press"],
  angerHandoff: 0.7,
  vipHandling: "human_reviewed",
  vipThreshold: usd(1500),
  maxOfferPercent: 15,
  maxOfferAmount: usd(25),
  marginFloorPercent: 20,
  autopilotConfidence: 0.9,
  maxRepliesPerTicket: 3,
  languages: ["en", "es"],
  bannedWords: ["guaranteed", "cheap"],
  signOff: "Warm regards,",
  signature: "The Example Store team",
};

const NOW = new Date("2026-10-07T12:00:00Z");

function ticket(patch: Partial<SupportTicket> = {}): SupportTicket {
  return {
    id: "t1",
    provider: "gorgias",
    subject: "Where is my order?",
    channel: "email",
    customer: {
      id: "c1",
      provider: "gorgias",
      name: "Avery Quinn",
      email: "avery.quinn@example.com",
      lifetimeValue: usd(300),
      orders: 3,
      vip: false,
      health: { verdict: "Steady", tone: "neutral" },
      priorTickets: 0,
      language: "en",
      shopifyCustomerId: 5001,
    },
    topic: "where_is_my_order",
    status: "open",
    queue: "needs_approval",
    priority: "normal",
    tags: [],
    assignee: null,
    sentiment: "calm",
    flags: [],
    anger: 0.1,
    createdAt: "2026-10-07T11:00:00Z",
    updatedAt: "2026-10-07T11:00:00Z",
    firstResponseAt: null,
    snoozedUntil: null,
    agentReplies: 0,
    atRisk: null,
    preview: "",
    unread: true,
    language: "en",
    ...patch,
  };
}

function draft(patch: Partial<DraftReply> = {}): DraftReply {
  return {
    id: "d1",
    ticketId: "t1",
    channel: "email",
    body: "Your order ships today.",
    sources: [],
    confidence: 0.92,
    reasons: [],
    voiceScore: 90,
    bannedHits: [],
    offer: null,
    generatedAt: "2026-10-07T11:01:00Z",
    language: "en",
    ...patch,
  };
}

const workspace = (patch: Partial<SupportWorkspace> = {}): Pick<SupportWorkspace, "autonomy" | "topicAutonomy" | "guardrails" | "killSwitch"> => ({
  autonomy: "approve",
  topicAutonomy: {},
  guardrails: GUARDRAILS,
  killSwitch: { active: false, at: null, by: null },
  ...patch,
});

describe("tabs", () => {
  it("normalises unknown tabs to the overview and leaves the default out of the URL", () => {
    expect(normalizeSupportTab("inbox")).toBe("inbox");
    expect(normalizeSupportTab("nope")).toBe("overview");
    expect(normalizeSupportTab(null)).toBe("overview");
    expect(supportHref("overview")).toBe("/customer-support");
    expect(supportHref("topics", { topic: "size_fit", empty: null })).toBe("/customer-support?tab=topics&topic=size_fit");
  });

  it("keeps the nine tabs in their deliberate order", () => {
    expect(SUPPORT_TAB_IDS).toEqual(["overview", "inbox", "approvals", "topics", "knowledge", "insights", "performance", "chat", "settings"]);
  });
});

describe("routeTopic", () => {
  it("routes by the strongest keyword match", () => {
    expect(routeTopic("Where's my order? Tracking hasn't moved")?.topic).toBe("where_is_my_order");
    expect(routeTopic("Does the hoodie run small? Which size?")?.topic).toBe("size_fit");
    expect(routeTopic("When is it back in stock? It's sold out")?.topic).toBe("back_in_stock");
    expect(routeTopic("We'd like to place a wholesale bulk order")?.topic).toBe("wholesale");
  });

  it("returns null when nothing matches", () => {
    expect(routeTopic("hello there")).toBeNull();
  });

  it("matches whole words only, like the backend", () => {
    expect(routeTopic("Wholesale enquiry: do you sell wholesale?")?.topic).toBe("wholesale");
    expect(routeTopic("what a lovely outfit")).toBeNull();
  });
});

describe("autonomy", () => {
  it("follows the topic override, else the agent", () => {
    expect(effectiveAutonomy("size_fit", workspace({ topicAutonomy: { size_fit: "autopilot" } }))).toBe("autopilot");
    expect(effectiveAutonomy("refund_status", workspace())).toBe("approve");
  });

  it("caps never-auto topics at Draft and drops everything to Suggest under the kill switch", () => {
    expect(effectiveAutonomy("wholesale", workspace({ topicAutonomy: { wholesale: "autopilot" } }))).toBe("draft");
    expect(allowedAutonomy("wholesale", GUARDRAILS)).toEqual(["suggest", "draft"]);
    expect(allowedAutonomy("size_fit", GUARDRAILS)).toEqual(["suggest", "draft", "approve", "autopilot"]);
    expect(effectiveAutonomy("size_fit", workspace({ killSwitch: { active: true, at: null, by: null } }))).toBe("suggest");
  });
});

describe("offerCheck — goodwill priced against margin", () => {
  it("passes an offer that keeps the margin well above the floor", () => {
    const check = offerCheck({ kind: "free_shipping", amount: usd(9.5), orderMargin: usd(71.2), orderTotal: usd(148) }, GUARDRAILS);
    expect(check.result).toBe("pass");
    expect(check.marginAfterMinor).toBe(6170);
  });

  it("warns near the floor and blocks under it", () => {
    expect(offerCheck({ kind: "partial_refund", amount: usd(7), orderMargin: usd(18.4), orderTotal: usd(54) }, GUARDRAILS).result).toBe("warn");
    const blocked = offerCheck({ kind: "partial_refund", amount: usd(8), orderMargin: usd(18.4), orderTotal: usd(100) }, GUARDRAILS);
    expect(blocked.result).toBe("block");
    expect(blocked.reasons.join(" ")).toMatch(/floor/);
  });

  it("blocks above the money ceiling or the percentage ceiling", () => {
    expect(offerCheck({ kind: "discount_code", amount: usd(30), orderMargin: usd(200), orderTotal: usd(400) }, GUARDRAILS).reasons.join(" ")).toMatch(/ceiling/);
    expect(offerCheck({ kind: "discount_code", amount: usd(20), orderMargin: usd(60), orderTotal: usd(100) }, GUARDRAILS).result).toBe("block");
  });
});

describe("guardrailCheck and canSend", () => {
  it("lets a clean draft go", () => {
    const checks = guardrailCheck({ ticket: ticket(), draft: draft(), guardrails: GUARDRAILS, killSwitch: false });
    expect(canSend(checks).allowed).toBe(true);
    // SPEC-375 patch: no kill switch row unless the agent is paused.
    expect(checks.some((c) => c.key === "kill")).toBe(false);
    expect(autopilotEligible(checks, draft(), GUARDRAILS)).toBe(true);
  });

  it("blocks for the kill switch, banned words, anger, a sensitive subject, a language and too many replies — each with a reason", () => {
    const cases: [Partial<SupportTicket>, Partial<DraftReply>, boolean, string][] = [
      [{}, {}, true, "kill"],
      [{}, { bannedHits: ["guaranteed"] }, false, "voice"],
      [{ anger: 0.8 }, {}, false, "anger"],
      [{ flags: ["chargeback"] }, {}, false, "sensitive"],
      [{}, { language: "fr" }, false, "language"],
      [{ agentReplies: 3 }, {}, false, "replies"],
    ];
    for (const [t, d, kill, key] of cases) {
      const checks = guardrailCheck({ ticket: ticket(t), draft: draft(d), guardrails: GUARDRAILS, killSwitch: kill });
      const verdict = canSend(checks);
      expect(verdict.allowed, key).toBe(false);
      expect(verdict.blockers.map((b) => b.key)).toContain(key);
      expect(verdict.blockers.every((b) => b.reason.length > 0)).toBe(true);
    }
  });

  it("warns, without blocking, for a reviewed VIP and a never-auto topic", () => {
    const vip = ticket({ customer: { ...ticket().customer, vip: true } });
    const checks = guardrailCheck({ ticket: vip, draft: draft(), guardrails: GUARDRAILS, killSwitch: false });
    expect(canSend(checks).allowed).toBe(true);
    expect(checks.find((c) => c.key === "vip")?.result).toBe("warn");
    expect(autopilotEligible(checks, draft(), GUARDRAILS)).toBe(false);
    const always = guardrailCheck({ ticket: vip, draft: draft(), guardrails: { ...GUARDRAILS, vipHandling: "always_human" }, killSwitch: false });
    expect(canSend(always).allowed).toBe(false);
  });

  it("re-checks an edit: removing the banned word clears the block", () => {
    expect(bannedHitsIn("It is GUARANTEED to fit", GUARDRAILS.bannedWords)).toEqual(["guaranteed"]);
    expect(bannedHitsIn("It is designed to fit", GUARDRAILS.bannedWords)).toEqual([]);
  });

  it("only pairs listed sensitive subjects with a hand-off", () => {
    expect(blockedFlags(["press", "injury"], { neverAutoFlags: ["injury"] })).toEqual(["injury"]);
  });
});

describe("hand-off", () => {
  it("collects every reason a ticket must go to a person", () => {
    const decision = handoffDecision(ticket({ flags: ["injury"], anger: 0.9, language: "de" }), null, GUARDRAILS);
    expect(decision.handoff).toBe(true);
    expect(decision.reasons).toHaveLength(4);
    expect(handoffDecision(ticket(), draft(), GUARDRAILS)).toEqual({ handoff: false, reasons: [] });
  });

  it("suggests the mapped team, three summary lines, a next step and a raised priority", () => {
    const context: TicketContext = {
      order: { name: "#4821", placedAt: "2026-10-02T00:00:00Z", total: usd(148), margin: usd(71.2), lines: [], href: "/orders?q=4821" },
      fulfilment: { status: "unfulfilled", location: "East fulfilment centre", carrier: null, tracking: null, handlingDays: 2, waitingDays: 5, eta: null, lastEvent: null },
      return: null,
      fit: [],
      stock: [],
      bracketing: null,
      history: [],
      macros: [],
    };
    const suggestion = suggestHandoff(ticket({ customer: { ...ticket().customer, vip: true } }), context, GUARDRAILS, [
      { topic: "where_is_my_order", to: { kind: "team", name: "Fulfilment desk" } },
    ]);
    expect(suggestion.to).toEqual({ kind: "team", name: "Fulfilment desk" });
    expect(suggestion.summary).toHaveLength(3);
    expect(suggestion.summary[1]).toMatch(/over its handling time/);
    expect(suggestion.priority).toBe("high");
    expect(suggestion.nextStep).toMatch(/warehouse/);
    expect(handoffSummaryValid(suggestion.summary)).toBe(true);
    expect(handoffSummaryValid(["a", "", "c"])).toBe(false);
    expect(suggestHandoff(ticket({ flags: ["chargeback"] }), context, GUARDRAILS, []).priority).toBe("critical");
  });
});

describe("SLA clock", () => {
  const slas = [{ channel: "email" as const, firstResponseMinutes: 240 }, { channel: "chat" as const, firstResponseMinutes: 5 }];

  it("counts down, warns in the last quarter and breaches after", () => {
    expect(slaClock(ticket({ createdAt: "2026-10-07T11:00:00Z" }), slas, NOW)).toMatchObject({ status: "ok", minutes: 180 });
    expect(slaClock(ticket({ createdAt: "2026-10-07T08:30:00Z" }), slas, NOW).status).toBe("due_soon");
    const late = slaClock(ticket({ createdAt: "2026-10-07T07:00:00Z" }), slas, NOW);
    expect(late.status).toBe("breached");
    expect(slaText(late)).toBe("1h over");
  });

  it("judges an answered ticket by how long the answer took", () => {
    expect(slaClock(ticket({ channel: "chat", createdAt: "2026-10-07T11:00:00Z", firstResponseAt: "2026-10-07T11:03:00Z" }), slas, NOW)).toMatchObject({ status: "met", minutes: 3 });
    expect(slaClock(ticket({ channel: "chat", createdAt: "2026-10-07T11:00:00Z", firstResponseAt: "2026-10-07T11:30:00Z" }), slas, NOW).status).toBe("breached");
  });

  it("formats durations", () => {
    expect(formatMinutes(30)).toBe("30m");
    expect(formatMinutes(95)).toBe("1h 35m");
    expect(formatMinutes(120)).toBe("2h");
    expect(formatMinutes(3000)).toBe("2d 2h");
  });
});

describe("confidence, send state, comparison, money", () => {
  it("bands confidence", () => {
    expect(confidenceBand(0.9)).toBe("high");
    expect(confidenceBand(0.7)).toBe("medium");
    expect(confidenceBand(0.4)).toBe("low");
  });

  it("maps the helpdesk's asynchronous send to a state", () => {
    expect(sendStateOf({ sentAt: null, failureReason: null })).toBe("queued");
    expect(sendStateOf({ sentAt: "2026-10-07T11:00:00Z", failureReason: null })).toBe("sent");
    expect(sendStateOf({ sentAt: null, failureReason: "Mailbox full" })).toBe("failed");
    expect(sendStateOf({ sentAt: null, failureReason: null, cancelled: true })).toBe("cancelled");
  });

  it("compares the agent with the team in the right direction", () => {
    expect(compareAgentHuman(4, 90, true).better).toBe("agent");
    expect(compareAgentHuman(4.2, 4.6, false).better).toBe("human");
    expect(compareAgentHuman(4.6, 4.62, false).better).toBe("even");
    expect(compareAgentHuman(null, 4, false)).toEqual({ better: null, deltaPercent: null });
    expect(comparisonText(compareAgentHuman(50, 100, true))).toBe("Agent better by 50%");
  });

  it("formats minor units in the money's own currency", () => {
    expect(formatMoney(usd(1234.5))).toBe("$1,234.50");
    expect(formatMoney(usd(2840), true)).toBe("$2,840");
    expect(formatMoney({ amountMinor: 1000, currency: "EUR" })).toBe("€10.00");
  });
});

describe("context wording", () => {
  const f = (patch: Partial<TicketFulfilment>): TicketFulfilment => ({
    status: "unfulfilled",
    location: "Main warehouse",
    carrier: null,
    tracking: null,
    handlingDays: 2,
    waitingDays: 1,
    eta: null,
    lastEvent: null,
    ...patch,
  });

  it("is late only against the shop's own handling time, and only before it ships", () => {
    expect(isLate(f({ waitingDays: 5 }))).toBe(true);
    expect(isLate(f({ waitingDays: 2 }))).toBe(false);
    expect(isLate(f({ waitingDays: 9, status: "shipped" }))).toBe(false);
    expect(fulfilmentLine(f({ waitingDays: 5 }))).toMatch(/over its 2-day handling time/);
  });

  it("never promises a restock date it cannot see", () => {
    expect(stockLine({ productId: 1, title: "Bag", variant: "Black", available: 0, incoming: null })).toMatch(/no restock date can be promised/);
    expect(stockLine({ productId: 1, title: "Bag", variant: "Black", available: 0, incoming: { quantity: 12, from: "transfer", expectedAt: null } })).toMatch(/no date yet/);
    expect(stockLine({ productId: 1, title: "Bag", variant: "Black", available: 4, incoming: null })).toBe("4 in stock");
  });

  it("describes bracketing as behaviour — never as fraud or abuse", () => {
    const b = { bracketOrders: 5, orders: 11, returnRate: 0.46 };
    const line = bracketingLine(b);
    expect(line).toMatch(/5 of 11 orders/);
    expect(line).not.toMatch(/fraud|abuse|scam|suspicious/i);
    expect(bracketingWorthNoting(b)).toBe(true);
    expect(bracketingWorthNoting({ ...b, bracketOrders: 1 })).toBe(false);
    expect(bracketingWorthNoting(null)).toBe(false);
  });

  it("calls the helpdesk's data stale after two hours", () => {
    expect(isStale("2026-10-07T11:00:00Z", NOW)).toBe(false);
    expect(isStale("2026-10-07T09:00:00Z", NOW)).toBe(true);
    expect(isStale(null, NOW)).toBe(true);
  });
});

describe("withMandatory (SPEC-347)", () => {
  it("folds the topics and flags nobody may switch off back in, once", () => {
    const saved = withMandatory({ neverAuto: ["size_fit"], neverAutoFlags: [] });
    expect(saved.neverAuto).toEqual(["size_fit", ...ALWAYS_NEVER_AUTO_TOPICS]);
    expect(saved.neverAutoFlags).toEqual(["chargeback", "legal_threat", "injury", "harassment", "press"]);
    expect(withMandatory(saved)).toEqual(saved);
  });
});
