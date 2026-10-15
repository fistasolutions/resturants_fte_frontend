/** Branch lift wording for a branch campaign (frontend SPEC-387 / backend SPEC-404). Pure. */
import type { BranchLift } from "@/types/ads";

/** "+12% on the 7 days before", "No sales in the 7 days before", or "Same as the 7 days before". */
export function liftSentence(lift: BranchLift): string {
  const span = `the ${lift.days} day${lift.days === 1 ? "" : "s"} before`;
  if (lift.change === null) return `No sales in ${span} to compare with`;
  const pct = Math.round(lift.change * 100);
  if (pct === 0) return `Same as ${span}`;
  return `${pct > 0 ? "+" : ""}${pct}% on ${span}`;
}

export function liftTone(lift: BranchLift): "up" | "down" | "flat" {
  if (lift.change === null || Math.round(lift.change * 100) === 0) return "flat";
  return lift.change > 0 ? "up" : "down";
}
