/**
 * The Clarity card's sync panel — the pure half (SPEC-270; backend SPEC-270).
 * Clarity has two things Search Console does not: a ten-calls-a-day budget (a run
 * spends three) and four named outcomes for "nothing came back". This module turns
 * a `ClarityStatus` into the words the card shows. Vitest-covered (root Rule 4).
 */
import type { ClarityBudget, ClaritySyncRun } from "@/types/clarity";

/** Calls one run spends — the backend's `CALLS_PER_RUN`. */
export const CALLS_PER_RUN = 3;
export const CLARITY_POLL_MS = 2_000;

export function claritySyncPollInterval(sync: ClaritySyncRun | null | undefined): number | false {
  return sync?.state === "running" ? CLARITY_POLL_MS : false;
}

export interface ClaritySyncProgress {
  /** 0–100; null while the total is unknown. */
  percent: number | null;
  label: string;
}

export function claritySyncProgress(sync: ClaritySyncRun | null): ClaritySyncProgress {
  if (!sync || sync.state !== "running") return { percent: null, label: "" };
  if (sync.total === null || sync.done === null || sync.total === 0) {
    return { percent: null, label: "Starting…" };
  }
  const done = Math.min(sync.done, sync.total);
  return {
    percent: Math.round((done / sync.total) * 100),
    label: `${done} of ${sync.total} ${sync.total === 1 ? "slice" : "slices"}`,
  };
}

export type ClaritySyncTone = "running" | "success" | "warning" | "error";

export interface ClaritySyncDescription {
  tone: ClaritySyncTone;
  headline: string;
  detail: string;
}

/** The one line under the fields. Every "nothing came back" has its own words —
 * a card that says "Connected" over an empty table is lying by omission. */
export function describeClaritySync(
  sync: ClaritySyncRun | null,
  capturedOn: string | null,
): ClaritySyncDescription | null {
  if (!sync) {
    return capturedOn
      ? { tone: "success", headline: "Synced", detail: `Last captured ${capturedOn}.` }
      : null;
  }
  if (sync.state === "running") {
    return {
      tone: "running",
      headline: capturedOn ? "Syncing" : "First sync",
      detail: "Pulling yesterday's behaviour by page, source and device.",
    };
  }
  if (sync.state === "error") {
    switch (sync.error) {
      case "unauthorized":
        return {
          tone: "error",
          headline: "Clarity rejected the token",
          detail: "Generate a new one under Settings → Data export in Clarity, paste it above and save.",
        };
      case "throttled":
        return {
          tone: "warning",
          headline: "Clarity's daily API budget is spent",
          detail: "Clarity allows 10 calls per project per day. The nightly sync runs at 04:15 UTC.",
        };
      default:
        return {
          tone: "error",
          headline: sync.error?.startsWith("cancelled") ? "Sync interrupted" : "Clarity didn't answer",
          detail: "Nothing was written. Retry, or wait for the nightly sync.",
        };
    }
  }
  if (sync.reason === "no_data" || sync.records === 0) {
    return {
      tone: "warning",
      headline: "Clarity returned no data",
      detail:
        "The token works, but Clarity has nothing for this project yet — is the tracking tag on the storefront? Data appears the day after it goes live.",
    };
  }
  return {
    tone: "success",
    headline: "Synced",
    detail: `${sync.records} ${sync.records === 1 ? "row" : "rows"} of behaviour captured${capturedOn ? ` for ${capturedOn}` : ""}.`,
  };
}

/** "3 of 10 calls used today · 2 syncs left" — why Sync now may be disabled. */
export function clarityBudgetLine(budget: ClarityBudget): string {
  const syncsLeft = Math.floor(budget.remaining / CALLS_PER_RUN);
  const left = syncsLeft === 0 ? "no syncs left today" : `${syncsLeft} ${syncsLeft === 1 ? "sync" : "syncs"} left`;
  return `${budget.used} of ${budget.limit} calls used today · ${left}`;
}

export function canSyncNow(sync: ClaritySyncRun | null, budget: ClarityBudget): boolean {
  return sync?.state !== "running" && budget.remaining >= CALLS_PER_RUN;
}
