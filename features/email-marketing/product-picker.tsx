"use client";

import { useId } from "react";

import { formatMoney } from "@/lib/email-marketing";
import { cn } from "@/lib/utils";
import type { CatalogProduct } from "@/types/email-marketing";

/**
 * Products from the real catalog (SPEC-345), with what the platform knows that the email
 * platform does not: margin, stock, Foresight's stockout risk and Fit's size verdict. A
 * product at stockout risk cannot be picked — the employee never promotes what is about to
 * run out. Each picker's ids are its own, so two on one page (a grid and Picked for you,
 * SPEC-368) never tick each other's boxes.
 */
export function ProductPicker({ catalog, selected, onChange }: { catalog: CatalogProduct[]; selected: number[]; onChange: (ids: number[]) => void }) {
  const prefix = useId();
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2" aria-label="Products">
      {catalog.map((p) => {
        const checked = selected.includes(p.id);
        const id = `${prefix}-product-${p.id}`;
        return (
          <li key={p.id}>
            <label
              htmlFor={id}
              className={cn(
                "flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm transition-colors",
                checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                p.stockoutRisk && "cursor-not-allowed opacity-60",
              )}
            >
              <input
                id={id}
                type="checkbox"
                className="mt-1 accent-primary"
                checked={checked}
                disabled={p.stockoutRisk}
                onChange={() => onChange(checked ? selected.filter((x) => x !== p.id) : [...selected, p.id])}
              />
              <span className="min-w-0">
                <span className="block font-medium">{p.title}</span>
                <span className="block text-xs text-muted-foreground">
                  {formatMoney(p.price)} · {p.marginPercent}% margin · {p.stock.toLocaleString("en-US")} in stock
                  {p.fit === "runs_small" ? " · runs small" : p.fit === "runs_large" ? " · runs large" : ""}
                </span>
                {p.stockoutRisk ? <span className="block text-xs text-warning">At stockout risk (Foresight) — not promoted</span> : null}
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}
