import { describe, expect, it } from "vitest";

import {
  adaptGoogleStatus,
  adaptVisibility,
  type ApiGoogleStatus,
  type ApiVisibility,
} from "@/lib/adapters";

describe("adaptGoogleStatus", () => {
  it("maps the backend status payload to the view model", () => {
    const raw: ApiGoogleStatus = {
      connected: true,
      configured: true,
      email: "owner@example.com",
      property_url: "sc-domain:example.com",
      last_pull: "2026-08-11",
    };
    expect(adaptGoogleStatus(raw)).toEqual({
      connected: true,
      configured: true,
      email: "owner@example.com",
      propertyUrl: "sc-domain:example.com",
      lastPull: "2026-08-11",
      needsProperty: false,
      sync: null,
    });
  });

  it("maps the property-choice and sync-run fields (SPEC-250 / backend SPEC-257)", () => {
    const raw: ApiGoogleStatus = {
      connected: true,
      configured: true,
      email: "owner@example.com",
      property_url: null,
      last_pull: null,
      needs_property: true,
      sync: {
        state: "running",
        started_at: "2026-09-16T07:00:00+00:00",
        finished_at: null,
        records: 0,
        done: 2,
        total: 4,
        error: null,
      },
    };
    expect(adaptGoogleStatus(raw)).toMatchObject({
      needsProperty: true,
      sync: { state: "running", done: 2, total: 4, records: 0, finishedAt: null },
    });
    // A pre-257 payload without the field derives it from the property.
    expect(adaptGoogleStatus({ ...raw, needs_property: undefined, sync: undefined })).toMatchObject({
      needsProperty: true,
      sync: null,
    });
  });

  it("passes through the unconnected / unconfigured empty state", () => {
    const raw: ApiGoogleStatus = {
      connected: false,
      configured: false,
      email: null,
      property_url: null,
      last_pull: null,
    };
    expect(adaptGoogleStatus(raw)).toEqual({
      connected: false,
      configured: false,
      email: null,
      propertyUrl: null,
      lastPull: null,
      needsProperty: false,
      sync: null,
    });
  });
});

describe("adaptVisibility", () => {
  const base: ApiVisibility = {
    connected: true,
    email: "owner@example.com",
    property_url: "sc-domain:example.com",
    window_days: 28,
    last_pull: "2026-08-11",
    posts: [
      {
        draft_id: 1,
        title: "Post A",
        live_url: "https://shop.example.com/a",
        impressions: 1000,
        clicks: 100,
        ctr: 0.1,
        position: 5,
        estimated: false,
        top_queries: [
          { query: "dress", impressions: 600, clicks: 60, ctr: 0.1, position: 4 },
          { query: "gown", impressions: 400, clicks: 40, ctr: 0.1, position: 8 },
        ],
      },
      {
        draft_id: 2,
        title: "Post B",
        live_url: "https://shop.example.com/b",
        impressions: 3000,
        clicks: 150,
        ctr: 0.05,
        position: 10,
        estimated: false,
        top_queries: [
          { query: "dress", impressions: 1000, clicks: 50, ctr: 0.05, position: 6 },
        ],
      },
      {
        draft_id: 3,
        title: "Post C (no data yet)",
        live_url: null,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        position: 0,
        estimated: true,
      },
    ],
  };

  it("maps top-level fields and posts (snake → camel)", () => {
    const result = adaptVisibility(base);
    expect(result.connected).toBe(true);
    expect(result.propertyUrl).toBe("sc-domain:example.com");
    expect(result.windowDays).toBe(28);
    expect(result.lastPull).toBe("2026-08-11");
    expect(result.posts).toHaveLength(3);
    expect(result.posts[0]).toMatchObject({
      draftId: 1,
      title: "Post A",
      liveUrl: "https://shop.example.com/a",
      estimated: false,
    });
    // A missing top_queries becomes an empty array, never undefined.
    expect(result.posts[2].topQueries).toEqual([]);
  });

  it("rolls up totals with an impression-weighted average position", () => {
    const { totals } = adaptVisibility(base);
    expect(totals.impressions).toBe(4000);
    expect(totals.clicks).toBe(250);
    expect(totals.measured).toBe(2); // only non-estimated posts
    // (5*1000 + 10*3000) / 4000 = 8.75
    expect(totals.avgPosition).toBeCloseTo(8.75, 5);
  });

  it("aggregates top queries across posts, best position, sorted by impressions", () => {
    const { topQueries } = adaptVisibility(base);
    expect(topQueries).toEqual([
      {
        query: "dress",
        impressions: 1600,
        clicks: 110,
        ctr: 110 / 1600,
        position: 4, // min(4, 6)
      },
      { query: "gown", impressions: 400, clicks: 40, ctr: 0.1, position: 8 },
    ]);
  });

  it("returns a null avg position and zero indexed when nothing is measured", () => {
    const result = adaptVisibility({
      ...base,
      posts: [base.posts[2]], // the estimated-only post
    });
    expect(result.totals.measured).toBe(0);
    expect(result.totals.avgPosition).toBeNull();
    expect(result.totals.impressions).toBe(0);
    expect(result.topQueries).toEqual([]);
  });

  it("falls back to a simple mean when indexed posts have no impressions", () => {
    const result = adaptVisibility({
      ...base,
      posts: [
        {
          draft_id: 9,
          title: "Zero-impression indexed",
          live_url: null,
          impressions: 0,
          clicks: 0,
          ctr: 0,
          position: 12,
          estimated: false,
        },
      ],
    });
    expect(result.totals.measured).toBe(1);
    expect(result.totals.avgPosition).toBe(12);
  });
});

describe("adaptVisibility — index status (SPEC-261)", () => {
  it("maps Google's verdict per post and the backend summary, tolerating a pre-261 payload", () => {
    const raw: ApiVisibility = {
      connected: true,
      email: "owner@example.com",
      property_url: "https://examplestore.com/",
      window_days: 28,
      last_pull: "2026-09-16",
      index_summary: { indexed: 1, not_indexed: 1, uninspected: 0 },
      posts: [
        {
          draft_id: 1,
          title: "Indexed",
          live_url: "https://examplestore.com/blogs/news/a",
          impressions: 0,
          clicks: 0,
          ctr: 0,
          position: 0,
          estimated: false,
          index: {
            state: "indexed",
            coverage_state: "Submitted and indexed",
            verdict: "PASS",
            last_crawl_time: "2026-09-16T04:03:27+00:00",
            google_canonical: "https://examplestore.com/blogs/news/a",
            referring_urls: ["https://examplestore.com/"],
            inspected_at: "2026-09-17T09:00:00+00:00",
          },
        },
        {
          draft_id: 2,
          title: "Unknown",
          live_url: "https://examplestore.com/blogs/news/b",
          impressions: 0,
          clicks: 0,
          ctr: 0,
          position: 0,
          estimated: false,
          index: {
            state: "unknown",
            coverage_state: "URL is unknown to Google",
            verdict: "NEUTRAL",
            last_crawl_time: null,
            google_canonical: null,
            inspected_at: "2026-09-17T09:00:00+00:00",
          },
        },
      ],
    };
    const result = adaptVisibility(raw);
    expect(result.indexSummary).toEqual({ indexed: 1, notIndexed: 1, uninspected: 0 });
    expect(result.posts[0].index).toMatchObject({
      state: "indexed",
      coverageState: "Submitted and indexed",
      lastCrawlTime: "2026-09-16T04:03:27+00:00",
      referringUrls: ["https://examplestore.com/"],
    });
    expect(result.posts[1].index).toMatchObject({ state: "unknown", referringUrls: [] });
    expect(result.totals.measured).toBe(2); // rows exist — not the same thing as indexed

    const legacy = adaptVisibility({ ...raw, index_summary: undefined, posts: raw.posts.map((p) => ({ ...p, index: undefined })) });
    expect(legacy.posts.every((p) => p.index === null)).toBe(true);
    expect(legacy.indexSummary).toEqual({ indexed: 0, notIndexed: 0, uninspected: 2 });
  });
});
