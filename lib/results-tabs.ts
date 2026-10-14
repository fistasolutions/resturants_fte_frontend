/**
 * The Results tab list, once (SPEC-338): the tab bar draws it and the sidebar preferences list
 * it. Value Ledger and Managers come first (the bar opens on the ledger), then one tab per send
 * type, keyed by its `ResultsData` field.
 */
import type { ResultsData } from "@/types/results";

export const RESULTS_LEDGER_TAB = "ledger" as const;
export const RESULTS_MANAGERS_TAB = "managers" as const;

export interface ResultsCategoryTab {
  key: keyof ResultsData;
  label: string;
}

export const RESULTS_CATEGORY_TABS: readonly ResultsCategoryTab[] = [
  { key: "overdue", label: "Overdue" },
  { key: "transfers", label: "Transfers" },
  { key: "winback", label: "Winback" },
  { key: "deadInventory", label: "Dead Inventory" },
  { key: "orders", label: "Orders" },
  { key: "storeTraffic", label: "Store Traffic" },
  { key: "discountReview", label: "Discount Reviews" },
  { key: "warehouse", label: "Warehouse" },
  { key: "support", label: "Support Team" },
  { key: "returns", label: "Returns" },
];

/** Every Results tab in bar order. */
export const RESULTS_TABS: readonly { key: string; label: string }[] = [
  { key: RESULTS_LEDGER_TAB, label: "Value Ledger" },
  { key: RESULTS_MANAGERS_TAB, label: "Managers" },
  ...RESULTS_CATEGORY_TABS,
];
