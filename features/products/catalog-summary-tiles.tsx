import { VerdictTile } from "@/components/shared/verdict-tile";
import { catalogStatusCounts } from "@/lib/catalog-summary";
import type { CatalogRow } from "@/types/analysis";
import { formatNumber } from "@/utils/format";

/** Catalog composition at a glance (SPEC-093) — counts of the backend-assigned
 * product status. Reuses the shared verdict tile so it matches the page's other
 * tiles exactly; used on both the Catalog tab header and the Overview dashboard. */
export function CatalogSummaryTiles({ rows }: { rows: CatalogRow[] }) {
  const counts = catalogStatusCounts(rows);
  return (
    <section
      aria-label="Catalog summary"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <VerdictTile
        label="Products"
        value={formatNumber(counts.total)}
        caption="in this period's catalog"
      />
      <VerdictTile
        label="Best sellers"
        value={formatNumber(counts.best_seller)}
        caption="top revenue drivers"
      />
      <VerdictTile
        label="Slow movers"
        value={formatNumber(counts.slow)}
        caption="stocked but barely selling"
      />
      <VerdictTile
        label="Dead stock"
        value={formatNumber(counts.dead_stock)}
        caption="no sales — candidates to clear"
      />
    </section>
  );
}
