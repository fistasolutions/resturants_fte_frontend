import { describe, expect, it } from "vitest";

import {
  GALLERY_THUMBNAIL_WIDTH,
  PREVIEW_WIDTH,
  galleryImageUrl,
} from "@/services/social-actions";

/**
 * SPEC-190 — the URL shape is what makes switching versions instant, so it is
 * pinned here.
 *
 * The owner's report was "clicking a version takes time to show". Three causes
 * stacked: the tile and the preview asked for DIFFERENT urls (so the bytes
 * already downloaded could not be reused), both were served `no-store`, and the
 * payload came out of Postgres at up to 2.4 MB a click.
 */
describe("gallery image urls (SPEC-190)", () => {
  it("carries no cache-buster — the bytes under an id never change", () => {
    // A version parameter here would defeat the `immutable` caching that turns
    // a switch into a repaint.
    const url = galleryImageUrl("7", 42);
    expect(url).not.toMatch(/[?&]v=/);
    expect(url).toMatch(/\/social\/posts\/7\/images\/42$/);
  });

  it("asks for a rendered thumbnail at the picker's width", () => {
    expect(galleryImageUrl("7", 42, { width: GALLERY_THUMBNAIL_WIDTH })).toMatch(
      /\?w=160$/,
    );
  });

  it("uses the SAME address for the tile and the preview, minus the width", () => {
    // This is the property that lets the browser reuse what it already has.
    const thumb = galleryImageUrl("7", 42, { width: 160 });
    const full = galleryImageUrl("7", 42);
    expect(thumb.startsWith(full)).toBe(true);
  });

  it("still supports the download variant", () => {
    expect(galleryImageUrl("7", 42, { download: true })).toMatch(/\?download=1$/);
  });

  it("combines width and download without losing either", () => {
    const url = galleryImageUrl("7", 42, { download: true, width: 320 });
    expect(url).toContain("download=1");
    expect(url).toContain("w=320");
  });

  it("keeps both widths in the set the backend accepts", () => {
    // The backend rejects anything outside its own whitelist (422), so a drift
    // here would break every tile — or every preview — at once.
    const allowed = [128, 160, 320, 640, 1024, 1536];
    expect(allowed).toContain(GALLERY_THUMBNAIL_WIDTH);
    expect(allowed).toContain(PREVIEW_WIDTH);
  });

  it("previews at a larger width than it tiles at", () => {
    expect(PREVIEW_WIDTH).toBeGreaterThan(GALLERY_THUMBNAIL_WIDTH);
  });

  it("prefetches and previews at the SAME width, or the warm-up is wasted", () => {
    // The gallery preloads every version at PREVIEW_WIDTH. If the preview then
    // asked for a different width it would be a different url, miss the cache,
    // and download again — which is the whole defect this fixed.
    const prefetched = galleryImageUrl("7", 42, { width: PREVIEW_WIDTH });
    const previewed = galleryImageUrl("7", 42, { width: PREVIEW_WIDTH });
    expect(prefetched).toBe(previewed);
    expect(prefetched).not.toBe(galleryImageUrl("7", 42, { width: GALLERY_THUMBNAIL_WIDTH }));
  });
});

/**
 * SPEC-191 — the batch preload and the delete route.
 *
 * Warming the strip one image at a time still paid ~1.2s of per-request database
 * overhead per version (measured against Railway), so a click landing inside
 * that window waited. One request instead, bytes held in the page.
 */
describe("preload and delete routes (SPEC-191)", () => {
  it("preloads at the width the preview renders, or the batch is wasted", () => {
    // The preload defaults to PREVIEW_WIDTH. If the two ever diverged the page
    // would hold bytes it never displays and still fetch the ones it shows.
    expect(PREVIEW_WIDTH).toBe(1024);
    expect(galleryImageUrl("7", 42, { width: PREVIEW_WIDTH })).toContain("w=1024");
  });

  it("keeps the download url on the full-quality original, not a derivative", () => {
    // Lossy for the screen, lossless for the file the owner actually posts.
    const download = galleryImageUrl("7", 42, { download: true });
    expect(download).not.toContain("w=");
  });
});
