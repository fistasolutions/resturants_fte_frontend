/**
 * View as company (SPEC-363 / backend SPEC-371) — the pure half: cookie names, the marker's
 * value, the countdown, the blocked-send error and the `/auth/me` shape. No React, no fetch.
 */

/** Not httpOnly: it holds no secret, only when the session ends — so the banner can tell it is
 * in a support session without a request (and every other user pays nothing). */
export const SUPPORT_COOKIE = "aias_support";
export const SUPPORT_ENDED_PATH = "/support-session/ended";
export const SUPPORT_ROUTE = "/api/support-session";
/** The event `apiErrorFromResponse` fires when a support session's send was refused. */
export const SUPPORT_BLOCKED_EVENT = "support-session-blocked";
export const SUPPORT_BLOCKED_CODE = "support_session_blocked";

export interface ApiSupportSession {
  id: string;
  operator: string;
  reason: string;
  organization_name: string;
  expires_at: string;
}

export interface SupportSession {
  id: string;
  operator: string;
  reason: string;
  companyName: string;
  expiresAt: string;
}

export function adaptSupportSession(api: ApiSupportSession | null | undefined): SupportSession | null {
  if (!api) return null;
  return {
    id: api.id,
    operator: api.operator,
    reason: api.reason,
    companyName: api.organization_name,
    expiresAt: api.expires_at,
  };
}

/** Whole seconds until `expiresAt`, never below zero; 0 for an unreadable date. */
export function secondsLeft(expiresAt: string, now: number = Date.now()): number {
  const end = Date.parse(expiresAt);
  if (Number.isNaN(end)) return 0;
  return Math.max(0, Math.floor((end - now) / 1000));
}

/** "27 min left" · "1 min left" · "Under a minute left" · "Ended". */
export function timeLeftLabel(expiresAt: string, now: number = Date.now()): string {
  const seconds = secondsLeft(expiresAt, now);
  if (seconds <= 0) return "Ended";
  if (seconds < 60) return "Under a minute left";
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} min left`;
}

/** The marker cookie's value: the end time as epoch seconds. */
export function markerValue(expiresAt: string): string {
  const end = Date.parse(expiresAt);
  return Number.isNaN(end) ? "0" : String(Math.floor(end / 1000));
}

/** True when a `document.cookie` string carries the marker. */
export function hasMarker(cookieHeader: string): boolean {
  return cookieHeader.split(";").some((part) => part.trim().startsWith(`${SUPPORT_COOKIE}=`));
}

/** True for the backend's "refused in a support session" answer. */
export function isSupportBlocked(status: number, code: string): boolean {
  return status === 423 && code === SUPPORT_BLOCKED_CODE;
}

/** What the banner says when a send was refused. */
export const BLOCKED_WARNING = "Nothing was sent: support sessions can't send to real people.";
