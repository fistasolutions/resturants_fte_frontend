/**
 * Which attribution measure to show for one published blog (backend SPEC-197).
 *
 * A post now carries three measures of the same thing, and they are NOT
 * interchangeable claims:
 *
 * - `attributed*`  — the buyer entered the site ON this article and bought in that
 *                    same session. The strongest proof, and the rarest.
 * - `lastTouch*`   — this article was the last thing they visited before buying.
 * - `firstTouch*`  — this article is what introduced them, possibly days earlier.
 *
 * The card has room for one. Showing the strongest available measure is what stops a
 * post that genuinely earned a first-touch sale from reading "No attributed sales
 * yet" — but the label must always name WHICH measure it is, because presenting a
 * first-touch dollar as if it were a same-session dollar would be a stronger claim
 * than the data supports.
 *
 * Pure by design: this is the logic layer Vitest covers, so the component stays
 * presentational (no component runner exists — root Rule 4).
 */

export type AttributionKind = "attributed" | "lastTouch" | "firstTouch" | "none";

export interface BlogAttributionSummary {
  kind: AttributionKind;
  orders: number;
  revenue: number;
  /** Short qualifier for the UI; empty for the strongest (unqualified) measure. */
  label: string;
  /** Full sentence for a tooltip / screen reader — says what was actually measured. */
  description: string;
}

interface AttributionInput {
  attributedOrders: number;
  attributedRevenue: number;
  firstTouchOrders: number;
  firstTouchRevenue: number;
  lastTouchOrders: number;
  lastTouchRevenue: number;
}

const NONE: BlogAttributionSummary = {
  kind: "none",
  orders: 0,
  revenue: 0,
  label: "",
  description: "No orders have been attributed to this post yet.",
};

/** The strongest measure with a non-zero result, or `none`. Revenue leads because
 * it is the headline; an order counted with zero revenue (a fully discounted order)
 * still counts, so orders are checked too. */
export function summarizeBlogAttribution(
  post: AttributionInput,
): BlogAttributionSummary {
  if (post.attributedRevenue > 0 || post.attributedOrders > 0) {
    return {
      kind: "attributed",
      orders: post.attributedOrders,
      revenue: post.attributedRevenue,
      label: "",
      description:
        "Landed on this post and bought in the same visit — the strongest proof.",
    };
  }
  if (post.lastTouchRevenue > 0 || post.lastTouchOrders > 0) {
    return {
      kind: "lastTouch",
      orders: post.lastTouchOrders,
      revenue: post.lastTouchRevenue,
      label: "last touch",
      description: "This post was the last thing they visited before buying.",
    };
  }
  if (post.firstTouchRevenue > 0 || post.firstTouchOrders > 0) {
    return {
      kind: "firstTouch",
      orders: post.firstTouchOrders,
      revenue: post.firstTouchRevenue,
      label: "first touch",
      description:
        "This post introduced the buyer — their journey started here, possibly days before checkout.",
    };
  }
  return NONE;
}

/** "1 order" / "3 orders". */
export function orderCountLabel(orders: number): string {
  return `${orders} ${orders === 1 ? "order" : "orders"}`;
}

/** How much of the attribution window has actually been looked at (SPEC-197).
 * Returns null while coverage is complete — there is nothing to caveat then. */
export function coverageNote(
  coverage: { orders: number; fetched: number; ratio: number } | null | undefined,
): string | null {
  if (!coverage || coverage.orders === 0) return null;
  if (coverage.ratio >= 1) return null;
  const percent = Math.round(coverage.ratio * 100);
  return `Journey data covers ${percent}% of orders in this window — attribution below is a floor, not a total.`;
}
