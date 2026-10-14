/**
 * Google Search Console connect flow — the pure half (SPEC-250; backend SPEC-257).
 * Everything the property dialog and the card compute from a `GoogleStatus` lives
 * here so Vitest covers it (no component runner — root Rule 4).
 */
import type { GoogleProperty, GoogleSyncRun } from "@/types/spotlight";

/** What `/integrations/gsc?google=` can carry back from the callback route. */
export type GoogleReturnState = "connected" | "error" | "choose";

/** Narrow the raw search param to a known return state, else null. */
export function googleReturnState(param: string | undefined | null): GoogleReturnState | null {
  return param === "connected" || param === "error" || param === "choose" ? param : null;
}

/** Google's `permissionLevel` in the owner's words. Unverified is spelled out
 * because it is the one level that cannot read search data — the reason a row
 * in the picker is disabled. */
export function permissionLabel(level: string | null | undefined): string {
  switch ((level ?? "").toLowerCase()) {
    case "siteowner":
      return "Owner";
    case "sitefulluser":
      return "Full access";
    case "siterestricteduser":
      return "Restricted access";
    case "siteunverifieduser":
      return "Unverified — can't read search data";
    default:
      return "No access";
  }
}

/** `sc-domain:examplestore.com` → "examplestore.com (domain property)";
 * `https://www.examplestore.com/` → "www.examplestore.com". */
export function propertyDisplay(siteUrl: string): { name: string; kind: string } {
  const value = siteUrl.trim();
  if (value.toLowerCase().startsWith("sc-domain:")) {
    return { name: value.slice("sc-domain:".length), kind: "Domain property" };
  }
  try {
    const url = new URL(value);
    return { name: url.host + (url.pathname === "/" ? "" : url.pathname), kind: "URL prefix" };
  } catch {
    return { name: value, kind: "URL prefix" };
  }
}

export interface SyncProgress {
  /** 0–100; null while the total is unknown (indeterminate bar). */
  percent: number | null;
  label: string;
}

/** The progress row for a running pull. Pages are the unit because that is what
 * the backend iterates — one Search Console query per published page. */
export function syncProgress(sync: GoogleSyncRun | null): SyncProgress {
  if (!sync || sync.state !== "running") return { percent: null, label: "" };
  if (sync.total === null || sync.done === null || sync.total === 0) {
    return { percent: null, label: "Starting…" };
  }
  const done = Math.min(sync.done, sync.total);
  return {
    percent: Math.round((done / sync.total) * 100),
    label: `${done} of ${sync.total} ${sync.total === 1 ? "page" : "pages"}`,
  };
}

export interface SyncDescription {
  tone: "running" | "success" | "error";
  headline: string;
  detail: string | null;
}

/** The one-line status copy for a finished or failed run. */
export function describeSync(sync: GoogleSyncRun | null, lastPull: string | null): SyncDescription | null {
  if (!sync) {
    return lastPull
      ? { tone: "success", headline: "Synced", detail: null }
      : null;
  }
  if (sync.state === "running") {
    return { tone: "running", headline: lastPull ? "Syncing" : "First sync", detail: null };
  }
  if (sync.state === "error") {
    const cancelled = (sync.error ?? "").startsWith("cancelled");
    return {
      tone: "error",
      headline: cancelled ? "Sync interrupted" : "Sync failed",
      detail: humanSyncError(sync.error),
    };
  }
  const rows = sync.records;
  return {
    tone: "success",
    headline: "Synced",
    detail: `${rows} ${rows === 1 ? "row" : "rows"} of search data`,
  };
}

/** Backend `sync_logs.error` values are short codes or messages; say them plainly. */
export function humanSyncError(error: string | null): string {
  switch (error) {
    case null:
    case "":
      return "The sync did not complete.";
    case "no_property":
      return "No property was chosen when the sync ran.";
    case "not_connected":
      return "Google was not connected when the sync ran.";
    default:
      return error.startsWith("cancelled")
        ? "The sync was interrupted before it finished."
        : error;
  }
}

/** Poll cadence for the status query: fast while a run is in flight, off otherwise. */
export const SYNC_POLL_MS = 2_000;

export function syncPollInterval(sync: GoogleSyncRun | null | undefined): number | false {
  return sync?.state === "running" ? SYNC_POLL_MS : false;
}

/** What the picker pre-selects: the stored property if it is still selectable,
 * else the recommended one, else nothing — the owner must choose. */
export function defaultProperty(
  properties: GoogleProperty[],
  stored: string | null | undefined,
): string | null {
  const kept = properties.find((p) => p.selectable && p.siteUrl === stored);
  if (kept) return kept.siteUrl;
  const recommended = properties.find((p) => p.selectable && p.recommended);
  return recommended?.siteUrl ?? null;
}
