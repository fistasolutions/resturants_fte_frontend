import { VerdictTile } from "@/components/shared/verdict-tile";
import type { InventoryAnalysis, InventoryByLocationDashboard } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

/** Second Overview row (SPEC-102) — the store-wide inventory snapshot that
 * complements the four "money headline" verdict tiles: how much stock is on
 * hand (value + units), what's running low, and how many units are frozen in
 * dead stock. All accurate store-wide figures (value/units from the
 * by-location dashboard totals; low-stock + frozen units from the analysis). */
export function InventorySnapshotTiles({
  analysis,
  byLocation,
}: {
  analysis: InventoryAnalysis;
  byLocation: InventoryByLocationDashboard | null;
}) {
  const totals = byLocation?.totals;
  return (
    <section
      aria-label="Inventory snapshot"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <VerdictTile
        label="Stock value on hand"
        value={totals ? formatCurrency(totals.stock_value) : "—"}
        caption={
          totals
            ? `retail value across ${formatNumber(totals.locations)} locations`
            : "current retail value"
        }
      />
      <VerdictTile
        label="Units on hand"
        value={totals ? formatNumber(totals.units) : "—"}
        caption="total units in stock"
      />
      <VerdictTile
        label="Low stock"
        value={formatNumber(analysis.counts.low_stock)}
        caption="variants running low (≤10 left)"
      />
      <VerdictTile
        label="Units frozen"
        value={formatNumber(analysis.dead_stock.total_units)}
        caption="units sitting in dead stock"
      />
    </section>
  );
}
