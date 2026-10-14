/**
 * SPEC-333 — Performance Ads' Audit tab: the adapters and the pure helpers.
 * A missing ratio must stay missing (never $0 or 0%), and the tab must pick the right state.
 */
import { describe, expect, it } from "vitest";

import { toAudit, toPerformance, toPlatformsStatus, type ApiPerformance } from "@/lib/ad-platforms-api";
import {
  adsReturnHref,
  connectionStage,
  multiple,
  normalizeWindow,
  percent,
  selectionChanged,
} from "@/lib/ad-platforms";
import { ADS_TAB_IDS, normalizeAdsTab } from "@/lib/ads";

const FIGURES = {
  spend: 450,
  impressions: 60000,
  clicks: 1200,
  purchases: 30,
  revenue: 1200,
  roas: 2.67,
  cpa: 15,
  ctr: 0.02,
  cpc: 0.38,
  cpm: 7.5,
  frequency: 1.25,
  hook_rate: null,
};

describe("the connection state", () => {
  it("moves from unconfigured to connected", () => {
    expect(connectionStage(toPlatformsStatus({ configured: false, platforms: [] }))).toBe("unconfigured");
    expect(connectionStage(toPlatformsStatus({ configured: true, platforms: [] }))).toBe("disconnected");
    const linked = {
      configured: true,
      platforms: [
        {
          platform: "meta" as const,
          status: "connected" as const,
          connected_by: "Ada",
          last_synced_at: null,
          last_error: null,
          accounts: [{ id: "act_1", name: "Main", currency: "USD", timezone: "UTC", active: true, selected: false }],
        },
      ],
    };
    expect(connectionStage(toPlatformsStatus(linked))).toBe("choose");
    linked.platforms[0].accounts[0].selected = true;
    const status = toPlatformsStatus(linked);
    expect(connectionStage(status)).toBe("connected");
    expect(status.platforms[0].connectedBy).toBe("Ada");
  });

  it("enables Save only when the ticks differ from what is saved", () => {
    const accounts = [
      { id: "a", name: "A", currency: "USD", timezone: "UTC", active: true, selected: true },
      { id: "b", name: "B", currency: "USD", timezone: "UTC", active: true, selected: false },
    ];
    expect(selectionChanged(accounts, new Set(["a"]))).toBe(false);
    expect(selectionChanged(accounts, new Set(["a", "b"]))).toBe(true);
  });
});

describe("the figures", () => {
  const raw: ApiPerformance = {
    days: 30,
    since: "2026-09-02",
    until: "2026-10-01",
    currency: "USD",
    accounts: [{ id: "act_1", name: "Main" }],
    totals: FIGURES,
    mer: { value: null, sales: null, reason: "Ad spend is in EUR, sales in USD." },
    campaigns: [{ ...FIGURES, id: "c1", name: "Prospecting", status: "ACTIVE", objective: "OUTCOME_SALES" }],
    ads: [
      {
        ...FIGURES,
        id: "a1",
        name: "Hero",
        campaign: "c1",
        status: "ACTIVE",
        title: "New season",
        body: null,
        thumbnail: null,
        is_video: true,
      },
    ],
  };

  it("keeps a missing ratio missing and explains a missing MER", () => {
    const data = toPerformance(raw);
    expect(data.totals.hookRate).toBeNull();
    expect(data.mer.value).toBeNull();
    expect(data.mer.reason).toBe("Ad spend is in EUR, sales in USD.");
    expect(data.ads[0].isVideo).toBe(true);
    expect(percent(data.totals.hookRate)).toBe("—");
    expect(multiple(data.mer.value)).toBe("—");
    expect(percent(data.totals.ctr, 2)).toBe("2.00%");
    expect(multiple(data.totals.roas)).toBe("2.67×");
  });

  it("adapts the findings and the spend at risk", () => {
    const audit = toAudit({
      days: 30,
      spend: 450,
      at_risk: 150,
      findings: [
        {
          rule: "spend_no_purchases",
          severity: "high",
          level: "ad",
          name: "Static",
          campaign_name: "Prospecting",
          title: "Spending with no purchases",
          evidence: "Spent $150.00 with no purchase.",
          wasted: 150,
          action: "Pause this ad.",
        },
      ],
    });
    expect(audit.atRisk).toBe(150);
    expect(audit.findings[0]).toMatchObject({ name: "Static", campaignName: "Prospecting", wasted: 150 });
  });
});

describe("where Meta's callback returns an Ads sign-in", () => {
  it("goes back to the screen that started it", () => {
    expect(adsReturnHref("audit", "connected")).toBe("/ads?tab=audit&meta=connected");
    expect(adsReturnHref("1", "cancelled")).toBe("/ads?tab=audit&meta=cancelled");
    // Meta's one card reads the Ads result as `ads=` — its `meta=` is the posting sign-in's.
    expect(adsReturnHref("integrations", "error")).toBe("/integrations/meta?tab=settings&ads=error");
    expect(adsReturnHref(null, "connected")).toBeNull();
    expect(adsReturnHref("social", "connected")).toBeNull();
  });
});

describe("the tab and its window", () => {
  it("is a real Paid Ads Manager tab, after Overview", () => {
    expect(ADS_TAB_IDS.slice(0, 2)).toEqual(["overview", "audit"]);
    expect(normalizeAdsTab("audit")).toBe("audit");
    expect(normalizeAdsTab("nonsense")).toBe("overview");
  });

  it("only reads the windows the backend offers", () => {
    expect(normalizeWindow("7")).toBe(7);
    expect(normalizeWindow("90")).toBe(90);
    expect(normalizeWindow("45")).toBe(30);
    expect(normalizeWindow(null)).toBe(30);
  });
});
