/** SPEC-256 — the Report FTE tab model. */
import { describe, expect, it } from "vitest";

import {
  REPORT_FTE_TABS,
  activeReportFteTab,
  composerHref,
  composerRunHref,
  reportPageHref,
  isReportFteFramedRoute,
  templateEditorHref,
} from "@/lib/report-fte-tabs";

describe("REPORT_FTE_TABS", () => {
  it("has six tabs in order, the Desk at the base path", () => {
    expect(REPORT_FTE_TABS.map((t) => t.key)).toEqual([
      "desk",
      "composer",
      "templates",
      "history",
      "delivered",
      "profile",
    ]);
    expect(REPORT_FTE_TABS[0].basePath).toBe("/report-fte");
    expect(REPORT_FTE_TABS[4].label).toBe("Delivered & scheduled");
  });

  it("activates on exact routes, keeps Templates active on the editor, and is null elsewhere", () => {
    expect(activeReportFteTab("/report-fte")).toBe("desk");
    expect(activeReportFteTab("/report-fte/")).toBe("desk");
    expect(activeReportFteTab("/report-fte/composer")).toBe("composer");
    expect(activeReportFteTab("/report-fte/templates")).toBe("templates");
    expect(activeReportFteTab("/report-fte/templates/trading-week")).toBe("templates");
    expect(activeReportFteTab("/report-fte/history")).toBe("history");
    expect(activeReportFteTab("/report-fte/reports/12")).toBeNull();
    expect(reportPageHref(12)).toBe("/report-fte/reports/12");
    expect(activeReportFteTab("/report-fte/profile")).toBe("profile");
    expect(activeReportFteTab("/report-fte/nope")).toBeNull();
    expect(activeReportFteTab("/reports")).toBeNull();
    expect(isReportFteFramedRoute("/report-fte/templates/x")).toBe(true);
    expect(isReportFteFramedRoute("/report-fte/other")).toBe(false);
  });

  it("builds the composer and editor hrefs", () => {
    expect(composerHref("  ")).toBe("/report-fte/composer");
    expect(composerRunHref(42)).toBe("/report-fte/composer?run=42");
    expect(composerHref("returns by brand & margin")).toBe(
      "/report-fte/composer?ask=returns%20by%20brand%20%26%20margin",
    );
    expect(templateEditorHref("trading-week")).toBe("/report-fte/templates/trading-week");
  });
});
