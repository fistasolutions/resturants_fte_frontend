/**
 * The setup checklist (SPEC-360; follows the first sync since SPEC-361) — pure.
 *
 * Every page, tab or employee the company switched on that reads an integration is a step:
 * "Connect V-Count", for Store Traffic: Overview, Store League, …. A step is to do until its app
 * is connected, syncing until that app's first good sync finishes, then done (or failed, when
 * the first sync failed). Setup sits at the top right of every page while any step is not done,
 * opens by itself when a step appears or changes, and — when the person connected an app from
 * Setup — takes them back to the page the step was for once that app has synced.
 */
import { connectionsLabel, integrationHref, integrationName, pageName } from "@/lib/disclosure";
import { EMPLOYEE_HREF, employeeName } from "@/lib/employee-switch";
import { TAB_ROUTES, tabHref, tabLabel, type SetupFor, type SetupStep, type Visibility } from "@/lib/guided-view";
import { navItems } from "@/lib/navigation";
import { pageKey } from "@/lib/first-sync";
import type { SetupSyncRow } from "@/lib/queries/setup";

export type LineState = "todo" | "syncing" | "done" | "failed";

export interface ChecklistLine {
  key: string;
  state: LineState;
  label: string;
  detail: string;
  /** Where the line's link goes: the app's page. */
  href: string;
  /** The app the line is about. */
  integration: string;
  /** The page the step is for — where Setup brings the person back to. */
  returnTo: string;
  /** "Store Traffic" — the page's name, for "… is ready". */
  returnLabel: string;
}

export interface Checklist {
  done: number;
  total: number;
  /** 0–100, for the progress bar. */
  percent: number;
  lines: ChecklistLine[];
}

/** One app's connection and first-sync facts, as Setup judges them. */
export interface SyncFact {
  connected: boolean;
  synced: boolean;
  failed: boolean;
}

export type SyncFacts = ReadonlyMap<string, SyncFact>;

/** The Integrations hub names Search Console `gsc`; the workspace names it `google`. */
const HUB_TO_WORKSPACE: Readonly<Record<string, string>> = { gsc: "google" };

/**
 * The hub's rows as Setup's facts. Synced: connected, and either a good sync has finished or the
 * app has nothing to sync (Meta for posting). Failed: connected, never synced, and the hub says
 * it needs attention.
 */
export function toSyncFacts(rows: readonly SetupSyncRow[]): SyncFacts {
  const out = new Map<string, SyncFact>();
  for (const row of rows) {
    const synced = row.connected && (!row.can_sync || row.last_success_at !== null);
    out.set(HUB_TO_WORKSPACE[row.key] ?? row.key, {
      connected: row.connected,
      synced,
      failed: row.connected && !synced && row.status === "attention",
    });
  }
  return out;
}

/** What a step is for, as the sidebar names it: "Accounts Payable", "Product Analyst → Fit". */
export function forLabel(item: SetupFor): string {
  if (item.kind === "employee") return employeeName(item.key);
  if (item.kind === "page") return pageName(item.key);
  return `${pageName(item.page)} → ${tabLabel(item.page, item.tab)}`;
}

/** "Store Traffic: Overview, Store League; Accounts Payable" — tabs grouped under their page. */
export function forDetail(items: readonly SetupFor[]): string {
  const parts: string[] = [];
  const tabsByPage = new Map<string, string[]>();
  for (const item of items) {
    if (item.kind === "tab") {
      const tabs = tabsByPage.get(item.page);
      if (tabs) tabs.push(tabLabel(item.page, item.tab));
      else {
        tabsByPage.set(item.page, [tabLabel(item.page, item.tab)]);
        parts.push(`tab:${item.page}`);
      }
    } else {
      parts.push(forLabel(item));
    }
  }
  return parts
    .map((part) => {
      if (!part.startsWith("tab:")) return part;
      const page = part.slice(4);
      return `${pageName(page)}: ${(tabsByPage.get(page) ?? []).join(", ")}`;
    })
    .join("; ");
}

function pageHref(key: string): string {
  return navItems.find((item) => pageKey(item.href) === key)?.href ?? `/${key}`;
}

/** The page a step is for: the first item's own page (a tab's own URL, an employee's page). */
export function returnFor(step: SetupStep): { href: string; label: string } {
  const item = step.for[0];
  if (!item) return { href: "/", label: "your workspace" };
  if (item.kind === "employee") return { href: EMPLOYEE_HREF[item.key] ?? "/employees", label: employeeName(item.key) };
  if (item.kind === "page") return { href: pageHref(item.key), label: pageName(item.key) };
  const href = TAB_ROUTES[item.page] ? tabHref(item.page, item.tab) : pageHref(item.page);
  return { href, label: pageName(item.page) };
}

/** A step's state: the workspace says whether it is connected; the hub's facts say whether it
 * has synced. An app the hub does not list (Meta Ads) counts as synced once connected. */
export function stepState(step: SetupStep, facts: SyncFacts): LineState {
  if (step.integration === "shopify") return "done";
  const anyOf = step.any_of.length ? step.any_of : [step.integration];
  const known = anyOf.map((key) => facts.get(key)).filter((fact): fact is SyncFact => fact !== undefined);
  const connected = step.done || known.some((fact) => fact.connected);
  if (!connected) return "todo";
  if (known.length === 0 || known.some((fact) => fact.synced)) return "done";
  if (known.some((fact) => fact.failed)) return "failed";
  return "syncing";
}

function line(step: SetupStep, facts: SyncFacts): ChecklistLine {
  const anyOf = step.any_of.length ? step.any_of : [step.integration];
  const state = stepState(step, facts);
  const app = connectionsLabel(anyOf);
  const back = returnFor(step);
  const forText = step.integration === "shopify" ? "Your store" : `For ${forDetail(step.for)}`;
  const label =
    state === "todo"
      ? `Connect ${app}`
      : state === "syncing"
        ? `Syncing ${app}…`
        : state === "failed"
          ? `${app}'s first sync failed`
          : step.integration === "shopify"
            ? "Shopify connected"
            : `${app} connected and synced`;
  const detail =
    state === "syncing"
      ? `First sync running. ${forText}.`
      : state === "failed"
        ? `Open ${integrationName(step.integration)} to see why and try again.`
        : forText;
  return {
    key: anyOf.join("+"),
    state,
    label,
    detail,
    href: integrationHref(step.integration),
    integration: step.integration,
    returnTo: back.href,
    returnLabel: back.label,
  };
}

/** The checklist to draw, or null: a full organization (FOC), nothing switched on that needs an
 * integration, or every step connected and synced. */
export function checklist(visibility: Visibility | null, facts: SyncFacts = new Map()): Checklist | null {
  if (!visibility || visibility.disclosure !== "guided") return null;
  const lines = visibility.setup.map((step) => line(step, facts));
  if (lines.length === 0 || lines.every((l) => l.state === "done")) return null;
  const done = lines.filter((l) => l.state === "done").length;
  return { done, total: lines.length, percent: Math.round((done / lines.length) * 100), lines };
}

/** How often Setup reads the sync facts: fast while a first sync runs, steadily while the person
 * is away connecting an app from Setup, otherwise never. */
export function pollInterval(list: Checklist | null, returning: boolean): number | false {
  if (!list) return returning ? 3_000 : false;
  if (list.lines.some((l) => l.state === "syncing")) return 2_500;
  if (returning) return 3_000;
  return false;
}

/** Whether Setup should read the sync facts at all: a guided organization with a step past
 * "to do" waiting on its first sync, or a connection under way from Setup. */
export function shouldWatch(visibility: Visibility | null, returning: boolean): boolean {
  if (!visibility || visibility.disclosure !== "guided") return false;
  return returning || visibility.setup.some((step) => step.done && step.integration !== "shopify");
}

/** What Setup last showed, by key: each app line's state, plus the store's and the brand's
 * milestones (SPEC-362). */
export type Seen = Readonly<Record<string, string>>;

export function seenOf(list: Checklist | null, extra: Readonly<Record<string, string>> = {}): Seen {
  return { ...Object.fromEntries((list?.lines ?? []).map((l) => [l.key, l.state])), ...extra };
}

/**
 * Whether Setup opens by itself, and which entry it highlights: one that was not there before,
 * or one whose state moved on (never to "to do"). With nothing seen yet in this session
 * (`previous` null) it only records what it shows, so a reload never reopens it for old news.
 */
export function autoOpen(previous: Seen | null, current: Seen): { open: boolean; highlight: string | null } {
  if (previous === null) return { open: false, highlight: null };
  const changed = Object.entries(current).find(
    ([key, state]) => previous[key] === undefined || (previous[key] !== state && state !== "todo"),
  );
  return changed ? { open: true, highlight: changed[0] } : { open: false, highlight: null };
}

/** What Setup remembers while the person is away connecting an app from it. */
export interface ReturnMemory {
  key: string;
  integration: string;
  href: string;
  label: string;
  /** Epoch ms; a memory older than half an hour is ignored. */
  at: number;
}

const RETURN_TTL_MS = 30 * 60 * 1000;

export function parseReturn(raw: string | null, now: number): ReturnMemory | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<ReturnMemory>;
    if (
      typeof value.key !== "string" ||
      typeof value.integration !== "string" ||
      typeof value.href !== "string" ||
      !value.href.startsWith("/") ||
      value.href.startsWith("//") ||
      typeof value.label !== "string" ||
      typeof value.at !== "number" ||
      now - value.at > RETURN_TTL_MS
    ) {
      return null;
    }
    return value as ReturnMemory;
  } catch {
    return null;
  }
}

/** What to do about a remembered return now: go back (the app has synced), stop (its first sync
 * failed — stay where the reason is), or keep waiting. */
export function returnDecision(memory: ReturnMemory | null, list: Checklist | null, visibility: Visibility | null): "back" | "stop" | "wait" | null {
  if (!memory) return null;
  const line = list?.lines.find((l) => l.key === memory.key);
  if (line) return line.state === "done" ? "back" : line.state === "failed" ? "stop" : "wait";
  // The line is gone: every step is done (Setup closed), or the step itself went away.
  const step = visibility?.setup.find((s) => (s.any_of.length ? s.any_of : [s.integration]).join("+") === memory.key);
  return step ? "back" : "stop";
}

/**
 * Whether a fresh read of the hub disagrees with the checklist: a step whose integration was
 * just connected (or disconnected). Setup then refreshes the workspace, so a connection made
 * anywhere ticks its step off without a reload.
 */
export function checklistIsStale(visibility: Visibility | null, hub: readonly { key: string; connected: boolean }[]): boolean {
  if (!visibility || visibility.disclosure !== "guided") return false;
  const connected = new Set(hub.filter((c) => c.connected).map((c) => HUB_TO_WORKSPACE[c.key] ?? c.key));
  const known = new Set(hub.map((c) => HUB_TO_WORKSPACE[c.key] ?? c.key));
  return visibility.setup.some((step) => {
    const judged = step.any_of.filter((key) => known.has(key));
    if (judged.length === 0) return false;
    return judged.some((key) => connected.has(key)) !== step.done;
  });
}

/**
 * The Integrations hub's overview read, by its cache key (`integrationQueries.overview()`). Named
 * here, not imported, because Setup is drawn on every page and that module carries the whole
 * hub's adapters; `tests/setup-checklist.test.ts` pins the two equal.
 */
export const HUB_OVERVIEW_KEY: readonly string[] = ["integrations", "overview"];
