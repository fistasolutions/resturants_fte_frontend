/** Rate-severity → semantic-token class mapping (SPEC-095). Tokens only, per
 * Rule 9 — no hardcoded colors; `--destructive`/`--warning`/`--muted` restyle
 * with the theme. `rateTone` (the logic) is unit-tested in lib/returns-format. */
import type { RateTone } from "@/lib/returns-format";

/** Filled heat cell (sizing grid). */
export const HEAT_CELL_CLASS: Record<RateTone, string> = {
  critical: "bg-destructive/20 text-destructive",
  high: "bg-warning/25 text-warning",
  medium: "bg-warning/12 text-warning",
  low: "bg-muted text-foreground",
  none: "bg-muted/40 text-muted-foreground",
};

/** Inline rate pill (tables). */
export const RATE_PILL_CLASS: Record<RateTone, string> = {
  critical: "bg-destructive/15 text-destructive",
  high: "bg-warning/20 text-warning",
  medium: "bg-warning/12 text-warning",
  low: "bg-muted text-muted-foreground",
  none: "text-muted-foreground",
};

/** Solid bar fill (category heat bars) — colored by rate severity so the
 * ranking reads as a heat map. */
export const HEAT_BAR_CLASS: Record<RateTone, string> = {
  critical: "bg-destructive",
  high: "bg-warning",
  medium: "bg-warning/70",
  low: "bg-primary/50",
  none: "bg-muted-foreground/30",
};
