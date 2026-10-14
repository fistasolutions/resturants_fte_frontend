import { CircleAlert } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { SectionCard } from "@/features/analysis/section-card";
import { SimpleTable } from "@/features/analysis/simple-table";
import { ChatMarkdown } from "@/features/chat/chat-markdown";
import { ExportPdfButton } from "@/features/reports/export-pdf-button";
import { parseReportSections } from "@/lib/report-sections";
import type { ReportDetail } from "@/types/reports";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";
import { GlispIcon } from "@/components/shared/glisp-icon";

interface ReportViewerProps {
  report: ReportDetail;
}

function delta(change: number | null | undefined): string | null {
  if (change === null || change === undefined) return null;
  return `${change > 0 ? "▲" : change < 0 ? "▼" : ""} ${Math.abs(change)}% vs prior day`;
}

function KpiTile({
  label,
  value,
  change,
}: {
  label: string;
  value: string;
  change?: string | null;
}) {
  return (
    <Card className="relative gap-1 px-4 py-3">
      <p className="pr-6 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <ExplainButton target={{ metric: label, value, detail: change }} />
      <p className="text-2xl font-bold tracking-tight">{value}</p>
      {change && <p className="text-xs text-muted-foreground">{change}</p>}
    </Card>
  );
}

function AiSection({
  title,
  tone,
  content,
}: {
  title: string;
  tone: "risk" | "upside" | "action";
  content: string;
}) {
  const toneLabel =
    tone === "risk" ? "WATCH" : tone === "upside" ? "UPSIDE" : "DO NEXT";
  return (
    <Card
      className={`gap-2 px-4 py-4 ${tone === "action" ? "lg:col-span-2" : ""}`}
    >
      <div className="flex items-center gap-2">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {toneLabel}
        </p>
        <Badge variant="outline" className="ml-auto gap-1 font-normal text-muted-foreground">
          <GlispIcon className="size-3" aria-hidden /> AI analysis
        </Badge>
      </div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ChatMarkdown content={content} />
    </Card>
  );
}

/** Structured daily report (SPEC-025): numbers from the stored metrics,
 * judgment from the AI narrative. Falls back to full Markdown for legacy or
 * unstructured reports — never a blank page. */
export function ReportViewer({ report }: ReportViewerProps) {
  const metrics = report.metrics ?? {};
  const sections = parseReportSections(report.content_md);
  const sales = metrics.sales;

  if (!sections.structured || !sales) {
    return (
      <Card className="gap-4 px-6 py-6">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {formatDate(report.report_date)} · generated{" "}
            {report.generated_by === "ai" ? "by AI" : "deterministically"}
          </p>
          <Badge variant="outline" className="ml-auto font-normal text-muted-foreground">
            {report.generated_by === "ai" ? "AI narrative" : "Fallback"}
          </Badge>
        </div>
        <ChatMarkdown content={report.content_md} />
      </Card>
    );
  }

  const customers = metrics.customers;
  const refunds = metrics.refunds;
  const counts = metrics.inventory_counts;

  return (
    <div className="min-w-0 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Executive report
          </p>
          <h2 className="font-heading text-xl tracking-wide">
            Daily Report
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {formatDate(report.report_date)} · generated{" "}
            {report.generated_by === "ai" ? "by AI" : "deterministically"}
          </p>
        </div>
        <ExportPdfButton date={report.report_date} scope={report.scope ?? "all"} />
      </div>

      <section
        aria-label="Key figures"
        className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6"
      >
        <KpiTile
          label="Revenue"
          value={formatCurrency(sales.gross_revenue)}
          change={delta(sales.change_pct?.gross_revenue)}
        />
        <KpiTile
          label="Orders"
          value={formatNumber(sales.orders)}
          change={delta(sales.change_pct?.orders)}
        />
        <KpiTile
          label="Avg order value"
          value={formatCurrency(sales.aov)}
          change={delta(sales.change_pct?.aov)}
        />
        <KpiTile
          label="Returning"
          value={customers ? `${customers.returning_rate_pct}%` : "—"}
        />
        <KpiTile
          label="New customers"
          value={customers ? formatNumber(customers.new) : "—"}
        />
        <KpiTile
          label="Refunds"
          value={formatCurrency(sales.refunds_total)}
          change={refunds ? `${refunds.pct_of_revenue}% of revenue` : null}
        />
      </section>

      {sections.summary && (
        <Card className="gap-2 px-4 py-4">
          <div className="flex items-center gap-2">
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Summary
            </p>
            <Badge variant="outline" className="ml-auto gap-1 font-normal text-muted-foreground">
              <GlispIcon className="size-3" aria-hidden /> AI analysis
            </Badge>
          </div>
          <ChatMarkdown content={sections.summary} />
        </Card>
      )}

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard title="Top products" headline="winners">
          <SimpleTable
            headers={["Product", "Units", "Revenue"]}
            rows={(metrics.top_products ?? []).map((p) => [
              p.title,
              formatNumber(p.units),
              formatCurrency(p.revenue),
            ])}
            emptyMessage="No product sales on this day."
          />
        </SectionCard>

        <SectionCard
          title="Worst products"
          headline={
            metrics.zero_sales
              ? `${formatNumber(metrics.zero_sales.total_products)} products sold nothing`
              : "laggards"
          }
        >
          <SimpleTable
            headers={["Product", "Units", "Revenue", "Stock left"]}
            rows={(metrics.worst_products ?? []).map((p) => [
              p.title,
              formatNumber(p.units),
              formatCurrency(p.revenue),
              formatNumber(p.stock),
            ])}
            emptyMessage="No laggards recorded for this day."
          />
        </SectionCard>

        <SectionCard
          title="Low & out of stock"
          headline={
            counts
              ? `${formatNumber(counts.out_of_stock)} out · ${formatNumber(counts.low_stock)} low`
              : undefined
          }
          estimate="days of cover at last-30-days sales pace"
        >
          <SimpleTable
            headers={["Product", "Sold (30d)", "On hand", "Days cover"]}
            rows={(metrics.reorder_alerts ?? []).map((r) => [
              r.title,
              formatNumber(r.units),
              formatNumber(r.stock),
              `${r.days_of_cover}d`,
            ])}
            emptyMessage="Nothing is about to run out."
          />
        </SectionCard>

        <SectionCard title="Largest discounts">
          <SimpleTable
            headers={["Code", "Status", "Times used"]}
            rows={(metrics.top_discounts?.top ?? []).map((d) => [
              d.code,
              d.status,
              formatNumber(d.usage_count),
            ])}
            emptyMessage="No discount data for this day."
          />
        </SectionCard>

        <SectionCard title="Sales by channel">
          <SimpleTable
            headers={["Channel", "Orders", "Revenue"]}
            rows={(metrics.channels ?? []).map((c) => [
              c.channel,
              formatNumber(c.orders),
              formatCurrency(c.revenue),
            ])}
            emptyMessage="No channel data for this day."
          />
        </SectionCard>

        <SectionCard title="Top customers">
          <SimpleTable
            headers={["Customer", "Orders", "Spent"]}
            rows={(metrics.top_customers ?? []).map((c) => [
              c.name ?? c.email ?? `#${c.customer_id}`,
              formatNumber(c.orders),
              formatCurrency(c.spent),
            ])}
            emptyMessage="No customer purchases on this day."
          />
        </SectionCard>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {sections.risks && (
          <AiSection title="Business risks" tone="risk" content={sections.risks} />
        )}
        {sections.opportunities && (
          <AiSection
            title="Opportunities"
            tone="upside"
            content={sections.opportunities}
          />
        )}
        {sections.actions && (
          <AiSection
            title="Recommended actions"
            tone="action"
            content={sections.actions}
          />
        )}
      </section>

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <CircleAlert className="size-3.5 shrink-0" aria-hidden />
        Figures computed by the backend from synchronized Shopify data;
        interpretation written by the AI analyst from those figures only.
      </p>
    </div>
  );
}
