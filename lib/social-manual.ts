/**
 * Social Growth manual actions (SPEC-168) — the branching logic behind download,
 * upload, and mark-as-posted.
 *
 * Lives in `lib/` on purpose: this repo has no jsdom/component runner
 * (`vitest.config.ts` pins `environment: "node"`), so anything with a rule in it
 * goes here where Vitest can cover it, and `features/social/post-detail.tsx`
 * stays presentational.
 */

/** Mirrors the backend's `_UPLOAD_CONTENT_TYPES` (SPEC-175). */
export const UPLOAD_ACCEPT = ["image/png", "image/jpeg", "image/webp"] as const;
/** Mirrors the backend's `MAX_UPLOAD_BYTES` (SPEC-175). */
export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

/** The `accept` attribute for the file input, from the one allow-list above. */
export const UPLOAD_ACCEPT_ATTR = UPLOAD_ACCEPT.join(",");

export type UploadCheck = { ok: true } | { ok: false; message: string };

/**
 * Client-side pre-check so a bad file fails instantly instead of after a 10 MB
 * round trip. The backend re-validates every byte regardless (SPEC-175) — this is
 * UX, never trust.
 */
export function validateUploadFile(file: {
  type: string;
  size: number;
}): UploadCheck {
  if (!UPLOAD_ACCEPT.includes(file.type as (typeof UPLOAD_ACCEPT)[number])) {
    return {
      ok: false,
      message: "Choose a PNG, JPEG, or WebP image.",
    };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return {
      ok: false,
      message: `That file is ${formatMb(file.size)} — the limit is 10 MB.`,
    };
  }
  if (file.size === 0) {
    return { ok: false, message: "That file is empty." };
  }
  return { ok: true };
}

function formatMb(bytes: number): string {
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Trim a permalink to what the backend will accept, or `null` when the owner left
 * it blank (it's optional). Throws nothing — an invalid value returns `invalid` so
 * the dialog can show a message without a request. Mirrors the backend's
 * `normalize_permalink`, including the `javascript:` rejection: this string ends up
 * as an `href`.
 */
export function normalizePermalink(
  value: string,
): { ok: true; value: string | null } | { ok: false; message: string } {
  const clean = value.trim();
  if (!clean) return { ok: true, value: null };
  if (clean.length > 1024) {
    return { ok: false, message: "That link is too long." };
  }
  let parsed: URL;
  try {
    parsed = new URL(clean);
  } catch {
    return { ok: false, message: "Enter a full link starting with https://" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, message: "Enter a full link starting with https://" };
  }
  return { ok: true, value: clean };
}

/**
 * "Posted 20 Aug 2026" for a published post, or null when it hasn't been. Kept
 * here (not in the component) so the null/invalid-date branches are testable.
 */
export function publishedLabel(publishedAt: string | null): string | null {
  if (!publishedAt) return null;
  const at = new Date(publishedAt);
  if (Number.isNaN(at.getTime())) return null;
  return `Posted ${at.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  })}`;
}

/** True when the owner may record this post as posted by hand (SPEC-175 gate). */
export function canMarkPosted(status: string): boolean {
  return status === "approved" || status === "scheduled";
}

/**
 * True when the Un-mark action shows. Only a hand-posted row may be reverted — a
 * post published through the API is genuinely live and the backend refuses
 * (409 `social_post_not_unmarkable`), so the control must not be offered.
 */
export function canUnmarkPosted(
  status: string,
  postedManually: boolean,
): boolean {
  return status === "published" && postedManually;
}
