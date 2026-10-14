import { TrendingDown, TrendingUp } from "lucide-react";

/**
 * Reused by `DecisionCard` for its compare badge (SPEC-075).
 *
 * The arrow always follows the literal number (up = increased, down =
 * decreased) — color is the only thing that carries "is this good or bad"
 * (via `invertDelta`, for metrics like Refunds or a risk decision where a
 * rise is bad news). Arrow direction used to flip with `invertDelta` too,
 * which produced contradictory-looking badges like a down-arrow next to a
 * "+1.9%" (SPEC-078 Patch, client feedback) — arrows meaning direction and
 * color meaning judgment is the convention every other dashboard uses, and
 * it's what the plain-language verdict text next to the badge is for.
 */
export function DeltaBadge({
  delta,
  invertDelta = false,
}: {
  delta: number | null;
  invertDelta?: boolean;
}) {
  if (delta === null) return null;
  const isGood = invertDelta ? delta <= 0 : delta >= 0;
  const increased = delta >= 0;
  const formatted = `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`;
  return (
    <span
      className={`flex items-center gap-0.5 text-xs font-semibold ${
        isGood ? "text-success" : "text-destructive"
      }`}
    >
      {increased ? (
        <TrendingUp className="size-3" aria-hidden />
      ) : (
        <TrendingDown className="size-3" aria-hidden />
      )}
      {formatted}
    </span>
  );
}
