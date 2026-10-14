import { describe, expect, it } from "vitest";

import {
  confidenceLabel,
  confidenceTone,
  deadlineMessage,
  deadlineState,
  deadlineTone,
  heroOccasion,
  ledgerHeadline,
  liftPhrase,
  rampSeries,
  splitCategories,
  categoryBarPct,
} from "@/lib/season";
import type { SeasonAccuracy, SeasonOccasion } from "@/types/foresight";

function occ(over: Partial<SeasonOccasion> = {}): SeasonOccasion {
  return {
    name: "Rosh Hashanah",
    date: "2026-09-12",
    days_until: 16,
    observations: 5,
    confidence: "high",
    theme_hint: "",
    status: "ok",
    lift: 1.69,
    lift_range: [1.43, 1.83],
    stores: [],
    categories: [],
    ramp: [
      { weeks_out: 1, lift: 3.39 },
      { weeks_out: 2, lift: 5.39 },
      { weeks_out: 3, lift: 4.67 },
      { weeks_out: 4, lift: null },
    ],
    ramp_start_on: "2026-08-22",
    order_by_on: "2026-07-23",
    order_by_passed: true,
    ...over,
  };
}

describe("order-by deadline", () => {
  const today = new Date("2026-08-27T00:00:00Z");

  it("flags a passed deadline — the most actionable state on the page", () => {
    expect(deadlineState(occ(), today)).toBe("passed");
    expect(deadlineTone("passed")).toBe("text-destructive");
    expect(deadlineMessage(occ(), "passed")).toContain("already under way");
  });

  it("grades the runway rather than showing a bare date", () => {
    // From 2026-08-27: 9 days / 34 days / 158 days out.
    const soon = { order_by_on: "2026-09-05", order_by_passed: false };
    const later = { order_by_on: "2026-09-30", order_by_passed: false };
    const far = { order_by_on: "2027-02-01", order_by_passed: false };
    expect(deadlineState(soon, today)).toBe("urgent");
    expect(deadlineState(later, today)).toBe("soon");
    expect(deadlineState(far, today)).toBe("comfortable");
  });

  it("says plainly when demand is not forecast to ramp at all", () => {
    const none = { order_by_on: null, order_by_passed: false };
    expect(deadlineState(none, today)).toBe("none");
    expect(deadlineMessage(none, "none")).toContain("not forecast to ramp");
  });

  it("never uses brand red for urgency — brand is identity-only", () => {
    for (const state of ["passed", "urgent", "soon", "comfortable"] as const) {
      expect(deadlineTone(state)).not.toContain("brand");
    }
  });
});

describe("lift phrasing", () => {
  it("never calls a sub-1 multiplier a lift — the decision inverts", () => {
    expect(liftPhrase(4.62)).toBe("4.62× busier");
    expect(liftPhrase(0.47)).toContain("quieter");
    expect(liftPhrase(null)).toBe("—");
  });
});

describe("confidence", () => {
  it("names thin history rather than dressing it as low confidence", () => {
    expect(confidenceLabel("insufficient_history")).toBe("Not enough history");
    expect(confidenceLabel("high")).toBe("High confidence");
    expect(confidenceTone("high")).toBe("text-success");
  });
});

describe("hero selection", () => {
  it("never headlines an occasion with no forecast", () => {
    const thin = occ({
      name: "Shavuos", days_until: 3, status: "insufficient_history", lift: null,
    });
    const real = occ({ name: "Rosh Hashanah", days_until: 16 });
    expect(heroOccasion([thin, real])?.name).toBe("Rosh Hashanah");
  });

  it("picks the soonest forecastable occasion", () => {
    const far = occ({ name: "Sukkot", days_until: 40 });
    const near = occ({ name: "Yom Kippur", days_until: 9 });
    expect(heroOccasion([far, near])?.name).toBe("Yom Kippur");
  });

  it("returns null when nothing is forecastable", () => {
    expect(heroOccasion([occ({ status: "insufficient_history", lift: null })])).toBeNull();
  });
});

describe("ramp series", () => {
  it("reads left-to-right as time approaching the occasion", () => {
    const series = rampSeries(occ());
    expect(series.map((p) => p.weeks_out)).toEqual([3, 2, 1]);
  });

  it("drops weeks with no measurement rather than plotting them as zero", () => {
    expect(rampSeries(occ()).every((p) => p.lift > 0)).toBe(true);
  });
});

describe("ledger headline", () => {
  const base: SeasonAccuracy = {
    has_data: false, judged: 0, hits: 0, hit_rate: null,
    mean_abs_error_pct: null, unscorable: 0, pending: 0, forecasts: [],
  };

  it("never fabricates a rate before anything is scored", () => {
    const out = ledgerHeadline(base);
    expect(out.scored).toBe(false);
    expect(out.hitRate).toBe("—");
    expect(out.waitingFor).toBe("No forecasts on record yet.");
  });

  it("says what it is waiting for", () => {
    expect(ledgerHeadline({ ...base, pending: 6 }).waitingFor).toContain("6 forecasts open");
  });

  it("reports the real rate once judged", () => {
    const out = ledgerHeadline({
      ...base, judged: 4, hits: 3, hit_rate: 0.75, mean_abs_error_pct: 12.4,
    });
    expect(out.hitRate).toBe("75%");
    expect(out.meanError).toBe("12.4%");
  });
});

describe("category split", () => {
  const rows = [
    { category: "Tops", lift: 2.69, observations: 5, direction: "surge" as const },
    { category: "Dresses", lift: 1.44, observations: 5, direction: "surge" as const },
    { category: "Skirts", lift: 1.05, observations: 5, direction: "flat" as const },
    { category: "Tees", lift: 0.1, observations: 5, direction: "collapse" as const },
  ];

  it("separates buy-more from pull-back instead of one ranked list", () => {
    // In a single sorted list the collapse sits at the bottom — which is
    // exactly where the costly mistake hides.
    const { buy, pullBack } = splitCategories(rows);
    expect(buy.map((r) => r.category)).toEqual(["Tops", "Dresses"]);
    expect(pullBack.map((r) => r.category)).toEqual(["Tees"]);
  });

  it("scales a 10x surge and a 0.1x collapse onto one legible scale", () => {
    const wide = [
      { category: "Tees", lift: 10.8, observations: 5, direction: "surge" as const },
      { category: "Skirts", lift: 0.1, observations: 5, direction: "collapse" as const },
    ];
    // 0.1x is a 10x move down — it must read as strongly as the 10.8x surge,
    // not as a near-empty bar.
    expect(categoryBarPct(wide[1], wide)).toBeGreaterThan(80);
    expect(categoryBarPct(wide[0], wide)).toBe(100);
  });

  it("never renders a zero-width bar", () => {
    expect(categoryBarPct(rows[2], rows)).toBeGreaterThanOrEqual(6);
  });
});
