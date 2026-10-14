/** SPEC-280 — Published › Unpublished: reason words, the live span, the order,
 * and the adapter carrying backend SPEC-279's two fields. */
import { describe, expect, it } from "vitest";

import { adaptPublishedPost } from "@/lib/adapters";
import { liveSpanLabel, PUBLISHED_VIEWS, sortUnpublished, unpublishedReasonLabel } from "@/lib/unpublished";
import type { PublishedPost } from "@/types/spotlight";

function post(id: number, publishedAt: string | null, unpublishedAt: string | null, reason: string | null = "owner"): PublishedPost {
  return {
    id, title: `Post ${id}`, handle: `post-${id}`, status: "unpublished", targetKeyword: "modest skirts",
    liveUrl: null, publishedAt, unpublishedAt, unpublishedReason: reason, live: false, seoScore: null, persona: null, imageUrl: null,
    attributedOrders: 0, attributedRevenue: 0, firstTouchOrders: 0, firstTouchRevenue: 0, lastTouchOrders: 0, lastTouchRevenue: 0,
  };
}

describe("why a post left the live set", () => {
  it("says it in the owner's words and never invents a reason", () => {
    expect(unpublishedReasonLabel("owner")).toBe("You unpublished it");
    expect(unpublishedReasonLabel("hidden_on_shopify")).toBe("Hidden in Shopify admin");
    expect(unpublishedReasonLabel("missing_on_shopify")).toBe("Gone from Shopify");
    expect(unpublishedReasonLabel("unrecorded")).toBe("Before this was recorded");
    expect(unpublishedReasonLabel(null)).toBe("Before this was recorded");
    expect(unpublishedReasonLabel("something-new")).toBe("Before this was recorded");
  });
});

describe("the span a post was live for", () => {
  it("reads from publish to departure with the day count", () => {
    expect(liveSpanLabel({ publishedAt: "2026-08-29T15:23:36Z", unpublishedAt: "2026-09-17T18:42:07Z" })).toBe("Live Aug 29 – Sep 17 · 19 days");
    expect(liveSpanLabel({ publishedAt: "2026-08-29T13:28:32Z", unpublishedAt: "2026-08-29T13:29:15Z" })).toBe("Live Aug 29 · under a day");
    expect(liveSpanLabel({ publishedAt: "2026-09-16T10:00:00Z", unpublishedAt: "2026-09-17T10:00:00Z" })).toBe("Live Sep 16 – Sep 17 · 1 day");
  });
  it("falls back honestly when a date is missing or broken", () => {
    expect(liveSpanLabel({ publishedAt: "2026-08-29T15:23:36Z", unpublishedAt: null })).toBe("Published Aug 29");
    expect(liveSpanLabel({ publishedAt: null, unpublishedAt: "2026-09-17T18:42:07Z" })).toBe("Unpublished Sep 17");
    expect(liveSpanLabel({ publishedAt: null, unpublishedAt: null })).toBe("");
    expect(liveSpanLabel({ publishedAt: "nonsense", unpublishedAt: "2026-09-17T18:42:07Z" })).toBe("");
    expect(liveSpanLabel({ publishedAt: "2026-08-29T15:23:36Z", unpublishedAt: "nonsense" })).toBe("Published Aug 29");
  });
});

describe("the order of the list", () => {
  it("is newest departure first, publish date as the fallback, and never mutates", () => {
    const rows = [
      post(10, "2026-08-29T13:28:32Z", "2026-08-29T13:29:15Z"),
      post(17, "2026-08-29T15:23:36Z", "2026-09-17T18:42:07Z"),
      post(3, "2026-09-01T00:00:00Z", null),
      post(20, "2026-09-12T08:05:28Z", "2026-09-17T18:41:55Z"),
    ];
    const copy = [...rows];
    expect(sortUnpublished(rows).map((p) => p.id)).toEqual([17, 20, 3, 10]);
    expect(rows).toEqual(copy);
  });
  it("has exactly the three views the tab shows", () => {
    // SPEC-305 added "Worth rewriting" — the refresh loop lives beside the posts it
    // is about rather than in a ninth Spotlight tab.
    expect(PUBLISHED_VIEWS.map((v) => v.id)).toEqual(["live", "unpublished", "refresh"]);
  });
});

describe("the adapter", () => {
  it("carries when and why, and nulls them when the backend has nothing", () => {
    const base = { id: 1, title: "t", handle: "h", status: "unpublished", target_keyword: "k", live_url: null, published_at: "2026-08-29T15:23:36Z" };
    expect(adaptPublishedPost({ ...base, unpublished_at: "2026-09-17T18:42:07Z", unpublished_reason: "hidden_on_shopify" })).toMatchObject({ unpublishedAt: "2026-09-17T18:42:07Z", unpublishedReason: "hidden_on_shopify" });
    expect(adaptPublishedPost(base)).toMatchObject({ unpublishedAt: null, unpublishedReason: null, live: true });
  });
});
