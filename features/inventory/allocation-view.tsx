"use client";

import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useMemo, useState } from "react";

import { Card } from "@/components/ui/card";
import { PlanFilterBar } from "@/features/shared/plan-filter-bar";
import {
  EMPTY_ALLOCATION_FILTERS,
  allocationLocations,
  filterAllocation,
  type AllocationFilters,
} from "@/lib/planning-filters";
import { formatShortDate } from "@/lib/planning-format";
import type { AllocationPlan } from "@/types/planning";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: AllocationPlan | null;
}

const HEAD_BASE =
  "px-3 py-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const HEAD = `${HEAD_BASE} text-right`;
// A separate constant, not `${HEAD} text-left`: Tailwind resolves conflicts by
// stylesheet order, not by the order classes appear in the string, so appending
// text-left to a text-right base does not win.
const HEAD_LEFT = `${HEAD_BASE} text-left`;
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

/**
 * Allocation (SPEC-220, backend SPEC-229). Every worthwhile store-to-store move
 * in one ranked list, grouped into the unit a van actually does.
 *
 * The capping rule is stated on the page rather than left to be inferred: "why
 * only 12 when there are 40 in stock" is the first question this list gets, and
 * the answer — moving more relocates dead stock instead of clearing it — is the
 * reason the numbers can be trusted.
 */
export function AllocationView({ data }: Props) {
  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Could not build the allocation plan. Try again shortly.
        </p>
      </Card>
    );
  }

  return <AllocationBody plan={data} />;
}

function AllocationBody({ plan }: { plan: AllocationPlan }) {
  const [filters, setFilters] = useState<AllocationFilters>(EMPTY_ALLOCATION_FILTERS);
  // Run and plan totals are recomputed from what survived — a header that still
  // says $352k over a filtered list of two rows is a number nobody can trust.
  const { runs, totals } = useMemo(
    () => filterAllocation(plan, filters),
    [plan, filters],
  );
  const { sources, destinations } = useMemo(() => allocationLocations(plan), [plan]);
  const data = plan;
  const active =
    filters.query !== "" ||
    filters.source !== "all" ||
    filters.destination !== "all";

  if (plan.runs.length === 0) {
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <CheckCircle2 className="size-6 text-success" aria-hidden />
        <p className="text-sm font-medium text-foreground">No moves worth making</p>
        <p className="text-sm text-muted-foreground">
          No location is sitting on stock that another location is actively selling.
        </p>
      </Card>
    );
  }

  const tiles = [
    { label: "Van runs", value: formatNumber(totals.runs) },
    { label: "Units to move", value: formatNumber(totals.units) },
    { label: "Expected value (gross)", value: formatCurrency(totals.expected_value) },
  ];

  return (
    <div className="flex flex-col gap-4">
      <PlanFilterBar
        query={filters.query}
        onQueryChange={(query) => setFilters((f) => ({ ...f, query }))}
        searchPlaceholder="Search product…"
        selects={[
          {
            id: "alloc-source",
            label: "From",
            value: filters.source,
            options: [
              { value: "all", label: "Any source" },
              ...sources.map((l) => ({ value: String(l.id), label: l.name })),
            ],
            onChange: (source) => setFilters((f) => ({ ...f, source })),
          },
          {
            id: "alloc-destination",
            label: "To",
            value: filters.destination,
            options: [
              { value: "all", label: "Any destination" },
              ...destinations.map((l) => ({ value: String(l.id), label: l.name })),
            ],
            onChange: (destination) => setFilters((f) => ({ ...f, destination })),
          },
        ]}
        summary={`${formatNumber(totals.runs)} of ${formatNumber(
          plan.totals.runs,
        )} runs`}
        active={active}
        onReset={() => setFilters(EMPTY_ALLOCATION_FILTERS)}
      />

      <section aria-label="Plan summary" className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-4">
            <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {tile.label}
            </p>
            <p className="mt-1 text-xl font-bold tabular-nums text-foreground">
              {tile.value}
            </p>
          </Card>
        ))}
      </section>

      <Card className="border-border/70 bg-muted/30 px-4 py-3">
        <p className="text-sm text-muted-foreground">{data.basis}</p>
      </Card>

      {runs.length === 0 ? (
        <Card className="p-8 text-center">
          <p className="text-sm font-medium text-foreground">No moves match</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Nothing in the plan matches these filters. Clear them to see all{" "}
            {formatNumber(plan.totals.runs)} runs.
          </p>
        </Card>
      ) : null}

      {runs.map((run) => (
        <Card key={run.run_key} className="overflow-hidden">
          <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                {run.source_location_name}
                <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                {run.destination_location_name}
              </h3>
              {run.already_sent_at ? (
                <span className="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  Last sent {formatShortDate(run.already_sent_at)}
                </span>
              ) : null}
            </div>
            <div className="flex items-center gap-4 text-sm tabular-nums">
              <span className="text-muted-foreground">
                {formatNumber(run.units)} units
              </span>
              <span className="font-semibold text-foreground">
                {formatCurrency(run.expected_value)}
              </span>
            </div>
          </header>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[54rem]">
              <thead className="border-b border-border bg-muted/40">
                <tr>
                  <th className={HEAD_LEFT} scope="col">Product</th>
                  <th className={HEAD} scope="col">Unsold at source</th>
                  <th className={HEAD} scope="col">Source stock</th>
                  <th className={HEAD} scope="col">Destination sold</th>
                  <th className={HEAD} scope="col">Destination stock</th>
                  <th className={HEAD} scope="col">Move</th>
                  <th className={HEAD} scope="col">Expected value</th>
                </tr>
              </thead>
              <tbody>
                {run.items.map((item) => (
                  <tr key={item.product_id} className="border-b border-border/60 last:border-0">
                    <td className="px-3 py-2.5 text-left text-sm text-foreground">
                      {item.title}
                    </td>
                    <td className={`${CELL} text-muted-foreground`}>
                      {item.days_since_last_sale_at_source === null
                        ? "never sold"
                        : `${formatNumber(item.days_since_last_sale_at_source)}d`}
                    </td>
                    <td className={CELL}>{formatNumber(item.source_stock)}</td>
                    <td className={CELL}>{formatNumber(item.destination_units_sold)}</td>
                    <td className={CELL}>{formatNumber(item.destination_stock)}</td>
                    <td className={`${CELL} font-semibold text-foreground`}>
                      {formatNumber(item.move_units)}
                    </td>
                    <td className={CELL}>{formatCurrency(item.expected_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ))}
    </div>
  );
}
