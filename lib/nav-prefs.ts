/**
 * Sidebar preferences (SPEC-338) — pure. A member can hide sidebar pages, a hub's sub-pages and
 * the tabs inside a page. Only the hidden ids are stored, in a per-account cookie the app layout
 * reads on the server, so an empty cookie means everything is shown. Hiding is a display choice:
 * a hidden page or tab still opens from a link, and the open tab is always drawn.
 *
 * Kept small on purpose: the sidebar imports it on every page. The list of every page's tabs
 * lives in `lib/nav-tab-registry.ts`, which only Settings reads.
 */

/** Pages that can never be hidden — Settings holds the switch to bring the others back. */
export const LOCKED_PAGES: ReadonlySet<string> = new Set(["/settings"]);

const ID = /^[A-Za-z0-9.:_-]{1,80}$/;
const MAX_IDS = 400;
const ONE_YEAR = 60 * 60 * 24 * 365;

/** A page's id: its route without the leading slash, `/` → `.` (`employees.finance`). */
export function pageId(href: string): string {
  return href.replace(/^\/+/, "").replace(/\/+$/, "").replace(/\//g, ".");
}

/** A tab's id: `<page id>:<tab key>` (`products:catalog`). */
export function tabId(pageHref: string, key: string): string {
  return `${pageId(pageHref)}:${key}`;
}

/** FNV-1a, base 36 — keeps the email out of the cookie name. */
function hash(text: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/** One cookie per account, so two people sharing a browser keep their own sidebar. */
export function navPrefsCookie(email: string): string {
  return `nav_hidden_${hash(email.trim().toLowerCase())}`;
}

/** The hidden ids in a cookie value; anything malformed is dropped. */
export function parseHidden(raw: string | null | undefined): Set<string> {
  if (!raw) return new Set();
  const ids = raw
    .split(",")
    .map((part) => part.trim())
    .filter((part) => ID.test(part));
  return new Set(ids.slice(0, MAX_IDS));
}

export function serializeHidden(hidden: ReadonlySet<string>): string {
  return [...hidden].filter((id) => ID.test(id)).sort().join(",");
}

/** The `document.cookie` assignment that stores `hidden` (or clears it when empty). */
export function navPrefsCookieString(name: string, hidden: ReadonlySet<string>): string {
  const value = serializeHidden(hidden);
  const age = value ? ONE_YEAR : 0;
  return `${name}=${value}; path=/; max-age=${age}; samesite=lax`;
}

export function isPageShown(href: string, hidden: ReadonlySet<string>): boolean {
  return LOCKED_PAGES.has(href) || !hidden.has(pageId(href));
}

/** The sidebar rows (or a hub's sub-pages) still shown. */
export function visibleNavItems<T extends { href: string }>(items: readonly T[], hidden: ReadonlySet<string>): T[] {
  return items.filter((item) => isPageShown(item.href, hidden));
}

/**
 * A page's tabs still shown. The first tab is always drawn (the sidebar link opens on it), and
 * so is the open one, so a deep link never lands under a missing tab.
 */
export function visibleTabs<T>(
  pageHref: string,
  tabs: readonly T[],
  keyOf: (tab: T) => string,
  hidden: ReadonlySet<string>,
  activeKey: string | null,
): T[] {
  if (hidden.size === 0) return [...tabs];
  return tabs.filter((tab, index) => {
    const key = keyOf(tab);
    return index === 0 || key === activeKey || !hidden.has(tabId(pageHref, key));
  });
}
