/**
 * Publish + performance presentation rules (SPEC-172).
 *
 * In `lib/` because this repo has no jsdom/component runner — every rule that can
 * be wrong goes here where Vitest reaches it.
 */

/** Metric totals from `GET /social/performance` (backend SPEC-182). */
export interface EngagementTotals {
  reach: number | null;
  impressions: number | null;
  likes: number | null;
  comments: number | null;
  saves: number | null;
  shares: number | null;
}

/**
 * True when the Publish button should be offered — mirroring the backend's guards
 * exactly, so a control is never shown for an action that would fail.
 *
 * `publishReady` comes from the backend (SPEC-184) and is false whenever Meta
 * isn't connected, the public image URL isn't configured, or Instagram isn't
 * linked. In manual-first mode it is always false, so **the button does not
 * render at all** — not disabled, absent.
 *
 * The image check matters too: Instagram has no text-only post, and learning that
 * from a failed publish is worse than never seeing the button.
 */
export function canPublishNow(
  status: string,
  hasImage: boolean,
  publishReady: boolean,
): boolean {
  if (!publishReady) return false;
  return hasImage && (status === "approved" || status === "scheduled");
}

/** True while a post is mid-publish on the backend (SPEC-180's claim state). */
export function isPublishing(status: string): boolean {
  return status === "publishing";
}

export function publishButtonLabel(
  pending: boolean,
  hasFailedBefore: boolean,
): string {
  if (pending) return "Publishing…";
  return hasFailedBefore ? "Retry publish" : "Publish now";
}

/**
 * A metric for display. `null` means Meta did not report it — rendered as an
 * em dash, NEVER as 0.
 *
 * This is the whole reason the type is `number | null`: a `?? 0` anywhere in the
 * UI would silently turn "we don't know" into "it got none" and poison every
 * average built on top of it (backend SPEC-182, root Rule 8).
 */
export function metricLabel(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-US");
}

/** True when a metric is absent rather than zero — drives the tooltip. */
export function isUnreported(value: number | null): boolean {
  return value === null || value === undefined;
}

export interface EngagementRow {
  key: keyof EngagementTotals;
  label: string;
  value: number | null;
}

const ROW_ORDER: Array<[keyof EngagementTotals, string]> = [
  ["reach", "Reach"],
  ["impressions", "Impressions"],
  ["likes", "Likes"],
  ["comments", "Comments"],
  ["saves", "Saves"],
  ["shares", "Shares"],
];

/** The metric rows in display order, nulls preserved. */
export function engagementRows(totals: EngagementTotals): EngagementRow[] {
  return ROW_ORDER.map(([key, label]) => ({ key, label, value: totals[key] }));
}

/**
 * Validate an optional publish time (UTC "HH:MM"). Returns an error message or
 * null. Empty is valid — omitting the time keeps the pre-SPEC-181 behaviour and
 * the backend falls back to its default hour.
 */
export function scheduleTimeError(value: string): string | null {
  const clean = value.trim();
  if (!clean) return null;
  const match = /^(\d{1,2}):(\d{2})$/.exec(clean);
  if (!match) return "Use a 24-hour time like 19:30.";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return "Use a 24-hour time like 19:30.";
  return null;
}

/** Normalise a validated time to "HH:MM", or null when left empty. */
export function normalizeScheduleTime(value: string): string | null {
  const clean = value.trim();
  if (!clean || scheduleTimeError(clean)) return null;
  const [hours, minutes] = clean.split(":");
  return `${hours.padStart(2, "0")}:${minutes}`;
}
