/**
 * The Dashboard's alert strip (SPEC-233): the five inventory/returns alerts the page
 * has carried since SPEC-021/044, as tiles. The captions moved here verbatim from the
 * view so pluralisation and the "sent to managers" wording are unit-tested.
 */

import { ordersPageHref } from "@/lib/order-filters";
import type { AlertsSummary } from "@/types/analytics";
import type { DeadInventoryAlerts } from "@/types/analysis";
import { formatCurrency, formatNumber, formatTime } from "@/utils/format";

export type AlertTone = "hi" | "md" | "ai";

export interface AlertTile {
  key: "unfulfilled" | "low_stock" | "dead_stock" | "returns_spike" | "misplaced";
  tone: AlertTone;
  label: string;
  value: string;
  caption: string;
  href: string;
  /** True renders the success state: dot green, value replaced by the message. */
  allClear: boolean;
  allClearMessage: string;
}

function plural(n: number, noun: string): string {
  return `${formatNumber(n)} ${noun}${n !== 1 ? "s" : ""}`;
}

export function unfulfilledCaption(alerts: AlertsSummary): string {
  return alerts.unfulfilledSent && alerts.unfulfilledSentAt
    ? `${formatNumber(alerts.unfulfilledCount)} orders · ✓ sent to managers, ${formatTime(alerts.unfulfilledSentAt)}`
    : `${plural(alerts.unfulfilledCount, "order")} unshipped over 48h`;
}

export function misplacedCaption(misplaced: DeadInventoryAlerts | null): string {
  return misplaced && misplaced.summary.styles_flagged > 0
    ? `${plural(misplaced.summary.styles_flagged, "style")} sitting idle across ${plural(misplaced.summary.locations_affected, "location")}, selling elsewhere`
    : "No misplaced inventory detected";
}

/**
 * The five alerts in the order the page has always shown them. `misplaced` is null
 * while its own query is loading or failed — that tile then reads all-clear, exactly
 * as the card did (SPEC-230: locations and misplaced stock degrade on their own).
 */
export function buildDashboardAlerts(
  alerts: AlertsSummary,
  misplaced: DeadInventoryAlerts | null,
): AlertTile[] {
  return [
    {
      key: "unfulfilled",
      tone: "hi",
      label: "Unfulfilled orders",
      value: formatCurrency(alerts.unfulfilledValue),
      caption: unfulfilledCaption(alerts),
      href: ordersPageHref({ fulfillment: "unfulfilled", age: "48_plus" }),
      allClear: alerts.unfulfilledCount === 0,
      allClearMessage: "Nothing unfulfilled over 48h",
    },
    {
      key: "low_stock",
      tone: "md",
      label: "Low stock risk",
      value: formatCurrency(alerts.lowStockRevenueAtRisk),
      caption: `${plural(alerts.lowStockVariants, "variant")} at risk of stockout`,
      href: "/inventory",
      allClear: alerts.lowStockRevenueAtRisk === 0,
      allClearMessage: "All variants well stocked",
    },
    {
      key: "dead_stock",
      tone: "hi",
      label: "Dead stock",
      value: formatCurrency(alerts.deadStockValue),
      caption: `${plural(alerts.deadStockProducts, "product")}, 0 sales in 90 days`,
      href: "/inventory",
      allClear: alerts.deadStockProducts === 0,
      allClearMessage: "All inventory is moving",
    },
    {
      key: "returns_spike",
      tone: "ai",
      label: "Returns spike",
      value: alerts.returnsSpikeProduct ?? "None",
      caption:
        alerts.returnsSpikeRate !== null
          ? `${alerts.returnsSpikeRate}% return rate (30 days)`
          : "No spike detected",
      href: "/orders/returns-spike",
      allClear: alerts.returnsSpikeProduct === null,
      allClearMessage: "No return spikes detected",
    },
    {
      key: "misplaced",
      tone: "md",
      label: "Misplaced stock",
      value: formatCurrency(misplaced?.summary.total_value ?? 0),
      caption: misplacedCaption(misplaced),
      href: "/inventory/dead-inventory-alerts",
      allClear: !misplaced || misplaced.summary.styles_flagged === 0,
      allClearMessage: "Nothing sitting on the wrong shelf",
    },
  ];
}
