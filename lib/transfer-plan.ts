/**
 * Pure view helpers for the Transfer Plan (SPEC-086) — kept framework-free and
 * unit-tested (repo has no jsdom runner, so all real logic lives here rather
 * than inside the component).
 */
import type { TransferDirection, TransferPlanRow } from "@/types/analysis";

/** Human label for a direction badge. */
export function directionLabel(direction: TransferDirection): string {
  return direction === "warehouse_to_store" ? "Warehouse → Store" : "Store → Store";
}

/** The destination label for a row — warehouse rows have no single destination
 * (aggregate), so they read as "Stores". */
export function destinationLabel(row: TransferPlanRow): string {
  return row.to_location ?? "Stores";
}

/** Where a row's action link points. Both directions now live under Inventory
 * Analyst (SPEC-088): warehouse rows go to the warehouse-transfer review/send;
 * store→store rows go to the read-only per-store drill-down. */
export function rowActionHref(row: TransferPlanRow): string {
  if (row.direction === "warehouse_to_store") return "/inventory/transfers/review";
  return `/inventory/store-transfers/${row.to_location_id}`;
}

/** Label for a row's action link. */
export function rowActionLabel(row: TransferPlanRow): string {
  if (row.direction === "warehouse_to_store") return "Review & send →";
  return `Review at ${destinationLabel(row)} →`;
}
