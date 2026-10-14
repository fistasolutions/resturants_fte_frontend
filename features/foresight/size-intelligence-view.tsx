import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { SizeIntelligence, SizeRow, SizeTone } from "@/types/foresight";
import { formatCompactCurrency } from "@/utils/format";
import { GlispIcon } from "@/components/shared/glisp-icon";

const VERDICT: Record<SizeTone, string> = {
  good: "text-success",
  warn: "text-warning",
  bad: "text-destructive",
  muted: "text-muted-foreground",
};

function Bar({ pct, tone }: { pct: number; tone: string }) {
  return (
    <div className="h-[9px] overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full ${tone}`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  );
}

function SizeRowView({ row }: { row: SizeRow }) {
  return (
    <div className="grid grid-cols-[36px_1fr_120px] items-center gap-3 border-b border-border py-2.5 last:border-0 sm:grid-cols-[44px_1fr_150px]">
      <span className="text-sm font-bold">{row.size}</span>
      <div className="flex flex-col gap-1">
        <Bar pct={(row.sell_through ?? 0) * 100} tone="bg-success" />
        <Bar pct={(row.return_rate ?? 0) * 100} tone="bg-warning" />
      </div>
      <span className={`text-right text-[11px] font-semibold ${VERDICT[row.tone]}`}>{row.verdict}</span>
    </div>
  );
}

function Kpi({ label, value, sub, risk }: { label: string; value: string; sub: string; risk?: boolean }) {
  return (
    <Card className="gap-1.5 p-4">
      <span className="text-[10.5px] font-semibold tracking-wide text-muted-foreground uppercase">{label}</span>
      <span className={`font-heading text-2xl tracking-tight tabular-nums ${risk ? "text-destructive" : ""}`}>
        {value}
      </span>
      <span className="text-[11.5px] text-muted-foreground">{sub}</span>
    </Card>
  );
}

/** Foresight → Size Intelligence (SPEC-153): the whole catalog's sell-through vs return
 * rate by size with a buy-signal verdict, an AI read, and the money at stake. */
export function SizeIntelligenceView({ data }: { data: SizeIntelligence }) {
  if (!data.has_data || data.sizes.length === 0) {
    return (
      <Card className="border border-dashed border-border bg-muted/30 px-6 py-10 text-center">
        <p className="text-sm text-muted-foreground">
          No catalog sales in this period to read a size signal yet.
        </p>
      </Card>
    );
  }

  const { kpis } = data;
  return (
    <div className="space-y-4">
      <Card className="overflow-hidden p-0">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">⇅ Sell-through vs returns by size — the whole catalog</h3>
          <div className="flex gap-4 text-[10.5px] text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block size-2 rounded-[2px] bg-success" aria-hidden />
              Sell-through
            </span>
            <span className="inline-flex items-center gap-1.5">
              <i className="inline-block size-2 rounded-[2px] bg-warning" aria-hidden />
              Return rate
            </span>
          </div>
        </div>

        <div className="px-4 py-1">
          {data.sizes.map((row) => (
            <SizeRowView key={row.size} row={row} />
          ))}
        </div>

        {data.ai_read && (
          <div className="flex items-start gap-2.5 border-t border-ai/25 bg-ai/5 px-4 py-3">
            <GlispIcon className="mt-0.5 size-4 shrink-0 text-ai" aria-hidden />
            <p className="text-sm text-ai">
              <span className="font-semibold">AI read: </span>
              {data.ai_read}
            </p>
          </div>
        )}
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi
          label="Selling out — restock"
          value={kpis.understocked.length ? kpis.understocked.join(", ") : "None"}
          sub={kpis.understocked.length ? "high sell-through — buy deeper" : "no size is sold out"}
        />
        <Kpi
          label="At markdown risk"
          value={formatCompactCurrency(kpis.markdown_risk)}
          sub={
            kpis.over_bought.length
              ? `over-bought stock — ${kpis.over_bought.join(", ")}`
              : "retail value of slow-moving stock"
          }
          risk
        />
        <Kpi
          label="Return value — sized items"
          value={formatCompactCurrency(kpis.return_value)}
          sub="est. retail value returned"
          risk
        />
      </div>

      <div className="flex items-center justify-between text-[11.5px] text-muted-foreground">
        <span>
          Sell-through = units sold ÷ (units sold + on-hand). Return rate is live from Loop.
        </span>
        <Link
          href="/returns?tab=sizing"
          className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
        >
          Per-style deep-dive <ArrowRight className="size-3.5" aria-hidden />
        </Link>
      </div>
    </div>
  );
}
