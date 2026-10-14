/**
 * Where the owner is when they ask the Ask Glisp panel something (SPEC-236).
 *
 * Reads the current URL into the `context` block `POST /chat` accepts (backend
 * SPEC-243): the sidebar title, the tab, the date range the URL names, and the
 * product / order / location the page is about. Everything here is derived from
 * the URL alone — no page data is read — so it is pure and unit-tested. The
 * backend resolves ids to names; the analyst never sees a bare number.
 *
 * Only what the URL actually says is sent: a page sitting on its silent default
 * range sends no range, so the analyst is never told a period the page did not
 * name.
 */
import { resolveDateRange } from "@/lib/date-range";
import { isNavItemActive, navItems } from "@/lib/navigation";
import type { ChatPageContext } from "@/types/chat";

export type SubjectKind = "product" | "order" | "location";

/** A dynamic route segment that names something the page is about. */
interface SubjectRoute {
  /** Path segments; `:product`, `:order`, `:location` capture a numeric id. */
  pattern: string;
}

/**
 * The dynamic routes whose segments are Shopify ids. Order matters only for
 * readability — every pattern must match the whole path.
 */
export const SUBJECT_ROUTES: readonly SubjectRoute[] = [
  { pattern: "/products/:product" },
  { pattern: "/orders/:order" },
  { pattern: "/returns/style/:product" },
  { pattern: "/inventory/dead-inventory-alerts/:product" },
  { pattern: "/inventory/dead-inventory-alerts/:product/:location" },
  { pattern: "/inventory/dead-inventory-alerts/:product/:location/send" },
  { pattern: "/inventory/store-transfers/:location" },
  { pattern: "/inventory/store-transfers/:location/:product" },
  { pattern: "/inventory/transfers/review/send/:location" },
  { pattern: "/brief/traffic/send/:location" },
  { pattern: "/brief/overdue/send/:location" },
  { pattern: "/orders/review/send/:location" },
  { pattern: "/traffic/stores/:location" },
  { pattern: "/discounts/locations/:location" },
  { pattern: "/discounts/transactions/:order" },
  { pattern: "/discounts/attention/send/:order" },
];

const ID_PATTERN = /^\d{1,19}$/;

/** "dead-stock" → "Dead stock"; "by-style" → "By style". */
export function humaniseSegment(segment: string): string {
  const words = segment.replace(/[-_]+/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "";
}

function parseId(raw: string | null | undefined): number | undefined {
  if (!raw || !ID_PATTERN.test(raw)) return undefined;
  const value = Number(raw);
  return Number.isSafeInteger(value) && value > 0 ? value : undefined;
}

/** Ids named by the path, per `SUBJECT_ROUTES`; empty when the path names none. */
function subjectIds(pathname: string): Partial<Record<SubjectKind, number>> {
  const parts = pathname.split("/").filter(Boolean);
  for (const { pattern } of SUBJECT_ROUTES) {
    const expected = pattern.split("/").filter(Boolean);
    if (expected.length !== parts.length) continue;
    const found: Partial<Record<SubjectKind, number>> = {};
    let matched = true;
    for (let index = 0; index < expected.length; index += 1) {
      const token = expected[index];
      const actual = parts[index];
      if (token.startsWith(":")) {
        const id = parseId(actual);
        if (id === undefined) {
          matched = false;
          break;
        }
        found[token.slice(1) as SubjectKind] = id;
      } else if (token !== actual) {
        matched = false;
        break;
      }
    }
    if (matched) return found;
  }
  return {};
}

/** The tab the page is on: `?tab=` first, else the second path segment when it is
 * a word (not an id and not a subject route). */
function tabOf(pathname: string, params: URLSearchParams): string | undefined {
  const fromQuery = params.get("tab");
  if (fromQuery) return humaniseSegment(fromQuery) || undefined;
  const parts = pathname.split("/").filter(Boolean);
  const second = parts[1];
  if (!second || ID_PATTERN.test(second)) return undefined;
  return humaniseSegment(second) || undefined;
}

function rangeOf(params: URLSearchParams, todayISO: string): ChatPageContext["range"] {
  const range = params.get("range") ?? params.get("period") ?? undefined;
  const from = params.get("from") ?? undefined;
  const to = params.get("to") ?? undefined;
  const date = params.get("date") ?? undefined;
  // Only when the URL names a period — never the page's silent default.
  if (!range && !(from && to) && !date) return undefined;
  const resolved = resolveDateRange({ range, from, to, date }, todayISO);
  return { label: resolved.label, start: resolved.from, end: resolved.to };
}

/**
 * The context block for the current URL, or null when the page is not a sidebar
 * destination (nothing useful to say). `todayISO` is injected so the range maths
 * is deterministic.
 */
export function pageContextFor(
  pathname: string,
  params: URLSearchParams,
  todayISO: string,
): ChatPageContext | null {
  const item = navItems.find((nav) => isNavItemActive(pathname, nav.href));
  if (!item) return null;

  const context: ChatPageContext = { route: pathname, page: item.title };
  const tab = tabOf(pathname, params);
  if (tab) context.tab = tab;
  const range = rangeOf(params, todayISO);
  if (range) context.range = range;

  const ids = subjectIds(pathname);
  if (ids.product) context.product_id = ids.product;
  if (ids.order) context.order_id = ids.order;
  const location = ids.location ?? parseId(params.get("location"));
  if (location) context.location_id = location;
  return context;
}

/** What the page is about, for choosing subject-aware prompts. */
export function subjectOf(context: ChatPageContext | null): SubjectKind | null {
  if (!context) return null;
  if (context.product_id) return "product";
  if (context.order_id) return "order";
  if (context.location_id) return "location";
  return null;
}
