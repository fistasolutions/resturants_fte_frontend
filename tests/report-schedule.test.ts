/** SPEC-031 — report schedule service adapter + next-run formatting. */
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  adaptReportSchedule,
  updateReportSchedule,
} from "@/services/report-schedule";
import { formatNextRun } from "@/utils/format";

const API_SCHEDULE = {
  time: "09:30",
  timezone: "America/New_York",
  source: "custom" as const,
  next_run_at: "2026-07-18T09:30:00-04:00",
};

describe("adaptReportSchedule", () => {
  it("maps snake_case API fields to the ReportSchedule shape", () => {
    expect(adaptReportSchedule(API_SCHEDULE)).toEqual({
      time: "09:30",
      timezone: "America/New_York",
      source: "custom",
      nextRunAt: "2026-07-18T09:30:00-04:00",
    });
  });
});

describe("updateReportSchedule", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PUTs the time through the proxy and returns the adapted schedule", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ report_schedule: API_SCHEDULE }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateReportSchedule("09:30");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/settings/report-schedule",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ time: "09:30" }),
      }),
    );
    expect(result.nextRunAt).toBe("2026-07-18T09:30:00-04:00");
    expect(result.source).toBe("custom");
  });

  it("throws the API error message on a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Invalid time." } }),
      }),
    );
    await expect(updateReportSchedule("25:00")).rejects.toThrow("Invalid time.");
  });

  it("falls back to a generic message when the error body is unreadable", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("not json");
        },
      }),
    );
    await expect(updateReportSchedule("09:00")).rejects.toThrow(
      "Could not save the report schedule.",
    );
  });
});

describe("formatNextRun", () => {
  it("renders in the store's timezone, not the viewer's", () => {
    expect(formatNextRun("2026-07-18T09:30:00-04:00", "America/New_York")).toBe(
      "Jul 18, 9:30 AM (America/New_York)",
    );
  });

  it("renders UTC schedules in UTC", () => {
    expect(formatNextRun("2026-07-18T06:00:00+00:00", "UTC")).toBe(
      "Jul 18, 6:00 AM (UTC)",
    );
  });

  it("falls back to UTC for an invalid zone", () => {
    expect(formatNextRun("2026-07-18T06:00:00+00:00", "Not/AZone")).toBe(
      "Jul 18, 6:00 AM (UTC)",
    );
  });

  it("returns empty for an unparseable timestamp", () => {
    expect(formatNextRun("garbage", "UTC")).toBe("");
  });
});
