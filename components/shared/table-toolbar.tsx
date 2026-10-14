"use client";

import { Search, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import type { FacetOption } from "@/lib/table-controls";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/utils/format";

interface TableToolbarProps {
  /** What the rows are, plural — "products", "codes" — for the count and the input. */
  noun: string;
  /** The chip row's name, e.g. "Verdict" — read by screen readers on the group. */
  facetLabel: string;
  query: string;
  onQuery: (query: string) => void;
  facets: FacetOption[];
  facet: string | null;
  onFacet: (facet: string | null) => void;
  matches: number;
  total: number;
  active: boolean;
  onClear: () => void;
  placeholder?: string;
}

const CHIP =
  "rounded-md px-2.5 py-1 text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The search box, the facet chips and the match count above a loaded table
 * (SPEC-258). Same bar as the `/ci` feed's, with the chips built from the rows
 * themselves so every label shown has at least one row behind it.
 */
export function TableToolbar({
  noun,
  facetLabel,
  query,
  onQuery,
  facets,
  facet,
  onFacet,
  matches,
  total,
  active,
  onClear,
  placeholder,
}: TableToolbarProps) {
  const chip = (label: string, count: number, value: string | null) => {
    const on = facet === value;
    return (
      <button
        key={label}
        type="button"
        aria-pressed={on}
        onClick={() => onFacet(value)}
        className={cn(CHIP, on ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground")}
      >
        {label}
        <span className={cn("ml-1 tabular-nums", on ? "text-background/70" : "text-muted-foreground/70")}>
          {formatNumber(count)}
        </span>
      </button>
    );
  };

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-border px-3 py-2.5">
      <div role="group" aria-label={facetLabel} className="flex flex-wrap rounded-lg border border-border bg-card p-0.5">
        {chip("All", total, null)}
        {facets.map((f) => chip(f.label, f.count, f.label))}
      </div>
      <div className="relative min-w-[180px] flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQuery(e.target.value)}
          placeholder={placeholder ?? `Search ${noun}…`}
          aria-label={`Search ${noun}`}
          className="pl-8"
        />
      </div>
      <p className="ml-auto text-xs text-muted-foreground tabular-nums" aria-live="polite">
        {active ? `${formatNumber(matches)} of ${formatNumber(total)}` : formatNumber(total)} {noun}
        {active ? (
          <button
            type="button"
            onClick={onClear}
            className="ml-2 inline-flex items-center gap-1 rounded-md border border-border px-2 py-0.5 text-[11px] font-medium text-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-3" aria-hidden /> Clear
          </button>
        ) : null}
      </p>
    </div>
  );
}
