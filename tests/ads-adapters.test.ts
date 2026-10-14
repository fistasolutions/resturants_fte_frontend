/**
 * SPEC-182 — Performance Ads adapters.
 *
 * This is a page about money. The rule these tests pin: a field the API omits renders
 * as an honest 0 or [], never `undefined` or `NaN` — and `utilization` above 1.0 is
 * passed through unclamped, because overspend is the one number an operator most needs
 * to see and the backend reports it honestly.
 */
import { describe, expect, it } from "vitest";

import {
  adaptAdsAccountability,
  adaptAdsBudget,
  adaptAdsCampaigns,
  adaptAdsCreative,
  adaptAdsOverview,
  adaptAdsSpendGates,
} from "@/lib/adapters";

describe("adaptAdsBudget", () => {
  it("maps a full payload", () => {
    expect(
      adaptAdsBudget({
        periodLabel: "This month",
        totalCap: 5000,
        spent: 250,
        remaining: 4750,
        utilization: 0.05,
        liveCampaigns: 1,
        pendingApprovals: 2,
      }),
    ).toEqual({
      periodLabel: "This month",
      totalCap: 5000,
      spent: 250,
      remaining: 4750,
      utilization: 0.05,
      liveCampaigns: 1,
      pendingApprovals: 2,
      // SPEC-183 — additive: the real stop state and whether a ceiling exists.
      killSwitchActive: false,
      monthlyCapSet: false,
    });
  });

  it("turns an empty payload into zeros, never NaN", () => {
    const budget = adaptAdsBudget({});
    expect(budget.totalCap).toBe(0);
    expect(budget.spent).toBe(0);
    expect(budget.utilization).toBe(0);
    expect(Number.isNaN(budget.remaining)).toBe(false);
  });

  it("survives a null payload", () => {
    expect(adaptAdsBudget(null).liveCampaigns).toBe(0);
  });

  it("defaults the kill switch to FALSE when unknown", () => {
    // An unknown stop state must never render as "stopped" — that would lull the
    // operator into believing spending is halted when it is not.
    expect(adaptAdsBudget({}).killSwitchActive).toBe(false);
    expect(adaptAdsBudget({ killSwitchActive: true }).killSwitchActive).toBe(true);
    expect(adaptAdsBudget({ monthlyCapSet: true }).monthlyCapSet).toBe(true);
  });

  it("does NOT clamp an overspent utilization", () => {
    // The backend reports > 1.0 deliberately. Hiding it would hide the incident.
    expect(adaptAdsBudget({ utilization: 1.4 }).utilization).toBe(1.4);
  });
});

describe("adaptAdsCampaigns", () => {
  it("maps a campaign's real-margin economics", () => {
    const { campaigns } = adaptAdsCampaigns({
      campaigns: [
        {
          id: "1", name: "Fall dresses", channel: "meta", objective: "conversions",
          persona: "P", offer: "O", status: "live", dailyCap: 100, totalCap: 1000,
          spent: 250, roas: 3, cac: 20, profit: 60, revenue: 100,
        },
      ],
      recommended: { name: "X", channel: "meta", objective: "o", reason: "scale_winner",
                     reasonDetail: "d", projectedSpend: "$125 / day", href: "/ads" },
    });
    expect(campaigns[0].roas).toBe(3);
    expect(campaigns[0].profit).toBe(60);
    expect(campaigns[0].status).toBe("live");
  });

  it("returns an empty list rather than undefined when there are no campaigns", () => {
    const data = adaptAdsCampaigns({});
    expect(data.campaigns).toEqual([]);
    expect(data.recommended.name).toBe("—");
  });

  it("defaults a campaign missing its numbers to zeros", () => {
    const { campaigns } = adaptAdsCampaigns({ campaigns: [{ id: "1", name: "C" }] });
    expect(campaigns[0].spent).toBe(0);
    expect(campaigns[0].roas).toBe(0);
    expect(campaigns[0].status).toBe("draft");
  });
});

describe("adaptAdsSpendGates", () => {
  it("keeps the backend's pre-formatted display strings", () => {
    const { gates } = adaptAdsSpendGates({
      gates: [
        {
          id: "1", action: "raise_budget", title: "Raise to $125/day", channel: "meta",
          rationale: "It returns 2.4x on real margin.", projectedSpend: "$125 / day",
          capContext: "$4,750 left of the $5,000 monthly cap",
          expectedProfit: "$300", expectedRoas: 2.4,
        },
      ],
    });
    expect(gates[0].projectedSpend).toBe("$125 / day");
    expect(gates[0].capContext).toContain("monthly cap");
    expect(gates[0].expectedRoas).toBe(2.4);
  });

  it("is empty when nothing awaits a decision", () => {
    expect(adaptAdsSpendGates({}).gates).toEqual([]);
  });
});

describe("adaptAdsAccountability", () => {
  it("maps the ledger, cap utilization and guardrails", () => {
    const data = adaptAdsAccountability({
      connected: false,
      ledger: [{ id: "1", date: "2026-08-31", campaign: "C", channel: "meta",
                 amount: 100, attributedProfit: 0 }],
      capUtilization: [{ id: "1", campaign: "C", channel: "meta", spent: 250,
                         cap: 1000, utilization: 0.25 }],
      guardrails: [{ id: "1", kind: "cap_hit", title: "Hit its daily cap",
                     detail: "The daily cap of 100 is reached.", timestamp: "t" }],
    });
    expect(data.ledger[0].amount).toBe(100);
    expect(data.capUtilization[0].utilization).toBe(0.25);
    expect(data.guardrails[0].kind).toBe("cap_hit");
  });

  it("defaults `connected` to FALSE when the field is missing", () => {
    // An unknown connection state must show the setup nudge, never imply a live
    // ad-platform integration that does not exist.
    expect(adaptAdsAccountability({}).connected).toBe(false);
    expect(adaptAdsAccountability({ connected: "yes" as unknown }).connected).toBe(false);
  });
});

describe("adaptAdsOverview / adaptAdsCreative", () => {
  it("maps KPIs and the trend", () => {
    const data = adaptAdsOverview({
      kpis: [{ id: "roas", label: "True ROAS", value: "3.00x", hint: "on real margin" }],
      blendedTrend: [{ label: "31 Aug", spend: 100, profit: 0 }],
      nextCampaign: { name: "N", channel: "google", objective: "o",
                      reason: "scale_winner", reasonDetail: "d",
                      projectedSpend: "$10 / day", href: "/ads" },
      activity: [{ id: "1", kind: "approval", title: "T", detail: "D", timestamp: "t" }],
    });
    expect(data.kpis[0].value).toBe("3.00x");
    expect(data.blendedTrend[0].spend).toBe(100);
    expect(data.nextCampaign.channel).toBe("google");
    expect(data.activity[0].kind).toBe("approval");
  });

  it("handles a wholly empty overview", () => {
    const data = adaptAdsOverview({});
    expect(data.kpis).toEqual([]);
    expect(data.activity).toEqual([]);
  });

  it("returns no creatives rather than inventing them", () => {
    expect(adaptAdsCreative({ creatives: [] }).creatives).toEqual([]);
    expect(adaptAdsCreative(null).creatives).toEqual([]);
  });
});
