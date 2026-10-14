"use client";

import { useState } from "react";

import { StatusBadge } from "@/components/shared/status-badge";
import { useDataManager } from "@/features/data-manager/data-manager-context";
import { ExampleNote, Section } from "@/features/data-manager/parts";
import { gapTone } from "@/lib/data-manager";
import { cn } from "@/lib/utils";
import type { ProfitGrouping } from "@/types/data-manager";
import { formatCurrency, formatNumber, formatWholeMoney } from "@/utils/format";

const GROUPINGS: { key: ProfitGrouping; label: string }[] = [
  { key: "product", label: "Product" },
  { key: "vendor", label: "Vendor" },
  { key: "location", label: "Location" },
];

/**
 * Real profit (SPEC-374): the backend's figures per product, vendor or location, beside what
 * Shopify's own unit cost says. The screen only formats them (root Rule 8).
 */
export function ProfitTab() {
  const { data } = useDataManager();
  const [grouping, setGrouping] = useState<ProfitGrouping>("product");
  const p = data.profit;
  const rows = p.rows[grouping];

  return (
    <div className="flex flex-col gap-4">
      <ExampleNote />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div role="group" aria-label="Group by" className="inline-flex rounded-lg border border-border bg-card p-0.5">
          {GROUPINGS.map((g) => (
            <button
              key={g.key}
              type="button"
              aria-pressed={grouping === g.key}
              onClick={() => setGrouping(g.key)}
              className={cn(
                "rounded-md px-3 py-1 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                grouping === g.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">Last 30 days</p>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
              <th className="px-3 py-2 text-left">{GROUPINGS.find((g) => g.key === grouping)?.label}</th>
              <th className="px-3 py-2 text-right">Units kept</th>
              <th className="px-3 py-2 text-right">Real price</th>
              <th className="px-3 py-2 text-right">Discount</th>
              <th className="px-3 py-2 text-right">Real cost</th>
              <th className="px-3 py-2 text-right">Real revenue</th>
              <th className="px-3 py-2 text-right">Real profit</th>
              <th className="px-3 py-2 text-right">Real margin</th>
              <th className="px-3 py-2 text-right">Shopify says</th>
              <th className="px-3 py-2 text-right">Gap</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const gap = r.shopifyMarginPct - r.realMarginPct;
              return (
                <tr key={r.name} className="border-b border-border last:border-b-0 hover:bg-muted/40">
                  <td className="px-3 py-2 whitespace-nowrap">{r.name}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatNumber(r.unitsKept)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(r.realPrice)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.discountPct.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatCurrency(r.realCost)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{formatWholeMoney(r.realRevenue)}</td>
                  <td className="px-3 py-2 text-right font-semibold tabular-nums">{formatWholeMoney(r.realProfit)}</td>
                  <td className="px-3 py-2 text-right tabular-nums">{r.realMarginPct.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{r.shopifyMarginPct.toFixed(1)}%</td>
                  <td className="px-3 py-2 text-right">
                    <StatusBadge tone={gapTone(gap)}>−{gap.toFixed(1)} pts</StatusBadge>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-border font-semibold">
              <td className="px-3 py-2">All</td>
              <td colSpan={4} />
              <td className="px-3 py-2 text-right tabular-nums">{formatWholeMoney(p.realRevenue)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{formatWholeMoney(p.realProfit)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{p.realMarginPct.toFixed(1)}%</td>
              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{p.shopifyMarginPct.toFixed(1)}%</td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Section title="How each figure is made">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li><b>Real price</b>: what customers paid per unit kept, after discounts, from your orders.</li>
            <li><b>Real cost</b>: the cost from your tables (goods, freight and duty) in force on each sale&apos;s date.</li>
            <li><b>Real revenue</b>: units kept × real price. Returned units are taken out.</li>
            <li><b>Real profit</b>: real revenue minus units kept × real cost.</li>
          </ul>
        </Section>
        <Section title="Where else it lands">
          <p className="text-sm">
            Once applied, the same real cost feeds Product Analyst&apos;s True Profit and Costs, the Dashboard&apos;s margins,
            Discount Decisions and Foresight: one cost, the same on every page.
          </p>
        </Section>
      </div>
    </div>
  );
}
