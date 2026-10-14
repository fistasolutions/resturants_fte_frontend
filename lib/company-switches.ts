/**
 * The company's switches in Settings → Sidebar (SPEC-360 over backend SPEC-368) — pure.
 *
 * Two layers, as in Slack or Notion: the company decides what exists (an owner or admin turns a
 * page, a tab or an employee on or off for everyone), and each person decides what they see (the
 * personal hide of SPEC-338, kept in their browser). This module reads the company layer from
 * the workspace: whether each row is on, waiting for its connection, or off — and when off,
 * whether a switch can turn it on, and what to say about it.
 */
import { appsLabel, pageName, type NavVisibility } from "@/lib/disclosure";
import { EMPLOYEE_HREF, employeeName, switchState } from "@/lib/employee-switch";
import { pageKey } from "@/lib/first-sync";
import { AWAITING, tabLabel, type Visibility } from "@/lib/guided-view";

export type CompanyState = "on" | "waiting" | "off";
export type UnitKind = "page" | "tab" | "employee" | "locked";

export interface UnitSwitch {
  /** What the backend switch names: `traffic`, `products:fit`, or an employee key. */
  unit: string;
  kind: UnitKind;
  label: string;
  state: CompanyState;
  /** Off, and an owner or admin may turn it on. */
  switchable: boolean;
  /** One line under the row: why it is off, or what it waits for. */
  note: string | null;
  /** The systems it reads — what "also disconnect" offers when it is turned off. */
  integrations: string[];
}

/** Never switched by the company: where the switches live, and the employees' hub. */
const LOCKED_PAGES: ReadonlySet<string> = new Set(["settings", "integrations", "employees"]);

/** Gates no switch overrides: the role, the plan, the calendar. Such rows are not listed. */
const HARD_GATES: ReadonlySet<string> = new Set(["permission", "feature", "calendar"]);

/** Pages the backend gates on a connection (`capabilities.PAGE_CONNECTIONS`). */
export const PAGE_INTEGRATIONS: Readonly<Record<string, readonly string[]>> = {
  "team-performance": ["gorgias"],
  warehouse: ["ipacky"],
  traffic: ["vcount", "clarity"],
};

const each = (tabs: readonly string[], integration: string) =>
  Object.fromEntries(tabs.map((tab) => [tab, [integration]]));

/** Tabs that read one integration (`capabilities.TAB_NEEDS`, connections only). */
export const TAB_INTEGRATIONS: Readonly<Record<string, Readonly<Record<string, readonly string[]>>>> = {
  products: { fit: ["loop"] },
  returns: each(["overview", "by-style", "sizing", "categories", "fixes"], "loop"),
  foresight: { sizes: ["loop"] },
  spotlight: each(["visibility", "money-pages"], "google"),
  traffic: { ...each(["overview", "stores", "opportunity", "hours", "staffing"], "vcount"), website: ["clarity"] },
  ads: each(["overview", "campaigns", "spend-gates", "accountability"], "meta_ads"),
  "email-marketing": each(
    ["overview", "plan", "campaigns", "flows", "audiences", "content", "approvals", "performance", "deliverability", "chat"],
    "klaviyo",
  ),
  "customer-support": each(
    ["overview", "inbox", "approvals", "topics", "knowledge", "insights", "performance", "chat"],
    "gorgias",
  ),
};

/** The employee whose own page `href` is, if any. */
export function employeeAt(href: string): string | null {
  return Object.entries(EMPLOYEE_HREF).find(([, h]) => h === href)?.[0] ?? null;
}

/** Whether the company layer applies: a guided organization whose workspace was read. */
export function isGuided(visibility: Visibility | null): visibility is Visibility {
  return visibility?.disclosure === "guided";
}

/** The rows Settings → Sidebar lists in a guided organization: every destination the role may
 * open, on or off — not only the visible ones, so an off page can be turned back on. */
export function listedItems<T extends { href: string }>(items: readonly T[], navigation: NavVisibility[] | null): T[] {
  if (navigation === null) return [...items];
  const byKey = new Map(navigation.map((n) => [n.key, n]));
  return items.filter((item) => {
    const nav = byKey.get(pageKey(item.href));
    return !nav || nav.visible || !HARD_GATES.has(nav.reason ?? "");
  });
}

function offNote(
  reason: string | null,
  needs: { any_of?: string[]; apps?: string[]; connection?: string; action?: string } | null,
): string {
  switch (reason) {
    case "turned_off":
      return "Turned off for everyone.";
    case "not_connected": {
      // SPEC-369: name every app it reads, never "an integration".
      const apps = needs?.apps?.length ? needs.apps : needs?.connection ? [needs.connection] : [];
      return apps.length ? `Needs ${appsLabel(apps)}.` : "Needs its integration connected.";
    }
    case "guided_hidden":
      return "Tucked away in a new workspace.";
    case "needs_action":
      return "Appears after your first action from the Morning Brief.";
    case "needs_locations":
      return "Appears once your store has a second location.";
    case "needs_pos":
      return "Appears once you sell in store with Shopify POS.";
    case "needs_history":
      return "Needs three years of sales history.";
    case "calendar":
      return "Reads the Hebrew calendar, which isn't switched on.";
    case "inactive_employee":
      return "Switched off.";
    case "no_data":
      return needs?.action ? "Appears after your first action from the Morning Brief." : "None of its tabs has data yet.";
    default:
      return "Not available yet.";
  }
}

function waitingNote(integrations: readonly string[]): string {
  return `Waiting for ${appsLabel(integrations)}.`;
}

/** A sidebar page's company switch. */
export function pageUnit(visibility: Visibility, href: string, title: string): UnitSwitch {
  const employee = employeeAt(href);
  if (employee) return employeeUnit(visibility, employee);
  const key = pageKey(href);
  const integrations = [...(PAGE_INTEGRATIONS[key] ?? [])];
  const base = { unit: key, label: title, integrations };
  if (LOCKED_PAGES.has(key)) return { ...base, kind: "locked", state: "on", switchable: false, note: null };
  const entry = visibility.pages[key];
  if (!entry || entry.visible) {
    const waiting = entry?.reason === AWAITING;
    const anyOf = entry?.needs?.apps ?? entry?.needs?.any_of ?? integrations;
    return { ...base, kind: "page", state: waiting ? "waiting" : "on", switchable: false, note: waiting ? waitingNote(anyOf) : null };
  }
  const switchable = ["turned_off", "not_connected", "guided_hidden"].includes(entry.reason ?? "");
  return { ...base, kind: "page", state: "off", switchable, note: offNote(entry.reason, entry.needs) };
}

/** One tab's company switch. */
export function tabUnit(visibility: Visibility, pageHref: string, tab: string): UnitSwitch {
  const page = pageKey(pageHref);
  const integrations = [...(TAB_INTEGRATIONS[page]?.[tab] ?? [])];
  const base = { unit: `${page}:${tab}`, kind: "tab" as const, label: tabLabel(page, tab), integrations };
  const lock = visibility.tabs[page]?.[tab];
  if (!lock) return { ...base, state: "on", switchable: false, note: null };
  if (lock.reason === AWAITING) return { ...base, state: "waiting", switchable: false, note: waitingNote(lock.needs?.any_of ?? integrations) };
  const switchable = lock.reason === "turned_off" || lock.reason === "not_connected";
  return { ...base, state: "off", switchable, note: offNote(lock.reason, lock.needs) };
}

/** An employee's company switch: its Active switch (SPEC-359). */
export function employeeUnit(visibility: Visibility, key: string): UnitSwitch {
  const state = switchState(visibility, key);
  const employee = visibility.employees.find((e) => e.key === key);
  const integrations = employee?.needs ?? [];
  const base = { unit: key, kind: "employee" as const, label: employeeName(key), integrations };
  if (!state.active) return { ...base, state: "off", switchable: true, note: "Switched off." };
  if (state.missing) return { ...base, state: "waiting", switchable: false, note: waitingNote([state.missing]) };
  return { ...base, state: "on", switchable: false, note: null };
}

/**
 * What else reads `integration` and is on — what disconnecting it would also empty. `unit` (and,
 * for a page or an employee, its own tabs) is left out: it is the thing being turned off. An
 * employee's tabs are named by the employee; several tabs of one page are counted, not listed.
 */
export function usedElsewhere(visibility: Visibility, integration: string, unit: string): string[] {
  const ownPage = unit.includes(":") ? null : EMPLOYEE_HREF[unit] ? pageKey(EMPLOYEE_HREF[unit]) : unit;
  const employeePages = new Set(Object.values(EMPLOYEE_HREF).map(pageKey));
  const out: string[] = [];
  for (const [key, integrations] of Object.entries(PAGE_INTEGRATIONS)) {
    if (key === ownPage || !integrations.includes(integration)) continue;
    if (visibility.pages[key]?.visible) out.push(pageName(key));
  }
  for (const [tabPage, tabs] of Object.entries(TAB_INTEGRATIONS)) {
    if (tabPage === ownPage || employeePages.has(tabPage) || !visibility.pages[tabPage]?.visible) continue;
    const reading = Object.entries(tabs)
      .filter(([tab, integrations]) => `${tabPage}:${tab}` !== unit && integrations.includes(integration))
      .filter(([tab]) => {
        const lock = visibility.tabs[tabPage]?.[tab];
        return !lock || lock.reason === AWAITING;
      })
      .map(([tab]) => tab);
    if (reading.length === 1) out.push(`${pageName(tabPage)} → ${tabLabel(tabPage, reading[0])}`);
    else if (reading.length > 1) out.push(`${pageName(tabPage)} (${reading.length} tabs)`);
  }
  for (const employee of visibility.employees) {
    if (employee.key === unit || !employee.active || !employee.needs.includes(integration)) continue;
    out.push(employeeName(employee.key));
  }
  return out;
}

/** The workspace names Search Console `google`; the Integrations catalogue names it `gsc`. */
const WORKSPACE_TO_CATALOG: Readonly<Record<string, string>> = { google: "gsc" };

/**
 * The apps Browse lists (SPEC-360): for a guided organization, Shopify, what is connected, and
 * what something switched on needs (`integrations_shown`); for everyone else, every app. Meta
 * Ads has no card here — it connects on Paid Ads → Audit.
 */
export function browseKeys<K extends string>(visibility: Visibility | null, all: readonly K[]): K[] {
  if (!isGuided(visibility)) return [...all];
  const shown = new Set(visibility.integrationsShown.map((key) => WORKSPACE_TO_CATALOG[key] ?? key));
  return all.filter((key) => shown.has(key));
}
