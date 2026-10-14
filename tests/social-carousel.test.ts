import { describe, expect, it } from "vitest";

import {
  CAROUSEL_POLL_MS,
  atFirstSlide,
  atLastSlide,
  clampSlideIndex,
  slideAspectClass,
  slideCounter,
  stepSlide,
  MIN_PUBLISHABLE_SLIDES,
  canBuildCarousel,
  carouselBlockedReason,
  carouselButtonLabel,
  carouselHeading,
  carouselPublishNote,
  shouldPollCarousel,
  showCarouselStrip,
  slideJobLabel,
} from "@/lib/social-carousel";

// SPEC-179 — the carousel rules. There is no component runner in this repo
// (root Rule 4), so every rule that can be wrong lives in lib/ and is pinned
// here.

describe("the guard (SPEC-179)", () => {
  it("refuses without an image, because a carousel is EDITED from that image", () => {
    // Backend SPEC-194: slides 2..N are images.edit passes over slide 1.
    // Generating a hero from text would put an invented garment at the front of
    // a sequence about a real product.
    expect(carouselBlockedReason(false, "none")).toMatch(/image first/i);
    expect(canBuildCarousel(false, "none")).toBe(false);
  });

  it("refuses a second build while one is running", () => {
    expect(carouselBlockedReason(true, "generating")).toMatch(/already/i);
    expect(canBuildCarousel(true, "generating")).toBe(false);
  });

  it("allows a rebuild after a failure — a failed job is not a dead end", () => {
    expect(carouselBlockedReason(true, "failed")).toBeNull();
    expect(canBuildCarousel(true, "failed")).toBe(true);
  });
});

describe("the button names what it makes, not a mode", () => {
  it("offers to make one, then to rebuild it", () => {
    expect(carouselButtonLabel(0)).toBe("Make this a carousel");
    expect(carouselButtonLabel(3)).toBe("Rebuild the carousel");
  });
});

describe("the strip", () => {
  it("shows a half-built carousel rather than waiting for the last slide", () => {
    expect(showCarouselStrip("generating", 2)).toBe(true);
    expect(showCarouselStrip("failed", 1)).toBe(true);
  });

  it("hides only when nothing was ever built", () => {
    expect(showCarouselStrip("none", 0)).toBe(false);
    expect(showCarouselStrip("ready", 0)).toBe(false);
  });

  it("heads the strip with what the sequence argues", () => {
    expect(carouselHeading("Why it earns its price", 3)).toBe(
      "Carousel · Why it earns its price · 3 slides",
    );
    expect(carouselHeading(null, 1)).toBe("Carousel · 1 slide");
    expect(carouselHeading("   ", 4)).toBe("Carousel · 4 slides");
  });

  it("labels slide 1 as the approved image, not the director's words", () => {
    // It IS the image the owner already judged — copied in, not generated.
    expect(slideJobLabel(1, "the hook")).toBe("the approved image");
    expect(slideJobLabel(2, "how it fits")).toBe("how it fits");
    expect(slideJobLabel(3, "  ")).toBe("slide 3");
    expect(slideJobLabel(4, null)).toBe("slide 4");
  });
});

describe("what Instagram will actually accept", () => {
  it("warns that one slide is not a carousel", () => {
    // Instagram takes 2-10 cards; a single slide publishes as a plain image.
    expect(MIN_PUBLISHABLE_SLIDES).toBe(2);
    expect(carouselPublishNote(1)).toMatch(/at least two/i);
  });

  it("stays quiet at two or more, and when there is nothing yet", () => {
    expect(carouselPublishNote(2)).toBeNull();
    expect(carouselPublishNote(5)).toBeNull();
    expect(carouselPublishNote(0)).toBeNull();
  });
});

describe("polling", () => {
  it("polls only while building", () => {
    expect(shouldPollCarousel("generating")).toBe(true);
    for (const status of ["none", "ready", "failed"]) {
      expect(shouldPollCarousel(status)).toBe(false);
    }
  });

  it("is paced for a 1.5-2.5 minute job", () => {
    expect(CAROUSEL_POLL_MS).toBeGreaterThanOrEqual(3000);
  });
});

// SPEC-180 — the viewer. SPEC-179 shipped a strip with no click target, so the
// owner could tell a carousel existed but could not look at it.

describe("walking the sequence (SPEC-180)", () => {
  it("steps forward and back", () => {
    expect(stepSlide(0, 3, 1)).toBe(1);
    expect(stepSlide(2, 3, -1)).toBe(1);
  });

  it("stops at the ends instead of wrapping", () => {
    // A carousel has a first and a last slide; wrapping hides which is which,
    // and the owner is judging whether the sequence BUILDS.
    expect(stepSlide(0, 3, -1)).toBe(0);
    expect(stepSlide(2, 3, 1)).toBe(2);
  });

  it("knows when it is at an end, so the arrows can disable", () => {
    expect(atFirstSlide(0)).toBe(true);
    expect(atFirstSlide(1)).toBe(false);
    expect(atLastSlide(2, 3)).toBe(true);
    expect(atLastSlide(1, 3)).toBe(false);
  });

  it("clamps a nonsense index rather than rendering nothing", () => {
    expect(clampSlideIndex(-5, 3)).toBe(0);
    expect(clampSlideIndex(99, 3)).toBe(2);
    expect(clampSlideIndex(0, 0)).toBe(0);
  });

  it("counts from one, the way a person reads a sequence", () => {
    expect(slideCounter(0, 3)).toBe("1 / 3");
    expect(slideCounter(2, 3)).toBe("3 / 3");
  });
});

describe("the frame a slide actually posts in (SPEC-180)", () => {
  it("follows the channel, so a tile never lies about the crop", () => {
    // These were square thumbnails over portrait slides — every tile was
    // centre-cropped, and the strip misrepresented what Meta will show.
    expect(slideAspectClass("instagram")).toBe("aspect-4/5");
    expect(slideAspectClass("facebook")).toBe("aspect-[1.91/1]");
  });
});
