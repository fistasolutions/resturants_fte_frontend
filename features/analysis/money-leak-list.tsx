import { ShieldCheck } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { ProductReturn, ReturnVerdict, ReturnVerdicts } from "@/types/analysis";
import { formatCurrency } from "@/utils/format";

function minutesAgo(iso: string): string {
  const minutes = Math.max(
    0,
    Math.round((Date.now() - new Date(iso).getTime()) / 60_000),
  );
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  return `${Math.round(minutes / 60)} h ago`;
}

interface MoneyLeakListProps {
  /** top_returns from the server-fetched ProductAnalysis (SPEC-040). */
  products: ProductReturn[];
  /** Pre-fetched AI verdicts from the RSC (SPEC-046); null if the AI call failed. */
  verdicts: ReturnVerdicts | null;
}

/** Money-leak table: top return products with AI verdicts (SPEC-046).
 * Fully server-rendered — no loading skeletons, no client-side fetch on every visit.
 * Verdicts are hash-keyed in the backend so they only regenerate when flagged
 * products actually change. */
export function MoneyLeakList({ products, verdicts }: MoneyLeakListProps) {
  if (products.length === 0) {
    return (
      <Card className="flex items-center gap-3 px-4 py-4">
        <ShieldCheck className="size-4 shrink-0 text-muted-foreground" aria-hidden />
        <p className="text-sm text-muted-foreground">
          No significant return spikes detected in this period.
        </p>
      </Card>
    );
  }

  const verdictMap = new Map<number, string>(
    (verdicts?.verdicts ?? []).map((v: ReturnVerdict) => [v.product_id, v.verdict]),
  );

  return (
    <section aria-label="Money leak — top return products">
      <div className="mb-2 flex items-center gap-3">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Money Leak
        </p>
        <div className="h-px flex-1 bg-border" aria-hidden />
        {verdicts?.generated_at && (
          <span className="text-[10px] text-muted-foreground">
            AI {minutesAgo(verdicts.generated_at)}
            {verdicts.stale ? " · stale" : ""}
          </span>
        )}
      </div>

      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-4 py-2.5 text-left text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Product
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Return rate
                </th>
                <th className="px-4 py-2.5 text-right text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  Lost to refunds
                </th>
                <th className="px-4 py-2.5 text-left text-[10px] font-medium tracking-wider text-muted-foreground uppercase">
                  AI verdict
                </th>
                <th className="w-24 px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {products.map((product) => {
                const rate = product.return_rate_pct;
                const isHighRate = rate !== null && rate >= 20;
                const verdict = verdictMap.get(product.product_id);
                const askWhy = `/chat?q=${encodeURIComponent(
                  `Why is ${product.title} getting so many returns? What should I do?`,
                )}`;

                return (
                  <tr
                    key={product.product_id}
                    className="transition-colors hover:bg-muted/30"
                  >
                    <td className="max-w-[180px] px-4 py-3">
                      <span
                        className="block truncate font-medium text-foreground"
                        title={product.title}
                      >
                        {product.title}
                      </span>
                    </td>
                    <td
                      className={`px-4 py-3 text-right tabular-nums ${
                        isHighRate ? "font-semibold text-destructive" : "text-foreground"
                      }`}
                    >
                      {rate !== null ? `${rate}%` : "—"}
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums text-foreground">
                      {formatCurrency(product.attributed_refund)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-muted-foreground">{verdict ?? "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <a
                        href={askWhy}
                        className="whitespace-nowrap text-xs text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
                      >
                        Ask why →
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </section>
  );
}
