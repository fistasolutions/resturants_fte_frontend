/**
 * Meta connection presentation rules (SPEC-171).
 *
 * Lives in `lib/` because this repo has no jsdom/component runner — every rule
 * that can be wrong goes here where Vitest reaches it, and
 * `features/integrations/meta-card.tsx` stays presentational.
 */

import type { MetaStatus } from "@/types/integrations";

export type BadgeTone = "success" | "warning" | "neutral";

export interface MetaBadge {
  label: string;
  tone: BadgeTone;
}

/**
 * The card's status badge. **Order matters**: a Page connected with no linked
 * Instagram account is checked BEFORE the success case, because publishing is
 * then only half-working and a green "Connected" would hide that.
 */
export function metaBadge(status: MetaStatus): MetaBadge {
  if (!status.configured) return { label: "Unavailable", tone: "neutral" };
  if (!status.connected) return { label: "Not connected", tone: "warning" };
  if (!status.instagramLinked) return { label: "Facebook only", tone: "warning" };
  return { label: "Connected", tone: "success" };
}

/** What can actually publish today, in plain language — null when disconnected. */
export function metaCapability(status: MetaStatus): string | null {
  if (!status.connected) return null;
  return status.instagramLinked
    ? "Posts can publish to Instagram and Facebook."
    : "Facebook only — no Instagram Business account is linked to this Page. Link one in Meta Business Suite, then reconnect.";
}

/**
 * The expiry warning. The daily refresh job should keep this null forever; if it
 * ever appears, publishing is days from stopping — which is exactly the silent
 * failure the job exists to prevent, so it must be visible when it happens.
 */
export function tokenWarning(status: MetaStatus): string | null {
  if (!status.connected || !status.expiringSoon) return null;
  return "This connection's access expires soon and could not be renewed automatically. Reconnect to keep publishing.";
}

export interface SummaryRow {
  label: string;
  value: string;
}

/** The connected-state rows, with empty fields dropped so no bare label renders. */
export function connectionSummary(status: MetaStatus): SummaryRow[] {
  if (!status.connected) return [];
  const rows: SummaryRow[] = [];
  if (status.pageName) rows.push({ label: "Page", value: status.pageName });
  if (status.instagramUsername) {
    rows.push({ label: "Instagram", value: `@${status.instagramUsername}` });
  }
  if (status.connectedBy) {
    rows.push({ label: "Authorised by", value: status.connectedBy });
  }
  return rows;
}
