/**
 * Media generation rules for the post detail (SPEC-187 / frontend).
 *
 * In `lib/` because this repo has no component runner — every rule that can be
 * wrong lives where Vitest reaches it.
 */

/**
 * A reel is two 8-second clips: Veo's per-call ceiling is 8s — measured live,
 * with and without reference images (backend SPEC-192) — so the owner's "at
 * least 15 seconds" is reached by generating twice and stitching.
 */
export const UGC_CLIPS = 2;
export const CLIP_SECONDS = 8;

/**
 * SPEC-178: prices are deliberately NOT shown. `videoCostLabel` and
 * `imageCostLabel` were here and are gone by owner decision — he knows what his
 * own tooling costs and did not want the number on the control every time.
 *
 * `videoModeLabel` / `videoModeHint` are gone with them: there is no longer a
 * mode to describe. A reel is a person talking. The b-roll transport survives in
 * the backend so stored videos still render, but nothing in the UI can start one.
 */

/**
 * Video animates the post's still, so the still has to exist first. The button
 * is disabled with the reason ON it rather than greyed out silently — a control
 * that fails on click teaches nothing.
 */
export function videoBlockedReason(
  hasImage: boolean,
  status: string,
): string | null {
  // A missing still no longer blocks anything: the reel is generated from text
  // and uses the product photo, when there is one, purely as a reference for the
  // garment — so its absence costs fidelity, not the feature (SPEC-178).
  void hasImage;
  if (status === "generating") return "A video is already being generated.";
  return null;
}

/** UGC without a still still works, but the garment is then invented rather
 * than the store's own — worth saying before the owner spends. */
export function videoReferenceWarning(hasImage: boolean): string | null {
  if (hasImage) return null;
  return "No product photo yet, so the garment on camera will be invented rather than yours.";
}

export function canGenerateVideo(hasImage: boolean, status: string): boolean {
  return videoBlockedReason(hasImage, status) === null;
}

/** What the owner reads while a job runs. Veo takes 1-3 minutes, so silence
 * would be indistinguishable from a hang. */
export function videoStatusLabel(status: string, error?: string | null): string {
  switch (status) {
    case "generating":
      return "Generating — this takes a couple of minutes.";
    case "ready":
      return "Video ready.";
    case "failed":
      return error || "Generation failed. Try again.";
    default:
      return "No video yet.";
  }
}

/**
 * What the progress toast says (SPEC-178).
 *
 * The backend reports the job's real step in `stage` (SPEC-192) — writing,
 * filming half one, filming half two, joining. Three unbroken minutes of
 * "Generating…" is indistinguishable from a hang, which is what this replaces.
 * `stage` is preferred whenever the server sent one; the status wording is the
 * fallback for a job that predates the field.
 */
export function mediaProgressLabel(
  status: string,
  stage?: string | null,
  error?: string | null,
): string {
  if (status === "failed") return error || "Generation failed.";
  if (stage && stage.trim()) return stage.trim();
  return videoStatusLabel(status, error);
}

/** The toast is up while a job runs, and stays after it lands so the owner sees
 * the outcome even if they looked away. Only `none` hides it. */
export function showMediaToast(status: string): boolean {
  return status === "generating" || status === "ready" || status === "failed";
}

/** True while the UI should keep polling. */
export function shouldPollVideo(status: string): boolean {
  return status === "generating";
}

/** How often to poll. Long enough not to hammer a 1-3 minute job. */
export const VIDEO_POLL_MS = 6000;

/**
 * Whether the Reel tile is rendered at all (SPEC-174).
 *
 * `none` is the only status that hides it: there is genuinely nothing to show,
 * and an empty frame would read as a broken image. Every other status — even
 * `failed` — earns a tile, because the owner spent money on that job and
 * silence would be indistinguishable from never having clicked.
 */
export function showVideoTile(status: string): boolean {
  return status === "generating" || status === "ready" || status === "failed";
}

/** The tile only opens a player when there are bytes behind it. */
export function videoTileDisabled(status: string): boolean {
  return status !== "ready";
}

/**
 * The duration written on the tile. The backend reports what Veo actually
 * returned, which is not always the requested length, so this shows the real
 * number and falls back to the target only when the job predates the field.
 */
export function videoDurationLabel(seconds?: number | null): string {
  if (typeof seconds !== "number" || !Number.isFinite(seconds) || seconds <= 0) {
    return `${UGC_CLIPS * CLIP_SECONDS}s`;
  }
  return `${Math.round(seconds)}s`;
}
