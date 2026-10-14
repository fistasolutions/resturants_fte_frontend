/**
 * Server-paginated page sizes shared by a route's Server Component (which prefetches
 * page N) and its client view (which reads it) — SPEC-230.
 *
 * They live here, in a plain module, on purpose: a value exported from a
 * `"use client"` file is NOT a value on the server — React turns every export of a
 * client module into a client reference, so a Server Component importing a constant
 * from a view would receive a proxy that throws when called (and `String()` of it is
 * the throwing function's source). The rollout shipped exactly that once; the sweep
 * caught it as `?limit=function()%20{…}` → 422. Never export non-component values
 * from a client module for a server file to consume.
 */
export const CUSTOMERS_PAGE_SIZE = 15;
export const WINBACK_PAGE_SIZE = 15;
export const REPORT_HISTORY_PAGE_SIZE = 10;
export const CONVERSATIONS_PAGE_SIZE = 25;
export const AGENT_CONVERSATIONS_PAGE_SIZE = 25;
