"use client";

import { Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterSelect {
  id: string;
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
}

interface Props {
  query: string;
  onQueryChange: (value: string) => void;
  searchPlaceholder: string;
  selects: FilterSelect[];
  /** The count of what survived the filter — always visible. */
  summary: string;
  active: boolean;
  onReset: () => void;
}

/**
 * Shared filter bar for the planning tabs (SPEC-218/220).
 *
 * Client-side by design: the plan is one aggregate the server already computed and
 * sent whole, so filtering it here is instant. Round-tripping to the API for a
 * substring match would be slower and gain nothing.
 *
 * The result count is always shown, because a filter that silently hides rows is
 * how a reader ends up trusting a total that no longer matches what is on screen.
 */
export function PlanFilterBar({
  query,
  onQueryChange,
  searchPlaceholder,
  selects,
  summary,
  active,
  onReset,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-card px-3 py-2.5">
      <div className="relative min-w-[12rem] flex-1">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          type="search"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder={searchPlaceholder}
          aria-label={searchPlaceholder}
          className="h-8 pl-8"
        />
      </div>

      {selects.map((select) => (
        <div key={select.id} className="flex items-center gap-1.5">
          <label
            htmlFor={select.id}
            className="text-xs font-medium whitespace-nowrap text-muted-foreground"
          >
            {select.label}
          </label>
          <Select value={select.value} onValueChange={select.onChange}>
            <SelectTrigger id={select.id} className="min-w-[8.5rem]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {select.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}

      <div className="ml-auto flex items-center gap-2">
        <span className="text-xs tabular-nums whitespace-nowrap text-muted-foreground">
          {summary}
        </span>
        {active ? (
          <Button variant="ghost" size="sm" onClick={onReset} className="h-8 gap-1">
            <X className="size-3.5" aria-hidden />
            Clear
          </Button>
        ) : null}
      </div>
    </div>
  );
}
