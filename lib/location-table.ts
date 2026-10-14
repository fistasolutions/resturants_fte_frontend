/**
 * The Locations table (SPEC-233): which locations get a row and which collapse into
 * the quiet footer line, plus each row's review link — the same rule the cards used
 * (channel cards have no location to filter by, so they link to the unfiltered list).
 */

import type { LocationKpi } from "@/types/dashboard";

export function locationReviewHref(loc: LocationKpi): string {
  return loc.location_id !== null
    ? `/orders/review?location=${loc.location_id}`
    : "/orders/review";
}

/** The key the cards used since SPEC-202 — channel rows have no location_id. */
export function locationKey(loc: LocationKpi): string {
  return loc.location_id !== null
    ? String(loc.location_id)
    : `channel:${loc.channel ?? loc.name}`;
}

export function hasActivity(loc: LocationKpi): boolean {
  return loc.revenue > 0 || loc.orders > 0;
}

/** Selling locations keep their row; the rest share one "No sales this period" line. */
export function splitLocations(locations: LocationKpi[]): {
  selling: LocationKpi[];
  quiet: LocationKpi[];
} {
  return {
    selling: locations.filter(hasActivity),
    quiet: locations.filter((loc) => !hasActivity(loc)),
  };
}

/** Rows shown at natural height; past this the table body scrolls (owner decision,
 * SPEC-233 Patches) — the header stays put and the fifth row peeks below it. */
export const LOCATION_ROWS_VISIBLE = 4;

export function locationsScroll(sellingCount: number): boolean {
  return sellingCount > LOCATION_ROWS_VISIBLE;
}

/** "6 selling · 3 quiet" for the panel header; "6 selling" when none are quiet. */
export function locationsSummary(selling: number, quiet: number): string {
  return quiet > 0 ? `${selling} selling · ${quiet} quiet` : `${selling} selling`;
}
