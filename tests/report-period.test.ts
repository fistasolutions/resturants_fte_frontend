/** SPEC-107 — reports period-toggle normalization (D-08). */

import { describe, expect, it } from "vitest";

import { normalizePeriod } from "@/lib/report-period";

describe("normalizePeriod", () => {
  it("keeps the two rollup periods", () => {
    expect(normalizePeriod("weekly")).toBe("weekly");
    expect(normalizePeriod("monthly")).toBe("monthly");
  });

  it("collapses anything else to daily", () => {
    expect(normalizePeriod("daily")).toBe("daily");
    expect(normalizePeriod(undefined)).toBe("daily");
    expect(normalizePeriod("yearly")).toBe("daily");
    expect(normalizePeriod("")).toBe("daily");
  });
});
