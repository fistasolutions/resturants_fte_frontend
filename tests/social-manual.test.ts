/**
 * SPEC-168 — Social Growth manual actions logic.
 *
 * Covers `lib/social-manual.ts`: the upload pre-check, the permalink normaliser
 * (which guards an `href`, so the `javascript:` case matters), the published
 * label, and the two visibility gates that mirror the backend's 409s.
 */

import { describe, expect, it } from "vitest";

import {
  MAX_UPLOAD_BYTES,
  UPLOAD_ACCEPT_ATTR,
  canMarkPosted,
  canUnmarkPosted,
  normalizePermalink,
  publishedLabel,
  validateUploadFile,
} from "@/lib/social-manual";

describe("validateUploadFile", () => {
  it.each(["image/png", "image/jpeg", "image/webp"])("accepts %s", (type) => {
    expect(validateUploadFile({ type, size: 1024 })).toEqual({ ok: true });
  });

  it.each(["image/gif", "image/svg+xml", "application/pdf", "text/plain", ""])(
    "rejects %s",
    (type) => {
      const result = validateUploadFile({ type, size: 1024 });
      expect(result.ok).toBe(false);
      if (!result.ok) expect(result.message).toMatch(/PNG, JPEG, or WebP/);
    },
  );

  it("accepts a file exactly at the limit", () => {
    expect(validateUploadFile({ type: "image/png", size: MAX_UPLOAD_BYTES })).toEqual({
      ok: true,
    });
  });

  it("rejects one byte over the limit and names the actual size", () => {
    const result = validateUploadFile({
      type: "image/png",
      size: 14.2 * 1024 * 1024,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain("14.2 MB");
      expect(result.message).toContain("10 MB");
    }
  });

  it("rejects an empty file", () => {
    const result = validateUploadFile({ type: "image/png", size: 0 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/empty/i);
  });

  it("exposes an accept attribute matching the allow-list", () => {
    expect(UPLOAD_ACCEPT_ATTR).toBe("image/png,image/jpeg,image/webp");
  });
});

describe("normalizePermalink", () => {
  it.each(["", "   "])("treats %p as absent (the link is optional)", (value) => {
    expect(normalizePermalink(value)).toEqual({ ok: true, value: null });
  });

  it("trims a valid https link", () => {
    expect(normalizePermalink("  https://instagram.com/p/abc  ")).toEqual({
      ok: true,
      value: "https://instagram.com/p/abc",
    });
  });

  it("accepts http as well as https", () => {
    expect(normalizePermalink("http://fb.com/posts/1")).toEqual({
      ok: true,
      value: "http://fb.com/posts/1",
    });
  });

  it("rejects a javascript: URL — this value becomes an href", () => {
    const result = normalizePermalink("javascript:alert(1)");
    expect(result.ok).toBe(false);
  });

  it.each(["ftp://example.com/x", "instagram.com/p/abc", "not a link"])(
    "rejects %p",
    (value) => {
      expect(normalizePermalink(value).ok).toBe(false);
    },
  );

  it("rejects an over-long link", () => {
    const result = normalizePermalink(`https://x.com/${"a".repeat(1100)}`);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.message).toMatch(/too long/i);
  });
});

describe("publishedLabel", () => {
  it("formats an ISO timestamp", () => {
    expect(publishedLabel("2026-08-20T09:30:00Z")).toBe("Posted 20 Aug 2026");
  });

  it("returns null when never published", () => {
    expect(publishedLabel(null)).toBeNull();
  });

  it("returns null for an unparseable value rather than 'Posted Invalid Date'", () => {
    expect(publishedLabel("not-a-date")).toBeNull();
  });
});

describe("visibility gates", () => {
  it.each(["approved", "scheduled"])("offers mark-as-posted from %s", (status) => {
    expect(canMarkPosted(status)).toBe(true);
  });

  it.each(["in_review", "changes_requested", "published"])(
    "hides mark-as-posted for %s",
    (status) => {
      expect(canMarkPosted(status)).toBe(false);
    },
  );

  it("offers un-mark only for a hand-posted published post", () => {
    expect(canUnmarkPosted("published", true)).toBe(true);
  });

  it("hides un-mark for an API-published post — the backend refuses it", () => {
    expect(canUnmarkPosted("published", false)).toBe(false);
  });

  it.each(["approved", "scheduled", "in_review"])(
    "hides un-mark for %s regardless of the flag",
    (status) => {
      expect(canUnmarkPosted(status, true)).toBe(false);
    },
  );
});
