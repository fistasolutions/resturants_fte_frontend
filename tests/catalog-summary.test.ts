import { describe, expect, it } from "vitest";

import { catalogStatusCounts } from "@/lib/catalog-summary";
import type { CatalogRow } from "@/types/analysis";

function row(status: CatalogRow["status"], id: number): CatalogRow {
  return {
    product_id: id,
    title: `P${id}`,
    category: "Tees",
    units: 0,
    revenue: 0,
    stock: 0,
    margin_pct: null,
    discount_pct: null,
    return_rate_pct: null,
    sell_through_pct: null,
    status,
  };
}

describe("catalogStatusCounts", () => {
  it("counts rows by their backend status and totals them", () => {
    const rows = [
      row("best_seller", 1),
      row("best_seller", 2),
      row("healthy", 3),
      row("slow", 4),
      row("dead_stock", 5),
      row("dead_stock", 6),
    ];
    expect(catalogStatusCounts(rows)).toEqual({
      total: 6,
      best_seller: 2,
      healthy: 1,
      slow: 1,
      dead_stock: 2,
    });
  });

  it("returns all-zero counts for an empty catalog", () => {
    expect(catalogStatusCounts([])).toEqual({
      total: 0,
      best_seller: 0,
      healthy: 0,
      slow: 0,
      dead_stock: 0,
    });
  });
});
