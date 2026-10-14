/** SPEC-181 — the journey fields survive the API → view-model hop, and a payload
 * without them yields 0 rather than undefined/NaN (never a fabricated number). */
import { describe, expect, it } from "vitest";

import { adaptJourneyCoverage, adaptPublishedPost } from "@/lib/adapters";

const BASE = {
  id: 1,
  title: "How to Layer Dresses for Fall",
  handle: "layer-dresses",
  status: "published",
  target_keyword: "modest dresses",
  live_url: "https://examplestore.com/blogs/news/layer-dresses",
  published_at: "2026-08-29T00:00:00Z",
};

describe("adaptPublishedPost — journey fields", () => {
  it("maps all four journey fields", () => {
    const post = adaptPublishedPost({
      ...BASE,
      attributed_orders: 1,
      attributed_revenue: 10,
      first_touch_orders: 3,
      first_touch_revenue: 250.5,
      last_touch_orders: 2,
      last_touch_revenue: 75,
    });
    expect(post.firstTouchOrders).toBe(3);
    expect(post.firstTouchRevenue).toBe(250.5);
    expect(post.lastTouchOrders).toBe(2);
    expect(post.lastTouchRevenue).toBe(75);
    // The SPEC-126 fields are untouched.
    expect(post.attributedOrders).toBe(1);
    expect(post.attributedRevenue).toBe(10);
  });

  it("defaults a payload without them to 0, not undefined", () => {
    const post = adaptPublishedPost(BASE);
    expect(post.firstTouchOrders).toBe(0);
    expect(post.firstTouchRevenue).toBe(0);
    expect(post.lastTouchOrders).toBe(0);
    expect(post.lastTouchRevenue).toBe(0);
  });
});

describe("adaptJourneyCoverage", () => {
  it("maps snake_case coverage", () => {
    expect(
      adaptJourneyCoverage({
        orders: 100,
        fetched: 40,
        with_journey: 28,
        ratio: 0.4,
      }),
    ).toEqual({ orders: 100, fetched: 40, withJourney: 28, ratio: 0.4 });
  });

  it("reports unknown coverage as unmeasured, never as complete", () => {
    expect(adaptJourneyCoverage(null)).toEqual({
      orders: 0,
      fetched: 0,
      withJourney: 0,
      ratio: 0,
    });
  });
});
