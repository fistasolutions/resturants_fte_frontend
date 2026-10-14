/**
 * SPEC-301 — the payment run's in-browser half: ticks, each company's cash after each
 * ticked bill, the run's total, the reason labels, the clipboard text.
 */
import { describe, expect, it } from "vitest";

import { cashAfter, defaultPicks, reasonLabel, runCompanies, runText, runTotal, toggled } from "@/lib/finance-run";
import type { BillRef, RunPlan, RunRow } from "@/types/finance";

function ref(id: string, company: string, balance: number, days: number): BillRef {
  return {
    id,
    company,
    vendor: `Vendor ${id}`,
    number: `B-${id}`,
    billedOn: "2026-09-01",
    dueOn: "2026-09-27",
    days,
    amount: balance,
    balance,
    status: "open",
    flags: [],
  };
}

function row(bill: BillRef, reason: RunRow["reason"], extra: Partial<RunRow> = {}): RunRow {
  return {
    bill,
    reason,
    daysLate: null,
    deadline: null,
    save: null,
    dueIn: null,
    selected: true,
    heldReason: null,
    ...extra,
  };
}

const PLAN: RunPlan = {
  through: "week",
  throughDate: "2026-09-27",
  days: 3,
  rows: [
    row(ref("1", "Pomona", 18420, -3), "late", { daysLate: 3 }),
    row(ref("2", "Pomona", 18420, -1), "late", { daysLate: 1, selected: false, heldReason: "Looks like a second copy" }),
    row(ref("3", "Lawrence", 12500, 24), "discount", { deadline: "2026-09-28", save: 250 }),
    row(ref("4", "Pomona", 5000, 2), "due", { dueIn: 2 }),
  ],
  companies: [
    { company: "Lawrence", bank: 142380.55, cushion: 5000 },
    { company: "Pomona", bank: 21640.1, cushion: 8000 },
    { company: "Jackson", bank: null, cushion: 5000 },
  ],
  live: true,
};

describe("the run", () => {
  it("starts with everything except what the backend held back", () => {
    expect([...defaultPicks(PLAN)].sort()).toEqual(["1", "3", "4"]);
  });

  it("each company pays from its own account", () => {
    const companies = Object.fromEntries(runCompanies(PLAN, defaultPicks(PLAN)).map((c) => [c.company, c]));
    expect(companies.Pomona).toMatchObject({ need: 23420, left: -1779.9, verdict: "short", bills: 2 });
    expect(companies.Lawrence).toMatchObject({ need: 12500, left: 129880.55, verdict: "covered" });
    expect(companies.Jackson).toMatchObject({ need: 0, left: null, verdict: "no_bank" });
  });

  it("cash after runs down each company's balance in run order; a held bill moves nothing", () => {
    const after = cashAfter(PLAN, defaultPicks(PLAN));
    expect(after.get("1")).toBe(3220.1);
    expect(after.get("2")).toBeNull();
    expect(after.get("4")).toBe(-1779.9);
    expect(after.get("3")).toBe(129880.55);
  });

  it("ticking the held copy back in moves Pomona further short", () => {
    const picks = toggled(defaultPicks(PLAN), "2");
    expect(runCompanies(PLAN, picks).find((c) => c.company === "Pomona")?.left).toBe(-20199.9);
    expect(runTotal(PLAN, picks)).toEqual({ amount: 54340, bills: 4 });
    expect(toggled(picks, "2").has("2")).toBe(false);
  });

  it("says why each bill is in the run", () => {
    expect(reasonLabel(PLAN.rows[0])).toEqual({ text: "3d late", tone: "bad" });
    expect(reasonLabel(PLAN.rows[2])).toEqual({ text: "Save $250 by Sep 28", tone: "good" });
    expect(reasonLabel(PLAN.rows[3]).tone).toBe("warn");
  });

  it("copies only the ticked bills, numbered", () => {
    expect(runText(PLAN, defaultPicks(PLAN)).split("\n")).toEqual([
      "1. Pomona · Vendor 1 · B-1 · $18420.00",
      "2. Lawrence · Vendor 3 · B-3 · $12500.00",
      "3. Pomona · Vendor 4 · B-4 · $5000.00",
    ]);
  });
});
