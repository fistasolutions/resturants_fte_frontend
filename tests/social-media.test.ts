import { describe, expect, it } from "vitest";

import {
  UGC_CLIPS,
  VIDEO_POLL_MS,
  canGenerateVideo,
  mediaProgressLabel,
  shouldPollVideo,
  showMediaToast,
  showVideoTile,
  videoBlockedReason,
  videoDurationLabel,
  videoStatusLabel,
  videoReferenceWarning,
  videoTileDisabled,
} from "@/lib/social-media";

// The media rules for the post detail (SPEC-187 generation, SPEC-174 playback).
// There is no component runner in this repo (root Rule 4), so every rule that
// can be wrong lives in lib/ and is pinned here.

// SPEC-178 — prices were removed from the UI by owner decision, so the cost
// helpers are gone. A reel is two 8-second clips (backend SPEC-192: Veo's
// per-call ceiling is 8s, measured live).
describe("reel shape (SPEC-178)", () => {
  it("is two clips, which is how it clears the owner's 15-second floor", () => {
    expect(UGC_CLIPS).toBe(2);
    expect(videoDurationLabel(null)).toBe("16s");
  });
});

describe("video generation guard (SPEC-187)", () => {
  // SPEC-178 reversed this rule. It was true while a video ANIMATED the still;
  // a reel is generated from text and only uses the photo as a reference, so a
  // missing photo now costs fidelity (see the warning) rather than the feature.
  it("no longer refuses a reel without a still", () => {
    expect(videoBlockedReason(false, "none")).toBeNull();
    expect(canGenerateVideo(false, "none")).toBe(true);
  });

  it("refuses a second job while one is running", () => {
    expect(videoBlockedReason(true, "generating")).toMatch(/already being generated/i);
    expect(canGenerateVideo(true, "generating")).toBe(false);
  });

  it("allows a retry after a failure — a failed job must not be a dead end", () => {
    expect(videoBlockedReason(true, "failed")).toBeNull();
    expect(canGenerateVideo(true, "failed")).toBe(true);
  });

  it("allows regenerating a ready video", () => {
    expect(canGenerateVideo(true, "ready")).toBe(true);
  });
});

describe("status labels", () => {
  it("names the wait, since Veo takes minutes and silence reads as a hang", () => {
    expect(videoStatusLabel("generating")).toMatch(/couple of minutes/i);
  });

  it("prefers the real failure reason over a generic one", () => {
    expect(videoStatusLabel("failed", "Enable billing on that project.")).toBe(
      "Enable billing on that project.",
    );
    expect(videoStatusLabel("failed", null)).toMatch(/try again/i);
    expect(videoStatusLabel("failed", "")).toMatch(/try again/i);
  });

  it("has a label for every status, including unknown ones", () => {
    expect(videoStatusLabel("ready")).toBeTruthy();
    expect(videoStatusLabel("none")).toBeTruthy();
    expect(videoStatusLabel("something-new")).toBeTruthy();
  });
});

describe("polling", () => {
  it("polls only while a job is running", () => {
    expect(shouldPollVideo("generating")).toBe(true);
    for (const done of ["ready", "failed", "none"]) {
      expect(shouldPollVideo(done)).toBe(false);
    }
  });

  it("keeps the interval slow enough not to hammer a minutes-long job", () => {
    expect(VIDEO_POLL_MS).toBeGreaterThanOrEqual(3000);
  });
});

// SPEC-174 — the Reel tile.
describe("video tile (SPEC-174)", () => {
  it("hides only when there is genuinely nothing to show", () => {
    expect(showVideoTile("none")).toBe(false);
    expect(showVideoTile("")).toBe(false);
  });

  it("shows a failed job — silence would look like never having clicked", () => {
    expect(showVideoTile("failed")).toBe(true);
    expect(showVideoTile("generating")).toBe(true);
    expect(showVideoTile("ready")).toBe(true);
  });

  it("only opens a player when there are bytes behind the tile", () => {
    expect(videoTileDisabled("ready")).toBe(false);
    expect(videoTileDisabled("generating")).toBe(true);
    expect(videoTileDisabled("failed")).toBe(true);
    expect(videoTileDisabled("none")).toBe(true);
  });

  it("writes the duration Veo actually returned, rounded", () => {
    expect(videoDurationLabel(15)).toBe("15s");
    expect(videoDurationLabel(14.6)).toBe("15s");
    expect(videoDurationLabel(8)).toBe("8s");
  });

  it("falls back to the target length for jobs predating the field", () => {
    // A `ready` row from before durationSeconds existed must still label the
    // tile — never "NaNs" and never a blank badge.
    for (const missing of [null, undefined, 0, Number.NaN, -3]) {
      expect(videoDurationLabel(missing)).toBe("16s");
    }
  });
});


// SPEC-178 — there is no mode any more: a reel IS a person talking. What
// survives is the guard on a second job and the honesty warning about a missing
// product photo.
describe("reel generation guard (SPEC-178)", () => {
  it("allows a reel without a still — it generates the scene from text", () => {
    expect(videoBlockedReason(false, "none")).toBeNull();
    expect(canGenerateVideo(false, "none")).toBe(true);
  });

  it("warns that the garment is invented when no product photo exists", () => {
    expect(videoReferenceWarning(false)).toMatch(/invented/i);
  });

  it("stays quiet once there is a real photo to pin in", () => {
    expect(videoReferenceWarning(true)).toBeNull();
  });

  it("still refuses a second job while one runs", () => {
    expect(canGenerateVideo(true, "generating")).toBe(false);
    expect(videoBlockedReason(true, "generating")).toMatch(/already/i);
  });
});

// SPEC-178 — the toast replaces three unbroken minutes of "Generating…", which
// was indistinguishable from a hang.
describe("progress toast (SPEC-178)", () => {
  it("prefers the backend's real step over the generic status", () => {
    expect(
      mediaProgressLabel("generating", "Filming the second half — 2 of 2…"),
    ).toBe("Filming the second half — 2 of 2…");
  });

  it("falls back to the status wording for a job with no stage yet", () => {
    expect(mediaProgressLabel("generating", null)).toMatch(/generating/i);
    expect(mediaProgressLabel("generating", "   ")).toMatch(/generating/i);
  });

  it("shows Google's own reason on a failure, never a bare code", () => {
    expect(
      mediaProgressLabel("failed", "Filming…", "Google rejected the request: quota"),
    ).toBe("Google rejected the request: quota");
  });

  it("is shown for a job that ran, and hidden only when nothing ever started", () => {
    expect(showMediaToast("generating")).toBe(true);
    expect(showMediaToast("ready")).toBe(true);
    expect(showMediaToast("failed")).toBe(true);
    expect(showMediaToast("none")).toBe(false);
  });
});
