/**
 * The store's handling time (frontend SPEC-364, backend SPEC-373): how many days an order may
 * wait before it ships, the figure the agent's late-order line counts against. A whole number of
 * days from 1 to 30; a row without it reads 2, the agent's old fixed value.
 */
import type { BusinessHours } from "@/types/customer-support";

export const DEFAULT_HANDLING_DAYS = 2;
export const MIN_HANDLING_DAYS = 1;
export const MAX_HANDLING_DAYS = 30;

export const HANDLING_DAYS_ERROR = `Handling time is a whole number of days from ${MIN_HANDLING_DAYS} to ${MAX_HANDLING_DAYS}.`;

/** The handling time the hours carry: missing or not a whole number reads 2; anything outside
 * 1–30 is held to the nearest end, as the backend would refuse it. */
export function handlingDaysOf(hours: Pick<BusinessHours, "handlingDays">): number {
  const value = hours.handlingDays;
  if (typeof value !== "number" || !Number.isInteger(value)) return DEFAULT_HANDLING_DAYS;
  return Math.min(MAX_HANDLING_DAYS, Math.max(MIN_HANDLING_DAYS, value));
}

/** What the owner typed, as a handling time: a whole number from 1 to 30, or null. */
export function parseHandlingDays(text: string): number | null {
  const trimmed = text.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const value = Number.parseInt(trimmed, 10);
  return value >= MIN_HANDLING_DAYS && value <= MAX_HANDLING_DAYS ? value : null;
}
