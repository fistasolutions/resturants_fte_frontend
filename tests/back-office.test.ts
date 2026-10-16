import { describe, expect, it } from "vitest";

import { addDays, addPlanned, mondayOf, pct, readBackOfficeTab } from "@/lib/back-office";

describe("back office", () => {
  it("finds the Monday and moves through the week", () => {
    expect(mondayOf("2026-10-16")).toBe("2026-10-12");
    expect(mondayOf("2026-10-12")).toBe("2026-10-12");
    expect(mondayOf("2026-10-18")).toBe("2026-10-12");
    expect(addDays("2026-10-12", 6)).toBe("2026-10-18");
  });

  it("reads tabs, shares and keeps the plan in order without repeats", () => {
    expect(readBackOfficeTab("schedule")).toBe("schedule");
    expect(readBackOfficeTab("nope")).toBe("clock");
    expect(pct(0.3125)).toBe("31.3%");
    expect(pct(null)).toBe("—");
    let plan = addPlanned([], { staffId: 1, day: "2026-10-13", start: "10:00", end: "18:00" });
    plan = addPlanned(plan, { staffId: 2, day: "2026-10-12", start: "09:00", end: "17:00" });
    plan = addPlanned(plan, { staffId: 1, day: "2026-10-13", start: "10:00", end: "18:00" });
    expect(plan.map((p) => p.staffId)).toEqual([2, 1]);
  });
});
