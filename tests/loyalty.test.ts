/** Frontend SPEC-383 — loyalty and gift cards' pure half. */
import { describe, expect, it } from "vitest";

import {
  LOYALTY_HQ_TABS,
  earnPreview,
  formatCodeInput,
  isCompleteCode,
  lastMonth,
  readLoyaltyTab,
  rewardSummary,
  settlementReading,
} from "@/lib/loyalty";

describe("loyalty and gift cards (SPEC-383)", () => {
  it("reads the tab, settlement being head office's", () => {
    expect(readLoyaltyTab("gift-cards")).toBe("gift-cards");
    expect(readLoyaltyTab("nope")).toBe("program");
    expect(LOYALTY_HQ_TABS.has("settlement")).toBe(true);
    expect(LOYALTY_HQ_TABS.has("members")).toBe(false);
  });

  it("describes a reward", () => {
    const names = (id: number) => (id === 7 ? "Garlic Knots" : undefined);
    const money = (v: number) => `$${v.toFixed(2)}`;
    expect(rewardSummary({ kind: "free_item", value: null, itemId: 7 }, names, money)).toBe("Free Garlic Knots");
    expect(rewardSummary({ kind: "free_item", value: null, itemId: 9 }, names, money)).toBe("A free item");
    expect(rewardSummary({ kind: "amount_off", value: 5, itemId: null }, names, money)).toBe("$5.00 off");
  });

  it("formats a gift card code as it is typed", () => {
    expect(formatCodeInput("abcd efgh-2345")).toBe("ABCD-EFGH-2345");
    expect(formatCodeInput("ABCDEFGHJKLMNPQRSTUV")).toBe("ABCD-EFGH-JKLM-NPQR");
    expect(isCompleteCode("ABCD-EFGH-JKLM-NPQR")).toBe(true);
    expect(isCompleteCode("ABCD-EFGH")).toBe(false);
  });

  it("previews the points an order earns, rounded down", () => {
    expect(earnPreview(39, 1)).toBe(39);
    expect(earnPreview(39.99, 2)).toBe(79);
    expect(earnPreview(0.29, 10)).toBe(2);
    expect(earnPreview(-5, 1)).toBe(0);
    expect(earnPreview(10, 0)).toBe(0);
  });

  it("reads a franchise's settlement", () => {
    expect(settlementReading(83.27)).toBe("Holds gift-card money");
    expect(settlementReading(-10)).toBe("Served cards sold elsewhere");
    expect(settlementReading(0.001)).toBe("Even");
  });

  it("starts the settlement on last month", () => {
    expect(lastMonth(new Date("2026-10-15T12:00:00Z"))).toEqual(["2026-09-01", "2026-09-30"]);
    expect(lastMonth(new Date("2026-01-05T12:00:00Z"))).toEqual(["2025-12-01", "2025-12-31"]);
  });
});
