/**
 * SPEC-345 — Email Marketing Manager: the pure logic every send is judged by.
 */
import { describe, expect, it } from "vitest";

import {
  approvalReadiness,
  band,
  builderHref,
  campaignChip,
  discountCost,
  emailTabHref,
  filterByName,
  filterCampaigns,
  EMAIL_TAB_IDS,
  flowGapMonthly,
  guardrailChecks,
  incrementalLift,
  isQuietHour,
  liftVerdict,
  marginAfterDiscount,
  money,
  nextAllowedHour,
  normalizeEmailTab,
  overFrequencyCap,
  overviewTiles,
  profitEstimate,
  scoreSubject,
  snapshotAge,
  typedConfirmMatches,
  voiceCheck,
  VOICE_GATE_CAP,
  type ProfitInput,
  type SendCandidate,
} from "@/lib/email-marketing";
import type { Guardrails } from "@/types/email-marketing";

const GUARDRAILS: Guardrails = {
  frequencyCapPerWeek: 3,
  quietHours: { start: 21, end: 8 },
  maxAudienceWithoutSecondApproval: 10_000,
  maxDiscountPercent: 25,
  marginFloorPercent: 30,
  excludedSegments: ["bracketers"],
  dailySendCeiling: 40_000,
  seedList: ["owner@examplestore.com"],
  requireSeedTest: true,
};

const SAFE: SendCandidate = {
  connected: true,
  killSwitch: false,
  recipients: 2_000,
  offerKind: "none",
  discountPercent: 0,
  productMarginPercent: 55,
  includedProtective: [],
  sendHour: 10,
  smartSend: false,
  sentToday: 0,
  frequencyExcluded: 0,
  seedTested: true,
  spamRate: 0.05,
  voiceScore: 90,
  bannedWords: [],
  stockoutProducts: [],
};

describe("tabs and links", () => {
  it("falls back to the overview for an unknown tab", () => {
    expect(normalizeEmailTab("nope")).toBe("overview");
    expect(normalizeEmailTab(null)).toBe("overview");
    expect(normalizeEmailTab("approvals")).toBe("approvals");
    expect(EMAIL_TAB_IDS).toHaveLength(11);
  });

  it("builds tab and builder links", () => {
    expect(emailTabHref("overview")).toBe("/email-marketing");
    expect(emailTabHref("plan")).toBe("/email-marketing?tab=plan");
    expect(builderHref({ goal: "win_back", audience: "going-quiet" })).toBe("/email-marketing/campaigns/new?goal=win_back&audience=going-quiet");
    expect(builderHref()).toBe("/email-marketing/campaigns/new");
  });
});

describe("profit per send", () => {
  const base: ProfitInput = {
    recipients: 10_000,
    holdoutPercent: 10,
    aov: 6_000,
    marginPercent: 50,
    discountPercent: 0,
    baselineConversion: 1,
    conversionLow: 1.5,
    conversionHigh: 2,
    sendCost: 1,
  };

  it("counts only the orders the email causes", () => {
    const e = profitEstimate(base);
    // 9,000 sent × 0.5–1.0 extra points × $60 × 50% − $90 sending
    expect(e.low.amount).toBe(9_000 * 0.005 * 6_000 * 0.5 - 9_000);
    expect(e.high.amount).toBe(9_000 * 0.01 * 6_000 * 0.5 - 9_000);
    expect(e.basis).toContain("9,000 sent");
  });

  it("shows a 20%-off code on a 22%-margin product as losing money", () => {
    const e = profitEstimate({ ...base, marginPercent: 22, discountPercent: 20 });
    expect(e.high.amount).toBeLessThan(0);
    expect(e.basis).toContain("20% off");
  });

  it("prices what a discount gives away on every order it touches", () => {
    expect(discountCost({ ...base, discountPercent: 10 }).amount).toBe(9_000 * 0.02 * 6_000 * 0.1);
    expect(discountCost(base).amount).toBe(0);
  });

  it("computes the margin left after a discount", () => {
    expect(marginAfterDiscount(50, 0)).toBe(50);
    expect(Math.round(marginAfterDiscount(50, 20))).toBe(38);
    expect(marginAfterDiscount(22, 20)).toBeCloseTo(2.5, 5);
  });
});

describe("incremental lift", () => {
  it("compares recipients with the holdout", () => {
    const lift = incrementalLift({ treatedSize: 10_000, treatedOrders: 200, controlSize: 1_000, controlOrders: 10, aov: 5_000 });
    expect(lift.treatedRate).toBeCloseTo(2, 5);
    expect(lift.controlRate).toBeCloseTo(1, 5);
    expect(lift.incrementalOrders).toBe(100);
    expect(lift.incrementalRevenue.amount).toBe(500_000);
    expect(lift.liftPercent).toBeCloseTo(100, 5);
    expect(lift.confident).toBe(true);
  });

  it("never reports negative incremental orders and is not confident on a tiny holdout", () => {
    const lift = incrementalLift({ treatedSize: 1_000, treatedOrders: 5, controlSize: 20, controlOrders: 1, aov: 5_000 });
    expect(lift.incrementalOrders).toBe(0);
    expect(lift.confident).toBe(false);
  });

  it("writes a verdict that names the platform and the loss", () => {
    const v = liftVerdict(money(100_000), money(30_000), money(-5_000), true, "Klaviyo");
    expect(v).toContain("Klaviyo");
    expect(v).toContain("30%");
    expect(v).toContain("loss");
    expect(liftVerdict(money(100_000), null, null, false, "Mailchimp")).toContain("no holdout");
  });
});

describe("quiet hours and frequency", () => {
  it("handles a window across midnight", () => {
    expect(isQuietHour(22, { start: 21, end: 8 })).toBe(true);
    expect(isQuietHour(3, { start: 21, end: 8 })).toBe(true);
    expect(isQuietHour(8, { start: 21, end: 8 })).toBe(false);
    expect(isQuietHour(12, { start: 12, end: 14 })).toBe(true);
    expect(isQuietHour(12, { start: 0, end: 0 })).toBe(false);
    expect(nextAllowedHour(23, { start: 21, end: 8 })).toBe(8);
    expect(nextAllowedHour(10, { start: 21, end: 8 })).toBe(10);
  });

  it("counts profiles at the weekly cap", () => {
    expect(overFrequencyCap([{ sends: 1, profiles: 500 }, { sends: 3, profiles: 40 }, { sends: 5, profiles: 2 }], 3)).toBe(42);
  });
});

describe("guardrails", () => {
  it("lets a clean send through", () => {
    const r = approvalReadiness(guardrailChecks(SAFE, GUARDRAILS));
    expect(r.ready).toBe(true);
    expect(r.needsTypedConfirm).toBe(false);
  });

  it("names no kill switch unless the employee is paused (SPEC-375 patch)", () => {
    expect(guardrailChecks(SAFE, GUARDRAILS).some((c) => c.key === "kill")).toBe(false);
    const paused = guardrailChecks({ ...SAFE, killSwitch: true }, GUARDRAILS).find((c) => c.key === "kill");
    expect(paused).toMatchObject({ label: "Paused", status: "block" });
  });

  it.each([
    ["not connected", { connected: false }, "connection"],
    ["kill switch", { killSwitch: true }, "kill"],
    ["discount over the limit", { offerKind: "discount", discountPercent: 30 }, "discount"],
    ["margin under the floor", { offerKind: "discount", discountPercent: 20, productMarginPercent: 35 }, "margin"],
    ["protected group in a discount send", { offerKind: "unique_codes", discountPercent: 10, includedProtective: ["Bracketers"] }, "protective"],
    ["daily ceiling", { sentToday: 39_000 }, "ceiling"],
    ["no seed test", { seedTested: false }, "seed"],
    ["spam at the limit", { spamRate: 0.31 }, "deliverability"],
    ["banned word", { bannedWords: ["cheap"] }, "voice"],
    ["stockout product", { stockoutProducts: ["Linen Throw"] }, "stock"],
  ] as const)("blocks on %s", (_name, patch, key) => {
    const checks = guardrailChecks({ ...SAFE, ...patch } as SendCandidate, GUARDRAILS);
    const r = approvalReadiness(checks);
    expect(r.ready).toBe(false);
    expect(r.blockers.map((b) => b.key)).toContain(key);
  });

  it("asks for a typed confirmation over the audience threshold", () => {
    const r = approvalReadiness(guardrailChecks({ ...SAFE, recipients: 11_200 }, GUARDRAILS));
    expect(r.ready).toBe(true);
    expect(r.needsTypedConfirm).toBe(true);
    expect(typedConfirmMatches("11,200", 11_200)).toBe(true);
    expect(typedConfirmMatches("11200", 11_200)).toBe(true);
    expect(typedConfirmMatches("11201", 11_200)).toBe(false);
    expect(typedConfirmMatches("", 11_200)).toBe(false);
  });

  it("warns, not blocks, on quiet hours — and not at all with smart send time", () => {
    const quiet = guardrailChecks({ ...SAFE, sendHour: 23 }, GUARDRAILS).find((c) => c.key === "quiet");
    expect(quiet?.status).toBe("warn");
    const smart = guardrailChecks({ ...SAFE, sendHour: null, smartSend: true }, GUARDRAILS).find((c) => c.key === "quiet");
    expect(smart?.status).toBe("pass");
  });

  it("skips the seed-test check when the owner does not require one", () => {
    const checks = guardrailChecks({ ...SAFE, seedTested: false }, { ...GUARDRAILS, requireSeedTest: false });
    expect(checks.some((c) => c.key === "seed")).toBe(false);
  });
});

describe("subject lines and voice", () => {
  it("rewards a phone-length subject with distinct preview text", () => {
    const good = scoreSubject("New: the Ceramic Mug Set, in 4 glazes", "Made in small batches. First 200 ship this week.");
    const bad = scoreSubject("FREE!!! ACT NOW AND SAVE BIG ON EVERYTHING TODAY ONLY", "");
    expect(good.score).toBeGreaterThan(bad.score);
    expect(bad.notes.join(" ")).toMatch(/Spam-filter words/);
    expect(bad.notes.join(" ")).toMatch(/shouting/);
    expect(scoreSubject("", "x").score).toBe(0);
  });

  it("caps the voice score on a banned word and flags claims", () => {
    const rules = { bannedWords: ["cheap"], claims: ["lowest price"], voiceNotes: [] };
    const banned = voiceCheck("A cheap mug, beautifully made.", rules);
    expect(banned.score).toBeLessThanOrEqual(VOICE_GATE_CAP);
    expect(banned.banned).toEqual(["cheap"]);
    const claim = voiceCheck("The lowest price anywhere.", rules);
    expect(claim.claims).toEqual(["lowest price"]);
    expect(voiceCheck("A mug, beautifully made.", rules).score).toBeGreaterThan(90);
    // word boundaries: "cheaper" is not "cheap"
    expect(voiceCheck("Cheaper to run.", rules).banned).toEqual([]);
  });
});

describe("bands, chips, gaps, tiles", () => {
  it("bands spam by the Gmail and Yahoo thresholds", () => {
    expect(band("spam", 0.05)).toBe("good");
    expect(band("spam", 0.15)).toBe("warn");
    expect(band("spam", 0.3)).toBe("bad");
  });

  it("maps every status to a chip", () => {
    for (const s of ["draft", "in_review", "scheduled", "sending", "sent", "cancelled", "failed"] as const) {
      expect(campaignChip(s).label.length).toBeGreaterThan(0);
    }
    expect(campaignChip("failed").tone).toBe("destructive");
  });

  it("prices a flow gap as profit", () => {
    expect(flowGapMonthly(1_000, money(200), 50).amount).toBe(100_000);
  });

  it("builds six overview tiles that name the platform", () => {
    const tiles = overviewTiles(
      {
        attributed30d: money(1_000_000),
        incremental30d: money(400_000),
        profit30d: money(-10_000),
        revenuePerRecipient: money(120),
        listSize: 18_000,
        listGrowth30d: 600,
        unsubscribeRate: 0.6,
        spamRate: 0.05,
      },
      "Klaviyo",
    );
    expect(tiles).toHaveLength(6);
    expect(tiles[0].sub).toContain("40%");
    expect(tiles[0].sub).toContain("Klaviyo");
    expect(tiles.find((t) => t.key === "profit")?.tone).toBe("bad");
    expect(tiles.find((t) => t.key === "unsubscribe")?.tone).toBe("bad");
  });

  it("calls a snapshot stale after 36 hours", () => {
    const now = new Date("2026-10-07T12:00:00Z");
    expect(snapshotAge("2026-10-07T04:00:00Z", now).stale).toBe(false);
    expect(snapshotAge("2026-10-05T12:00:00Z", now)).toEqual({ hours: 48, stale: true });
  });
});

describe("filterCampaigns (Campaigns tab, SPEC-345 patch)", () => {
  const rows = [
    { name: "Spring Sale", status: "sent" as const },
    { name: "Winter Draft", status: "draft" as const },
    { name: "spring preview", status: "draft" as const },
  ];

  it("keeps everything with no status filter and no query", () => {
    expect(filterCampaigns(rows, "all", "")).toHaveLength(3);
  });

  it("filters by status", () => {
    expect(filterCampaigns(rows, "draft", "").map((c) => c.name)).toEqual(["Winter Draft", "spring preview"]);
  });

  it("searches the name case-insensitively, trimmed, and combines with status", () => {
    expect(filterCampaigns(rows, "all", "  SPRING ").map((c) => c.name)).toEqual(["Spring Sale", "spring preview"]);
    expect(filterCampaigns(rows, "draft", "spring").map((c) => c.name)).toEqual(["spring preview"]);
    expect(filterCampaigns(rows, "all", "nope")).toEqual([]);
  });
});

describe("filterByName (Audiences provider lists, SPEC-345 patch)", () => {
  const rows = [{ name: "VIP Customers" }, { name: "Purchasers" }, { name: "vip wholesale" }];
  it("keeps all on an empty or whitespace query", () => {
    expect(filterByName(rows, "")).toHaveLength(3);
    expect(filterByName(rows, "   ")).toHaveLength(3);
  });
  it("matches case-insensitively and trims", () => {
    expect(filterByName(rows, "  VIP ").map((r) => r.name)).toEqual(["VIP Customers", "vip wholesale"]);
    expect(filterByName(rows, "purcha").map((r) => r.name)).toEqual(["Purchasers"]);
    expect(filterByName(rows, "zzz")).toEqual([]);
  });
});
