/**
 * SPEC-181 — which attribution measure a published post can claim.
 *
 * The precedence rule is the whole point: a post that earned a first-touch sale
 * must stop reading "No attributed sales yet", but it must never be shown as if
 * the buyer had landed on it and bought in the same session.
 */
import { describe, expect, it } from "vitest";

import {
  coverageNote,
  orderCountLabel,
  summarizeBlogAttribution,
} from "@/lib/blog-attribution";

const EMPTY = {
  attributedOrders: 0,
  attributedRevenue: 0,
  firstTouchOrders: 0,
  firstTouchRevenue: 0,
  lastTouchOrders: 0,
  lastTouchRevenue: 0,
};

describe("summarizeBlogAttribution", () => {
  it("prefers the same-session measure when it exists", () => {
    const result = summarizeBlogAttribution({
      ...EMPTY,
      attributedOrders: 1,
      attributedRevenue: 100,
      lastTouchOrders: 5,
      lastTouchRevenue: 999,
      firstTouchOrders: 9,
      firstTouchRevenue: 5000,
    });
    expect(result.kind).toBe("attributed");
    expect(result.revenue).toBe(100);
    // The strongest measure needs no qualifier.
    expect(result.label).toBe("");
  });

  it("falls back to last touch, and says so", () => {
    const result = summarizeBlogAttribution({
      ...EMPTY,
      lastTouchOrders: 2,
      lastTouchRevenue: 75,
      firstTouchOrders: 4,
      firstTouchRevenue: 400,
    });
    expect(result.kind).toBe("lastTouch");
    expect(result.revenue).toBe(75);
    expect(result.label).toBe("last touch");
  });

  it("surfaces a first-touch-only post instead of calling it nothing", () => {
    const result = summarizeBlogAttribution({
      ...EMPTY,
      firstTouchOrders: 3,
      firstTouchRevenue: 250,
    });
    expect(result.kind).toBe("firstTouch");
    expect(result.revenue).toBe(250);
    expect(result.label).toBe("first touch");
    expect(result.description).toContain("introduced");
  });

  it("reports an honest nothing when every measure is zero", () => {
    const result = summarizeBlogAttribution(EMPTY);
    expect(result.kind).toBe("none");
    expect(result.revenue).toBe(0);
    expect(result.orders).toBe(0);
  });

  it("counts a fully discounted order (revenue 0, orders 1)", () => {
    const result = summarizeBlogAttribution({ ...EMPTY, firstTouchOrders: 1 });
    expect(result.kind).toBe("firstTouch");
    expect(result.orders).toBe(1);
  });
});

describe("orderCountLabel", () => {
  it("is singular for one and plural otherwise", () => {
    expect(orderCountLabel(1)).toBe("1 order");
    expect(orderCountLabel(0)).toBe("0 orders");
    expect(orderCountLabel(4)).toBe("4 orders");
  });
});

describe("coverageNote", () => {
  it("says nothing when coverage is complete", () => {
    expect(coverageNote({ orders: 10, fetched: 10, ratio: 1 })).toBeNull();
  });

  it("says nothing when there are no orders to cover", () => {
    expect(coverageNote({ orders: 0, fetched: 0, ratio: 0 })).toBeNull();
  });

  it("says nothing when coverage is unknown", () => {
    expect(coverageNote(null)).toBeNull();
    expect(coverageNote(undefined)).toBeNull();
  });

  it("states the percentage and that the number is a floor", () => {
    const note = coverageNote({ orders: 100, fetched: 40, ratio: 0.4 });
    expect(note).toContain("40%");
    expect(note).toContain("floor");
  });
});
