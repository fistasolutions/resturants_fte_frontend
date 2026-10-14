/**
 * The trust footer (SPEC-264): the wording of the quiet line under an answer —
 * how long ago each system was synced, how many tools ran — and its tone.
 * Pure; the card only lays it out.
 */
import type { AnswerCall, AnswerFreshness } from "@/types/chat";

/** A sync older than this turns the dot amber. */
export const STALE_AFTER_MS = 60 * 60_000;

export type FooterTone = "fresh" | "stale" | "unknown";

/** "just now", "4 min ago", "3 h ago", "2 days ago"; "" for a bad date. */
export function agoLabel(iso: string, now = Date.now()): string {
  const at = new Date(iso).getTime();
  if (Number.isNaN(at)) return "";
  const ms = Math.max(0, now - at);
  const minutes = Math.round(ms / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export interface FreshnessSegment {
  system: string;
  /** "synced 4 min ago" / "no sync". */
  label: string;
  stale: boolean;
}

/** One segment per system, in the order the answer read them. */
export function freshnessSegments(freshness: AnswerFreshness[], now = Date.now()): FreshnessSegment[] {
  return freshness.map((entry) => {
    if (!entry.synced_at) return { system: entry.system, label: "no sync", stale: false };
    const at = new Date(entry.synced_at).getTime();
    const stale = !Number.isNaN(at) && now - at > STALE_AFTER_MS;
    return { system: entry.system, label: `synced ${agoLabel(entry.synced_at, now)}`, stale };
  });
}

/** Amber when any read system is stale, green when every one has a recent sync,
 * muted when nothing has a sync to show (an engine, an old answer). */
export function footerTone(freshness: AnswerFreshness[], now = Date.now()): FooterTone {
  const segments = freshnessSegments(freshness, now);
  if (segments.some((s) => s.stale)) return "stale";
  if (segments.some((s) => s.label !== "no sync")) return "fresh";
  return "unknown";
}

export function toolsLabel(count: number): string {
  return count === 1 ? "1 tool ran" : `${count} tools ran`;
}

/** "0.9 s", "12 s"; "" when unmeasured. */
export function secondsLabel(ms: number): string {
  if (!ms || ms <= 0) return "";
  const seconds = ms / 1000;
  return seconds >= 10 ? `${Math.round(seconds)} s` : `${seconds.toFixed(1)} s`;
}

/** The receipt is worth opening only when there is a row with something in it. */
export function hasReceipt(calls: AnswerCall[] | undefined): boolean {
  return Array.isArray(calls) && calls.length > 0;
}
