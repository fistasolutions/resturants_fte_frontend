"use client";

import { ArrowRight } from "lucide-react";

import { ShallowLink } from "@/components/shared/shallow-link";
import { buttonVariants } from "@/components/ui/button";
import { useDataManager } from "@/features/data-manager/data-manager-context";
import { ExampleNote, Section, Tiles } from "@/features/data-manager/parts";
import { dataTabHref, type DataTab } from "@/lib/data-manager";
import { formatDateTime, formatNumber, formatWholeMoney } from "@/utils/format";

/** Overview (SPEC-374): the real figures first, then what needs the owner and what the employee did. */
export function OverviewTab() {
  const { data, uploads, applied } = useDataManager();
  const p = data.profit;
  const gap = p.shopifyMarginPct - p.realMarginPct;
  const rowsCopied =
    data.tables.reduce((sum, t) => sum + t.rowCount, 0) + uploads.reduce((sum, t) => sum + t.rowCount, 0);
  const tableCount = data.tables.length + uploads.length;

  const needs: { tone: string; title: string; detail: string; tab: DataTab }[] = [
    ...(applied
      ? []
      : [{ tone: "bg-warning", title: `${data.pending.changes.length} changes waiting to apply`, detail: `${data.pending.table} changed since the last read.`, tab: "changes" as const }]),
    { tone: "bg-warning", title: `${formatNumber(data.matches.notInShopify)} rows not matched to a product`, detail: "Style codes in your tables that your store does not have.", tab: "matching" },
    { tone: "bg-info", title: `${formatNumber(data.matches.needsLook)} rows need a look`, detail: "The name looks right, the code does not.", tab: "matching" },
  ];

  return (
    <div className="flex flex-col gap-4">
      <ExampleNote />
      <Tiles
        tiles={[
          { label: "Real revenue · 30d", value: formatWholeMoney(p.realRevenue), note: "after discounts and returns, from your orders" },
          { label: "Real profit · 30d", value: formatWholeMoney(p.realProfit), note: "revenue minus the real cost from your tables" },
          { label: "Real margin", value: `${p.realMarginPct.toFixed(1)}%`, note: `${gap.toFixed(1)} pts below Shopify's cost (${p.shopifyMarginPct.toFixed(1)}%)`, tone: gap > 5 ? "warning" : "default" },
          { label: "Cost coverage", value: `${p.costCoveragePct.toFixed(1)}%`, note: `${formatNumber(p.variantsWithCost)} of ${formatNumber(p.variants)} variants have a real cost` },
          { label: "Rows copied", value: formatNumber(rowsCopied), note: `from ${tableCount} tables, exactly as written` },
        ]}
      />
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Section title="Needs you" description="Each one opens the tab that settles it." className="xl:col-span-2">
          <ul className="divide-y divide-border">
            {needs.map((item) => (
              <li key={item.title} className="flex items-center gap-3 py-2.5">
                <span className={`size-2 shrink-0 rounded-full ${item.tone}`} aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                </div>
                <ShallowLink href={dataTabHref(item.tab)} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  Open
                  <ArrowRight aria-hidden />
                </ShallowLink>
              </li>
            ))}
          </ul>
        </Section>
        <Section title="What it did last" description="Newest first.">
          <ul className="divide-y divide-border">
            {data.activity.map((item) => (
              <li key={item.title} className="flex gap-3 py-2.5">
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-ai" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.detail}</p>
                  <p className="text-[11px] text-muted-foreground">{formatDateTime(item.at)}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      </div>
    </div>
  );
}
