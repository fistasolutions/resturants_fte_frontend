import { describe, expect, it } from "vitest";

import { buildLocationSalesRows } from "@/lib/location-sales";
import type { ProductLocationSales } from "@/types/analysis";

const row = (
  location_id: number | null,
  location_name: string,
  units: number,
): ProductLocationSales => ({ location_id, location_name, units, revenue: units * 10, orders: 1 });

describe("buildLocationSalesRows", () => {
  it("derives share of units per location", () => {
    const rows = buildLocationSalesRows([row(1, "A", 3), row(2, "B", 1)]);
    expect(rows.map((r) => r.share)).toEqual([75, 25]);
  });

  it("preserves the backend's order and labels", () => {
    // The API sorts units-descending and names the NULL bucket; re-deriving
    // either here would let the box drift from the contract.
    const input = [row(null, "Online / unattributed", 5), row(7, "Brooklyn", 9)];
    const rows = buildLocationSalesRows(input);
    expect(rows.map((r) => r.location_name)).toEqual(["Online / unattributed", "Brooklyn"]);
    expect(rows[0].location_id).toBeNull();
  });

  it("returns zero shares instead of NaN when nothing sold", () => {
    const rows = buildLocationSalesRows([row(1, "A", 0), row(2, "B", 0)]);
    expect(rows.every((r) => r.share === 0)).toBe(true);
  });

  it("handles an empty list", () => {
    expect(buildLocationSalesRows([])).toEqual([]);
  });

  it("gives a single location the full bar", () => {
    expect(buildLocationSalesRows([row(1, "A", 12)])[0].share).toBe(100);
  });
});
