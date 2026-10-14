import { describe, expect, it } from "vitest";

import { EMPLOYEE_HREF, employeeName, switchState } from "@/lib/employee-switch";
import { toVisibility, type ApiVisibility } from "@/lib/guided-view";
import { hubChildren, navItems } from "@/lib/navigation";

const guided = (employees: ApiVisibility["employees"]) =>
  toVisibility({ disclosure: "guided", pages: {}, tabs: {}, employees })!;

describe("an employee's switch", () => {
  it("reads the workspace's answer on a guided organization", () => {
    const v = guided([
      { key: "spotlight", active: true, needs: [], ready: true },
      { key: "finance", active: true, needs: ["quickbooks"], ready: false },
      { key: "social", active: false, needs: ["meta"], ready: false },
    ]);
    expect(switchState(v, "spotlight")).toEqual({ switchable: true, active: true, missing: null });
    expect(switchState(v, "finance")).toEqual({ switchable: true, active: true, missing: "quickbooks" });
    // Off: nothing is missing yet, because it isn't asked to work.
    expect(switchState(v, "social")).toEqual({ switchable: true, active: false, missing: null });
  });

  it("is not drawn, and counts as on, for a full organization or an unread workspace", () => {
    const full = toVisibility({
      disclosure: "full",
      pages: {},
      employees: [{ key: "social", active: false, needs: ["meta"], ready: false }],
    });
    const always = { switchable: false, active: true, missing: null };
    expect(switchState(full, "social")).toEqual(always);
    expect(switchState(null, "social")).toEqual(always);
    expect(switchState(guided([]), "social")).toEqual(always);
  });
});

describe("employee names", () => {
  it("name every employee by its sidebar title", () => {
    const titles = new Map([...navItems, ...hubChildren("/employees")].map((item) => [item.href, item.title]));
    for (const [key, href] of Object.entries(EMPLOYEE_HREF)) {
      expect(titles.has(href), key).toBe(true);
      expect(employeeName(key)).toBe(titles.get(href));
    }
    expect(employeeName("unknown")).toBe("unknown");
  });
});
