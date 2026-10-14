import Link from "next/link";
import type { ReactNode } from "react";

import { KpiStrip } from "@/components/shared/kpi-strip";
import { Panel } from "@/components/shared/panel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ChatMarkdown } from "@/features/chat/chat-markdown";
import { ExportPdfButton } from "@/features/reports/export-pdf-button";
import { GenerateReportButton } from "@/features/reports/generate-report-button";
import { drilldownHref, type AgeBucket } from "@/lib/order-filters";
import { parseReportSections } from "@/lib/report-sections";
import { buildReportStrip } from "@/lib/report-strip";
import { cn } from "@/lib/utils";
import type { ReportDetail } from "@/types/reports";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

/** Panel-style column headers and cells — the Dashboard's compact table (SPEC-233). */
const HEAD = "h-8 px-3 text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground";
const CELL = "px-3 py-1.5 text-xs";
const LINK =
  "rounded-sm underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring";

/** A count cell that drills down to the matching orders list (SPEC-038).
 * Opens a new tab so the report stays put; zero counts stay plain text. */
function DrilldownCell({
  row,
  count,
  age,
  className = "",
}: {
  row: { location_id: number | null; location: string };
  count: number;
  age?: AgeBucket;
  className?: string;
}) {
  if (count <= 0) {
    return <span className={className}>{formatNumber(count)}</span>;
  }
  return (
    <Link
      href={drilldownHref(row, age)}
      target="_blank"
      rel="noopener"
      aria-label={`View the ${formatNumber(count)} unfulfilled orders — ${row.location}${
        age ? `, placed ${age.replace("_", "–")}h ago` : ""
      }`}
      className={cn(LINK, className)}
    >
      {formatNumber(count)}
    </Link>
  );
}

/** Colored revenue-change badge on the report header (SPEC-045). */
function DayBadge({ changePct }: { changePct: number | null | undefined }) {
  if (changePct === null || changePct === undefined) return null;
  if (changePct > 5) {
    return (
      <span className="inline-flex items-center rounded-full border border-success/25 bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
        ↑ Strong day
      </span>
    );
  }
  if (changePct < -5) {
    return (
      <span className="inline-flex items-center rounded-full border border-warning/25 bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
        ↓ Watch closely
      </span>
    );
  }
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/50 px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
      → Flat
    </span>
  );
}

/** A hairline list row: a name on the left, its figures on the right. */
function Row({ children, trailing }: { children: ReactNode; trailing: ReactNode }) {
  return (
    <li className="flex items-baseline justify-between gap-3 px-4 py-1.5 text-[13px]">
      <span className="min-w-0 truncate">{children}</span>
      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{trailing}</span>
    </li>
  );
}

/** The narrative sections (summary, risks, opportunities, actions) share one body. */
function Prose({ content }: { content: string }) {
  return (
    <div className="px-4 py-3">
      <ChatMarkdown content={content} />
    </div>
  );
}

interface ReportV2ViewProps {
  report: ReportDetail;
  /** Period label for the section headers ("daily" default; "weekly"/"monthly"
   * for the D-08 rollup). */
  periodLabel?: string;
  /** Optional banner describing a rollup window (D-08); omitted for daily. */
  periodNote?: string;
}

/**
 * The v3 executive report (SPEC-045), compact since SPEC-288: the summary, then one
 * six-tile KPI strip, then the sections as panels in the Brief's and the Dashboard's
 * vocabulary (SPEC-231/233) — tables two-up, lists three-up, the narrative three-up —
 * so the page is figures, not padding. Every figure, drill-down and button of the
 * SPEC-045 layout survives; only the arrangement changed.
 *
 * Renders only for payloads carrying the SPEC-027 keys; older reports keep the
 * legacy viewer (Rule 7 — history is not rewritten).
 */
export function ReportV2View({
  report,
  periodLabel = "daily",
  periodNote,
}: ReportV2ViewProps) {
  const metrics = report.metrics;
  const sales = metrics.sales;
  const sections = parseReportSections(report.content_md);
  const tiles = buildReportStrip(metrics, periodLabel);
  const deadStock = metrics.dead_stock_aged;
  const sss = metrics.same_store_sales;
  const styles = topStyles(metrics);

  return (
    <div className="space-y-3">
      {periodNote && (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          {periodNote}
        </p>
      )}
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-xs text-muted-foreground">
            {formatDate(report.report_date)} ·{" "}
            {report.generated_by === "ai" ? "generated by AI" : "deterministic"} ·{" "}
            {periodLabel}
          </p>
          <DayBadge changePct={sales?.change_pct?.gross_revenue} />
        </div>
        <div className="flex items-center gap-2">
          <ExportPdfButton
            date={report.report_date}
            scope={report.scope ?? "all"}
            period={periodLabel}
          />
          <GenerateReportButton
            date={report.report_date}
            scope="all"
            variant="regenerate"
          />
        </div>
      </div>

      {/* ── AI Summary ───────────────────────────────────────────────────── */}
      {sections.structured && sections.summary && (
        <Panel title="Summary" count="AI analysis">
          <Prose content={sections.summary} />
        </Panel>
      )}

      {/* ── The six figures — Financials and Operations as one strip ──────── */}
      <KpiStrip tiles={tiles} label={`${periodLabel} figures`} />

      {/* ── The location tables: store performance | unfulfilled ─────────────
          Two five-column tables are what 1440px holds side by side; a third clips. */}
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {metrics.locations && metrics.locations.length > 0 && (
          <Panel title="Store performance" count={`${metrics.locations.length} locations`}>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(HEAD, "pl-4")}>Location</TableHead>
                  <TableHead className={cn(HEAD, "text-right")}>Orders</TableHead>
                  <TableHead className={cn(HEAD, "text-right")}>Gross revenue</TableHead>
                  <TableHead className={cn(HEAD, "text-right")}>AOV</TableHead>
                  <TableHead className={cn(HEAD, "pr-4 text-right")}>Margin</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {metrics.locations.map((row) => (
                  <TableRow key={row.location}>
                    <TableCell className={cn(CELL, "pl-4 font-medium")}>{row.location}</TableCell>
                    <TableCell className={cn(CELL, "text-right")}>{formatNumber(row.orders)}</TableCell>
                    <TableCell className={cn(CELL, "text-right font-semibold")}>
                      {formatCurrency(row.gross_revenue)}
                    </TableCell>
                    <TableCell className={cn(CELL, "text-right")}>
                      {row.aov !== null ? formatCurrency(row.aov) : "—"}
                    </TableCell>
                    <TableCell className={cn(CELL, "pr-4 text-right")}>
                      {row.margin_pct !== null ? `${row.margin_pct}%` : "—"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        )}

        {metrics.unfulfilled_by_location && metrics.unfulfilled_by_location.length > 0 && (
          <Panel title="Unfulfilled orders by location" count="opens the orders in a new tab">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={cn(HEAD, "pl-4")}>Location</TableHead>
                  <TableHead className={cn(HEAD, "text-right")}>Total</TableHead>
                  <TableHead className={cn(HEAD, "text-right")}>0–24h</TableHead>
                  <TableHead className={cn(HEAD, "text-right")}>24–48h</TableHead>
                  <TableHead className={cn(HEAD, "pr-4 text-right")}>48h+</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="tabular-nums">
                {metrics.unfulfilled_by_location.map((row) => (
                  <TableRow key={row.location}>
                    <TableCell className={cn(CELL, "pl-4 font-medium")}>
                      <Link href={drilldownHref(row)} target="_blank" rel="noopener" className={LINK}>
                        {row.location}
                      </Link>
                    </TableCell>
                    <TableCell className={cn(CELL, "text-right")}>
                      <DrilldownCell row={row} count={row.total} />
                    </TableCell>
                    <TableCell className={cn(CELL, "text-right")}>
                      <DrilldownCell row={row} count={row.h0_24} age="0_24" />
                    </TableCell>
                    <TableCell className={cn(CELL, "text-right")}>
                      <DrilldownCell row={row} count={row.h24_48} age="24_48" />
                    </TableCell>
                    <TableCell className={cn(CELL, "pr-4 text-right")}>
                      <DrilldownCell
                        row={row}
                        count={row.h48_plus}
                        age="48_plus"
                        className={row.h48_plus > 0 ? "font-semibold text-destructive" : ""}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Panel>
        )}
      </div>

      {/* ── Styles | same-store + dead stock ─────────────────────────────────
          Ten style rows on the left stand as tall as the two panels on the right.
          Top products is the first five rows of Top 10 styles (both are
          `product_performance`), so it shows only when the payload has no styles. */}
      {(styles || deadStock || (sss && sss.locations.length > 0)) && (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {styles && (
            <Panel title={styles.title} count="by revenue">
              <ol className="divide-y divide-border">
                {styles.rows.map((style, i) => (
                  <Row
                    key={style.key}
                    trailing={`${formatNumber(style.units)} units · ${formatCurrency(style.revenue)}`}
                  >
                    <span className="mr-2 text-muted-foreground tabular-nums">{i + 1}.</span>
                    {style.title}
                  </Row>
                ))}
              </ol>
            </Panel>
          )}

          {(deadStock || (sss && sss.locations.length > 0)) && (
            <div className="flex flex-col gap-3">
              {sss && sss.locations.length > 0 && (
                <Panel
                  title="Same-store sales"
                  count={`${sss.comparable_total.store_count} comparable stores`}
                  aside={
                    <span>
                      <span className={changeClass(sss.comparable_total.change_pct)}>
                        {changeLabel(sss.comparable_total.change_pct)}
                      </span>{" "}
                      vs prior period
                    </span>
                  }
                >
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className={cn(HEAD, "pl-4")}>Location</TableHead>
                        <TableHead className={cn(HEAD, "text-right")}>This period</TableHead>
                        <TableHead className={cn(HEAD, "text-right")}>Prior period</TableHead>
                        <TableHead className={cn(HEAD, "pr-4 text-right")}>Change</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody className="tabular-nums">
                      {sss.locations.map((row) => (
                        <TableRow key={row.location}>
                          <TableCell className={cn(CELL, "pl-4 font-medium")}>{row.location}</TableCell>
                          <TableCell className={cn(CELL, "text-right")}>
                            {formatCurrency(row.current_revenue)}
                          </TableCell>
                          <TableCell className={cn(CELL, "text-right")}>
                            {formatCurrency(row.previous_revenue)}
                          </TableCell>
                          <TableCell className={cn(CELL, "pr-4 text-right font-semibold", changeClass(row.change_pct))}>
                            {changeLabel(row.change_pct)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Panel>
              )}
              {deadStock && (
                <Panel title="Aged dead stock" count="value tied up · by last sale">
                  <dl className="grid grid-cols-3 divide-x divide-border">
                    {(
                      [
                        ["30–60 days", deadStock.buckets.d30_60],
                        ["60–90 days", deadStock.buckets.d60_90],
                        ["90+ days", deadStock.buckets.d90_plus],
                      ] as const
                    ).map(([label, bucket]) => (
                      <div key={label} className="min-w-0 px-3 py-2">
                        <dt className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">
                          {label}
                        </dt>
                        <dd className="text-sm font-bold tabular-nums">
                          {formatNumber(bucket.products)}
                          <span className="text-xs font-normal text-muted-foreground"> products</span>
                        </dd>
                        <dd className="truncate text-[11px] text-muted-foreground tabular-nums">
                          {formatCurrency(bucket.stock_value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  {deadStock.top_by_value.length > 0 && (
                    <ul className="divide-y divide-border">
                      {deadStock.top_by_value.slice(0, 5).map((item) => (
                        <Row
                          key={item.title}
                          trailing={
                            <>
                              {item.days_since_last_sale !== null
                                ? `${item.days_since_last_sale}d`
                                : "never sold"}{" "}
                              · {formatCurrency(item.stock_value)}
                            </>
                          }
                        >
                          {item.title}
                        </Row>
                      ))}
                    </ul>
                  )}
                </Panel>
              )}

            </div>
          )}
        </div>
      )}

      {/* ── Sales by channel | Risks | Opportunities ──────────────────────── */}
      {((metrics.channels && metrics.channels.length > 0) ||
        (sections.structured && (sections.risks || sections.opportunities))) && (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
          {metrics.channels && metrics.channels.length > 0 && (
            <Panel title="Sales by channel" count="by revenue">
              <ul className="divide-y divide-border">
                {metrics.channels.map((channel) => (
                  <Row
                    key={channel.channel}
                    trailing={`${formatNumber(channel.orders)} orders · ${formatCurrency(channel.revenue)}`}
                  >
                    {channel.channel}
                  </Row>
                ))}
              </ul>
            </Panel>
          )}
          {sections.structured && sections.risks && (
            <Panel title="Risks">
              <Prose content={sections.risks} />
            </Panel>
          )}
          {sections.structured && sections.opportunities && (
            <Panel title="Opportunities">
              <Prose content={sections.opportunities} />
            </Panel>
          )}
        </div>
      )}

      {/* ── Recommended actions — the closing panel, full width ───────────── */}
      {sections.structured && sections.actions && (
        <Panel title="Recommended actions" className="border-primary/20 bg-primary/5">
          <Prose content={sections.actions} />
        </Panel>
      )}

      {/* Fallback: unstructured older-format narrative */}
      {!sections.structured && (
        <Panel title="Report">
          <Prose content={report.content_md} />
        </Panel>
      )}
    </div>
  );
}

interface StyleRows {
  title: string;
  rows: { key: string | number; title: string; units: number; revenue: number }[];
}

/** Top 10 styles (D-19) when the payload has it, else the older five-row Top products
 * — never both, since the five are the first five of the ten. */
function topStyles(metrics: ReportDetail["metrics"]): StyleRows | null {
  if (metrics.top_styles && metrics.top_styles.length > 0) {
    return {
      title: "Top 10 styles",
      rows: metrics.top_styles.map((s) => ({ key: s.product_id, title: s.title, units: s.units, revenue: s.revenue })),
    };
  }
  if (metrics.top_products && metrics.top_products.length > 0) {
    return {
      title: "Top products",
      rows: metrics.top_products.map((p) => ({ key: p.title, title: p.title, units: p.units, revenue: p.revenue })),
    };
  }
  return null;
}

function changeClass(pct: number | null): string {
  return pct === null ? "text-muted-foreground" : pct >= 0 ? "text-success" : "text-destructive";
}

function changeLabel(pct: number | null): string {
  return pct === null ? "—" : `${pct >= 0 ? "+" : ""}${pct}%`;
}
