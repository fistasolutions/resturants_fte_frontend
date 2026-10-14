/**
 * SPEC-216 — generation toast logic.
 *
 * The rule worth protecting: the Generate button is DISABLED and explains itself, never
 * hidden. A control that vanishes reads as a bug.
 */
import { describe, expect, it } from "vitest";

import {
  approximateWords,
  elapsedLabel,
  generateDisabledReason,
  progressLine,
  shouldKeepPolling,
  toastHref,
  type GenerationJob,
} from "@/lib/generation";
import { adaptJob } from "@/services/spotlight-generation";

const RUNNING: GenerationJob = {
  id: 7, status: "running", step: "Writing", message: null, roundsDone: 1,
  bodyChars: 5500, draftId: null, error: null, keyword: "modest dresses",
  queryId: null, startedAt: "2026-09-03T10:00:00Z", finishedAt: null,
};

describe("approximateWords", () => {
  it("turns characters into a readable word estimate", () => {
    expect(approximateWords(5500)).toBe(1000);
    expect(approximateWords(0)).toBe(0);
    expect(approximateWords(-5)).toBe(0);
  });
});

describe("elapsedLabel", () => {
  it("formats minutes and seconds", () => {
    const now = new Date("2026-09-03T10:03:07Z");
    expect(elapsedLabel("2026-09-03T10:00:00Z", now)).toBe("3:07");
  });

  it("never goes negative or NaN on bad input", () => {
    expect(elapsedLabel(null)).toBe("0:00");
    expect(elapsedLabel("not a date")).toBe("0:00");
    const past = new Date("2026-09-03T09:00:00Z");
    expect(elapsedLabel("2026-09-03T10:00:00Z", past)).toBe("0:00");
  });
});

describe("generateDisabledReason", () => {
  it("blocks a second generation and says why", () => {
    const reason = generateDisabledReason(RUNNING);
    expect(reason).toContain("modest dresses");
    expect(reason).toContain("One at a time");
  });

  it("does not block when idle or finished", () => {
    expect(generateDisabledReason(null)).toBeNull();
    expect(generateDisabledReason({ ...RUNNING, status: "succeeded" })).toBeNull();
    expect(generateDisabledReason({ ...RUNNING, status: "failed" })).toBeNull();
  });
});

describe("progressLine", () => {
  it("reports the phase and progress while running", () => {
    expect(progressLine(RUNNING)).toBe("Writing · about 1,000 words so far");
  });

  it("falls back to the phase before any body exists", () => {
    expect(progressLine({ ...RUNNING, bodyChars: 0, message: "Preparing…" })).toBe(
      "Preparing…",
    );
  });

  it("surfaces the real error on failure", () => {
    expect(progressLine({ ...RUNNING, status: "failed", error: "quota exceeded" })).toBe(
      "quota exceeded",
    );
  });

  it("never shows a bare failure with no explanation", () => {
    expect(progressLine({ ...RUNNING, status: "failed", error: null })).toContain(
      "Nothing was saved",
    );
  });
});

describe("toastHref", () => {
  it("goes to the finished draft once there is one", () => {
    expect(toastHref({ ...RUNNING, status: "succeeded", draftId: 18 })).toBe(
      "/spotlight/draft/18",
    );
  });

  it("goes back to the live generating surface while running", () => {
    expect(toastHref(RUNNING)).toBe("/spotlight/draft/new?keyword=modest%20dresses");
    expect(toastHref({ ...RUNNING, keyword: null, queryId: 12 })).toBe(
      "/spotlight/draft/new?query_id=12",
    );
  });

  it("degrades to the spotlight page with no seed", () => {
    expect(toastHref({ ...RUNNING, keyword: null, queryId: null })).toBe("/spotlight");
  });
});

describe("shouldKeepPolling", () => {
  it("polls only while running — an idle app makes no traffic", () => {
    expect(shouldKeepPolling(RUNNING)).toBe(true);
    expect(shouldKeepPolling({ ...RUNNING, status: "succeeded" })).toBe(false);
    expect(shouldKeepPolling(null)).toBe(false);
  });
});

describe("adaptJob", () => {
  it("maps the API payload", () => {
    const job = adaptJob({
      id: 3, status: "running", step: "Scoring", rounds_done: 2, body_chars: 900,
      draft_id: null, keyword: "belts", started_at: "2026-09-03T10:00:00Z",
    });
    expect(job?.step).toBe("Scoring");
    expect(job?.roundsDone).toBe(2);
    expect(job?.keyword).toBe("belts");
  });

  it("returns null for no job rather than a hollow object", () => {
    expect(adaptJob(null)).toBeNull();
    expect(adaptJob({})).toBeNull();
  });

  it("defaults numbers to 0 so a progress line never renders NaN", () => {
    const job = adaptJob({ id: 1 });
    expect(job?.bodyChars).toBe(0);
    expect(job?.roundsDone).toBe(0);
    expect(job?.status).toBe("running");
  });

  it("treats an unknown status as running rather than silently finished", () => {
    expect(adaptJob({ id: 1, status: "weird" })?.status).toBe("running");
  });
});

describe("aborted polls (SPEC-216 patch)", () => {
  it("an aborted fetch raises RequestAborted, not a generic failure", async () => {
    const { RequestAborted, getActiveGeneration } = await import(
      "@/services/spotlight-generation"
    );
    const original = globalThis.fetch;
    globalThis.fetch = (() => {
      const err = new Error("The operation was aborted.");
      err.name = "AbortError";
      return Promise.reject(err);
    }) as typeof fetch;
    try {
      await expect(getActiveGeneration()).rejects.toBeInstanceOf(RequestAborted);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("a real network failure still propagates as itself", async () => {
    const { RequestAborted, getActiveGeneration } = await import(
      "@/services/spotlight-generation"
    );
    const original = globalThis.fetch;
    globalThis.fetch = (() =>
      Promise.reject(new TypeError("Failed to fetch"))) as typeof fetch;
    try {
      await expect(getActiveGeneration()).rejects.not.toBeInstanceOf(RequestAborted);
    } finally {
      globalThis.fetch = original;
    }
  });
});
