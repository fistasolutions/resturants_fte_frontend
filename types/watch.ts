/** Watchlist (SPEC-262 / backend SPEC-262): a threshold the owner asked to be
 * told about, on a figure the platform already computes. */

export type WatchUnit = "pct" | "usd" | "count" | "days";
export type WatchDirection = "above" | "below";
export type WatchRecipient = "owner" | "returns" | "warehouse" | "support" | "managers";
export type WatchStatus = "watching" | "paused";
export type WatchState = "quiet" | "fired";

export interface WatchMetric {
  key: string;
  label: string;
  unit: WatchUnit;
  subject: "none" | "product" | "optional_product";
  /** Allowed periods, first is the default; empty when the metric takes none. */
  periods: string[];
  href: string;
  hint: string;
}

export interface Watch {
  id: number;
  metric: string;
  label: string;
  unit: WatchUnit;
  subjectLabel: string | null;
  productId: number | null;
  period: string | null;
  direction: WatchDirection;
  threshold: number;
  notifyNudge: boolean;
  notifyEmail: WatchRecipient | null;
  status: WatchStatus;
  state: WatchState;
  baselineValue: number | null;
  lastValue: number | null;
  lastCheckedAt: string | null;
  firedAt: string | null;
  firedValue: number | null;
  firedNote: string | null;
  fireCount: number;
  emailSentAt: string | null;
  emailError: string | null;
  /** The rule as a sentence, from the backend. */
  rule: string;
  /** Today's reading, formatted by the backend. */
  current: string;
  href: string;
  createdAt: string | null;
}

export interface WatchList {
  watches: Watch[];
  metrics: WatchMetric[];
  /** Which role emails are set in Settings — the form warns on a missing one. */
  recipients: Record<WatchRecipient, boolean>;
}

export interface WatchCheckResult {
  checked: number;
  fired: Watch[];
  elapsedMs: number;
}

export interface WatchInput {
  metric: string;
  direction: WatchDirection;
  threshold: number;
  productQuery?: string | null;
  period?: string | null;
  notifyNudge?: boolean;
  notifyEmail?: WatchRecipient | null;
}

export interface WatchPatch {
  direction?: WatchDirection;
  threshold?: number;
  period?: string | null;
  notifyNudge?: boolean;
  notifyEmail?: WatchRecipient | null;
  status?: WatchStatus;
}
