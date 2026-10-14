import { VerdictTile } from "@/components/shared/verdict-tile";
import type { ProductVerdicts } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

/** The page's four verdicts (SPEC-026 §1) — every value backend-computed;
 * margin honest-empty until cost data exists. */
export function VerdictTiles({ verdicts }: { verdicts: ProductVerdicts }) {
  return (
    <section
      aria-label="Product verdicts"
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
    >
      <VerdictTile
        label="Best seller"
        value={verdicts.best_seller?.title ?? "—"}
        caption={
          verdicts.best_seller
            ? `${formatCurrency(verdicts.best_seller.revenue)} revenue`
            : "No sales in this period"
        }
      />
      <VerdictTile
        label="Highest margin"
        value={verdicts.highest_margin?.title ?? "No cost data yet"}
        caption={
          verdicts.highest_margin
            ? `${verdicts.highest_margin.margin_pct}% margin`
            : "Margins appear once product costs sync"
        }
      />
      <VerdictTile
        label="Highest returns"
        value={
          verdicts.highest_returns
            ? formatCurrency(verdicts.highest_returns.attributed_refund)
            : "—"
        }
        caption={
          verdicts.highest_returns
            ? `${verdicts.highest_returns.title} · ${verdicts.highest_returns.return_rate_pct}% return rate (estimate)`
            : "No refunds attributed in this period"
        }
      />
      <VerdictTile
        label="No sales in 60d+"
        value={formatNumber(verdicts.no_sales_60d)}
        caption="products — candidates to liquidate"
      />
    </section>
  );
}
