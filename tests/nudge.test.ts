import { describe, expect, it } from "vitest";

import { nudgeQueries } from "@/lib/queries/nudge";
import {
  DISMISSED_TTL_MS,
  NUDGE_ROUTES,
  hasPageRule,
  nudgeContext,
  nudgeRouteFor,
  pruneDismissed,
  splitLine,
} from "@/lib/nudge";
import type { Nudge } from "@/types/nudge";

const NUDGE: Nudge = {
  id: "dashboard:revenue:+359",
  page: "Dashboard",
  line: "Revenue is +358.8% vs yesterday at this hour.",
  figure: "+358.8%",
  action: "Explain",
  question: 'Explain the "Revenue" figure on this page — it reads $65,644, +358.8% vs yesterday (same time). What is behind it, and what should I do about it?',
  focus: "Revenue — $65,644, +358.8% vs yesterday (same time)",
  href: null,
};

describe("nudgeRouteFor", () => {
  it("maps a page to its family and ignores pages without a rule", () => {
    expect(nudgeRouteFor("/dashboard")).toBe("/dashboard");
    expect(nudgeRouteFor("/inventory/dead-stock")).toBe("/inventory");
    expect(nudgeRouteFor("/orders/5551234")).toBe("/orders");
    // SPEC-262: a fired watch can show on any page, so every family asks…
    expect(nudgeRouteFor("/ai")).toBe("/ai");
    expect(nudgeRouteFor("/tax-reports/2026-08")).toBe("/tax-reports");
    expect(hasPageRule("/ai")).toBe(false);
    expect(hasPageRule("/orders")).toBe(true);
    // …except where the panel is not there to show it.
    expect(nudgeRouteFor("/chat")).toBeNull();
    expect(nudgeRouteFor("/login")).toBeNull();
    expect(nudgeRouteFor("/")).toBeNull();
  });

  it("mirrors the backend rule table exactly", () => {
    expect([...NUDGE_ROUTES].sort()).toEqual(
      ["/customers", "/dashboard", "/discounts", "/foresight", "/inventory", "/orders", "/products", "/returns"].sort(),
    );
  });
});

describe("dismissals", () => {
  it("keeps recent, well-formed entries and drops the rest", () => {
    const now = 10_000_000_000;
    expect(
      pruneDismissed(
        { fresh: now - 1000, stale: now - DISMISSED_TTL_MS - 1, junk: "x", other: null },
        now,
      ),
    ).toEqual({ fresh: now - 1000 });
    expect(pruneDismissed(null, now)).toEqual({});
    expect(pruneDismissed("nope", now)).toEqual({});
  });
});

describe("nudgeContext / splitLine", () => {
  it("attaches the focus to the page context and keeps null null", () => {
    expect(nudgeContext({ route: "/dashboard", page: "Dashboard" }, NUDGE)).toEqual({
      route: "/dashboard",
      page: "Dashboard",
      focus: NUDGE.focus,
    });
    expect(nudgeContext(null, NUDGE)).toBeNull();
  });

  it("splits the line around the figure for bolding", () => {
    expect(splitLine(NUDGE)).toEqual(["Revenue is ", "+358.8%", " vs yesterday at this hour."]);
    expect(splitLine({ ...NUDGE, figure: "missing" })).toEqual([NUDGE.line, "", ""]);
  });
});

describe("nudgeQueries", () => {
  it("reads the route's nudge through the client cache", async () => {
    const def = nudgeQueries.forRoute("/inventory");
    expect(def.queryKey).toEqual(["nudge", "/inventory"]);
    const calls: string[] = [];
    const api = async <T,>(path: string): Promise<T> => {
      calls.push(path);
      return { nudge: NUDGE } as T;
    };
    expect(await def.load(api)).toEqual(NUDGE);
    expect(calls).toEqual(["/nudge?route=%2Finventory"]);
    expect(await def.load(async <T,>() => ({ nudge: null }) as T)).toBeNull();
  });
});
