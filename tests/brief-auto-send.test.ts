/** SPEC-069 — brief auto-send schedule service adapter. */
import { afterEach, describe, expect, it, vi } from "vitest";

import { adaptBriefAutoSend, updateBriefAutoSend } from "@/services/brief-auto-send";

const API_SCHEDULE_ENABLED = {
  enabled: true,
  time: "08:00",
  timezone: "America/New_York",
  next_run_at: "2026-08-02T08:00:00-04:00",
};

const API_SCHEDULE_DISABLED = {
  enabled: false,
  time: "07:00",
  timezone: "America/New_York",
  next_run_at: null,
};

describe("adaptBriefAutoSend", () => {
  it("maps snake_case API fields to the BriefAutoSendSchedule shape when enabled", () => {
    expect(adaptBriefAutoSend(API_SCHEDULE_ENABLED)).toEqual({
      enabled: true,
      time: "08:00",
      timezone: "America/New_York",
      nextRunAt: "2026-08-02T08:00:00-04:00",
    });
  });

  it("maps a null next_run_at through when disabled", () => {
    expect(adaptBriefAutoSend(API_SCHEDULE_DISABLED)).toEqual({
      enabled: false,
      time: "07:00",
      timezone: "America/New_York",
      nextRunAt: null,
    });
  });
});

describe("updateBriefAutoSend", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("PUTs enabled+time through the proxy and returns the adapted schedule", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ brief_auto_send: API_SCHEDULE_ENABLED }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await updateBriefAutoSend(true, "08:00");

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proxy/settings/brief-auto-send",
      expect.objectContaining({
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: true, time: "08:00" }),
      }),
    );
    expect(result.enabled).toBe(true);
    expect(result.nextRunAt).toBe("2026-08-02T08:00:00-04:00");
  });

  it("throws the API error message on a failed response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: { message: "Invalid time." } }),
      }),
    );
    await expect(updateBriefAutoSend(true, "25:00")).rejects.toThrow("Invalid time.");
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
    await expect(updateBriefAutoSend(false, "07:00")).rejects.toThrow(
      "Could not save the auto-send schedule.",
    );
  });
});
