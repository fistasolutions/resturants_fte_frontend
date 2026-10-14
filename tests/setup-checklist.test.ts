import { describe, expect, it } from "vitest";

import { toVisibility, type ApiVisibility, type SetupStep } from "@/lib/guided-view";
import { integrationQueries } from "@/lib/queries/integrations";
import type { SetupSyncRow } from "@/lib/queries/setup";
import {
  HUB_OVERVIEW_KEY,
  autoOpen,
  checklist,
  checklistIsStale,
  forDetail,
  forLabel,
  parseReturn,
  pollInterval,
  returnDecision,
  returnFor,
  seenOf,
  shouldWatch,
  stepState,
  toSyncFacts,
  type ReturnMemory,
} from "@/lib/setup-checklist";

const SHOPIFY: SetupStep = { integration: "shopify", any_of: ["shopify"], for: [], done: true };
const VCOUNT: SetupStep = {
  integration: "vcount",
  any_of: ["vcount"],
  for: ["overview", "stores", "opportunity", "hours", "staffing"].map((tab) => ({ kind: "tab" as const, page: "traffic", tab })),
  done: false,
};
const CLARITY: SetupStep = {
  integration: "clarity",
  any_of: ["clarity"],
  for: [{ kind: "tab", page: "traffic", tab: "website" }],
  done: false,
};
const FINANCE: SetupStep = {
  integration: "quickbooks",
  any_of: ["quickbooks"],
  for: [{ kind: "employee", key: "finance" }],
  done: false,
};

const vis = (setup: SetupStep[], disclosure = "guided") =>
  toVisibility({ disclosure, pages: {}, tabs: {}, setup } as ApiVisibility);

const row = (key: string, over: Partial<SetupSyncRow> = {}): SetupSyncRow => ({
  key,
  connected: false,
  status: "not_connected",
  last_success_at: null,
  can_sync: true,
  ...over,
});
const facts = (...rows: SetupSyncRow[]) => toSyncFacts(rows);

describe("a step's state", () => {
  it("is to do, syncing, done or failed, from the workspace and the hub", () => {
    expect(stepState(SHOPIFY, facts())).toBe("done");
    expect(stepState(CLARITY, facts(row("clarity")))).toBe("todo");
    expect(stepState(CLARITY, facts(row("clarity", { connected: true, status: "pending" })))).toBe("syncing");
    expect(stepState({ ...CLARITY, done: true }, facts())).toBe("done"); // not listed by the hub: done once connected
    expect(
      stepState(CLARITY, facts(row("clarity", { connected: true, status: "healthy", last_success_at: "2026-10-09T10:00:00Z" }))),
    ).toBe("done");
    expect(stepState(CLARITY, facts(row("clarity", { connected: true, status: "attention" })))).toBe("failed");
    // An app with nothing to sync is done once connected.
    expect(stepState({ ...FINANCE, integration: "meta", any_of: ["meta"] }, facts(row("meta", { connected: true, can_sync: false })))).toBe("done");
    // Search Console is `gsc` on the hub.
    expect(toSyncFacts([row("gsc", { connected: true })]).has("google")).toBe(true);
  });
});

describe("the checklist", () => {
  it("names each app and what it is for, grouping a page's tabs", () => {
    const list = checklist(vis([SHOPIFY, VCOUNT, CLARITY, FINANCE]))!;
    expect(list).toMatchObject({ done: 1, total: 4, percent: 25 });
    expect(list.lines.map((l) => [l.key, l.state, l.label, l.detail, l.href, l.returnTo])).toEqual([
      ["shopify", "done", "Shopify connected", "Your store", "/integrations/shopify", "/"],
      [
        "vcount",
        "todo",
        "Connect V-Count",
        "For Store Traffic: Overview, Store League, Lost-Sales, Peak Hours, Staffing",
        "/integrations/vcount",
        "/traffic",
      ],
      ["clarity", "todo", "Connect Microsoft Clarity", "For Store Traffic: Website", "/integrations/clarity", "/traffic/website"],
      ["quickbooks", "todo", "Connect QuickBooks Online", "For Accounts Payable", "/integrations/quickbooks", "/employees/finance"],
    ]);
  });

  it("follows a first sync, and stays until every app has synced", () => {
    const syncing = checklist(vis([SHOPIFY, { ...CLARITY, done: true }]), facts(row("clarity", { connected: true, status: "syncing" })))!;
    expect(syncing.lines[1]).toMatchObject({ state: "syncing", label: "Syncing Microsoft Clarity…" });
    expect(syncing.done).toBe(1);
    const failed = checklist(vis([SHOPIFY, { ...CLARITY, done: true }]), facts(row("clarity", { connected: true, status: "attention" })))!;
    expect(failed.lines[1]).toMatchObject({ state: "failed", label: "Microsoft Clarity's first sync failed" });
    expect(
      checklist(
        vis([SHOPIFY, { ...CLARITY, done: true }]),
        facts(row("clarity", { connected: true, status: "healthy", last_success_at: "2026-10-09T10:00:00Z" })),
      ),
    ).toBeNull();
  });

  it("is never drawn for a full organization or with nothing switched on", () => {
    expect(checklist(vis([SHOPIFY, CLARITY], "full"))).toBeNull();
    expect(checklist(vis([]))).toBeNull();
    expect(checklist(null)).toBeNull();
  });

  it("words what each step is for", () => {
    expect(forLabel({ kind: "tab", page: "products", tab: "fit" })).toBe("Product Analyst → Fit");
    expect(forDetail([{ kind: "page", key: "warehouse" }, ...CLARITY.for])).toBe("Warehouse; Store Traffic: Website");
    expect(returnFor(FINANCE)).toEqual({ href: "/employees/finance", label: "Accounts Payable" });
    expect(returnFor({ ...FINANCE, for: [{ kind: "page", key: "team-performance" }] })).toEqual({
      href: "/team-performance",
      label: "Team Performance",
    });
  });
});

describe("reading the sync facts", () => {
  it("polls only while a first sync runs or a connection is under way", () => {
    const syncing = checklist(vis([SHOPIFY, { ...CLARITY, done: true }]), facts(row("clarity", { connected: true, status: "syncing" })));
    expect(pollInterval(syncing, false)).toBe(2_500);
    expect(pollInterval(checklist(vis([SHOPIFY, CLARITY])), true)).toBe(3_000);
    expect(pollInterval(checklist(vis([SHOPIFY, CLARITY])), false)).toBe(false);
    expect(pollInterval(null, false)).toBe(false);
    expect(shouldWatch(vis([SHOPIFY, CLARITY]), false)).toBe(false);
    expect(shouldWatch(vis([SHOPIFY, { ...CLARITY, done: true }]), false)).toBe(true);
    expect(shouldWatch(vis([SHOPIFY, CLARITY]), true)).toBe(true);
    expect(shouldWatch(vis([SHOPIFY, CLARITY], "full"), true)).toBe(false);
  });

  it("is the Integrations overview, and refreshes the workspace on a new connection", () => {
    expect([...integrationQueries.overview().queryKey]).toEqual([...HUB_OVERVIEW_KEY]);
    const v = vis([SHOPIFY, VCOUNT, CLARITY]);
    expect(checklistIsStale(v, [row("vcount"), row("clarity")])).toBe(false);
    expect(checklistIsStale(v, [row("vcount"), row("clarity", { connected: true })])).toBe(true);
    expect(checklistIsStale(null, [row("clarity", { connected: true })])).toBe(false);
  });
});

describe("opening by itself", () => {
  const before = checklist(vis([SHOPIFY, VCOUNT]))!;
  const added = checklist(vis([SHOPIFY, VCOUNT, CLARITY]))!;

  it("opens on a new step or a step that moved on, highlighting it", () => {
    expect(autoOpen(seenOf(before), seenOf(added))).toEqual({ open: true, highlight: "clarity" });
    const syncing = checklist(vis([SHOPIFY, { ...VCOUNT, done: true }]), facts(row("vcount", { connected: true, status: "syncing" })))!;
    expect(autoOpen(seenOf(before), seenOf(syncing))).toEqual({ open: true, highlight: "vcount" });
  });

  it("opens for the store's and the brand's milestones (SPEC-362)", () => {
    expect(autoOpen({}, seenOf(null, { store: "running" }))).toEqual({ open: true, highlight: "store" });
    expect(autoOpen({ store: "running" }, seenOf(null, { store: "done", brand: "running" }))).toMatchObject({ open: true });
    expect(autoOpen({ store: "done", brand: "running" }, seenOf(null, { store: "done", brand: "review" }))).toEqual({
      open: true,
      highlight: "brand",
    });
  });

  it("stays shut for old news: the same steps, or nothing seen yet this session", () => {
    expect(autoOpen(seenOf(added), seenOf(added))).toEqual({ open: false, highlight: null });
    expect(autoOpen(null, seenOf(added))).toEqual({ open: false, highlight: null });
  });
});

describe("coming back", () => {
  const NOW = 1_800_000_000_000;
  const memory: ReturnMemory = { key: "clarity", integration: "clarity", href: "/traffic/website", label: "Store Traffic", at: NOW };

  it("keeps only a fresh, same-site memory", () => {
    expect(parseReturn(JSON.stringify(memory), NOW + 1_000)).toEqual(memory);
    expect(parseReturn(JSON.stringify(memory), NOW + 31 * 60_000)).toBeNull();
    expect(parseReturn(JSON.stringify({ ...memory, href: "https://evil.example" }), NOW)).toBeNull();
    expect(parseReturn(JSON.stringify({ ...memory, href: "//evil.example" }), NOW)).toBeNull();
    expect(parseReturn("not json", NOW)).toBeNull();
    expect(parseReturn(null, NOW)).toBeNull();
  });

  it("goes back once the app has synced, waits while it syncs, and stops when it failed", () => {
    const v = vis([SHOPIFY, VCOUNT, { ...CLARITY, done: true }]);
    const at = (status: string, synced = false) =>
      checklist(v, facts(row("clarity", { connected: true, status, last_success_at: synced ? "2026-10-09T10:00:00Z" : null })));
    expect(returnDecision(memory, at("syncing"), v)).toBe("wait");
    expect(returnDecision(memory, at("healthy", true), v)).toBe("back");
    expect(returnDecision(memory, at("attention"), v)).toBe("stop");
    // Every step done closes Setup: the step is still in the workspace, so go back.
    expect(returnDecision(memory, null, vis([SHOPIFY, { ...CLARITY, done: true }]))).toBe("back");
    // The step went away (the page was turned off): stay.
    expect(returnDecision(memory, null, vis([SHOPIFY, VCOUNT]))).toBe("stop");
    expect(returnDecision(null, at("syncing"), v)).toBeNull();
  });
});
