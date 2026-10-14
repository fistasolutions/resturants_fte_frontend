/**
 * One tile of a KPI strip (SPEC-231, shared in SPEC-233): the row of small tiles under
 * a page header. Page-specific builders (`lib/brief-strip.ts`, `lib/dashboard-strip.ts`)
 * decide the tiles; `components/shared/kpi-strip.tsx` only lays them out.
 */

export type StripTone = "neutral" | "good" | "warn" | "bad";

export interface StripTile {
  key: string;
  label: string;
  value: string;
  /** Dimmed text right after the value — "/9" in "5/9". */
  suffix?: string;
  /** Signed % vs the comparison; null when there is no baseline. Rendered by
   * `DeltaBadge`, so arrow = direction and colour = judgment. */
  delta: number | null;
  /** A rise is bad news (the `DeltaBadge` convention). */
  invertDelta: boolean;
  /** The line under the value. */
  sub: string;
  /** Colour of the value itself; neutral tiles let the delta carry the judgment. */
  tone: StripTone;
  /** Makes the whole tile a link. */
  href?: string;
}
