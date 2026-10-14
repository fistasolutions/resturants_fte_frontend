import { VerdictTile } from "@/components/shared/verdict-tile";
import type { InventoryVerdicts } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

/** The inventory page's four money headlines (SPEC-024 Patches) — all
 * backend-computed from the same aggregate the buckets below use. */
export function InventoryVerdictTiles({ verdicts }: { verdicts: InventoryVerdicts }) {
  return (
    <section
      aria-label="Inventory verdicts"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <VerdictTile
        label="Out of stock"
        value={formatNumber(verdicts.out_of_stock_variants)}
        caption="variants, oversold included"
      />
      <VerdictTile
        label="Most urgent reorder"
        value={verdicts.most_urgent_reorder?.title ?? "—"}
        caption={
          verdicts.most_urgent_reorder
            ? `${verdicts.most_urgent_reorder.days_of_cover} days of cover left (est.)`
            : "Nothing about to run out"
        }
      />
      <VerdictTile
        label="Top missed seller"
        value={verdicts.top_missed_seller?.title ?? "—"}
        caption={
          verdicts.top_missed_seller
            ? `${formatCurrency(verdicts.top_missed_seller.window_revenue)} demand, zero stock`
            : "No sellers are out of stock"
        }
      />
      <VerdictTile
        label="Cash frozen"
        value={formatCurrency(verdicts.dead_stock_value.total_stock_value)}
        caption={`across ${formatNumber(verdicts.dead_stock_value.total_products)} dead-stock products`}
      />
    </section>
  );
}
