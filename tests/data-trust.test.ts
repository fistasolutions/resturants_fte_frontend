import { describe, expect, it } from "vitest";

import {
  adaptDataTrust,
  correctionSentence,
  isMateriallyContaminated,
  ruleStatusLabel,
  sortRules,
} from "@/lib/data-trust";
import type { DataTrustApiResponse, DataTrustRule } from "@/types/data-trust";

/**
 * Figures mirror production on 2026-09-03: three ACTIVE "TEST TALLY PROD"
 * products carried $8,928,310 of stock — 83% of the 180-day dead-stock number.
 */
const RESPONSE: DataTrustApiResponse = {
  summary: {
    rules_triggered: 2,
    products_excluded: 4,
    stock_value_reported: 10695027,
    stock_value_excluded: 8928310,
    stock_value_trusted: 1766717,
    excluded_share_pct: 83.5,
  },
  rules: [
    {
      key: "cost_above_price",
      label: "Variants costing more than they sell for",
      severity: "high",
      count: 7773,
      value_impact: null,
      excluded: false,
      affects: ["True profit"],
      explanation: "Only 244 exceed 3x price.",
      action: "Review in Shopify.",
      samples: [],
    },
    {
      key: "test_products",
      label: "Test products still active in Shopify",
      severity: "excluded",
      count: 4,
      value_impact: 8928310,
      excluded: true,
      affects: ["Inventory", "Dead stock"],
      explanation: "Named as fixtures and never sold.",
      action: "Archive these products in Shopify.",
      samples: [
        { product_id: 1, title: "TEST TALLY PROD 2 blue", detail: "27,060 units" },
      ],
    },
  ],
};

describe("adaptDataTrust", () => {
  it("maps the backend shape to camelCase without altering figures", () => {
    const report = adaptDataTrust(RESPONSE);
    expect(report.summary.stockValueTrusted).toBe(1766717);
    expect(report.summary.stockValueExcluded).toBe(8928310);
    expect(report.summary.excludedSharePct).toBe(83.5);
    expect(report.rules).toHaveLength(2);
    expect(report.rules[1].samples[0].productId).toBe(1);
  });

  it("preserves a null value impact rather than coercing it to zero", () => {
    // A fabricated 0 would read as "this costs nothing", which is a different
    // claim from "we cannot honestly put a number on this".
    const report = adaptDataTrust(RESPONSE);
    expect(report.rules[0].valueImpact).toBeNull();
  });

  it("falls back to the lowest severity on an unknown value", () => {
    const odd = {
      ...RESPONSE,
      rules: [{ ...RESPONSE.rules[0], severity: "catastrophic" }],
    };
    expect(adaptDataTrust(odd).rules[0].severity).toBe("low");
  });
});

describe("sortRules", () => {
  it("puts excluded rules first — they are the ones that moved the numbers", () => {
    const sorted = sortRules(adaptDataTrust(RESPONSE).rules);
    expect(sorted[0].key).toBe("test_products");
    expect(sorted[1].key).toBe("cost_above_price");
  });

  it("does not mutate the input", () => {
    const rules = adaptDataTrust(RESPONSE).rules;
    const firstKey = rules[0].key;
    sortRules(rules);
    expect(rules[0].key).toBe(firstKey);
  });

  it("breaks a severity tie by count, largest first", () => {
    const base = adaptDataTrust(RESPONSE).rules[0];
    const rules: DataTrustRule[] = [
      { ...base, key: "small", count: 5 },
      { ...base, key: "big", count: 900 },
    ];
    expect(sortRules(rules).map((r) => r.key)).toEqual(["big", "small"]);
  });
});

describe("ruleStatusLabel", () => {
  it("distinguishes excluded from flagged in text, not only colour", () => {
    const [flagged, excluded] = adaptDataTrust(RESPONSE).rules;
    expect(ruleStatusLabel(excluded)).toBe("Excluded from figures");
    expect(ruleStatusLabel(flagged)).toBe("Flagged only");
  });
});

describe("isMateriallyContaminated", () => {
  it("treats production's 83.5% as material", () => {
    expect(isMateriallyContaminated(83.5)).toBe(true);
  });

  it("treats a trace amount as immaterial", () => {
    expect(isMateriallyContaminated(0)).toBe(false);
    expect(isMateriallyContaminated(4.9)).toBe(false);
    expect(isMateriallyContaminated(5)).toBe(true);
  });
});

describe("correctionSentence", () => {
  it("states the correction in one auditable sentence", () => {
    const sentence = correctionSentence(adaptDataTrust(RESPONSE));
    expect(sentence).toContain("4 test products");
    expect(sentence).toContain("83.5%");
  });

  it("returns null when there is nothing to correct", () => {
    const clean = adaptDataTrust({
      summary: {
        rules_triggered: 0,
        products_excluded: 0,
        stock_value_reported: 0,
        stock_value_excluded: 0,
        stock_value_trusted: 0,
        excluded_share_pct: 0,
      },
      rules: [],
    });
    expect(correctionSentence(clean)).toBeNull();
  });

  it("uses the singular for one product", () => {
    const one = adaptDataTrust({
      ...RESPONSE,
      summary: { ...RESPONSE.summary, products_excluded: 1 },
    });
    expect(correctionSentence(one)).toContain("1 test product ");
  });
});
