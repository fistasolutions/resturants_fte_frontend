"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import type { ProfitBridgeStep, ProfitLens, ProfitProduct } from "@/types/foresight";
import { formatCompactCurrency, formatCurrency, formatNumber, formatPercent } from "@/utils/format";
import { GlispIcon } from "@/components/shared/glisp-icon";

const PAGE_SIZE = 12;

const PILL: Record<ProfitProduct["verdict_tone"], string> = {
  good: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning",
  bad: "bg-destructive/15 text-destructive",
  muted: "bg-muted text-muted-foreground",
};

const BAR: Record<ProfitBridgeStep["kind"], string> = {
  gross: "bg-muted-foreground/35",
  cogs: "bg-warning/70",
  discounts: "bg-destructive/70",
  returns: "bg-warning/50",
  net: "bg-success",
};

const CAP: Record<ProfitBridgeStep["kind"], string> = {
  gross: "text-foreground",
  cogs: "text-warning",
  discounts: "text-destructive",
  returns: "text-warning",
  net: "text-success",
};

function delta(pct: number | null, unit: "%" | "pts"): { text: string; cls: string } | null {
  if (pct === null) return null;
  const up = pct >= 0;
  const arrow = up ? "▲" : "▼";
  const val = unit === "%" ? `${Math.abs(pct)}%` : `${Math.abs(pct)} pts`;
  return { text: `${arrow} ${val} vs prior`, cls: up ? "text-success" : "text-destructive" };
}

function Kpi({
  label,
  value,
  tone,
  sub,
  subCls,
}: {
  label: string;
  value: string;
  tone?: string;
  sub?: string;
  subCls?: string;
}) {
  return (
    <Card className="relative gap-1.5 p-4">
      <span className="pr-6 text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </span>
      <ExplainButton target={{ metric: label, value, detail: sub }} />
      <span className={`font-heading text-2xl tracking-tight tabular-nums ${tone ?? ""}`}>{value}</span>
      {sub && <span className={`text-[11.5px] ${subCls ?? "text-muted-foreground"}`}>{sub}</span>}
    </Card>
  );
}

function ProfitBridge({ steps }: { steps: ProfitBridgeStep[] }) {
  const gross = steps.find((s) => s.kind === "gross")?.amount ?? 0;
  const height = (amt: number) => (gross ? Math.max(4, (Math.abs(amt) / gross) * 100) : 4);
  return (
    <div className="flex h-52 items-end gap-2.5 pt-2 sm:gap-4">
      {steps.map((s) => (
        <div key={s.kind} className="flex h-full flex-1 flex-col items-center justify-end">
          <span className={`mb-1.5 text-sm font-bold tabular-nums ${CAP[s.kind]}`}>
            {s.amount < 0 ? "−" : ""}
            {formatCompactCurrency(Math.abs(s.amount))}
          </span>
          <div
            className={`w-full rounded-t-md ${BAR[s.kind]}`}
            style={{ height: `${height(s.amount)}%` }}
          />
          <span className="mt-1.5 text-center text-[10.5px] leading-tight text-muted-foreground">
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

function ProductTable({ products }: { products: ProfitProduct[] }) {
  const [page, setPage] = useState(0);
  const pages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const slice = products.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);
  const TH = "px-3 py-2 text-right text-[11px] font-medium text-muted-foreground";

  return (
    <Card className="gap-3 p-4">
      <h3 className="text-[13px] font-semibold">Margin by product — your real winners &amp; losers</h3>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[12.5px]">
          <thead>
            <tr className="border-b border-border">
              <th className="py-2 pr-3 text-left text-[11px] font-medium text-muted-foreground">Style</th>
              <th className={TH}>Units</th>
              <th className={TH}>Gross</th>
              <th className={TH}>Net margin</th>
              <th className={TH}>Margin %</th>
              <th className="py-2 pl-3 text-left text-[11px] font-medium text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {slice.map((p) => (
              <tr key={p.product_id} className="border-b border-border/60 last:border-0">
                <td className="max-w-[15rem] truncate py-2.5 pr-3 font-medium" title={p.title}>
                  {p.title}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatNumber(p.units)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">{formatCurrency(p.gross_revenue)}</td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {p.product_margin === null ? "—" : formatCurrency(p.product_margin)}
                </td>
                <td className={`px-3 py-2.5 text-right tabular-nums ${p.margin_pct !== null && p.margin_pct < 0 ? "text-destructive" : ""}`}>
                  {p.margin_pct === null ? "—" : formatPercent(p.margin_pct)}
                </td>
                <td className="py-2.5 pl-3">
                  <span className={`inline-block rounded-md px-2 py-0.5 text-[11px] font-medium ${PILL[p.verdict_tone]}`}>
                    {p.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <button type="button" onClick={() => setPage(current - 1)} disabled={current === 0} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:bg-muted/40 disabled:opacity-40">
            <ChevronLeft className="size-3.5" aria-hidden /> Prev
          </button>
          <span className="tabular-nums">{current + 1} / {pages}</span>
          <button type="button" onClick={() => setPage(current + 1)} disabled={current >= pages - 1} className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:bg-muted/40 disabled:opacity-40">
            Next <ChevronRight className="size-3.5" aria-hidden />
          </button>
        </div>
      )}
      <p className="text-[11px] text-muted-foreground">
        Net margin = revenue − COGS − allocated discount; needs a per-variant cost to count.
      </p>
    </Card>
  );
}

export function ProfitLensView({ data }: { data: ProfitLens }) {
  const s = data.summary;
  const gd = delta(s.gross_delta_pct, "%");
  const nd = delta(s.net_delta_pct, "%");
  const md = delta(s.margin_delta_pts, "pts");

  return (
    <div className="space-y-3">
      {/* 4 headline tiles */}
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Gross sales" value={formatCompactCurrency(s.gross_sales)} sub={gd?.text} subCls={gd?.cls} />
        <Kpi
          label="Net profit"
          value={formatCompactCurrency(s.net_profit)}
          tone="text-success"
          sub={nd?.text}
          subCls={nd?.cls}
        />
        <Kpi
          label="Net margin"
          value={s.net_margin_pct === null ? "—" : formatPercent(s.net_margin_pct)}
          sub={md?.text}
          subCls={md?.cls}
        />
        <Kpi
          label="Lost to leaks"
          value={formatCompactCurrency(s.lost_to_leaks)}
          tone="text-destructive"
          sub="COGS + discounts + returns"
        />
      </div>

      {/* Profit bridge */}
      <Card className="gap-3 p-4">
        <h3 className="text-[13px] font-semibold">◈ Where the money went — the profit bridge</h3>
        <ProfitBridge steps={data.bridge} />
        {data.ai_read && (
          <div className="rounded-lg border border-ai/25 bg-ai/5 px-3.5 py-2.5 text-[12.5px] leading-relaxed text-foreground">
            <span className="inline-flex items-center gap-1 font-semibold text-ai">
              <GlispIcon className="size-3.5" aria-hidden /> AI read:
            </span>{" "}
            {data.ai_read}
          </div>
        )}
        {s.coverage_pct < 100 && (
          <p className="text-[11px] text-muted-foreground">
            {formatPercent(s.coverage_pct)} of revenue has a known cost — net profit is optimistic where costs are missing.
          </p>
        )}
      </Card>

      <ProductTable products={data.products} />
    </div>
  );
}
