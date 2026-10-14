/**
 * SPEC-345 on backend SPEC-354 — the provider matrix, the calendar, the journey layout, the
 * builder's draft → request body, the query registry on the real paths, every write's
 * method/path/body through the proxy, and the chat's answer actions.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/lib/api-error";
import {
  campaignToDraft,
  defaultAudience,
  defaultBlocks,
  draftToCampaign,
  draftToInput,
  estimateRecipients,
  initialDraft,
  stepProblem,
  strategyLabel,
  subjectVariants,
  THROTTLE_PERCENTS,
  wallClock,
  type BuilderDraft,
} from "@/lib/email-builder";
import { delayLabel, findMessage, flowMessages, journeyHours, layoutFlow } from "@/lib/email-flow-layout";
import { approvalReadiness, GOAL_ORDER, GOALS, typedConfirmMatches } from "@/lib/email-marketing";
import { addDays, monthGrid, moveProblem, planTotals, rejectProblem, weekDays, weekStart } from "@/lib/email-plan";
import { can, EMAIL_PROVIDER_ORDER, EMAIL_PROVIDERS, privateKeyProblem } from "@/lib/email-providers";
import { EMAIL_MARKETING_KEY, emailMarketingPaths, emailMarketingQueries } from "@/lib/queries/email-marketing";
import * as actions from "@/services/email-marketing-actions";
import type { Audience, CampaignChecks, CatalogProduct, FlowStep, PlanSlot } from "@/types/email-marketing";

const usd = (amount: number) => ({ amount, currency: "USD" });

function audience(key: string, over: Partial<Audience> = {}): Audience {
  return {
    key,
    name: key,
    source: "fte",
    provider: "klaviyo",
    externalId: null,
    description: "",
    size: 100,
    consent: { emailSubscribed: 80, smsSubscribed: 0, neverSubscribed: 15, suppressed: 5 },
    overlap: null,
    sync: { at: null, direction: null, as: null },
    protective: false,
    ...over,
  };
}

const AUDIENCES: Audience[] = [
  audience("vip"),
  audience("going-quiet", { size: 300, consent: { emailSubscribed: 250, smsSubscribed: 0, neverSubscribed: 40, suppressed: 10 } }),
  audience("bracketers", { protective: true }),
  audience("klaviyo-list-KL1", { source: "provider_list", size: 4_000, consent: { emailSubscribed: 3_600, smsSubscribed: 0, neverSubscribed: 300, suppressed: 100 } }),
];

const CATALOG: CatalogProduct[] = [
  { id: 1, title: "Ceramic Mug Set", price: usd(4_800), marginPercent: 60, stock: 40, stockoutRisk: false, fit: null },
  { id: 2, title: "Linen Apron", price: usd(3_200), marginPercent: 24, stock: 2, stockoutRisk: true, fit: null },
  { id: 3, title: "Oak Board", price: usd(5_600), marginPercent: 52, stock: 15, stockoutRisk: false, fit: null },
];

function draft(over: Partial<BuilderDraft> = {}): BuilderDraft {
  return {
    ...initialDraft("launch", { id: "new", excluded: ["bracketers"], today: "2026-10-07", catalog: CATALOG, post: null, sender: "Example Store", audiences: AUDIENCES }),
    ...over,
  };
}

describe("capability matrix", () => {
  it("connects only Klaviyo today, names the rest", () => {
    expect(EMAIL_PROVIDER_ORDER.filter((k) => EMAIL_PROVIDERS[k].available)).toEqual(["klaviyo"]);
    expect(can("klaviyo", "flowsCreate")).toBe(true);
    expect(can("shopify_email", "smsChannel")).toBe(false);
  });

  it("checks the key's shape before it is ever sent", () => {
    expect(privateKeyProblem("klaviyo", "")).toMatch(/Paste/);
    expect(privateKeyProblem("klaviyo", "abc123")).toMatch(/pk_/);
    expect(privateKeyProblem("klaviyo", "pk_0123456789abcdefghij")).toBeNull();
  });
});

describe("calendar", () => {
  it("starts weeks on Monday and covers whole weeks", () => {
    expect(weekStart("2026-10-07")).toBe("2026-10-05");
    const grid = monthGrid("2026-10-15", "2026-10-07");
    expect(grid[0][0].date).toBe("2026-09-28");
    expect(grid.every((w) => w.length === 7)).toBe(true);
    expect(weekDays("2026-10-07", "2026-10-07").map((d) => d.day)).toEqual([5, 6, 7, 8, 9, 10, 11]);
    expect(addDays("2026-10-31", 1)).toBe("2026-11-01");
  });

  it("refuses what the server refuses: a short reason, a move into the past", () => {
    expect(rejectProblem("no")).not.toBeNull();
    expect(rejectProblem("Too close to the launch")).toBeNull();
    expect(moveProblem("2026-10-06", "2026-10-07")).toMatch(/past/);
    expect(moveProblem("2026-10-07", "2026-10-07")).toBeNull();
    expect(moveProblem("tomorrow", "2026-10-07")).not.toBeNull();
  });

  it("totals the plan by state", () => {
    const slot = (id: string, state: PlanSlot["state"], amount: number): PlanSlot => ({
      id,
      date: "2026-10-08",
      kind: "campaign",
      title: id,
      reason: "",
      reasonKind: "stock",
      audience: "",
      expectedProfit: usd(amount),
      state,
      rejectReason: null,
      goal: null,
    });
    const totals = planTotals([slot("a", "accepted", 1_000), slot("b", "proposed", 500), slot("c", "rejected", 900)]);
    expect([totals.accepted, totals.proposed, totals.rejected]).toEqual([1, 1, 1]);
    expect(totals.acceptedProfit.amount).toBe(1_000);
  });
});

describe("journey layout", () => {
  const steps: FlowStep[] = [
    { id: "t", kind: "trigger", label: "Viewed Product", detail: "Starts when a profile does this." },
    { id: "d", kind: "delay", label: "Wait", hours: 24 },
    {
      id: "s",
      kind: "split",
      label: "Random 10%",
      yes: [{ id: "o", kind: "other", label: "Update profile", detail: "" }],
      no: [{ id: "n", kind: "message", label: "Email", channel: "email", subject: "Still deciding?", previewText: "", blocks: [], status: "live" }],
    },
  ];

  it("nests branches and keeps a step it does not draw in detail", () => {
    expect(layoutFlow(steps).map((r) => [r.step.id, r.depth, r.branch])).toEqual([
      ["t", 0, null],
      ["d", 0, null],
      ["s", 0, null],
      ["o", 1, "yes"],
      ["n", 1, "no"],
    ]);
    expect(flowMessages(steps).map((m) => m.id)).toEqual(["n"]);
    expect(findMessage(steps, "n")?.subject).toBe("Still deciding?");
    expect(journeyHours(steps)).toBe(24);
    expect(delayLabel(48)).toBe("2 days");
  });
});

describe("builder", () => {
  it("defaults to a segment the backend has, or the store's own list", () => {
    for (const goal of GOAL_ORDER) {
      expect(["", "vip", "going-quiet", "due-reorder", "first-time", "discount-only"]).toContain(GOALS[goal].audience);
    }
    expect(defaultAudience("vip", AUDIENCES)).toEqual(["vip"]);
    expect(defaultAudience("", AUDIENCES)).toEqual(["klaviyo-list-KL1"]);
    expect(defaultAudience("due-reorder", AUDIENCES)).toEqual(["klaviyo-list-KL1"]);
    expect(defaultAudience("vip", [audience("bracketers", { protective: true })])).toEqual([]);
    expect(draft().audienceKeys).toEqual(["vip"]);
  });

  it("never prefills a stockout-risk product or the store's name", () => {
    expect(draft().productIds).not.toContain(2);
    const text = JSON.stringify([subjectVariants("newsletter", "", ""), subjectVariants("custom", "", ""), defaultBlocks("custom", [], null)]);
    expect(text).not.toMatch(/Example Store|examplestore/);
    expect(defaultBlocks("launch", [], null, "Example Store").at(-1)?.body).toMatch(/^Example Store · /);
  });

  it("gives an honest upper bound: consented profiles only, nothing guessed", () => {
    const estimate = estimateRecipients(draft({ audienceKeys: ["vip", "going-quiet"] }), AUDIENCES);
    expect(estimate.recipients).toBe(330);
    expect(estimate.exclusions).toEqual([{ reason: "Not subscribed, suppressed or without an email (consent)", count: 70 }]);
    expect(estimateRecipients(draft({ audienceKeys: [] }), AUDIENCES).recipients).toBe(0);
  });

  it("asks for what the server would refuse, step by step", () => {
    expect(stepProblem("goal", draft({ name: "x" }))).not.toBeNull();
    expect(stepProblem("audience", draft({ audienceKeys: [] }), AUDIENCES)).not.toBeNull();
    expect(stepProblem("audience", draft({ audienceKeys: ["vip", "klaviyo-list-KL1"] }), AUDIENCES)).toMatch(/not both/);
    expect(stepProblem("audience", draft({ audienceKeys: ["vip"] }), AUDIENCES)).toBeNull();
    expect(stepProblem("offer", draft({ offerKind: "discount", discountCode: null }))).toMatch(/Shopify/);
    expect(stepProblem("offer", draft({ offerKind: "discount", discountCode: "FALL15", discountPercent: 15 }))).toBeNull();
    expect(stepProblem("content", draft({ subject: " " }))).not.toBeNull();
    expect(stepProblem("schedule", draft({ strategy: { kind: "throttled", at: "2026-10-09T10:00:00Z", percent: 80 } }))).toMatch(/50%/);
    expect(stepProblem("schedule", draft({ strategy: { kind: "throttled", at: "2026-10-09T10:00:00Z", percent: 20 } }))).toBeNull();
    // Klaviyo accepts only its listed rates — 15% and 30% are refused there.
    expect(stepProblem("schedule", draft({ strategy: { kind: "throttled", at: "2026-10-09T10:00:00Z", percent: 15 } }))).not.toBeNull();
    expect(stepProblem("schedule", draft({ strategy: { kind: "throttled", at: "2026-10-09T10:00:00Z", percent: 33 } }))).toBeNull();
  });

  it("saves the body the backend expects", () => {
    const body = draftToInput(draft({ name: "  Autumn launch ", offerKind: "discount", discountCode: "FALL15", discountPercent: 15, testKind: "none" }));
    expect(body).toMatchObject({ name: "Autumn launch", goal: "launch", offer: { kind: "discount", code: "FALL15" }, variants: 1, holdoutPercent: 10 });
    expect(draftToInput(draft({ offerKind: "discount", discountCode: null })).offer).toEqual({ kind: "none" });
    expect(draftToInput(draft({ offerKind: "free_shipping", discountCode: "SHIPFREE" })).offer).toEqual({ kind: "free_shipping", code: "SHIPFREE" });
  });

  it("round-trips a saved draft back into the builder", () => {
    const d = draft({ offerKind: "discount", discountCode: "FALL15", discountPercent: 15, productIds: [1, 3] });
    const saved = { ...draftToCampaign(d, { recipients: 80, exclusions: [] }, CATALOG, "klaviyo", 90, "2026-10-07T09:00:00Z"), id: "42" };
    expect(saved.offer).toMatchObject({ kind: "discount", code: "FALL15", percent: 15, productMarginPercent: 52 });
    const back = campaignToDraft(saved);
    expect(back).toMatchObject({ id: "42", offerKind: "discount", discountCode: "FALL15", discountPercent: 15, subject: d.subject });
    expect(draftToInput(back)).toEqual(draftToInput({ ...d, id: "42" }));
  });

  it("keeps a set time as a wall clock, with no zone", () => {
    expect(wallClock(new Date(2026, 9, 9, 10, 0))).toBe("2026-10-09T10:00");
    expect(strategyLabel({ kind: "static", at: "2026-10-09T10:00" })).toMatch(/10:00 AM, in each customer's timezone/);
    expect([...THROTTLE_PERCENTS]).toEqual([1, 2, 5, 10, 11, 13, 14, 17, 20, 25, 33, 50]);
  });

  it("labels a throttled send by its share of the audience", () => {
    expect(strategyLabel({ kind: "throttled", at: "2026-10-09T10:00:00Z", percent: 20 })).toMatch(/20% of the audience an hour/);
  });
});

describe("the server's checks drive the approve button", () => {
  const checks: CampaignChecks = {
    recipients: 12_400,
    heldOut: 1_240,
    exclusions: [],
    checks: [
      { key: "audience", label: "Audience size", status: "warn", reason: "12,400 recipients — over 10,000, so the count must be typed to confirm." },
      { key: "seed", label: "Seed test", status: "block", reason: "Send a test to the seed list first." },
    ],
  };

  it("blocks on a server block and asks for the typed count", () => {
    const readiness = approvalReadiness(checks.checks);
    expect(readiness.ready).toBe(false);
    expect(readiness.needsTypedConfirm).toBe(true);
    expect(typedConfirmMatches("12,400", checks.recipients)).toBe(true);
    expect(typedConfirmMatches("12,399", checks.recipients)).toBe(false);
  });
});

describe("query registry", () => {
  it("reads every view from its own path under one key prefix", async () => {
    const defs = [
      [emailMarketingQueries.workspace(), "/email-marketing/workspace"],
      [emailMarketingQueries.overview(), "/email-marketing/overview"],
      [emailMarketingQueries.plan(), "/email-marketing/plan"],
      [emailMarketingQueries.campaigns(), "/email-marketing/campaigns"],
      [emailMarketingQueries.campaign("7"), "/email-marketing/campaigns/7"],
      [emailMarketingQueries.checks("7"), "/email-marketing/campaigns/7/checks"],
      [emailMarketingQueries.flows(), "/email-marketing/flows"],
      [emailMarketingQueries.flow("missing-welcome"), "/email-marketing/flows/missing-welcome"],
      [emailMarketingQueries.audiences(), "/email-marketing/audiences"],
      [emailMarketingQueries.content(), "/email-marketing/content"],
      [emailMarketingQueries.discountCodes(), "/email-marketing/discount-codes"],
      [emailMarketingQueries.approvals(), "/email-marketing/approvals"],
      [emailMarketingQueries.performance(), "/email-marketing/performance"],
      [emailMarketingQueries.deliverability(), "/email-marketing/deliverability"],
      [emailMarketingQueries.activity(), "/email-marketing/activity"],
      [emailMarketingQueries.seedTests(), "/email-marketing/seed-tests"],
    ] as const;
    const keys = new Set<string>();
    for (const [def, path] of defs) {
      expect(def.queryKey.slice(0, 1)).toEqual([...EMAIL_MARKETING_KEY]);
      keys.add(JSON.stringify(def.queryKey));
      const seen: string[] = [];
      await def.load(async <T,>(p: string) => {
        seen.push(p);
        return {} as T;
      });
      expect(seen).toEqual([path]);
    }
    expect(keys.size).toBe(defs.length);
    expect(emailMarketingPaths.campaign("a/b")).toBe("/email-marketing/campaigns/a%2Fb");
  });
});

describe("writes go through the proxy, one route each", () => {
  const calls: { url: string; method: string; body: unknown }[] = [];

  function stub(status = 200, payload: unknown = {}) {
    calls.length = 0;
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, method: String(init.method), body: init.body ? JSON.parse(String(init.body)) : undefined });
        return new Response(status === 204 ? null : JSON.stringify(payload), { status, headers: { "Content-Type": "application/json" } });
      }),
    );
  }

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("maps every action to its method, path and body", async () => {
    stub(200, { id: "9" });
    const input = draftToInput(draft());
    await actions.connectProvider("pk_0123456789abcdefghij");
    await actions.connectProvider(null);
    await actions.saveCampaign(input, null);
    await actions.saveCampaign(input, "9");
    await actions.requestReview("9");
    await actions.sendSeedTest("9");
    await actions.approveCampaign("9", "12,400");
    await actions.cancelCampaign("9");
    await actions.buildFlow("browse_abandon");
    await actions.setFlowStatus("3", "live");
    await actions.saveFlowMessage("3", "A2", "Still want it?", "Held for you");
    await actions.syncAudience("vip");
    await actions.setKillSwitch(true, "Pausing for a check");
    await actions.setProgramAutonomy("launch", "autopilot");
    await actions.refreshPlan();
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      "PUT /api/proxy/email-marketing/connection",
      "PUT /api/proxy/email-marketing/connection",
      "POST /api/proxy/email-marketing/campaigns",
      "PUT /api/proxy/email-marketing/campaigns/9",
      "POST /api/proxy/email-marketing/campaigns/9/review",
      "POST /api/proxy/email-marketing/campaigns/9/test",
      "POST /api/proxy/email-marketing/campaigns/9/approve",
      "POST /api/proxy/email-marketing/campaigns/9/cancel",
      "POST /api/proxy/email-marketing/flows/browse_abandon/build",
      "POST /api/proxy/email-marketing/flows/3/status",
      "PUT /api/proxy/email-marketing/flows/3/messages/A2",
      "POST /api/proxy/email-marketing/audiences/vip/sync",
      "POST /api/proxy/email-marketing/kill-switch",
      "PUT /api/proxy/email-marketing/programs/launch/autonomy",
      "POST /api/proxy/email-marketing/plan/refresh",
    ]);
    expect(calls[0].body).toEqual({ private_key: "pk_0123456789abcdefghij" });
    expect(calls[1].body).toEqual({});
    expect(calls[2].body).toEqual(input);
    expect(calls[6].body).toEqual({ typed: "12,400" });
    expect(calls[9].body).toEqual({ status: "live" });
    expect(calls[10].body).toEqual({ subject: "Still want it?", previewText: "Held for you" });
    expect(calls[12].body).toEqual({ active: true, reason: "Pausing for a check" });
  });

  it("sends plan and approval decisions with their reasons", async () => {
    stub(204);
    await expect(actions.acceptPlanSlot("5")).resolves.toBeUndefined();
    await actions.rejectPlanSlot("5", "Too close to the launch");
    await actions.movePlanSlot("5", "2026-10-12");
    await actions.decideApproval("8", "send_back", "Make the subject warmer");
    await actions.decideApproval("8", "approve", null, "12,400");
    await actions.disconnectProvider();
    expect(calls.map((c) => [c.method, c.url, c.body])).toEqual([
      ["POST", "/api/proxy/email-marketing/plan/5/accept", undefined],
      ["POST", "/api/proxy/email-marketing/plan/5/reject", { reason: "Too close to the launch" }],
      ["POST", "/api/proxy/email-marketing/plan/5/move", { date: "2026-10-12" }],
      ["POST", "/api/proxy/email-marketing/approvals/8/decide", { decision: "send_back", reason: "Make the subject warmer", typed: null }],
      ["POST", "/api/proxy/email-marketing/approvals/8/decide", { decision: "approve", reason: null, typed: "12,400" }],
      ["DELETE", "/api/proxy/email-marketing/connection", undefined],
    ]);
  });

  it("surfaces the server's own reason when it refuses", async () => {
    stub(409, { error: { code: "email_guardrails_blocked", message: "Send a test to the seed list first." } });
    const failure = actions.approveCampaign("9", null);
    await expect(failure).rejects.toBeInstanceOf(ApiError);
    await expect(actions.approveCampaign("9", null)).rejects.toMatchObject({ status: 409, code: "email_guardrails_blocked", message: "Send a test to the seed list first." });
  });
});
