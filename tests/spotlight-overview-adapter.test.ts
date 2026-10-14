import { describe, expect, it } from "vitest";

import { adaptOverview, type ApiOverview } from "@/lib/adapters";

// Pure, node-safe: the adapter never imports the server-only service
// (mirrors tests/spotlight-adapter.test.ts). Covers the SPEC-120 mapping:
// snake_case → view model, pipeline status/kpi/activity/next-action shaping,
// and the "impressions only when GSC connected" rule.

const CONNECTED: ApiOverview = {
  pipeline: [
    { key: "foundation", label: "Foundation", status: "done", detail: "Brand Brain locked with 5 personas", progress: 100 },
    { key: "intelligence", label: "Intelligence", status: "done", detail: "12 search queries mapped", progress: 100 },
    { key: "content", label: "Content", status: "active", detail: "4 drafts written · 2 in review", progress: 50 },
    { key: "approvals", label: "Approvals", status: "active", detail: "3 awaiting your review", progress: 50 },
    { key: "distribution", label: "Distribution", status: "queued", detail: "No posts published yet", progress: 0 },
  ],
  kpis: {
    brand_dna_ready: true,
    drafts_in_review: 2,
    published_total: 5,
    published_this_month: 3,
    impressions_28d: 41200,
    gsc_connected: true,
    revenue_from_blogs: 1240.5,
    attributed_orders: 8,
  },
  activity: [
    { kind: "publish", text: 'Published "Modest Dresses Guide"', detail: "Live on your storefront", when: "2026-08-11T08:20:00Z" },
    { kind: "unknown-kind", text: 'Drafted "Fit guide"', detail: "820 words · SEO 74", when: "2026-08-10T07:05:00Z" },
  ],
  next_actions: [
    { text: "2 drafts ready — review & publish", cta_tab: "approvals" },
    { text: "Nudge with an unmapped tab", cta_tab: "somewhere-else" },
  ],
};

describe("adaptOverview", () => {
  it("maps pipeline stages, statuses, and progress to the view model", () => {
    const { pipeline } = adaptOverview(CONNECTED);
    expect(pipeline.map((s) => s.id)).toEqual([
      "foundation", "intelligence", "content", "approvals", "distribution",
    ]);
    expect(pipeline[0]).toEqual({
      id: "foundation",
      name: "Foundation",
      description: "Brand Brain locked with 5 personas",
      progress: 100,
      status: "complete",
    });
    // done→complete, active→in_progress, queued→not_started.
    expect(pipeline.map((s) => s.status)).toEqual([
      "complete", "complete", "in_progress", "in_progress", "not_started",
    ]);
  });

  it("shows a real reach number and formats counts when GSC is connected", () => {
    const kpis = adaptOverview(CONNECTED).kpis;
    const byId = Object.fromEntries(kpis.map((k) => [k.id, k]));
    expect(byId["brand-dna"].value).toBe("Ready");
    expect(byId["drafts-in-review"].value).toBe("2");
    expect(byId["published"].value).toBe("5");
    expect(byId["published"].hint).toBe("3 this month");
    expect(byId["reach"].value).toBe("41,200");
    expect(byId["reach"].hint).toBe("Impressions, trailing 28 days");
    // No fabricated deltas — the rollup has no baseline.
    expect(kpis.every((k) => k.delta === undefined)).toBe(true);
  });

  it("hides the reach number with a neutral dash when GSC is not connected", () => {
    const raw: ApiOverview = {
      ...CONNECTED,
      kpis: { ...CONNECTED.kpis, gsc_connected: false, impressions_28d: 0, brand_dna_ready: false },
    };
    const byId = Object.fromEntries(adaptOverview(raw).kpis.map((k) => [k.id, k]));
    expect(byId["reach"].value).toBe("—");
    expect(byId["reach"].hint).toBe("Connect Search Console to measure");
    expect(byId["brand-dna"].value).toBe("Pending");
  });

  it("normalizes activity kinds and deep-links next-actions to their tab", () => {
    const { activity, nextActions } = adaptOverview(CONNECTED);
    expect(activity[0].kind).toBe("publish");
    expect(activity[0].title).toBe('Published "Modest Dresses Guide"');
    expect(activity[0].timestamp).toBe("2026-08-11T08:20:00Z");
    // Unknown kind falls back to "draft" rather than breaking the icon map.
    expect(activity[1].kind).toBe("draft");
    // Ids are stable/unique per item.
    expect(new Set(activity.map((a) => a.id)).size).toBe(activity.length);

    expect(nextActions[0].href).toBe("/spotlight?tab=approvals");
    expect(nextActions[0].cta).toBe("Review approvals");
    expect(nextActions[0].title).toBe("2 drafts ready — review & publish");
    // An unmapped tab still deep-links and renders a sane default CTA.
    expect(nextActions[1].href).toBe("/spotlight?tab=somewhere-else");
    expect(nextActions[1].cta).toBe("Open");
  });

  it("handles the empty rollup without inventing content", () => {
    const raw: ApiOverview = {
      pipeline: CONNECTED.pipeline,
      kpis: {
        brand_dna_ready: false,
        drafts_in_review: 0,
        published_total: 0,
        published_this_month: 0,
        impressions_28d: 0,
        gsc_connected: false,
        revenue_from_blogs: 0,
        attributed_orders: 0,
      },
      activity: [],
      next_actions: [],
    };
    const data = adaptOverview(raw);
    expect(data.activity).toEqual([]);
    expect(data.nextActions).toEqual([]);
    // SPEC-126: an honest zero-state revenue tile — $0.00, never fabricated.
    const byId = Object.fromEntries(data.kpis.map((k) => [k.id, k]));
    expect(byId["revenue-from-blogs"].value).toBe("$0.00");
    expect(byId["revenue-from-blogs"].hint).toBe("No attributed sales yet");
  });

  it("formats the SPEC-126 revenue-from-blogs KPI with its order count", () => {
    const byId = Object.fromEntries(adaptOverview(CONNECTED).kpis.map((k) => [k.id, k]));
    expect(byId["revenue-from-blogs"].label).toBe("Revenue from blogs");
    expect(byId["revenue-from-blogs"].value).toBe("$1,240.50");
    expect(byId["revenue-from-blogs"].hint).toBe("8 orders · trailing 90 days");
  });
});
