/** SPEC-251 — the pure half of Products → Costs. */
import { describe, expect, it } from "vitest";

import {
  CSV_TEMPLATE,
  assumedLabel,
  coverageTiles,
  describeApiError,
  emptyManualForm,
  emptyShipmentHeader,
  manualCostBody,
  rateLabel,
  reconciliationLines,
  shipmentFormData,
  validateManualForm,
  validateShipmentHeader,
} from "@/lib/costs";
import type { ApiCostCoverage, ApiCostReconciliation } from "@/types/costs";

const COVERAGE: ApiCostCoverage = {
  revenue: 1000,
  cost_known_revenue: 400,
  landed_revenue: 250,
  coverage_pct: 40,
  landed_pct: 25,
  flagged: true,
  min_coverage_pct: 50,
  variants_selling: 120,
  variants_with_landed: 30,
  variants_with_shopify_cost: 50,
  lines: 800,
  lines_landed: 200,
};

describe("coverageTiles", () => {
  it("flags coverage under the floor and names the landed share", () => {
    const tiles = coverageTiles(COVERAGE, 3);
    expect(tiles.map((t) => t.key)).toEqual(["coverage", "landed", "variants", "shipments"]);
    expect(tiles[0].value).toBe("40%");
    expect(tiles[0].tone).toBe("bad");
    expect(tiles[0].sub).toContain("50% floor");
    expect(tiles[1].sub).toBe("200 of 800 lines carry a landed cost");
    expect(tiles[2].value).toBe("30");
    expect(tiles[2].suffix).toBe("/120");
    expect(tiles[3].value).toBe("3");
  });

  it("shows a dash with no sales", () => {
    const tiles = coverageTiles({ ...COVERAGE, coverage_pct: null, landed_pct: null, flagged: false }, 0);
    expect(tiles[0].value).toBe("—");
    expect(tiles[0].tone).toBe("neutral");
  });
});

describe("validateShipmentHeader", () => {
  const file = new File(["sku,quantity,unit_cost\n"], "s.csv", { type: "text/csv" });

  it("passes a base-currency shipment with blank optional totals", () => {
    const form = { ...emptyShipmentHeader("USD", "2026-09-16"), reference: "SH-1" };
    expect(validateShipmentHeader(form, "USD", file)).toEqual([]);
  });

  it("requires an FX rate for a foreign invoice and numeric totals", () => {
    const form = {
      ...emptyShipmentHeader("USD", "2026-09-16"),
      reference: "SH-1",
      currency: "eur",
      freightTotal: "12x",
    };
    const errors = validateShipmentHeader(form, "USD", null);
    expect(errors).toEqual([
      "FX rate is required for a EUR invoice (USD per 1 EUR).",
      "Freight total must be a number (or blank).",
      "Choose the shipment CSV.",
    ]);
  });

  it("requires the reference and the received date", () => {
    const form = { ...emptyShipmentHeader("USD", ""), reference: "  " };
    expect(validateShipmentHeader(form, "USD", file)).toEqual([
      "Reference is required (the shipment or invoice number).",
      "Received date is required.",
    ]);
  });
});

describe("shipmentFormData", () => {
  it("sends only the fields that were filled, upper-cases the currency, and skips the rate at base", () => {
    const file = new File(["x"], "s.csv");
    const form = {
      ...emptyShipmentHeader("USD", "2026-09-16"),
      reference: " SH-1 ",
      currency: "usd",
      fxRate: "1.2",
      freightTotal: "88",
      supplier: "Mirage",
    };
    const body = shipmentFormData(form, "USD", file);
    expect(body.get("reference")).toBe("SH-1");
    expect(body.get("currency")).toBe("USD");
    expect(body.get("fx_rate")).toBeNull();
    expect(body.get("freight_total")).toBe("88");
    expect(body.get("duty_total")).toBeNull();
    expect(body.get("supplier")).toBe("Mirage");
    expect(body.get("allocation_method")).toBe("value");
    expect(body.get("file")).toBeInstanceOf(File);
  });

  it("sends the rate for a foreign invoice", () => {
    const form = { ...emptyShipmentHeader("USD", "2026-09-16"), reference: "S", currency: "EUR", fxRate: "1.1" };
    expect(shipmentFormData(form, "USD", new File(["x"], "s.csv")).get("fx_rate")).toBe("1.1");
  });
});

describe("manual entry", () => {
  it("validates and builds the body with blanks absent", () => {
    const form = { ...emptyManualForm("USD", "2026-09-16"), unitCost: "30", freight: "1,000.5" };
    expect(validateManualForm(form, "USD")).toEqual([]);
    expect(manualCostBody(form, "USD")).toEqual({
      effective_date: "2026-09-16",
      currency: "USD",
      fx_rate: 1,
      unit_cost: 30,
      freight: 1000.5,
      duty: undefined,
      brokerage: undefined,
      insurance: undefined,
      handling: undefined,
      source_document: undefined,
    });
  });

  it("refuses a missing unit cost and a foreign entry without a rate", () => {
    const form = { ...emptyManualForm("USD", ""), currency: "ILS", duty: "abc" };
    expect(validateManualForm(form, "USD")).toEqual([
      "Effective date is required.",
      "Unit cost is required.",
      "FX rate is required for a ILS entry.",
      "duty must be a number (or blank).",
    ]);
  });
});

describe("error and labels", () => {
  it("reads the backend envelope with its rows", () => {
    const shaped = describeApiError(
      { error: { message: "2 rows match no variant on this store.", details: [{ field: "row 3", message: "no variant with SKU/id 'NOPE'" }] } },
      "fallback",
    );
    expect(shaped.message).toBe("2 rows match no variant on this store.");
    expect(shaped.rows).toEqual(["row 3: no variant with SKU/id 'NOPE'"]);
    expect(describeApiError(null, "fallback")).toEqual({ message: "fallback", rows: [] });
  });

  it("builds the reconciliation lines and the labels", () => {
    const rec: ApiCostReconciliation = {
      landed_recorded: 1200,
      invoices_entered: 1000,
      assumptions_applied: 200,
      variance: 200,
      variance_lines: [{ label: "Assumptions applied (duty, handling, shrinkage not on an invoice)", amount: 200 }],
      shipments: 1,
      rows: 3,
      manual_entries: 2,
    };
    const lines = reconciliationLines(rec);
    expect(lines.map((l) => l.label)[3]).toMatch(/^↳ Assumptions applied/);
    expect(lines[2].value).toBe("$200.00");
    expect(assumedLabel([])).toBe("all from the invoice");
    expect(assumedLabel(["duty", "shrinkage"])).toBe("duty, shrinkage from assumptions");
    expect(rateLabel("EUR", "USD", 1.1)).toBe("EUR @ 1.1");
    expect(rateLabel("USD", "USD", 1)).toBe("USD");
    expect(CSV_TEMPLATE.split("\n")[0]).toBe("sku,quantity,unit_cost,weight");
  });
});
