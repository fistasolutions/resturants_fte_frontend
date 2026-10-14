/**
 * Pure catalog composition helper for the Product Analyst page (SPEC-093).
 * Framework-free + unit-testable. This COUNTS rows by their backend-assigned
 * `status` — a presentation aggregation, not a new business metric (the status
 * itself is computed by the analytics engine; root Rule 8).
 */

import type { CatalogRow } from "@/types/analysis";

export interface CatalogStatusCounts {
  total: number;
  best_seller: number;
  healthy: number;
  slow: number;
  dead_stock: number;
}

export function catalogStatusCounts(rows: CatalogRow[]): CatalogStatusCounts {
  const counts: CatalogStatusCounts = {
    total: rows.length,
    best_seller: 0,
    healthy: 0,
    slow: 0,
    dead_stock: 0,
  };
  for (const row of rows) {
    counts[row.status] += 1;
  }
  return counts;
}
