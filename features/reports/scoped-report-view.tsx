import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { SectionCard } from "@/features/analysis/section-card";
import { ChatMarkdown } from "@/features/chat/chat-markdown";
import { GenerateReportButton } from "@/features/reports/generate-report-button";
import { ScopeTrendChart } from "@/features/reports/scope-trend-chart";
import { parseReportSections } from "@/lib/report-sections";
import type { ReportDetail, ScopedReportMetrics } from "@/types/reports";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

interface ScopedReportViewProps {
  report: ReportDetail;
  scopeName: string;
}

function delta(change: number | null | undefined): string | null {
  if (change === null || change === undefined) return null;
  return `${change > 0 ? "▲" : change < 0 ? "▼" : ""} ${Math.abs(change)}% vs prior day`;
}

function Tile({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string | null;
}) {
  return (
    <Card className="relative gap-1 px-4 py-3">
      <p className="pr-6 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <ExplainButton target={{ metric: label, value, detail: note }} />
      <p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p>
      {note && <p className="text-xs text-muted-foreground">{note}</p>}
    </Card>
  );
}

/**
 * A brand/location tab's report (SPEC-033): KPI row → margin (always with its
 * coverage badge, never an invented 0%) → top products → the AI narrative.
 */
export function ScopedReportView({ report, scopeName }: ScopedReportViewProps) {
  const metrics = report.metrics as ScopedReportMetrics;
  const sales = metrics.sales;
  const margin = metrics.margin;
  const sections = parseReportSections(report.content_md);
  // A location that never sells but holds stock is a warehouse — lead with
  // shelf inventory instead of a wall of $0 tiles (SPEC-034 Patches).
  const inventoryOnly =
    metrics.shelf !== undefined &&
    (sales?.orders ?? 0) === 0 &&
    (metrics.shelf?.units_on_hand ?? 0) > 0;
  // No sales AND no stock = an empty Shopify placeholder location. The
  // picker no longer offers these (backend SPEC-026 Patches); old URLs get
  // an honest explanation instead of a wall of zeros that reads as a bug.
  const emptyLocation =
    metrics.shelf !== undefined &&
    (sales?.orders ?? 0) === 0 &&
    (metrics.shelf?.units_on_hand ?? 0) === 0;

  const header = (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="text-sm text-muted-foreground">
        {scopeName} · {formatDate(report.report_date)} · generated{" "}
        {report.generated_by === "ai" ? "by AI" : "deterministically"}
      </p>
      <GenerateReportButton
        date={report.report_date}
        scope={report.scope ?? "all"}
        variant="regenerate"
      />
    </div>
  );

  if (emptyLocation) {
    // Nothing to show but zeros — say so instead of rendering them.
    return (
      <div className="space-y-4">
        {header}
        <Card className="border-dashed px-4 py-3">
          <p className="text-sm text-muted-foreground">
            This location has no orders attributed and holds no sellable
            stock in Shopify — there is nothing to report here. It no longer
            appears in the location picker; pick another location or brand
            above.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {header}

      {/* AI Summary first — insight before numbers (SPEC-045). */}
      {sections.structured && sections.summary && !inventoryOnly && (
        <SectionCard title="Summary">
          <ChatMarkdown content={sections.summary} />
        </SectionCard>
      )}

      {inventoryOnly && (
        <Card className="border-dashed px-4 py-3">
          <p className="text-sm text-muted-foreground">
            No sales are attributed to this location — it appears to be a
            fulfillment/warehouse location (or its POS register isn’t assigned
            in Shopify). Shelf inventory below.
          </p>
        </Card>
      )}

      {sales && !inventoryOnly && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Tile
            label="Gross revenue"
            value={formatCurrency(sales.gross_revenue)}
            note={delta(metrics.sales?.change_pct?.gross_revenue)}
          />
          <Tile
            label="Orders"
            value={formatNumber(sales.orders)}
            note={delta(metrics.sales?.change_pct?.orders)}
          />
          <Tile label="Units" value={formatNumber(sales.units)} />
          <Tile label="AOV" value={formatCurrency(sales.aov)} />
          {metrics.customers && (
            <Tile label="Customers" value={formatNumber(metrics.customers.active)} />
          )}
          {metrics.refunds != null && (
            <Tile
              label="Refunds"
              value={formatCurrency(metrics.refunds.total)}
              note={`${formatNumber(metrics.refunds.count)} refunds`}
            />
          )}
        </div>
      )}

      {!inventoryOnly && (metrics.sales_last_week || metrics.share || metrics.rank) && (
        <p className="text-sm text-muted-foreground">
          {metrics.share && metrics.share.rank !== null && (
            <>
              <span className="font-medium text-foreground">
                #{metrics.share.rank}
              </span>{" "}
              of {metrics.share.brands_selling} brands ·{" "}
              <span className="font-medium text-foreground">
                {metrics.share.share_pct}%
              </span>{" "}
              of store revenue that day.{" "}
            </>
          )}
          {metrics.rank && metrics.rank.rank !== null && (
            <>
              <span className="font-medium text-foreground">
                #{metrics.rank.rank}
              </span>{" "}
              of {metrics.rank.of_locations} locations by revenue that day.{" "}
            </>
          )}
          {metrics.sales_last_week && (
            <>
              Same day last week: {formatCurrency(metrics.sales_last_week.gross_revenue)}{" "}
              ({formatNumber(metrics.sales_last_week.orders)} orders)
              {metrics.sales_last_week.change_pct.gross_revenue !== null &&
                ` — ${metrics.sales_last_week.change_pct.gross_revenue > 0 ? "up" : "down"} ${Math.abs(metrics.sales_last_week.change_pct.gross_revenue)}% week over week`}
              .
            </>
          )}
        </p>
      )}

      {!inventoryOnly && metrics.trend && metrics.trend.length > 1 && (
        <SectionCard title="Revenue trend" headline="last 7 days">
          <ScopeTrendChart data={metrics.trend} />
        </SectionCard>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {metrics.location_split && metrics.location_split.length > 0 && (
          <SectionCard title="Where it sold" headline="by location">
            <ul className="divide-y divide-border/60 text-sm">
              {metrics.location_split.map((row) => (
                <li key={row.location} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0 truncate">{row.location}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatNumber(row.units)} units · {formatCurrency(row.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
        {metrics.channels && metrics.channels.length > 0 && (
          <SectionCard title="Sales by channel">
            <ul className="divide-y divide-border/60 text-sm">
              {metrics.channels.map((row) => (
                <li key={row.channel} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0 truncate">{row.channel}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatNumber(row.orders)} orders · {formatCurrency(row.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
        {metrics.top_brands && metrics.top_brands.length > 0 && (
          <SectionCard title="Top brands at this location">
            <ul className="divide-y divide-border/60 text-sm">
              {metrics.top_brands.map((row) => (
                <li key={row.vendor} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0 truncate">{row.vendor}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {formatNumber(row.units)} units · {formatCurrency(row.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
        {metrics.inventory &&
          (metrics.inventory.stockout_risks.length > 0 ||
            metrics.inventory.oversold_variants > 0) && (
            <SectionCard title="Inventory health" headline="this brand">
              {metrics.inventory.oversold_variants > 0 && (
                <p className="text-sm text-destructive">
                  {formatNumber(metrics.inventory.oversold_variants)} oversold
                  variants (negative availability) — review tracking.
                </p>
              )}
              {metrics.inventory.stockout_risks.length > 0 && (
                <ul className="divide-y divide-border/60 text-sm">
                  {metrics.inventory.stockout_risks.map((row) => (
                    <li key={row.title} className="flex items-baseline justify-between gap-3 py-1.5">
                      <span className="min-w-0 truncate">{row.title}</span>
                      <span className="shrink-0 text-muted-foreground tabular-nums">
                        {row.days_of_cover}d of cover · {formatNumber(row.stock)} left
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </SectionCard>
          )}
        {metrics.markdown && metrics.markdown.products_on_markdown > 0 && (
          <SectionCard
            title="Markdown status"
            headline={`${formatNumber(metrics.markdown.products_on_markdown)} on markdown`}
          >
            <ul className="divide-y divide-border/60 text-sm">
              {metrics.markdown.deepest.map((row) => (
                <li key={row.title} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0 truncate">{row.title}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {row.markdown_pct}% off
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
        {metrics.returns && metrics.returns.products.length > 0 && (
          <SectionCard title="Returns" estimate={metrics.returns.basis}>
            <ul className="divide-y divide-border/60 text-sm">
              {metrics.returns.products.map((row) => (
                <li key={row.title} className="flex items-baseline justify-between gap-3 py-1.5">
                  <span className="min-w-0 truncate">{row.title}</span>
                  <span className="shrink-0 text-muted-foreground tabular-nums">
                    {row.return_rate_pct !== null ? `${row.return_rate_pct}% rate · ` : ""}
                    {formatCurrency(row.attributed_refund)}
                  </span>
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
        {metrics.unfulfilled && metrics.unfulfilled.total > 0 && (
          <SectionCard
            title="Unfulfilled orders"
            headline={`${formatNumber(metrics.unfulfilled.total)} open`}
          >
            <dl className="grid grid-cols-3 gap-2 text-sm">
              {(
                [
                  ["0–24h", metrics.unfulfilled.h0_24, false],
                  ["24–48h", metrics.unfulfilled.h24_48, false],
                  ["48h+", metrics.unfulfilled.h48_plus, true],
                ] as const
              ).map(([label, count, danger]) => (
                <div key={label} className="rounded-lg bg-muted/50 px-3 py-2">
                  <dt className="text-xs text-muted-foreground">{label}</dt>
                  <dd
                    className={`font-semibold tabular-nums ${danger && count > 0 ? "text-destructive" : ""}`}
                  >
                    {formatNumber(count)}
                  </dd>
                </div>
              ))}
            </dl>
          </SectionCard>
        )}
        {metrics.shelf && (
          <SectionCard title="Shelf health" headline="at this location">
            <dl className="grid grid-cols-3 gap-2 text-sm">
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Low stock</dt>
                <dd className="font-semibold tabular-nums">
                  {formatNumber(metrics.shelf.low_stock_variants)} variants
                </dd>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Units on hand</dt>
                <dd className="font-semibold tabular-nums">
                  {formatNumber(metrics.shelf.units_on_hand)}
                </dd>
              </div>
              <div className="rounded-lg bg-muted/50 px-3 py-2">
                <dt className="text-xs text-muted-foreground">Stock value</dt>
                <dd className="font-semibold tabular-nums">
                  {formatCurrency(metrics.shelf.stock_value)}
                </dd>
              </div>
            </dl>
          </SectionCard>
        )}
        {metrics.peak_hours && metrics.peak_hours.some((h) => h.orders > 0) && (
          <SectionCard title="Peak hours" headline="UTC">
            <ul className="space-y-1.5 text-sm">
              {[...metrics.peak_hours]
                .filter((h) => h.orders > 0)
                .sort((a, b) => b.orders - a.orders)
                .slice(0, 5)
                .map((h, _index, top) => (
                  <li key={h.hour_utc} className="flex items-center gap-2">
                    <span className="w-12 shrink-0 text-xs text-muted-foreground tabular-nums">
                      {String(h.hour_utc).padStart(2, "0")}:00
                    </span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                      <span
                        className="block h-full rounded-full bg-chart-1"
                        style={{ width: `${(h.orders / top[0].orders) * 100}%` }}
                        aria-hidden
                      />
                    </span>
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                      {formatNumber(h.orders)} orders
                    </span>
                  </li>
                ))}
            </ul>
          </SectionCard>
        )}
        {metrics.codes && metrics.codes.length > 0 && (
          <SectionCard title="Discount codes on these orders">
            <ul className="flex flex-wrap gap-1.5 text-xs">
              {metrics.codes.map((row) => (
                <li
                  key={row.code}
                  className="rounded-full border border-border bg-muted/50 px-2.5 py-0.5"
                >
                  {row.code} · {formatNumber(row.orders)}
                </li>
              ))}
            </ul>
          </SectionCard>
        )}
      </div>

      <Card className="gap-2 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Product margin
          </p>
          {margin && margin.margin_pct !== null && (
            <Badge variant="outline">
              based on {margin.coverage_pct}% of revenue
            </Badge>
          )}
        </div>
        {margin && margin.margin_pct !== null ? (
          <p className="text-2xl font-bold tracking-tight tabular-nums">
            {margin.margin_pct}%
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              {margin.product_margin !== null
                ? `${formatCurrency(margin.product_margin)} margin · ${formatCurrency(margin.cogs)} COGS`
                : null}
            </span>
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No cost data in this slice yet — add cost-per-item in Shopify for
            these products and margin appears here automatically.
          </p>
        )}
      </Card>

      {metrics.top_products && metrics.top_products.length > 0 && (
        <Card className="gap-2 px-4 py-3">
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Top products
          </p>
          <ul className="divide-y divide-border text-sm">
            {metrics.top_products.map((product) => (
              <li
                key={product.title}
                className="flex items-baseline justify-between gap-3 py-1.5"
              >
                <span className="min-w-0 truncate">{product.title}</span>
                <span className="shrink-0 text-muted-foreground tabular-nums">
                  {formatNumber(product.units)} units ·{" "}
                  {formatCurrency(product.revenue)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {report.generated_by === "fallback" ? (
        // The deterministic fallback text only duplicates the cards above —
        // never render it as a wall. Say why the narrative is missing instead.
        <Card className="border-dashed px-4 py-3">
          <p className="text-sm text-muted-foreground">
            The AI narrative could not be generated for this run (the data
            cards above are complete and correct). Use “Regenerate this view”
            to retry once the AI service is available.
          </p>
        </Card>
      ) : sections.structured ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {sections.risks && (
              <SectionCard title="Risks">
                <ChatMarkdown content={sections.risks} />
              </SectionCard>
            )}
            {sections.opportunities && (
              <SectionCard title="Opportunities">
                <ChatMarkdown content={sections.opportunities} />
              </SectionCard>
            )}
          </div>
          {sections.actions && (
            <SectionCard title="Recommended actions">
              <ChatMarkdown content={sections.actions} />
            </SectionCard>
          )}
        </div>
      ) : (
        <Card className="px-6 py-5">
          <ChatMarkdown content={report.content_md} />
        </Card>
      )}
    </div>
  );
}
