/**
 * QuickBooks connection presentation rules (SPEC-300).
 *
 * Lives in `lib/` because this repo has no jsdom/component runner — every rule that can
 * be wrong goes here where Vitest reaches it, and
 * `features/integrations/quickbooks-card.tsx` stays presentational. The rule
 * `lib/meta-connection.ts` set.
 *
 * The difference from every other integration: **QuickBooks is not one connection.**
 * Each company is a separate set of books, with its own realm,
 * its own tokens and its own way of breaking. So the badge summarises the worst state in
 * the list rather than the first, and a broken company can never hide behind a green one.
 */

import { FINANCE_ROOT } from "@/lib/finance";
import { agoLabel } from "@/lib/trust-footer";
import type { ConnectionsOverview, QboConnection } from "@/types/finance";

export type BadgeTone = "success" | "warning" | "neutral";

export interface QboBadge {
  label: string;
  tone: BadgeTone;
}

/** Connections that cannot read their books until the owner acts. */
export function brokenConnections(overview: ConnectionsOverview): QboConnection[] {
  return overview.connections.filter((row) => row.status !== "connected");
}

/**
 * The card's status badge. **Order matters**: a company that needs reconnecting is
 * checked BEFORE the success case, because its bills have silently stopped updating —
 * which is the exact failure this employee exists to prevent, so a green "3 companies"
 * over it would be a lie.
 */
export function quickBooksBadge(overview: ConnectionsOverview): QboBadge {
  if (!overview.configured) return { label: "Unavailable", tone: "neutral" };
  if (overview.connections.length === 0) return { label: "Not connected", tone: "warning" };
  const broken = brokenConnections(overview).length;
  if (broken > 0) {
    return { label: `${broken} needs reconnecting`, tone: "warning" };
  }
  const count = overview.connected;
  return { label: count === 1 ? "1 company" : `${count} companies`, tone: "success" };
}

/** What is actually being read today, in plain language — null before anything is. */
export function quickBooksCapability(overview: ConnectionsOverview): string | null {
  if (!overview.configured || overview.connections.length === 0) return null;
  const broken = brokenConnections(overview);
  if (broken.length > 0) {
    const names = broken.map((row) => row.companyName).join(", ");
    return `${names} stopped updating — reconnect to start reading its bills again.`;
  }
  return "Unpaid bills are read from each company every hour. Nothing is ever written back.";
}

export interface QboRow {
  id: number;
  company: string;
  realm: string;
  /** "read 12 min ago" · "never read" · the failure, when there is one. */
  detail: string;
  broken: boolean;
  /** The bar, while this company is being read (SPEC-303); null otherwise. */
  sync: SyncView | null;
}

/** One line per company, in the order the backend returned them (by name). */
export function connectionRows(
  overview: ConnectionsOverview,
  now: number = Date.now(),
): QboRow[] {
  return overview.connections.map((row) => ({
    id: row.id,
    company: row.companyName,
    realm: row.realmIdMasked,
    detail:
      row.status !== "connected"
        ? (row.lastError ?? "Needs reconnecting.")
        : row.lastSyncedAt
          ? `read ${agoLabel(row.lastSyncedAt, now)}`
          : "waiting for its first read",
    broken: row.status !== "connected",
    sync: syncProgress(row),
  }));
}

/**
 * What the Connect button says. A business may keep several sets of books, so connecting
 * one is not necessarily the end of the job — the label keeps inviting the next one.
 */
export function connectLabel(overview: ConnectionsOverview): string {
  return overview.connections.length === 0 ? "Connect QuickBooks" : "Connect another company";
}

// ── progress (SPEC-303 / backend SPEC-298) ──────────────────────────────────

export interface SyncView {
  /** 0–100 for the bar; a waiting company sits at 0. */
  percent: number;
  /** What it is doing, in the backend's words. */
  label: string;
  /** "Step 4 of 7", or "In line" while it waits. */
  stepText: string;
  /** "First read" for a company never read before, otherwise "Reading". */
  heading: string;
  waiting: boolean;
}

/** The bar for one company, or null when nothing is running for it. */
export function syncProgress(row: QboConnection): SyncView | null {
  const sync = row.sync;
  if (!sync) return null;
  const steps = Math.max(1, sync.steps);
  const done = Math.min(Math.max(sync.step, 0), steps);
  const waiting = sync.state === "queued";
  return {
    percent: waiting ? 0 : Math.round((done / steps) * 100),
    label: sync.label,
    stepText: waiting ? "In line" : `Step ${Math.min(done + 1, steps)} of ${steps}`,
    heading: sync.first ? "First read" : "Reading",
    waiting,
  };
}

/** How often the connections are re-read: every 2 s while a company is being read,
 * never otherwise — polling stops on its own the moment the last bar finishes. */
export const SYNC_POLL_MS = 2000;

/** After "Sync now" is pressed, when to look for the companies it marked — long enough
 * for the backend's first write, short enough that the bars appear at once. */
export const SYNC_PEEK_MS = 800;

export function connectionsPollInterval(overview: ConnectionsOverview | undefined): number | false {
  return overview?.syncing ? SYNC_POLL_MS : false;
}

/** The cookie that tells the Intuit callback which page the connect started on. */
export const RETURN_COOKIE = "qbo_return";
export const INTEGRATIONS_PATH = "/integrations";
/** QuickBooks' own page in the Integrations hub (SPEC-328) — its Settings tab shows the result. */
export const QUICKBOOKS_INTEGRATION_PATH = "/integrations/quickbooks";
const RETURN_PATHS = new Set([INTEGRATIONS_PATH, QUICKBOOKS_INTEGRATION_PATH, FINANCE_ROOT]);

/**
 * Where the callback may send the owner: Integrations (the hub or QuickBooks' own page) or
 * Finance Oversight, and nothing
 * else — the cookie is readable by page script, so it is never trusted as a URL.
 */
export function returnPathFor(value: string | null | undefined): string {
  return value && RETURN_PATHS.has(value) ? value : FINANCE_ROOT;
}

/** The `document.cookie` string that remembers (or, with null, forgets) the start page. */
export function returnCookie(path: string | null): string {
  return path
    ? `${RETURN_COOKIE}=${encodeURIComponent(path)}; Path=/; Max-Age=900; SameSite=Lax`
    : `${RETURN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
}

export interface ConnectNotice {
  tone: "success" | "neutral" | "error";
  text: string;
}

/** The line the Integrations card shows after the round trip through Intuit. */
export function connectNotice(params: URLSearchParams): ConnectNotice | null {
  const connected = params.get("connected");
  if (connected) return { tone: "success", text: `${connected} connected — reading its books now.` };
  const error = params.get("qbo_error");
  if (error) return { tone: "error", text: error };
  if (params.get("qbo_cancelled")) {
    return { tone: "neutral", text: "Connection cancelled — nothing changed." };
  }
  return null;
}
