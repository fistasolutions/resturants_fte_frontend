"use client";

import { BadgePercent, MessageSquareText, ShieldCheck, Users } from "lucide-react";

import DiscountsLoading from "@/app/(app)/discounts/loading";
import AttentionLoading from "@/app/(app)/discounts/attention/loading";
import ReasonsLoading from "@/app/(app)/discounts/reasons/loading";
import StaffLoading from "@/app/(app)/discounts/staff/loading";
import { AlertsList } from "@/features/discounts/alerts-list";
import { AttentionQueue } from "@/features/discounts/attention-queue";
import { CannibalisationTable } from "@/features/discounts/cannibalisation-table";
import { DecisionsTable } from "@/features/discounts/decisions-table";
import { LocationTable } from "@/features/discounts/location-table";
import { DiscountOverviewKpis } from "@/features/discounts/overview-kpis";
import { PromotionsCard } from "@/features/discounts/promotions-card";
import { ReasonsBreakdown } from "@/features/discounts/reasons-breakdown";
import { StaffLeaderboard } from "@/features/discounts/staff-leaderboard";
import { UnmappedStaffBanner } from "@/features/discounts/unmapped-staff-banner";
import { useApiQuery } from "@/hooks/use-api-query";
import type { ResolvedRange } from "@/lib/date-range";
import { discountQueries } from "@/lib/queries/discounts";

/**
 * The Discount Monitoring tabs (SPEC-098), read from the client cache (SPEC-230).
 * The header + date picker + tab bar are the persistent discount shell; each tab is
 * only its body and keeps the exact empty/error copy its server page had. Overview,
 * Staff and the per-location page share the overview / employees answers.
 */

function TabError({ what }: { what: string }) {
  return (
    <div className="rounded-card border border-destructive/20 bg-destructive/10 p-6 text-sm text-destructive">
      Couldn&apos;t load {what}. Try again shortly.
    </div>
  );
}

interface TabProps {
  range: ResolvedRange;
  /** `rangeQuery(params)` — the `?range=…` suffix drill-down links carry. */
  rq: string;
}

export function DiscountsOverviewTab({ range, rq }: TabProps) {
  const overviewQ = useApiQuery(discountQueries.overview(range.from, range.to));
  const automaticQ = useApiQuery(discountQueries.automatic(range.from, range.to));
  const employeesQ = useApiQuery(discountQueries.employees(range.from, range.to));
  const alertsQ = useApiQuery(discountQueries.alerts(range.from, range.to));
  if (overviewQ.isPending || automaticQ.isPending || employeesQ.isPending || alertsQ.isPending) {
    return <DiscountsLoading />;
  }
  if (overviewQ.isError || automaticQ.isError || employeesQ.isError || alertsQ.isError) {
    return <TabError what="discount data" />;
  }
  const overview = overviewQ.data;
  const automatic = automaticQ.data;
  const employees = employeesQ.data;
  const alerts = alertsQ.data;

  if (overview.company.orders === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-10 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <BadgePercent className="size-5" aria-hidden />
        </span>
        <h2 className="font-heading text-lg tracking-wide">No orders in this range</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Pick a wider date range to see discount activity across your locations.
        </p>
      </div>
    );
  }

  const topAlerts = alerts.alerts.slice(0, 10);

  return (
    <div className="space-y-6">
      <DiscountOverviewKpis overview={overview} />
      <UnmappedStaffBanner employees={employees.employees} />
      <LocationTable locations={overview.locations} rangeQuery={rq} />
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <PromotionsCard promotions={automatic.promotions} />
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-foreground">
            Flagged discounts{" "}
            <span className="font-normal text-muted-foreground">
              ({alerts.counts.red} red · {alerts.counts.yellow} review)
            </span>
          </h2>
          <AlertsList alerts={topAlerts} rangeQuery={rq} />
        </div>
      </div>
    </div>
  );
}

export function DiscountsAttentionTab({ range }: { range: ResolvedRange }) {
  const attention = useApiQuery(discountQueries.attention(range.from, range.to));
  if (attention.isPending) return <AttentionLoading />;
  if (attention.isError) return <TabError what="the attention queue" />;
  const data = attention.data;

  if (data.items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-success/30 bg-success/5 p-10 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-success/10 text-success">
          <ShieldCheck className="size-5" aria-hidden />
        </span>
        <h2 className="font-heading text-lg tracking-wide">All clear</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          No discounts crossed a policy threshold in this range — nothing needs your attention.
        </p>
      </div>
    );
  }

  return <AttentionQueue items={data.items} counts={data.counts} />;
}

/** Discounts → Cannibalisation (SPEC-186). */
export function DiscountsCannibalisationTab({ range }: { range: ResolvedRange }) {
  const result = useApiQuery(discountQueries.cannibalisation(range.from, range.to));
  if (result.isPending) return <DiscountsLoading />;
  if (result.isError) return <TabError what="discount cannibalisation" />;
  const data = result.data;

  return <CannibalisationTable data={data} />;
}

/** Discounts → Decisions (SPEC-244): what the store did while each code ran. */
export function DiscountsDecisionsTab({ range }: { range: ResolvedRange }) {
  const result = useApiQuery(discountQueries.decisions(range.from, range.to));
  if (result.isPending) return <DiscountsLoading />;
  if (result.isError) return <TabError what="discount decisions" />;
  return <DecisionsTable data={result.data} />;
}

export function DiscountsReasonsTab({ range }: { range: ResolvedRange }) {
  const result = useApiQuery(discountQueries.reasons(range.from, range.to));
  if (result.isPending) return <ReasonsLoading />;
  if (result.isError) return <TabError what="discount reasons" />;
  const data = result.data;

  if (data.total_manual === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-10 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <MessageSquareText className="size-5" aria-hidden />
        </span>
        <h2 className="font-heading text-lg tracking-wide">No manual discounts in this range</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          Once staff enter manual discounts, the reasons behind them break down here.
        </p>
      </div>
    );
  }

  return <ReasonsBreakdown data={data} />;
}

export function DiscountsStaffTab({ range, rq }: TabProps) {
  // Company-wide (location_id omitted) — the WHO leaderboard across all stores.
  const result = useApiQuery(discountQueries.employees(range.from, range.to));
  if (result.isPending) return <StaffLoading />;
  if (result.isError) return <TabError what="staff data" />;
  const employees = result.data;

  if (employees.employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-card border border-border bg-card p-10 text-center">
        <span className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
          <Users className="size-5" aria-hidden />
        </span>
        <h2 className="font-heading text-lg tracking-wide">No manual discounts in this range</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          When staff enter manual discounts at the register, they&apos;ll be ranked here.
        </p>
      </div>
    );
  }

  return <StaffLeaderboard employees={employees.employees} rangeQuery={rq} />;
}
