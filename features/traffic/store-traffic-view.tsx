import {
  ArrowUpRight,
  Clock,
  DollarSign,
  PiggyBank,
  Receipt,
  ShoppingBag,
  TrendingUp,
  Users,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { ExplainButton } from "@/features/chat/explain-button";
import { StoreVisitorsChart } from "@/features/traffic/store-visitors-chart";
import { TrafficEmpty } from "@/features/traffic/traffic-empty";
import { conversionPct, formatConversion, hourLabel } from "@/lib/conversion";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime, formatNumber } from "@/utils/format";
import type {
  DailyTraffic,
  HourlyTraffic,
  TrafficOverview,
  TrafficPeaks,
  TrafficTotals,
} from "@/types/traffic";

// ── Hero: conversion funnel ─────────────────────────────────────────────────

function HeroConversion({ totals }: { totals: TrafficTotals }) {
  const pct = conversionPct(totals.conversion_rate);
  return (
    <Card className="relative gap-5 overflow-hidden border-ai/20 bg-gradient-to-br from-ai/10 via-card to-card p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="flex items-center gap-1.5 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            <TrendingUp className="size-3.5 text-ai" aria-hidden />
            In-store conversion
          </p>
          <p className="font-heading text-5xl tracking-tight tabular-nums md:text-6xl">
            {formatConversion(totals.conversion_rate)}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(totals.transactions)} of {formatNumber(totals.visitors)} visitors bought
          </p>
        </div>
        {totals.sales_per_visitor != null && (
          <div className="text-right">
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              Net sales / visitor
            </p>
            <p className="font-heading text-2xl tabular-nums">
              {formatCurrency(totals.sales_per_visitor)}
            </p>
            <p
              className="mt-0.5 text-[11px] text-muted-foreground"
              title={`Gross ${formatCurrency(totals.gross_sales ?? totals.sales)} − Tax ${formatCurrency(totals.tax_collected ?? 0)} = Net ${formatCurrency(totals.sales)} (excludes sales tax)`}
            >
              {formatCurrency(totals.sales)} net
              {totals.tax_collected ? ` · ${formatCurrency(totals.tax_collected)} tax` : ""}
            </p>
          </div>
        )}
      </div>

      {/* Funnel: visitors → transactions */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-muted-foreground">Visitors</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full w-full rounded-full bg-ai/40" aria-hidden />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
            {formatNumber(totals.visitors)}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-xs text-muted-foreground">Bought</span>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-500"
              style={{ width: `${Math.max(pct, 1.5)}%` }}
              aria-hidden
            />
          </div>
          <span className="w-16 shrink-0 text-right text-xs font-medium tabular-nums">
            {formatNumber(totals.transactions)}
          </span>
        </div>
      </div>
    </Card>
  );
}

// ── KPI tiles ────────────────────────────────────────────────────────────────

function Stat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <Card className="gap-2 p-4">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <span className="flex items-center gap-1">
          <ExplainButton placement="inline" target={{ metric: label, value }} />
          <Icon className="size-4 text-muted-foreground" aria-hidden />
        </span>
      </div>
      <p className="font-heading text-2xl tabular-nums">{value}</p>
    </Card>
  );
}

// ── Conversion by hour ────────────────────────────────────────────────────────

function ConversionHourly({
  hourly,
  peaks,
}: {
  hourly: HourlyTraffic[];
  peaks: TrafficPeaks;
}) {
  if (hourly.length === 0) return null;
  const peakVisitors = Math.max(...hourly.map((h) => h.visitors), 1);

  return (
    <Card className="gap-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Traffic &amp; conversion by hour
        </p>
        <div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground">
          {peaks.busiest_hour != null && (
            <span>
              Busiest{" "}
              <span className="font-medium text-foreground">{hourLabel(peaks.busiest_hour)}</span>
            </span>
          )}
          {peaks.best_converting_hour != null && (
            <span>
              Best converting{" "}
              <span className="font-medium text-success">
                {hourLabel(peaks.best_converting_hour)}
              </span>
            </span>
          )}
        </div>
      </div>
      <div className="flex items-end gap-1.5 overflow-x-auto pb-1" style={{ height: 160 }}>
        {hourly.map((h) => {
          const isBest = peaks.best_converting_hour === h.hour;
          return (
            <div key={h.hour} className="flex h-full min-w-9 flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium tabular-nums text-success">
                {formatConversion(h.conversion_rate)}
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className={cn(
                    "w-full rounded-t transition-[height]",
                    isBest ? "bg-success" : "bg-ai/50",
                  )}
                  style={{ height: `${Math.max((h.visitors / peakVisitors) * 100, 3)}%` }}
                  title={`${hourLabel(h.hour)}: ${formatNumber(h.visitors)} visitors, ${formatNumber(h.transactions)} sales`}
                />
              </div>
              <span className="text-[10px] tabular-nums text-muted-foreground">
                {formatNumber(h.visitors)}
              </span>
              <span className="text-[10px] text-muted-foreground">{hourLabel(h.hour)}</span>
            </div>
          );
        })}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Bars = visitors per hour · green % = conversion · tallest-converting hour highlighted.
      </p>
    </Card>
  );
}

// ── Daily trend ────────────────────────────────────────────────────────────────

function TrafficDaily({ daily }: { daily: DailyTraffic[] }) {
  if (daily.length <= 1) return null;
  const peak = Math.max(...daily.map((d) => d.visitors), 1);

  return (
    <Card className="gap-4 p-5">
      <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
        Daily visitors &amp; conversion
      </p>
      <div className="flex items-end gap-1.5 overflow-x-auto pb-1" style={{ height: 140 }}>
        {daily.map((d) => (
          <div key={d.date} className="flex h-full min-w-10 flex-1 flex-col items-center gap-1">
            <span className="text-[10px] font-medium tabular-nums text-success">
              {formatConversion(d.conversion_rate)}
            </span>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t bg-ai/50"
                style={{ height: `${Math.max((d.visitors / peak) * 100, 3)}%` }}
                title={`${d.date}: ${formatNumber(d.visitors)} visitors, ${formatNumber(d.transactions)} sales`}
              />
            </div>
            <span className="text-[10px] text-muted-foreground">{d.date.slice(5)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export function StoreTrafficView({
  data,
  lastSync,
}: {
  data: TrafficOverview | null;
  lastSync: string | null;
}) {
  if (!data || !data.has_data) {
    return <TrafficEmpty connected={Boolean(data?.last_sync)} />;
  }
  const t = data.totals;
  const showProfit = t.profit_per_visitor != null;

  return (
    <div className="space-y-4">
      <HeroConversion totals={t} />

      <section
        className={`grid grid-cols-2 gap-3 md:grid-cols-4 ${showProfit ? "xl:grid-cols-5" : ""}`}
      >
        <Stat label="Visitors" value={formatNumber(t.visitors)} icon={Users} />
        <Stat label="Transactions" value={formatNumber(t.transactions)} icon={ShoppingBag} />
        <Stat
          label="Net / visitor"
          value={t.sales_per_visitor != null ? formatCurrency(t.sales_per_visitor) : "—"}
          icon={DollarSign}
        />
        <Stat
          label="Avg order value"
          value={t.avg_order_value != null ? formatCurrency(t.avg_order_value) : "—"}
          icon={Receipt}
        />
        {showProfit && (
          <Stat
            label="Profit / visitor"
            value={formatCurrency(t.profit_per_visitor as number)}
            icon={PiggyBank}
          />
        )}
      </section>

      <StoreVisitorsChart storeDaily={data.store_daily} />
      <ConversionHourly hourly={data.hourly} peaks={data.peaks} />
      <TrafficDaily daily={data.daily} />

      {lastSync && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="size-3.5" aria-hidden />
          V-Count synced {formatDateTime(lastSync)}
          <Link
            href="/integrations"
            className="ml-1 inline-flex items-center gap-0.5 hover:text-foreground hover:underline"
          >
            manage <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </p>
      )}
    </div>
  );
}
