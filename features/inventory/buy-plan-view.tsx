import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { BuyPlanData } from "@/types/analysis";
import { formatCurrency, formatNumber } from "@/utils/format";

/**
 * Inventory → Buy Plan (SPEC-211). The reorder decision in the shape it is
 * actually made: units split across sizes, per style.
 *
 * A `constrained` size sold out, so its share understates real demand. It is
 * marked, never silently inflated — a model quietly adjusting a buy sheet is not
 * something a buyer asked for.
 */
export function BuyPlanView({ data }: { data: BuyPlanData }) {
  const { summary, curves, products } = data;

  if (products.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm font-medium text-foreground">
          Nothing falls below {summary.coverDaysTarget} days of cover
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Widen the date range or raise the cover target to see more.
        </p>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Styles to reorder
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.productsToReorder)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            under {summary.coverDaysTarget} days of cover
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Units suggested
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.unitsSuggested)}
          </p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Revenue at risk
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-destructive">
            {formatCurrency(summary.revenueAtRisk)}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">if these run out</p>
        </Card>
        <Card className="p-4">
          <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Categories with a curve
          </p>
          <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
            {formatNumber(summary.categoriesWithCurve)}
          </p>
        </Card>
      </div>

      <div className="flex flex-col gap-3">
        {products.map((product) => (
          <Card key={product.productId} className="p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{product.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {product.category} · {formatNumber(product.unitsSold)} sold ·{" "}
                  {formatNumber(product.onHand)} on hand ·{" "}
                  <span className="font-medium text-destructive">
                    {product.daysOfCover} days cover
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold tabular-nums text-foreground">
                  {formatNumber(product.suggestedUnits)}
                </p>
                <p className="text-[11px] text-muted-foreground">units to buy</p>
              </div>
            </div>

            {product.split.length > 0 ? (
              <>
                <div className="mt-4 flex flex-wrap gap-2">
                  {product.split.map((item) => (
                    <div
                      key={item.size}
                      className={cn(
                        "flex min-w-14 flex-col items-center rounded-md border px-2.5 py-1.5",
                        item.constrained
                          ? "border-warning/40 bg-warning/10"
                          : "border-border bg-muted/40",
                      )}
                    >
                      <span className="text-[11px] font-medium text-muted-foreground">
                        {item.size}
                      </span>
                      <span className="text-sm font-bold tabular-nums text-foreground">
                        {item.units}
                      </span>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">
                  {product.splitBasis}
                  {product.split.some((s) => s.constrained) && (
                    <span className="ml-1 text-warning">
                      · shaded sizes sold out — real demand is higher than the split shows
                    </span>
                  )}
                </p>
              </>
            ) : (
              <p className="mt-3 text-xs text-muted-foreground">{product.splitBasis}</p>
            )}
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Category size curves</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Each style&apos;s split is drawn from its category, narrowed to the sizes that
          style actually carries.
        </p>
        <div className="mt-4 flex flex-col gap-4">
          {curves.map((curve) => (
            <div key={curve.category}>
              <p className="text-xs font-semibold text-foreground">{curve.category}</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {curve.sizes.map((size) => (
                  <span
                    key={size.size}
                    className={cn(
                      "rounded px-2 py-0.5 text-[11px] tabular-nums",
                      size.constrained
                        ? "bg-warning/15 text-warning"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {size.size} {size.sharePct}%
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
