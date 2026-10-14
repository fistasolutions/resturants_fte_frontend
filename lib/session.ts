/**
 * Session cookies (SPEC-017). Both are httpOnly and set ONLY by
 * app/api/session/route.ts — client JS never reads or writes tokens.
 * proxy.ts gates routes on SESSION_COOKIE presence.
 */
export const SESSION_COOKIE = "aias_session";
export const REFRESH_COOKIE = "aias_refresh";

export const ACCESS_MAX_AGE_SECONDS = 60 * 30; // mirrors backend access TTL
export const REFRESH_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // backend refresh TTL

/**
 * Shared attributes for every session cookie write (SPEC-149) — login, silent
 * refresh, and logout must all agree, so this is the single source of truth.
 */
export const cookieBase = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
} as const;
