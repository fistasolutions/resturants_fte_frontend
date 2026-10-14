import { describe, expect, it } from "vitest";

import { ADDABLE_BLOCKS, adviceIcon, BLOCK_LABELS, blockLabel, newBlock } from "@/lib/email-blocks";
import { guardrailChecks, protectedPhrase, type SendCandidate } from "@/lib/email-marketing";
import type { AdviceBlock, Guardrails } from "@/types/email-marketing";

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
  offerKind: "discount",
  discountPercent: 10,
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

const GENERAL: AdviceBlock = {
  label: "Product advice",
  title: "How to get the most from it",
  body: "A short note on choosing, using or caring for what is in this email.",
};

const check = (patch: Partial<SendCandidate>, key: string) =>
  guardrailChecks({ ...SAFE, ...patch }, GUARDRAILS).find((c) => c.key === key);

describe("the advice block follows the store's trade (SPEC-350)", () => {
  it("takes the backend's label and starter text", () => {
    expect(blockLabel("size_advice", GENERAL)).toBe("Product advice");
    const block = newBlock("size_advice", "a1", GENERAL);
    expect(block).toMatchObject({ id: "a1", kind: "size_advice", title: GENERAL.title, body: GENERAL.body });
  });

  it("falls back to today's text on an older backend, and leaves other blocks alone", () => {
    expect(blockLabel("size_advice")).toBe("Size advice");
    expect(newBlock("size_advice", "a2").title).toBe("Find your size");
    expect(blockLabel("hero", GENERAL)).toBe(BLOCK_LABELS.hero);
    expect(newBlock("product_grid", "g1", GENERAL)).toMatchObject({ kind: "product_grid", productIds: [] });
    expect(ADDABLE_BLOCKS).not.toContain("footer");
  });
});

describe("the advice block's mark follows the store's trade (SPEC-364)", () => {
  it("shows a ruler for a clothing store only", () => {
    expect(adviceIcon({ label: "Size advice", title: "Find your size", body: "" })).toBe("ruler");
    expect(adviceIcon(GENERAL)).toBe("info");
  });

  it("keeps the ruler on an older backend that sends no advice block", () => {
    expect(adviceIcon(undefined)).toBe("ruler");
  });
});

describe("the guardrail mirror matches the backend (SPEC-350 / backend SPEC-360)", () => {
  it("names the store's own protected groups — today's words for a clothing store", () => {
    expect(check({ protectedNames: ["Bracketers", "High-return customers"] }, "protective")?.reason).toBe(
      "Bracketers and high-return customers are left out.",
    );
    expect(check({ protectedNames: ["Multi-variant returners", "High-return customers"] }, "protective")?.reason).toBe(
      "Multi-variant returners and high-return customers are left out.",
    );
    expect(protectedPhrase(undefined)).toBe("Bracketers and high-return customers");
  });

  it("blocks a test of an older version", () => {
    const seed = check({ seedTested: false, seedTestStale: true }, "seed");
    expect(seed).toMatchObject({ status: "block", reason: "Edited since the last test — send a new test." });
    expect(check({ seedTested: false }, "seed")?.reason).toBe("Send a test to your seed list first.");
  });

  it("blocks a Klaviyo list past the weekly cap and warns it has no holdout", () => {
    expect(check({ listsAtCap: ["Newsletter"] }, "frequency")).toMatchObject({
      status: "block",
      reason: "Newsletter already had 3 emails this week — pick another audience or wait.",
    });
    expect(check({ providerSend: true }, "holdout")?.status).toBe("warn");
    expect(check({}, "holdout")).toBeUndefined();
  });
});
