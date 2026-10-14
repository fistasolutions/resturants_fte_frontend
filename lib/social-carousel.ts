/**
 * Carousel rules for the post detail (SPEC-179 / backend SPEC-194).
 *
 * In `lib/` because this repo has no component runner — every rule that can be
 * wrong lives where Vitest reaches it.
 */

/** Why the button is unavailable, written ON the control rather than greying it
 * out silently. A control that fails on click teaches nothing. */
export function carouselBlockedReason(
  hasImage: boolean,
  status: string,
): string | null {
  // A carousel is EDITED FROM the approved image (backend SPEC-194). With
  // nothing to build from there is no honest way to make one — generating a hero
  // from text would put an invented garment at the front of a sequence about a
  // real product.
  if (!hasImage) return "Generate the image first — the carousel is built from it.";
  if (status === "generating") return "A carousel is already being built.";
  return null;
}

export function canBuildCarousel(hasImage: boolean, status: string): boolean {
  return carouselBlockedReason(hasImage, status) === null;
}

/** What the button says. It names what it makes rather than offering a mode —
 * SPEC-178 deleted the mode picker and this does not reintroduce one. */
export function carouselButtonLabel(slideCount: number): string {
  return slideCount > 0 ? "Rebuild the carousel" : "Make this a carousel";
}

/** True while the UI should keep polling. */
export function shouldPollCarousel(status: string): boolean {
  return status === "generating";
}

/** Long enough not to hammer a 1.5-2.5 minute job, short enough that each slide
 * appears soon after it lands. */
export const CAROUSEL_POLL_MS = 6000;

/** Whether the slides strip is rendered at all. `none` is the only status that
 * hides it: a half-built carousel still has slides worth showing, and a failed
 * one keeps whatever the owner already paid for. */
export function showCarouselStrip(status: string, slideCount: number): boolean {
  return status !== "none" && slideCount > 0;
}

/** The line above the strip: what this sequence argues, or a plain fallback. */
export function carouselHeading(
  concept: string | null | undefined,
  slideCount: number,
): string {
  const count = `${slideCount} slide${slideCount === 1 ? "" : "s"}`;
  const label = (concept ?? "").trim();
  return label ? `Carousel · ${label} · ${count}` : `Carousel · ${count}`;
}

/** What a slide is FOR, shown under its number. Slide 1 is always the approved
 * image, so it says so rather than repeating the director's label. */
export function slideJobLabel(position: number, job?: string | null): string {
  if (position === 1) return "the approved image";
  return (job ?? "").trim() || `slide ${position}`;
}

/** Instagram accepts 2-10 cards. One slide is not a carousel — it publishes as
 * a plain image post — so the UI says so instead of implying otherwise. */
export const MIN_PUBLISHABLE_SLIDES = 2;

export function carouselPublishNote(slideCount: number): string | null {
  if (slideCount === 0 || slideCount >= MIN_PUBLISHABLE_SLIDES) return null;
  return "One slide publishes as a normal image post — a carousel needs at least two.";
}

/**
 * The frame a slide actually posts in (SPEC-180).
 *
 * The strip rendered square thumbnails over portrait slides, so every tile was
 * centre-cropped — the UI quietly misrepresenting what Meta will show. Same rule
 * the post preview already applies: Instagram 4:5, Facebook 1.91:1.
 */
export function slideAspectClass(channel: string): string {
  return channel === "instagram" ? "aspect-4/5" : "aspect-[1.91/1]";
}

/** Where a click on slide `index` should land, clamped to the sequence. */
export function clampSlideIndex(index: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(Math.max(index, 0), total - 1);
}

/**
 * Deliberately does NOT wrap. A carousel has a first and a last slide, and
 * wrapping hides which is which — the owner is judging whether the sequence
 * builds, so its ends have to feel like ends.
 */
export function stepSlide(index: number, total: number, delta: number): number {
  return clampSlideIndex(index + delta, total);
}

export function atFirstSlide(index: number): boolean {
  return index <= 0;
}

export function atLastSlide(index: number, total: number): boolean {
  return index >= total - 1;
}

/** "2 / 3" — position in the sequence, for the viewer's counter. */
export function slideCounter(index: number, total: number): string {
  return `${clampSlideIndex(index, total) + 1} / ${total}`;
}
