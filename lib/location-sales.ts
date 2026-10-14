import type { ProductLocationSales } from "@/types/analysis";

export interface LocationSalesRow extends ProductLocationSales {
  /** Share of this product's units sold at this location, 0-100. */
  share: number;
}

/**
 * Share-of-units for the product detail "Sold per location" box (SPEC-160).
 *
 * The backend already orders rows units-descending and labels the NULL
 * (online / unattributed) bucket, so this only derives the proportional share
 * used for the bar widths — it never re-sorts or re-labels, which would let the
 * box drift from the API contract.
 */
export function buildLocationSalesRows(rows: ProductLocationSales[]): LocationSalesRow[] {
  const total = rows.reduce((sum, row) => sum + row.units, 0);
  // A product can be returned into a negative/zero window total; guard the
  // divide rather than emitting NaN widths into the DOM.
  if (total <= 0) return rows.map((row) => ({ ...row, share: 0 }));
  return rows.map((row) => ({ ...row, share: (row.units / total) * 100 }));
}
