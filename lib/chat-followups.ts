/**
 * Per-conversation follow-up chips that survive leaving the page (SPEC-223).
 *
 * The chips were held in component state and cleared on every conversation
 * switch, so returning to a conversation silently replaced its real follow-ups
 * with the generic starters — as if the assistant had forgotten the exchange.
 *
 * `localStorage` is the right home: this is a per-viewer convenience, never
 * shared and never read back by the backend. Every access is guarded, because
 * storage throws outright in a private window or with site data blocked, and a
 * miss simply falls back to the curated starters — today's behaviour.
 */

const KEY = "aias_chat_followups";

/** Conversations kept before the oldest is evicted. */
const MAX_CONVERSATIONS = 30;

export type FollowUpCache = Record<string, string[]>;

function read(): FollowUpCache {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return isCache(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function isCache(value: unknown): value is FollowUpCache {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return false;
  return Object.values(value).every(
    (entry) => Array.isArray(entry) && entry.every((item) => typeof item === "string"),
  );
}

/** Drop the oldest entries once the cache grows past its cap. */
export function evict(cache: FollowUpCache, keep = MAX_CONVERSATIONS): FollowUpCache {
  const keys = Object.keys(cache);
  if (keys.length <= keep) return cache;
  const trimmed: FollowUpCache = {};
  for (const key of keys.slice(keys.length - keep)) trimmed[key] = cache[key];
  return trimmed;
}

export function loadFollowUps(conversationId: string | null): string[] | null {
  if (!conversationId) return null;
  const cached = read()[conversationId];
  return cached && cached.length > 0 ? cached : null;
}

export function saveFollowUps(conversationId: string, questions: string[]): void {
  if (!conversationId || questions.length === 0) return;
  try {
    const next = evict({ ...read(), [conversationId]: questions });
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Storage unavailable — the chips simply fall back to the starters.
  }
}

export function forgetFollowUps(conversationId: string): void {
  try {
    const cache = read();
    delete cache[conversationId];
    window.localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // Nothing to do; a stale entry is harmless.
  }
}
