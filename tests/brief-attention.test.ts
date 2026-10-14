import { describe, expect, it } from "vitest";

import {
  DEFAULT_PRIMARY_LIMIT,
  checksSummary,
  deltaToneClass,
  sourceLabel,
  splitAttention,
} from "@/lib/brief-attention";
import type { BriefAttention, BriefAttentionItem } from "@/types/brief";

function item(key: string): BriefAttentionItem {
  return { key, status: "warn", title: key, count: 1, detail: "", href: "/" };
}

function data(n: number, over: Partial<BriefAttention> = {}): BriefAttention {
  return {
    generated_at: "2026-09-09T07:00:00Z",
    total: n,
    items: Array.from({ length: n }, (_, i) => item(`k${i}`)),
    checks_run: 9,
    checks_fired: n,
    checks_failed: 0,
    ...over,
  };
}

describe("splitAttention", () => {
  it("shows the top five and collapses the rest", () => {
    const { primary, extra } = splitAttention(data(8));
    expect(primary).toHaveLength(5);
    expect(extra).toHaveLength(3);
  });

  it("collapses nothing when everything fits", () => {
    const { primary, extra } = splitAttention(data(3));
    expect(primary).toHaveLength(3);
    expect(extra).toEqual([]);
  });

  it("honours a limit the backend sends", () => {
    const { primary, extra } = splitAttention(data(6, { primary_limit: 2 }));
    expect(primary).toHaveLength(2);
    expect(extra).toHaveLength(4);
  });

  it("preserves the backend's ranking — it holds the money, not the page", () => {
    const { primary } = splitAttention(data(5));
    expect(primary.map((i) => i.key)).toEqual(["k0", "k1", "k2", "k3", "k4"]);
  });

  it("falls back to the default limit when none is sent", () => {
    expect(DEFAULT_PRIMARY_LIMIT).toBe(5);
    expect(splitAttention(data(9)).primary).toHaveLength(5);
  });
});

describe("checksSummary", () => {
  it("states what ran, so silence is not mistaken for breakage", () => {
    expect(checksSummary(data(6))).toBe("6 of 9 checks fired");
  });

  it("names failures instead of folding them into the fired count", () => {
    expect(checksSummary(data(4, { checks_failed: 2 }))).toBe(
      "4 of 9 checks fired · 2 could not run",
    );
  });

  it("says nothing when the backend did not report counts", () => {
    expect(checksSummary(data(2, { checks_run: undefined }))).toBe("");
  });

  it("reports zero fired plainly — a clean morning is a result", () => {
    expect(checksSummary(data(0))).toBe("0 of 9 checks fired");
  });
});

describe("deltaToneClass", () => {
  it("uses destructive for an error-severity finding", () => {
    expect(deltaToneClass("+583% vs 30-day norm", "error")).toContain("destructive");
  });

  it("uses the warning token for a warn-severity finding", () => {
    expect(deltaToneClass("+115% vs 30-day norm", "warn")).toContain("warning");
  });

  it("never tints a fall green — a fired detector is bad news whichever way the number moved", () => {
    // store_conversion_drop and aov_drop both fire on a fall; a green chip on a
    // destructive-red card read as reassurance.
    expect(deltaToneClass("−15.6 pts", "error")).toContain("destructive");
    expect(deltaToneClass("-12% vs 30-day norm", "warn")).toContain("warning");
    for (const d of ["−27.7 pts", "-12%"]) {
      expect(deltaToneClass(d, "error")).not.toContain("success");
    }
  });

  it("never uses brand red — that token is identity only (Rule 9)", () => {
    for (const d of ["+50%", "−50%", ""]) {
      expect(deltaToneClass(d)).not.toContain("brand");
    }
  });

  it("returns nothing for a missing delta", () => {
    expect(deltaToneClass(undefined)).toBe("");
  });
});

describe("sourceLabel", () => {
  it("uppercases for the card badge", () => {
    expect(sourceLabel("V-Count")).toBe("V-COUNT");
    expect(sourceLabel("iPacky")).toBe("IPACKY");
  });

  it("is empty when the backend sent no source", () => {
    expect(sourceLabel(undefined)).toBe("");
    expect(sourceLabel("  ")).toBe("");
  });
});
