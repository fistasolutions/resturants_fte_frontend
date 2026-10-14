import { ArrowRight, CheckCircle2 } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatConversion, formatSlot } from "@/lib/planning-format";
import type { StaffingPlan } from "@/types/planning";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  data: StaffingPlan | null;
}

/**
 * Staffing (SPEC-219, backend SPEC-228). Peak Hours names the symptom; this names
 * the trade — which hour gives an hour of cover up and which takes it.
 *
 * The one-for-one constraint is stated per location because it is the reason the
 * recommendation is actionable at all: adding hours is a budget conversation,
 * moving them is a rota edit.
 */
export function StaffingView({ data }: Props) {
  if (!data) {
    return (
      <Card className="p-8 text-center">
        <p className="text-sm text-muted-foreground">
          Could not build the staffing plan. Try again shortly.
        </p>
      </Card>
    );
  }

  if (!data.has_data) {
    return (
      <Card className="p-10 text-center">
        <p className="text-sm font-medium text-foreground">No footfall for this period</p>
        <p className="mt-1 text-sm text-muted-foreground">
          V-Count has not synced visitor hours for the selected dates.
        </p>
      </Card>
    );
  }

  if (data.locations.length === 0) {
    // Three different reasons produce an empty plan, and saying the wrong one is
    // worse than saying nothing: "every hour converts well" on a one-week window
    // reads as an all-clear when the truth is there was not enough clean data.
    const thin = data.weeks_observed < 4;
    const mostlyExcluded = (data.excluded_cells ?? 0) > 0;
    return (
      <Card className="flex flex-col items-center gap-2 p-10 text-center">
        <CheckCircle2 className="size-6 text-success" aria-hidden />
        {thin ? (
          <>
            <p className="text-sm font-medium text-foreground">
              Not enough data in this window
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              A rota change needs at least four weeks of footfall to stand up; this
              range has {formatNumber(data.weeks_observed)}. Widen the date range to
              see the plan.
            </p>
          </>
        ) : mostlyExcluded ? (
          <>
            <p className="text-sm font-medium text-foreground">
              No moves worth making from the hours we can trust
            </p>
            <p className="max-w-md text-sm text-muted-foreground">
              {formatNumber(data.excluded_cells ?? 0)} hours were excluded because the
              counter recorded more sales than visitors, or traffic with almost no
              sales. What remains is already converting at or above average.
            </p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-foreground">No moves worth making</p>
            <p className="text-sm text-muted-foreground">
              Every busy hour is already converting at or above its store&rsquo;s own
              average.
            </p>
          </>
        )}
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
        <span className="text-sm text-muted-foreground">
          Store average conversion{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatConversion(data.avg_conversion)}
          </span>
        </span>
        <span className="text-sm text-muted-foreground">
          Average order value{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatCurrency(data.aov)}
          </span>
        </span>
        <span className="text-sm text-muted-foreground">
          Weeks observed{" "}
          <span className="font-semibold tabular-nums text-foreground">
            {formatNumber(data.weeks_observed)}
          </span>
        </span>
        {/* Disclosed, not silently dropped: a third of cells can fail this check. */}
        {data.excluded_cells ? (
          <span className="text-sm text-muted-foreground">
            Hours excluded{" "}
            <span className="font-semibold tabular-nums text-foreground">
              {formatNumber(data.excluded_cells)}
            </span>{" "}
            <span className="text-xs">
              (the counter recorded more sales than visitors)
            </span>
          </span>
        ) : null}
      </Card>

      {/* Six-figure numbers on real data — the ceiling has to be stated, not implied. */}
      {data.basis ? (
        <Card className="border-border/70 bg-muted/30 px-4 py-3">
          <p className="text-sm text-muted-foreground">{data.basis}</p>
        </Card>
      ) : null}

      {data.locations.map((location) => (
        <Card key={location.location_id} className="overflow-hidden">
          <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border px-4 py-3">
            {/* The one-hour-for-one-hour rule is stated once, in the basis card
                above — repeating it per location was pure noise. */}
            <h3 className="text-sm font-semibold text-foreground">
              {location.location_name}
            </h3>
            <span className="text-sm font-semibold tabular-nums text-foreground">
              {formatCurrency(location.total_estimated_gain)}
            </span>
          </header>

          <ul className="divide-y divide-border/60">
            {location.moves.map((move) => (
              <li
                key={`${move.give.weekday}-${move.give.hour}-${move.take.weekday}-${move.take.hour}`}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{formatSlot(move.give)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatNumber(move.give.visitors)} visitors ·{" "}
                      {formatConversion(move.give.conversion_rate)}
                    </p>
                  </div>
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                  <div className="text-sm">
                    <p className="font-medium text-foreground">{formatSlot(move.take)}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {formatNumber(move.take.visitors)} visitors ·{" "}
                      {formatConversion(move.take.conversion_rate)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  {move.confidence === "low" ? (
                    <span className="inline-flex rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                      &lt; 4 weeks of data
                    </span>
                  ) : null}
                  <span className="text-sm font-semibold tabular-nums text-foreground">
                    {formatCurrency(move.estimated_gain)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
}
