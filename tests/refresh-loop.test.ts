/** SPEC-305 — Spotlight › Published › Worth rewriting: the adapters and the wording. */

import { describe, expect, it } from "vitest";

import {
  adaptRefresh,
  bandLabel,
  missedLine,
  refreshSummary,
  windowLabel,
  type RefreshData,
} from "@/lib/refresh-loop";

const API = {
  window_end: "2026-09-22",
  published: 12,
  scanned: 12,
  potential_clicks: 181.4,
  posts: [
    {
      draft_id: 41,
      title: "How to style a modest denim skirt",
      url: "https://examplestore.example/blogs/news/modest-denim-skirt",
      target_keyword: "modest denim skirt",
      potential_clicks: 118.2,
      missed_count: 5,
      top_missed: [
        {
          query: "denim skirt with boots",
          position: 14,
          impressions: 3000,
          clicks: 1,
          potential_clicks: 96.0,
        },
        {
          query: "midi denim skirt petite",
          position: 9.4,
          impressions: 900,
          clicks: 0,
          potential_clicks: 22.2,
        },
      ],
    },
  ],
};

describe("adaptRefresh", () => {
  it("maps the payload and never lets a missing number through as NaN", () => {
    const data = adaptRefresh(API);
    expect(data.windowEnd).toBe("2026-09-22");
    expect(data.posts[0].draftId).toBe(41);
    expect(data.posts[0].topMissed[0].potentialClicks).toBe(96);

    const empty = adaptRefresh({});
    expect(empty).toEqual({
      windowEnd: null,
      published: 0,
      scanned: 0,
      potentialClicks: 0,
      posts: [],
    });
    const partial = adaptRefresh({ posts: [{ draft_id: 7 }] });
    expect(partial.posts[0]).toEqual({
      draftId: 7,
      title: "",
      url: null,
      targetKeyword: "",
      potentialClicks: 0,
      missedCount: 0,
      topMissed: [],
    });
  });
});

describe("the wording", () => {
  it("summarises the list without promising the clicks", () => {
    expect(refreshSummary(adaptRefresh(API))).toBe(
      "1 of 12 published posts are ranking for searches they were never written for — about 181 more clicks a month between them.",
    );
  });

  it("says nothing when there is nothing to say", () => {
    expect(refreshSummary(adaptRefresh({ published: 12 }))).toBe("");
  });

  it("reads a missed search out loud", () => {
    const missed = adaptRefresh(API).posts[0].topMissed[0];
    expect(missedLine(missed)).toBe(
      "position 14.0 · 3,000 impressions · about 96 more clicks a month",
    );
  });

  it("names where in the results the post actually sits", () => {
    expect(bandLabel(8)).toBe("bottom of page one");
    expect(bandLabel(10)).toBe("bottom of page one");
    expect(bandLabel(10.4)).toBe("page two");
    expect(bandLabel(19)).toBe("page two");
  });

  it("says when the rows were read, or that they never were", () => {
    expect(windowLabel(adaptRefresh(API))).toBe("Last 28 days, read Sep 22");
    const never: RefreshData = adaptRefresh({});
    expect(windowLabel(never)).toBe("Not scanned yet — the scan runs Monday.");
  });
});
