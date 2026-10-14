import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { formatRate, rateTone } from "@/lib/returns-format";
import type { CategoryRow } from "@/types/returns-intel";
import { formatCurrency, formatNumber } from "@/utils/format";

import { HEAT_BAR_CLASS, RATE_PILL_CLASS } from "./tone";

export function CategoriesTab({
  categories,
  rangeQuery,
}: {
  categories: CategoryRow[];
  rangeQuery: string;
}) {
  const maxProfitLost = Math.max(...categories.map((c) => c.profit_lost), 1);

  return (
    <div className="space-y-3">
      {categories.map((category) => {
        const tone = rateTone(category.return_rate);
        return (
          <Link
            key={category.category}
            href={`/returns?tab=by-style&category=${encodeURIComponent(category.category)}&${rangeQuery}`}
            className="block"
          >
            <Card className="group gap-3 p-4 transition-colors hover:border-primary/40">
              <div className="flex items-center justify-between gap-3">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate text-sm font-medium text-foreground">
                    {category.category}
                  </p>
                  <ChevronRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={cn(
                      "rounded-md px-1.5 py-0.5 text-xs font-medium tabular-nums",
                      RATE_PILL_CLASS[tone],
                    )}
                  >
                    {formatRate(category.return_rate)}
                  </span>
                  <span className="w-20 text-right text-sm font-semibold tabular-nums text-destructive">
                    {formatCurrency(category.profit_lost)}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between gap-3">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", HEAT_BAR_CLASS[tone])}
                    style={{ width: `${Math.max((category.profit_lost / maxProfitLost) * 100, 2)}%` }}
                  />
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatNumber(category.units_returned)} of{" "}
                  {formatNumber(category.units_sold)} returned
                </span>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
