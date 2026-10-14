import { describe, expect, it } from "vitest";

import { adaptRoster, figureText, lastLine, statusTone, teamLine, type RawRoster } from "@/lib/employees";
import { employeesPaths, employeesQueries } from "@/lib/queries/employees";
import type { Employee } from "@/types/employees";

const RAW: RawRoster = {
  generated_at: "2026-09-22T07:00:00+00:00",
  employees: [
    {
      key: "spotlight",
      name: "Search Visibility",
      monogram: "SV",
      role: "Search visibility",
      department: "Growth",
      job: "Finds the searches worth answering.",
      href: "/spotlight",
      status: "needs_you",
      status_label: "Needs you",
      status_note: "8 drafts to review.",
      needs_you: { count: 8, label: "drafts to review", href: "/spotlight?tab=approvals" },
      figures: [
        { key: "published_month", label: "Published · month", value: 0, kind: "count" },
        { key: "impressions_28d", label: "Impressions · 28d", value: 12345, kind: "count" },
        { key: "blog_revenue", label: "Blog revenue", value: 1234.5, kind: "money" },
      ],
      last_activity: { text: 'Drafted "The Denim Skirt"', at: "2026-09-18T12:43:55+00:00" },
      last_run: {
        job: "spotlight_nightly",
        title: "Search Visibility nightly",
        health: "ok",
        at: "2026-09-22T04:00:00+00:00",
        cadence_label: "Daily",
      },
      setup: null,
    },
    {
      key: "ads",
      name: "Paid Ads Manager",
      monogram: "PA",
      role: "Media buying",
      department: "Growth",
      job: "Proposes profit-aware campaigns.",
      href: "/ads",
      status: "not_started",
      status_label: "Not started",
      status_note: "Not started yet — create a campaign to give it its first job.",
      needs_you: null,
      figures: [
        { key: "live", label: "Live campaigns", value: 0, kind: "count" },
        { key: "spent", label: "Spent · month", value: 0, kind: "money" },
        { key: "cap", label: "Monthly cap", value: null, kind: "money" },
      ],
      last_activity: null,
      last_run: {
        job: "ads_guardrails",
        title: "Ads guardrails",
        health: "never_run",
        at: null,
        cadence_label: "Every 15 minutes",
      },
      setup: { label: "Create a campaign", href: "/ads?tab=campaigns" },
    },
  ],
  totals: { needs_you: 8, attention: 0, working: 0, not_started: 1 },
};

const NOW = new Date("2026-09-22T07:00:00Z");

describe("adaptRoster", () => {
  it("maps every field to the view model", () => {
    const roster = adaptRoster(RAW);
    expect(roster.generatedAt).toBe("2026-09-22T07:00:00+00:00");
    expect(roster.totals).toEqual({ needsYou: 8, attention: 0, working: 0, notStarted: 1 });
    const [spotlight, ads] = roster.employees;
    expect(spotlight.statusLabel).toBe("Needs you");
    expect(spotlight.needsYou).toEqual({ count: 8, label: "drafts to review", href: "/spotlight?tab=approvals" });
    expect(spotlight.lastRun?.cadenceLabel).toBe("Daily");
    expect(spotlight.setup).toBeNull();
    expect(ads.needsYou).toBeNull();
    expect(ads.setup).toEqual({ label: "Create a campaign", href: "/ads?tab=campaigns" });
    expect(ads.figures[2]).toEqual({ key: "cap", label: "Monthly cap", value: null, kind: "money" });
  });
});

describe("presentation", () => {
  it("statusTone never uses the brand token and covers every status", () => {
    expect(statusTone("working")).toBe("success");
    expect(statusTone("needs_you")).toBe("warning");
    expect(statusTone("attention")).toBe("destructive");
    expect(statusTone("idle")).toBe("neutral");
    expect(statusTone("not_started")).toBe("info");
    expect(statusTone("unread")).toBe("neutral");
  });

  it("figureText formats by kind and says when a value is unset", () => {
    expect(figureText({ key: "a", label: "A", value: 12345, kind: "count" })).toBe("12,345");
    expect(figureText({ key: "b", label: "B", value: 1234.5, kind: "money" })).toBe("$1,234.50");
    expect(figureText({ key: "c", label: "C", value: null, kind: "money" })).toBe("Not set");
    expect(figureText({ key: "c", label: "C", value: null, kind: "money" }, "unread")).toBe("—");
  });

  it("teamLine only says what is non-zero", () => {
    expect(teamLine({ needsYou: 8, attention: 0, working: 3, notStarted: 1 }, 4)).toBe(
      "4 digital employees · 8 items need you · 1 not started",
    );
    expect(teamLine({ needsYou: 1, attention: 2, working: 0, notStarted: 0 }, 4)).toBe(
      "4 digital employees · 1 item needs you · 2 need attention",
    );
    expect(teamLine({ needsYou: 0, attention: 0, working: 4, notStarted: 0 }, 4)).toBe(
      "4 digital employees · all on shift",
    );
  });

  it("lastLine prefers the domain's own event, then the last run, then nothing", () => {
    const [spotlight, ads] = adaptRoster(RAW).employees;
    expect(lastLine(spotlight, NOW)).toBe('Drafted "The Denim Skirt" · 4d ago');
    expect(lastLine(ads, NOW)).toBe("Ads guardrails · never run · never");
    const quiet: Employee = { ...ads, lastRun: null };
    expect(lastLine(quiet, NOW)).toBeNull();
  });
});

describe("employeesQueries", () => {
  it("reads the one roster path and adapts it", async () => {
    const seen: string[] = [];
    const api = async <T,>(path: string): Promise<T> => {
      seen.push(path);
      return RAW as unknown as T;
    };
    const def = employeesQueries.roster();
    expect(def.queryKey).toEqual(["employees", "roster"]);
    const roster = await def.load(api);
    expect(seen).toEqual([employeesPaths.roster()]);
    expect(employeesPaths.roster()).toBe("/employees");
    // Every employee comes from the backend's roster (backend SPEC-353, SPEC-354) — nothing
    // is added in the browser.
    expect(roster.employees).toHaveLength(RAW.employees.length);
  });
});
