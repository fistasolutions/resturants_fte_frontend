import { describe, expect, it } from "vitest";

import {
  bandBarClass,
  bandTextClass,
  coverBarPct,
  donutSlices,
  formatDays,
  formatMoney,
  fulfilmentSummary,
  itemLabel,
  verdictLabel,
  verdictTone,
} from "@/lib/stockout";
import type { StockoutAccuracy, StockoutItem } from "@/types/foresight";

function item(over: Partial<StockoutItem> = {}): StockoutItem {
  return {
    variant_id: 1,
    location_id: 301,
    product_title: "Ribbed Tee",
    variant_title: "M",
    location_name: "Lawrence",
    on_hand: 20,
    units_sold: 60,
    daily_units: 1,
    days_of_cover: 20,
    predicted_out_on: "2026-09-09",
    revenue_at_risk: 1200,
    band: "warning",
    ...over,
  };
}

describe("cover bar", () => {
  it("scales against reorder lead time, not the worst row on the page", () => {
    // A full bar must mean "survives a reorder comfortably". Scaling to the max
    // would make a catalogue where everything is critical look healthy.
    expect(coverBarPct(30, 30)).toBe(100);
    expect(coverBarPct(15, 30)).toBe(50);
    expect(coverBarPct(3, 30)).toBe(10);
  });

  it("caps at 100 so a well-stocked line cannot overflow the track", () => {
    expect(coverBarPct(400, 30)).toBe(100);
  });

  it("never divides by zero", () => {
    expect(coverBarPct(10, 0)).toBe(100);
  });
});

describe("risk bands", () => {
  it("never uses brand red for risk — brand is identity-only", () => {
    for (const band of ["critical", "warning", "healthy"] as const) {
      expect(bandTextClass(band)).not.toContain("brand");
      expect(bandBarClass(band)).not.toContain("brand");
    }
    expect(bandTextClass("critical")).toBe("text-destructive");
  });

  it("drops empty bands so the donut has no zero-width wedge", () => {
    const slices = donutSlices({ critical: 3, warning: 0, healthy: 12 });
    expect(slices.map((s) => s.band)).toEqual(["critical", "healthy"]);
  });

  it("orders worst band first", () => {
    const slices = donutSlices({ critical: 1, warning: 2, healthy: 3 });
    expect(slices[0].band).toBe("critical");
  });
});

describe("formatting", () => {
  it("reads sub-day cover as '<1 day' rather than '0 days'", () => {
    expect(formatDays(0.4)).toBe("<1 day");
    expect(formatDays(1)).toBe("1 day");
    expect(formatDays(20)).toBe("20 days");
    expect(formatDays(null)).toBe("—");
  });

  it("formats money without false precision", () => {
    expect(formatMoney(1200.4)).toBe("$1,200");
  });

  it("drops missing parts from a label instead of printing null", () => {
    expect(itemLabel(item())).toBe("Ribbed Tee · M · Lawrence");
    expect(itemLabel(item({ variant_title: null, location_name: null }))).toBe(
      "Ribbed Tee",
    );
  });
});

describe("fulfilment summary", () => {
  const base: StockoutAccuracy = {
    has_data: false, judged: 0, hits: 0, hit_rate: null,
    mean_abs_error_days: null, acted_upon: 0, unscorable: 0,
    pending: 0, next_horizon: null, predictions: [],
  };

  it("never fabricates a rate before anything is judged", () => {
    const out = fulfilmentSummary(base);
    expect(out.scored).toBe(false);
    expect(out.hitRateLabel).toBe("—");
    expect(out.hitRatePct).toBe(0);
    expect(out.waitingFor).toBe("No predictions on record yet.");
  });

  it("says what it is waiting for while predictions are open", () => {
    const out = fulfilmentSummary({ ...base, pending: 4, next_horizon: "2026-09-09" });
    expect(out.waitingFor).toContain("4 predictions open");
    expect(out.waitingFor).toContain("2026-09-09");
  });

  it("keeps acted-on warnings OUT of the rate but still reports them", () => {
    // 2 of 4 judged = 50%. The 7 acted-on warnings are not in that denominator:
    // counting them as hits would inflate a score for an outcome that never
    // happened; counting them as misses would punish the system for working.
    const out = fulfilmentSummary({
      ...base, judged: 4, hits: 2, hit_rate: 0.5,
      mean_abs_error_days: 3.2, acted_upon: 7,
    });
    expect(out.hitRatePct).toBe(50);
    expect(out.actedUpon).toBe(7);
    expect(out.meanError).toBe("3.2 days");
  });
});

describe("verdict presentation", () => {
  it("labels acted_upon in plain words, not the enum", () => {
    expect(verdictLabel("acted_upon")).toBe("acted on");
    expect(verdictLabel(null)).toBe("—");
  });

  it("does not render a miss as a destructive failure", () => {
    expect(verdictTone("hit")).toBe("text-success");
    expect(verdictTone("acted_upon")).toBe("text-primary");
    expect(verdictTone("miss")).not.toContain("destructive");
  });
});
