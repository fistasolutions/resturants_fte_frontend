"use client";

import { useMemo, useState } from "react";
import { UtensilsCrossed } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { socialQueries } from "@/lib/queries/social";
import { MENU_REASON_LABELS, menuByReason } from "@/lib/social-menu";
import { cn } from "@/lib/utils";
import type { StudioProduct } from "@/types/social";

const FILTERS = ["all", "best_seller", "profit_pick", "new_item"] as const;

/** A restaurant brand's Content Studio browser (SPEC-389): dishes worth a post, each with why. */
export function MenuBrowser({ onSelect }: { onSelect: (item: StudioProduct) => void }) {
  const items = useApiQuery(socialQueries.menuItems());
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const shown = useMemo(() => menuByReason(items.data ?? [], filter), [items.data, filter]);

  if (items.isError) return <QueryErrorState error={items.error} onRetry={() => void items.refetch()} />;
  if (!items.data)
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-28 rounded-2xl" />
        ))}
      </div>
    );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter dishes">
        {FILTERS.map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={filter === key}
            onClick={() => setFilter(key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
              filter === key ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
            )}
          >
            {key === "all" ? "All dishes" : MENU_REASON_LABELS[key]}{" "}
            <span className="tabular-nums">{menuByReason(items.data, key).length}</span>
          </button>
        ))}
      </div>
      {shown.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">
          {items.data.length === 0
            ? "No dish stands out yet. Once orders come in, best sellers and dishes worth pushing appear here."
            : "No dish under this filter."}
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {shown.map((item) => (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item)}
                className="flex h-full w-full flex-col gap-2 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="flex items-center gap-2 font-medium text-foreground">
                    <UtensilsCrossed className="size-4 text-muted-foreground" aria-hidden /> {item.name}
                  </span>
                  <span className="text-sm tabular-nums text-foreground">{item.priceLabel}</span>
                </span>
                <span className="text-xs text-muted-foreground">{item.category}</span>
                <span className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full border border-border px-2 py-0.5 font-medium">
                    {MENU_REASON_LABELS[item.reason] ?? item.reason}
                  </span>
                  {item.suggested ? <span className="font-medium text-success">Suggested next</span> : null}
                </span>
                {item.reasonDetail ? <span className="text-xs text-muted-foreground">{item.reasonDetail}</span> : null}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
