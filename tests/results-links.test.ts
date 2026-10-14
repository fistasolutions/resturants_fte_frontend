/** SPEC-156 — Results outcome-link resolution, incl. the new `transfers` type. */

import { describe, expect, it } from "vitest";

import { resolveLink } from "@/features/results/results-tabs";

describe("resolveLink — transfers (SPEC-156)", () => {
  it("routes a transfers outcome with a location key to the per-location review send page", () => {
    expect(resolveLink({ type: "transfers", location_key: "302" })).toBe(
      "/inventory/transfers/review/send/302",
    );
  });

  it("routes a transfers outcome with no location key to the review index", () => {
    expect(resolveLink({ type: "transfers" })).toBe("/inventory/transfers/review");
  });
});

describe("resolveLink — pre-existing types unchanged (regression guard)", () => {
  it("keeps every other outcome type on its documented destination", () => {
    expect(resolveLink({ type: "overdue", location_key: "l1" })).toBe("/brief/overdue");
    expect(resolveLink({ type: "inventory", location_key: "l1" })).toBe("/inventory");
    expect(resolveLink({ type: "dead_inventory", product_id: 5, location_id: 9 })).toBe(
      "/inventory/dead-inventory-alerts/5/9",
    );
    expect(resolveLink({ type: "customers" })).toBe("/customers");
    expect(resolveLink({ type: "traffic" })).toBe("/traffic");
    expect(resolveLink({ type: "discounts" })).toBe("/discounts/attention");
    expect(resolveLink({ type: "warehouse" })).toBe("/warehouse");
    expect(resolveLink({ type: "support" })).toBe("/team-performance/agents");
    expect(resolveLink({ type: "returns" })).toBe("/returns");
  });
});
