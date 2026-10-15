import { describe, expect, it } from "vitest";

import {
  attributionBody,
  attributionQuery,
  parseStoredAttribution,
  readAttribution,
  serializeAttribution,
} from "@/lib/attribution";
import { liftSentence, liftTone } from "@/lib/branch-lift";
import { orderBody } from "@/lib/restaurant-os";
import type { BranchLift } from "@/types/ads";

const lift = (change: number | null): BranchLift => ({
  branchId: 1,
  days: 7,
  before: { from: "2026-10-01", to: "2026-10-07", netSales: 100, orders: 5 },
  during: { from: "2026-10-08", to: "2026-10-14", netSales: 112, orders: 6 },
  change,
});

describe("ad attribution", () => {
  it("reads, normalises and cuts the utm tokens", () => {
    expect(readAttribution("?utm_source=Meta&utm_medium=paid&utm_campaign=ADS-12")).toEqual({
      utmSource: "meta",
      utmMedium: "paid",
      utmCampaign: "ads-12",
    });
    expect(readAttribution("?q=pizza")).toBeNull();
    expect(readAttribution(`?utm_campaign=${"x".repeat(200)}`)?.utmCampaign).toHaveLength(120);
  });

  it("carries tokens onward and survives storage", () => {
    expect(attributionQuery({ utm_campaign: "ads-3", utm_source: ["meta", "x"], other: "1" })).toBe(
      "?utm_source=meta&utm_campaign=ads-3",
    );
    expect(attributionQuery({})).toBe("");
    const found = readAttribution("?utm_campaign=ads-3")!;
    expect(parseStoredAttribution(serializeAttribution(found))).toEqual(found);
    expect(parseStoredAttribution("not json")).toBeNull();
    expect(parseStoredAttribution(null)).toBeNull();
  });

  it("goes into the order body, or null", () => {
    expect(attributionBody(null)).toBeNull();
    const body = orderBody({
      branchId: 1,
      channel: "carryout",
      lines: [],
      attribution: { utmSource: "meta", utmMedium: null, utmCampaign: "ads-3" },
    });
    expect(body.attribution).toEqual({ utm_source: "meta", utm_medium: null, utm_campaign: "ads-3" });
    expect(orderBody({ branchId: 1, channel: "carryout", lines: [] }).attribution).toBeNull();
  });

  it("words a branch's lift", () => {
    expect(liftSentence(lift(0.12))).toBe("+12% on the 7 days before");
    expect(liftTone(lift(0.12))).toBe("up");
    expect(liftSentence(lift(-0.2))).toBe("-20% on the 7 days before");
    expect(liftTone(lift(-0.2))).toBe("down");
    expect(liftSentence(lift(null))).toBe("No sales in the 7 days before to compare with");
    expect(liftTone(lift(0.001))).toBe("flat");
  });
});
