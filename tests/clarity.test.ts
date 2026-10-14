/**
 * SPEC-214 — Clarity display logic and adapters.
 *
 * The rule these tests exist to protect: **unmeasured is not zero.** A post nobody has
 * measured and a post nobody read look identical if both render as 0, and they call for
 * opposite reactions — connect the tag, versus rewrite the article.
 */
import { describe, expect, it } from "vitest";

import {
  adaptClarityBlogEngagement,
  adaptClarityCampaigns,
  adaptClarityFriction,
  adaptClarityStatus,
} from "@/lib/adapters";
import { campaignSources, emptyStateMessage, frictionBand, mergedFrom, readThrough, sourceVerdict } from "@/lib/clarity";

describe("readThrough", () => {
  it("turns scroll depth into the word readers stop at", () => {
    const result = readThrough({
      measured: true, wordCount: 2572, avgScrollDepth: 0.18, stopsAroundWord: 463,
    });
    expect(result.summary).toBe("Readers stop around word 463 of 2,572 (18%).");
    expect(result.depth).toBe(0.18);
  });

  it("says NOT MEASURED rather than implying nobody read it", () => {
    const result = readThrough({
      measured: false, wordCount: 2572, avgScrollDepth: null, stopsAroundWord: null,
    });
    expect(result.measured).toBe(false);
    expect(result.summary).toContain("Not measured");
    expect(result.summary).not.toContain("0");
  });

  it("falls back to a plain percentage when word count is unknown", () => {
    const result = readThrough({
      measured: true, wordCount: 0, avgScrollDepth: 0.5, stopsAroundWord: null,
    });
    expect(result.summary).toBe("50% average scroll depth.");
  });
});

describe("frictionBand", () => {
  it("bands on a RATE, not a raw count", () => {
    // A busy page with the same rate as a quiet one is not worse. Raw counts are the
    // ordering Clarity already gives, and the reason it is not actionable.
    expect(frictionBand(50, 500)).toBe(frictionBand(5, 50));
  });

  it("hits its boundaries exactly", () => {
    expect(frictionBand(10, 100)).toBe("severe");
    expect(frictionBand(9, 100)).toBe("notable");
    expect(frictionBand(3, 100)).toBe("notable");
    expect(frictionBand(2, 100)).toBe("minor");
  });

  it("never divides by zero sessions", () => {
    expect(frictionBand(99, 0)).toBe("minor");
  });
});

describe("sourceVerdict", () => {
  it("separates a broken page from a wrong audience", () => {
    const brokenPage = sourceVerdict({
      sessions: 2410, avgScrollDepth: 0.74, attributedOrders: 0, rageClicks: 140,
    });
    const wrongAudience = sourceVerdict({
      sessions: 5120, avgScrollDepth: 0.21, attributedOrders: 0, rageClicks: 0,
    });
    expect(brokenPage).toContain("landing page");
    expect(wrongAudience).toContain("audience");
    // The whole point: a spend dashboard sees "0 orders" for both and pauses both.
    expect(brokenPage).not.toBe(wrongAudience);
  });

  it("handles a source with no sessions", () => {
    expect(
      sourceVerdict({ sessions: 0, avgScrollDepth: 0, attributedOrders: 0, rageClicks: 0 }),
    ).toBe("No sessions recorded.");
  });
});

describe("emptyStateMessage", () => {
  it("distinguishes not-configured from configured-but-no-data-yet", () => {
    expect(emptyStateMessage(false, false)).toContain("Integrations");
    expect(emptyStateMessage(false, true)).toContain("tomorrow");
    expect(emptyStateMessage(true, true)).toContain("window");
  });
});

describe("adapters", () => {
  it("keeps an unmeasured post's fields NULL, never 0", () => {
    const data = adaptClarityBlogEngagement({
      connected: true,
      posts: [{ draft_id: 1, title: "T", measured: false, word_count: 2000 }],
    });
    const post = data.posts[0];
    expect(post.measured).toBe(false);
    expect(post.sessions).toBeNull();
    expect(post.avgScrollDepth).toBeNull();
    expect(post.stopsAroundWord).toBeNull();
  });

  it("maps a measured post fully", () => {
    const data = adaptClarityBlogEngagement({
      connected: true, captured_on: "2026-09-01", window_days: 30,
      posts: [{
        draft_id: 18, title: "Layering", handle: "layering", word_count: 2572,
        measured: true, sessions: 312, avg_scroll_depth: 0.18,
        avg_active_seconds: 41, rage_clicks: 27, stops_around_word: 463,
      }],
    });
    expect(data.posts[0].stopsAroundWord).toBe(463);
    expect(data.capturedOn).toBe("2026-09-01");
  });

  it("defaults friction counts to 0 and marginKnown to FALSE", () => {
    // Unknown margin must never render as known margin.
    const page = adaptClarityFriction({ pages: [{ handle: "h", title: "T" }] }).pages[0];
    expect(page.rageClicks).toBe(0);
    expect(page.revenue90d).toBe(0);
    expect(page.marginKnown).toBe(false);
  });

  it("survives null payloads everywhere", () => {
    expect(adaptClarityStatus(null).configured).toBe(false);
    expect(adaptClarityBlogEngagement(null).posts).toEqual([]);
    expect(adaptClarityFriction(null).pages).toEqual([]);
    expect(adaptClarityCampaigns(null).sources).toEqual([]);
  });

  it("maps campaign sources with their attributed orders", () => {
    const source = adaptClarityCampaigns({
      sources: [{ source: "google", sessions: 2410, avg_scroll_depth: 0.74,
                  attributed_orders: 38, attributed_revenue: 2590 }],
    }).sources[0];
    expect(source.sessions).toBe(2410);
    expect(source.attributedOrders).toBe(38);
    expect(source.attributedRevenue).toBe(2590);
    expect(source.label).toBe("google"); // an older payload without a label keeps its key
    expect(source.rawSources).toEqual([]);
  });

  it("shows a channel's merged names and leaves out the store's own site", () => {
    const { sources } = adaptClarityCampaigns({
      sources: [
        { source: "meta", label: "Meta (Facebook & Instagram)", raw_sources: ["facebook", "ig", "l.instagram.com"],
          sessions: 500, internal: false },
        { source: "google", label: "Google", raw_sources: ["google"], sessions: 300, internal: false },
        { source: "parentsforum.org", label: "parentsforum.org", raw_sources: ["www.parentsforum.org"], sessions: 9 },
        { source: "own-site", label: "Your own website", raw_sources: ["examplestore.com"], sessions: 900,
          internal: true },
      ],
    });
    expect(mergedFrom(sources[0])).toBe("Includes facebook, ig, l.instagram.com");
    expect(mergedFrom(sources[1])).toBeNull();
    expect(mergedFrom(sources[2])).toBeNull();
    expect(campaignSources(sources).map((s) => s.source)).toEqual(["meta", "google", "parentsforum.org"]);
  });
});
