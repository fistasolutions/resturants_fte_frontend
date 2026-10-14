import { formatCurrency, formatNumber } from "@/utils/format";
import type { DiscountPromotion } from "@/types/discounts";

/** Automatic + code promotions breakdown (SPEC-098) — the "approved,
 * programmed" discounts, distinct from staff-entered manual ones. */
export function PromotionsCard({ promotions }: { promotions: DiscountPromotion[] }) {
  return (
    <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="text-sm font-semibold text-foreground">Automatic &amp; code promotions</h2>
      {promotions.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">
          No automatic or code-based promotions in this range — discounting here is manual.
        </p>
      ) : (
        <ul className="mt-3 space-y-2.5">
          {promotions.slice(0, 8).map((p, i) => (
            <li key={`${p.title}-${i}`} className="flex items-center justify-between gap-3 text-sm">
              <span className="min-w-0 truncate">
                <span className="text-foreground">{p.title}</span>{" "}
                <span className="text-xs text-muted-foreground">
                  · {p.type === "discount_code" ? "code" : p.type}
                </span>
              </span>
              <span className="shrink-0 text-right tabular-nums">
                <span className="font-medium text-foreground">{formatCurrency(p.discount)}</span>{" "}
                <span className="text-xs text-muted-foreground">
                  ({formatNumber(p.orders)} orders)
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
