"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";

import { KpiStrip } from "@/components/shared/kpi-strip";
import { PageHeader } from "@/components/shared/page-header";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { BranchDialog } from "@/features/restaurant/branch-dialog";
import { NetSalesChart } from "@/features/restaurant/net-sales-chart";
import { Figure, RestaurantSkeleton } from "@/features/restaurant/parts";
import { PeriodPicker } from "@/features/restaurant/period-picker";
import { ServicePanel } from "@/features/restaurant-os/service-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { BRANCH_STATUS_LABELS, money, overviewTiles, periodLabel } from "@/lib/restaurant";
import type { Branch, RestaurantFilters } from "@/types/restaurant";

function Details({ branch }: { branch: Branch }) {
  const rows: [string, string | null][] = [
    ["Franchisee", branch.franchiseeName],
    ["Region", branch.regionName],
    ["Address", [branch.addressLine, branch.city, branch.state, branch.postalCode].filter(Boolean).join(", ") || null],
    ["Phone", branch.phone],
    ["General manager", [branch.managerName, branch.managerEmail].filter(Boolean).join(" · ") || null],
    ["Timezone", branch.ianaTimezone ?? "The brand's"],
    ["POS store id", branch.externalRef],
    ["Opened", branch.openedOn ? periodLabel(branch.openedOn, branch.openedOn) : null],
  ];
  return (
    <dl className="grid gap-x-6 gap-y-3 rounded-2xl border border-border bg-card p-4 text-sm sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">{label}</dt>
          <dd className="truncate text-foreground">{value ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

/** `/network/branches/[id]` (SPEC-377): one branch's scorecard and its details. */
export function BranchDetailView({ branchId, filters }: { branchId: number; filters: RestaurantFilters }) {
  const branch = useApiQuery(restaurantQueries.branch(branchId));
  const card = useApiQuery(restaurantQueries.scorecard(branchId, filters));
  const [editing, setEditing] = useState(false);

  const back = (
    <Link href="/network?tab=branches" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
      <ArrowLeft className="size-4" aria-hidden />
      Branches
    </Link>
  );
  if (branch.isError) {
    return (
      <main className="space-y-4 p-4 md:p-6">
        {back}
        <QueryErrorState error={branch.error} onRetry={() => void branch.refetch()} />
      </main>
    );
  }
  const b = branch.data;
  return (
    <main className="space-y-4 p-4 md:p-6">
      {back}
      <PageHeader
        title={b ? `#${b.code} ${b.name}` : "Branch"}
        description={b ? `${b.franchiseeName}${b.regionName ? ` · ${b.regionName}` : ""}` : "Loading the branch…"}
        actions={
          b ? (
            <>
              {b.status !== "open" ? <Badge variant="outline">{BRANCH_STATUS_LABELS[b.status]}</Badge> : null}
              <RoleButton need={["network.manage"]} variant="outline" onClick={() => setEditing(true)}>
                <Pencil aria-hidden />
                Edit
              </RoleButton>
            </>
          ) : null
        }
      />
      <div className="flex justify-end">
        <PeriodPicker />
      </div>
      {card.isError ? (
        <QueryErrorState error={card.error} onRetry={() => void card.refetch()} />
      ) : !card.data ? (
        <RestaurantSkeleton tiles={10} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
            <Figure label="Rank in the network" value={`${card.data.rank} of ${card.data.of}`} hint="by net sales" />
            <Figure label="Franchisee average" value={money(card.data.franchiseeAverageNetSales)} hint="net sales per branch" />
            <Figure label="Network average" value={money(card.data.networkAverageNetSales)} hint="net sales per branch" />
          </div>
          <KpiStrip
            tiles={overviewTiles(card.data, `vs ${periodLabel(card.data.previousPeriod.from, card.data.previousPeriod.to)}`)}
            label="This branch at a glance"
            explain={false}
          />
          <NetSalesChart points={card.data.trend} />
        </>
      )}
      {b ? <Details branch={b} /> : null}
      {b ? <ServicePanel branchId={b.id} /> : null}
      {editing && b ? <BranchDialog open={editing} onOpenChange={setEditing} branch={b} /> : null}
    </main>
  );
}
