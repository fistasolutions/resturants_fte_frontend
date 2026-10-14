/**
 * Pure filtering for the Cash Release and Allocation tabs (SPEC-218/220).
 *
 * Lives in `lib/` because this is the layer Vitest covers — the components stay
 * presentational and the matching rules get real tests (root Rule 4).
 */

import type {
  AllocationPlan,
  AllocationRun,
  CashReleasePlan,
  CashReleaseWeek,
} from "@/types/planning";

/** Case- and whitespace-insensitive substring match. Empty query matches all. */
export function matchesQuery(text: string, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return text.toLowerCase().includes(q);
}

export interface CashReleaseFilters {
  query: string;
  /** "all" | "180+d" | "90-180d" */
  bucket: string;
  /** "all" or a week number as a string */
  week: string;
}

export const EMPTY_CASH_FILTERS: CashReleaseFilters = {
  query: "",
  bucket: "all",
  week: "all",
};

/**
 * Filtered weeks with their totals RECOMPUTED from what survived.
 *
 * Recomputing is the whole point: leaving the server's totals in place while the
 * rows below them are filtered produces a card that does not add up, which is the
 * single fastest way to lose a reader's trust in a money figure.
 */
export function filterCashRelease(
  plan: CashReleasePlan,
  filters: CashReleaseFilters,
): { weeks: CashReleaseWeek[]; totals: CashReleasePlan["totals"] } {
  const weeks: CashReleaseWeek[] = [];
  for (const week of plan.weeks) {
    if (filters.week !== "all" && String(week.week) !== filters.week) continue;
    const items = week.items.filter(
      (item) =>
        (filters.bucket === "all" || item.bucket === filters.bucket) &&
        matchesQuery(item.title, filters.query),
    );
    if (items.length === 0) continue;
    weeks.push({
      ...week,
      items,
      products: items.length,
      stock_value: round2(items.reduce((n, i) => n + i.stock_value, 0)),
      expected_cash: round2(items.reduce((n, i) => n + i.expected_cash, 0)),
      margin_given_up: round2(items.reduce((n, i) => n + i.margin_given_up, 0)),
    });
  }
  return {
    weeks,
    totals: {
      products: weeks.reduce((n, w) => n + w.products, 0),
      stock_value: round2(weeks.reduce((n, w) => n + w.stock_value, 0)),
      expected_cash: round2(weeks.reduce((n, w) => n + w.expected_cash, 0)),
      margin_given_up: round2(weeks.reduce((n, w) => n + w.margin_given_up, 0)),
    },
  };
}

export interface AllocationFilters {
  query: string;
  /** "all" or a location id as a string */
  source: string;
  destination: string;
}

export const EMPTY_ALLOCATION_FILTERS: AllocationFilters = {
  query: "",
  source: "all",
  destination: "all",
};

/** Filtered runs with run and plan totals recomputed — same reasoning as above. */
export function filterAllocation(
  plan: AllocationPlan,
  filters: AllocationFilters,
): { runs: AllocationRun[]; totals: AllocationPlan["totals"] } {
  const runs: AllocationRun[] = [];
  for (const run of plan.runs) {
    if (
      filters.source !== "all" &&
      String(run.source_location_id) !== filters.source
    ) {
      continue;
    }
    if (
      filters.destination !== "all" &&
      String(run.destination_location_id) !== filters.destination
    ) {
      continue;
    }
    const items = run.items.filter((item) => matchesQuery(item.title, filters.query));
    if (items.length === 0) continue;
    runs.push({
      ...run,
      items,
      units: items.reduce((n, i) => n + i.move_units, 0),
      expected_value: round2(items.reduce((n, i) => n + i.expected_value, 0)),
    });
  }
  return {
    runs,
    totals: {
      runs: runs.length,
      moves: runs.reduce((n, r) => n + r.items.length, 0),
      units: runs.reduce((n, r) => n + r.units, 0),
      expected_value: round2(runs.reduce((n, r) => n + r.expected_value, 0)),
    },
  };
}

/** Distinct locations present in a plan, for populating the selects. */
export function allocationLocations(plan: AllocationPlan): {
  sources: { id: number; name: string }[];
  destinations: { id: number; name: string }[];
} {
  const sources = new Map<number, string>();
  const destinations = new Map<number, string>();
  for (const run of plan.runs) {
    sources.set(run.source_location_id, run.source_location_name);
    destinations.set(run.destination_location_id, run.destination_location_name);
  }
  const sort = (m: Map<number, string>) =>
    [...m.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name));
  return { sources: sort(sources), destinations: sort(destinations) };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
