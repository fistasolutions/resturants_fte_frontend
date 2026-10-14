/**
 * A nudge on the button (SPEC-246): which pages ask for one, how a dismissal is
 * remembered, and how the nudge's question travels to the analyst. Pure — the
 * DOM/localStorage touches are guarded, everything else is unit-tested.
 */
import type { ChatPageContext } from "@/types/chat";
import type { Nudge } from "@/types/nudge";

/** The route families the backend has a rule for (backend `RULES`, SPEC-254) —
 * pinned by a test so the client never asks on a page that cannot answer. */
export const NUDGE_ROUTES: readonly string[] = [
  "/dashboard",
  "/orders",
  "/inventory",
  "/foresight",
  "/discounts",
  "/customers",
  "/products",
  "/returns",
];

/** Pages that never ask: the chat workspace hides the panel, the sign-in has none. */
const SILENT_ROUTES: readonly string[] = ["/chat", "/login"];

/**
 * `/inventory/dead-stock` → `/inventory`. Since SPEC-262 every page family asks —
 * a fired watch shows anywhere, and the backend answers it first, then the page's
 * own rule (`NUDGE_ROUTES`), then null. Null only for the silent pages.
 */
export function nudgeRouteFor(pathname: string): string | null {
  const first = pathname.split("/").filter(Boolean)[0];
  if (!first) return null;
  const route = `/${first}`;
  return SILENT_ROUTES.includes(route) ? null : route;
}

/** True when the page has a rule of its own (a watch can still fire elsewhere). */
export function hasPageRule(route: string): boolean {
  return NUDGE_ROUTES.includes(route);
}

// Keeps the pre-rename prefix on purpose (SPEC-337): a new key would reset every saved choice.
export const DISMISSED_KEY = "ecommerce-fte.nudges.dismissed";
/** Dismissals older than this are forgotten — a nudge id that has not come back
 * in a month is not worth remembering. */
export const DISMISSED_TTL_MS = 30 * 24 * 60 * 60 * 1000;

type Dismissed = Record<string, number>;

function storage(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** The remembered dismissals, pruned. Empty when storage is unavailable. */
export function readDismissed(now = Date.now()): Dismissed {
  const store = storage();
  if (!store) return {};
  try {
    const raw = store.getItem(DISMISSED_KEY);
    return raw ? pruneDismissed(JSON.parse(raw) as unknown, now) : {};
  } catch {
    return {};
  }
}

/** Keep only well-formed, recent entries. Exported for the unit tests. */
export function pruneDismissed(value: unknown, now: number): Dismissed {
  if (!value || typeof value !== "object") return {};
  const out: Dismissed = {};
  for (const [id, at] of Object.entries(value as Record<string, unknown>)) {
    if (typeof at === "number" && now - at < DISMISSED_TTL_MS) out[id] = at;
  }
  return out;
}

export function isDismissed(id: string, now = Date.now()): boolean {
  return id in readDismissed(now);
}

export function dismissNudge(id: string, now = Date.now()): void {
  const store = storage();
  if (!store) return;
  try {
    store.setItem(DISMISSED_KEY, JSON.stringify({ ...readDismissed(now), [id]: now }));
  } catch {
    // Storage full or blocked — the nudge simply shows again next time.
  }
}

/** The page context with the nudge's focus attached (backend SPEC-249). */
export function nudgeContext(
  context: ChatPageContext | null,
  nudge: Nudge,
): ChatPageContext | null {
  return context ? { ...context, focus: nudge.focus } : null;
}

/** The line split around its figure so the figure can be set in bold. */
export function splitLine(nudge: Nudge): [string, string, string] {
  const at = nudge.line.indexOf(nudge.figure);
  if (at < 0) return [nudge.line, "", ""];
  return [
    nudge.line.slice(0, at),
    nudge.figure,
    nudge.line.slice(at + nudge.figure.length),
  ];
}
