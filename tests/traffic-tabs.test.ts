/** SPEC-112 — Store Traffic tab model + routing helpers. */

import { describe, expect, it } from "vitest";

import {
  TRAFFIC_TABS,
  activeTrafficTab,
  isTrafficTabRoute,
  resolveTrafficRange,
  trafficTabHref,
} from "@/lib/traffic-tabs";

describe("activeTrafficTab", () => {
  it("matches exactly the three tab routes", () => {
    expect(activeTrafficTab("/traffic")).toBe("overview");
    expect(activeTrafficTab("/traffic/stores")).toBe("stores");
    expect(activeTrafficTab("/traffic/opportunity")).toBe("opportunity");
  });
  it("ignores trailing slashes", () => {
    expect(activeTrafficTab("/traffic/stores/")).toBe("stores");
  });
  it("returns null on nested/unknown routes so the shell stays off them", () => {
    expect(activeTrafficTab("/traffic/stores/jackson")).toBeNull();
    expect(activeTrafficTab("/dashboard")).toBeNull();
  });
});

describe("isTrafficTabRoute", () => {
  it("is true only on the three tab routes", () => {
    expect(isTrafficTabRoute("/traffic/opportunity")).toBe(true);
    expect(isTrafficTabRoute("/traffic/stores/x")).toBe(false);
  });
});

describe("trafficTabHref", () => {
  it("carries only range params across a switch", () => {
    const p = new URLSearchParams({ from: "2026-08-01", to: "2026-08-07", page: "2" });
    expect(trafficTabHref("/traffic/stores", p)).toBe(
      "/traffic/stores?from=2026-08-01&to=2026-08-07",
    );
  });
  it("no params → bare basePath", () => {
    expect(trafficTabHref("/traffic", new URLSearchParams())).toBe("/traffic");
  });
});

describe("resolveTrafficRange", () => {
  it("honours an explicit custom range", () => {
    const r = resolveTrafficRange({ from: "2026-07-01", to: "2026-07-10" });
    expect(r.from).toBe("2026-07-01");
    expect(r.to).toBe("2026-07-10");
  });
  it("defaults to a 7-day window when nothing is given", () => {
    const r = resolveTrafficRange({});
    // 7-day span inclusive → from is 7 days before to.
    const days = (new Date(r.to).getTime() - new Date(r.from).getTime()) / 86_400_000;
    expect(days).toBe(7);
  });
});


describe("Staffing tab (SPEC-219)", () => {
  it("is registered next to Peak Hours, whose data it reads", () => {
    const keys = TRAFFIC_TABS.map((t) => t.key);
    expect(keys).toContain("staffing");
    expect(keys.indexOf("staffing")).toBe(keys.indexOf("hours") + 1);
    expect(
      TRAFFIC_TABS.find((t) => t.key === "staffing")?.basePath,
    ).toBe("/traffic/staffing");
  });

  it("activates on its exact route only", () => {
    expect(activeTrafficTab("/traffic/staffing")).toBe("staffing");
    expect(activeTrafficTab("/traffic/staffing/3")).toBeNull();
  });
});
