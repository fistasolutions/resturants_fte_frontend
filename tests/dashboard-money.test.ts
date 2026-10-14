import { describe, expect, it } from "vitest";

import {
  VISIBLE_LINES,
  buildMoneyCard,
  buildMoneyCards,
  lineSub,
  missingSourcesNote,
} from "@/lib/dashboard-money";
import type { DashboardMoney, DashboardMoneyLine, DashboardMoneyNumber } from "@/types/dashboard";

function line(key: string, amount: number, count: number, unit = "products"): DashboardMoneyLine {
  return { key, label: key, amount, count, unit, action: `Fix ${key}`, href: `/${key}` };
}

function number(
  key: DashboardMoneyNumber["key"],
  lines: DashboardMoneyLine[],
  over: Partial<DashboardMoneyNumber> = {},
): DashboardMoneyNumber {
  return {
    key,
    title: key,
    question: `${key}?`,
    total: lines.reduce((sum, l) => sum + l.amount, 0),
    lines,
    ...over,
  };
}

function money(numbers: DashboardMoneyNumber[], sources_missing: string[] = []): DashboardMoney {
  return { generated_at: "2026-09-14T10:00:00Z", window_days: 30, numbers, sources_missing };
}

describe("lineSub", () => {
  it("formats the amount, then the count with its noun", () => {
    expect(lineSub(line("policy", 479355.84, 692, "orders"))).toBe("$479,355.84 · 692 orders");
    expect(lineSub(line("dead", 1929323.18, 1472))).toBe("$1,929,323.18 · 1,472 products");
  });
});

describe("buildMoneyCard", () => {
  it("shows the first lines and folds the rest", () => {
    const card = buildMoneyCard(
      number("trapped", [line("a", 300, 3), line("b", 200, 2), line("c", 100, 1)]),
    );
    expect(card.total).toBe("$600.00");
    expect(card.tone).toBe("warn");
    expect(card.lines.map((l) => l.key)).toEqual(["a", "b"]);
    expect(card.lines).toHaveLength(VISIBLE_LINES);
    expect(card.hidden).toBe(1);
    expect(card.empty).toBe(false);
    expect(card.lines[0]).toEqual({
      key: "a",
      label: "a",
      sub: "$300.00 · 3 products",
      action: "Fix a",
      href: "/a",
    });
  });

  it("gives leaked money the destructive tone and at-risk money the warning tone", () => {
    expect(buildMoneyCard(number("leaking", [line("x", 1, 1)])).tone).toBe("bad");
    expect(buildMoneyCard(number("at_risk", [line("x", 1, 1)])).tone).toBe("warn");
  });

  it("treats a number with no lines as a real, neutral zero", () => {
    const card = buildMoneyCard(number("leaking", []));
    expect(card.empty).toBe(true);
    expect(card.tone).toBe("neutral");
    expect(card.total).toBe("$0.00");
    expect(card.lines).toEqual([]);
    expect(card.hidden).toBe(0);
  });

  it("never folds when everything fits", () => {
    expect(buildMoneyCard(number("trapped", [line("a", 1, 1), line("b", 1, 1)])).hidden).toBe(0);
  });
});

describe("buildMoneyCards", () => {
  it("keeps the backend's order", () => {
    const cards = buildMoneyCards(
      money([number("trapped", []), number("leaking", []), number("at_risk", [])]),
    );
    expect(cards.map((c) => c.key)).toEqual(["trapped", "leaking", "at_risk"]);
  });
});

describe("missingSourcesNote", () => {
  it("is null when every producer answered", () => {
    expect(missingSourcesNote(money([]))).toBeNull();
  });

  it("names how many sources are missing, never a zero", () => {
    expect(missingSourcesNote(money([], ["stockout"]))).toBe(
      "1 source could not be read — figures are partial",
    );
    expect(missingSourcesNote(money([], ["stockout", "dormant_vips"]))).toBe(
      "2 sources could not be read — figures are partial",
    );
  });
});
