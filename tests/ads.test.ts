import { describe, expect, it } from "vitest";

import {
  ADS_TAB_IDS,
  capUtilizationTone,
  formatRoas,
  normalizeAdsTab,
  roasTone,
} from "@/lib/ads";

describe("normalizeAdsTab", () => {
  it("passes through every valid tab id", () => {
    for (const id of ADS_TAB_IDS) {
      expect(normalizeAdsTab(id)).toBe(id);
    }
  });

  it("falls back to overview for unknown / empty values", () => {
    expect(normalizeAdsTab("bogus")).toBe("overview");
    expect(normalizeAdsTab(null)).toBe("overview");
    expect(normalizeAdsTab(undefined)).toBe("overview");
    expect(normalizeAdsTab("")).toBe("overview");
  });
});

describe("roasTone", () => {
  it("buckets profit-aware ROAS (>=2.5 strong, >=1 steady, else weak)", () => {
    expect(roasTone(6.2)).toBe("strong");
    expect(roasTone(2.5)).toBe("strong");
    expect(roasTone(2.4)).toBe("steady");
    expect(roasTone(1)).toBe("steady");
    expect(roasTone(0.9)).toBe("weak");
    expect(roasTone(0)).toBe("weak");
  });
});

describe("capUtilizationTone", () => {
  it("buckets cap utilization (<0.8 healthy, >=0.8 nearing, >=1 over)", () => {
    expect(capUtilizationTone(0)).toBe("healthy");
    expect(capUtilizationTone(0.79)).toBe("healthy");
    expect(capUtilizationTone(0.8)).toBe("nearing");
    expect(capUtilizationTone(0.99)).toBe("nearing");
    expect(capUtilizationTone(1)).toBe("over");
    expect(capUtilizationTone(1.2)).toBe("over");
  });
});

describe("formatRoas", () => {
  it("renders a one-decimal multiple", () => {
    expect(formatRoas(3.18)).toBe("3.2x");
    expect(formatRoas(6)).toBe("6.0x");
    expect(formatRoas(0)).toBe("0.0x");
  });
});

/* The former "ads services (mock seam)" suite asserted properties of the Phase-1
 * fixtures — that both channels appeared, that every status and guardrail kind was
 * represented. Those were assertions about the MOCK's completeness, which was the right
 * test while the mock was the product.
 *
 * SPEC-182 pointed `services/ads.ts` at the live backend, so it now imports
 * `serverApi` and is `server-only` — unimportable in this node test env, and asserting
 * "at least one Google campaign exists" against a real store would be asserting the
 * merchant's data, not our code. The equivalent coverage moved to
 * `tests/ads-adapters.test.ts`, which pins the mapping and the honest-zero behaviour
 * that actually belongs to us.
 */
