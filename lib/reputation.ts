/** The Reputation Manager's pure half (frontend SPEC-390 / backend SPEC-408). */
import type { GuestRating, RatingTag } from "@/types/restaurant-os";

export const COMPLAINT_TAGS: RatingTag[] = ["late", "cold", "missing_item", "wrong_item", "rude"];
export const PRAISE_TAGS: RatingTag[] = ["great_taste", "hot_fresh", "fast", "friendly"];

export const TAG_LABELS: Record<RatingTag, string> = {
  late: "Late",
  cold: "Cold",
  missing_item: "Missing item",
  wrong_item: "Wrong item",
  rude: "Rude",
  great_taste: "Great taste",
  hot_fresh: "Hot and fresh",
  fast: "Fast",
  friendly: "Friendly",
};

/** The tags a guest is offered: complaints for 1–3 stars, praise for 4–5. */
export function tagsFor(stars: number): RatingTag[] {
  return stars >= 4 ? PRAISE_TAGS : COMPLAINT_TAGS;
}

export function starsText(stars: number): string {
  return "★".repeat(stars) + "☆".repeat(Math.max(0, 5 - stars));
}

export type RatingFilter = "waiting" | "all" | "low" | "high";

export function filterRatings(rows: GuestRating[], filter: RatingFilter): GuestRating[] {
  if (filter === "waiting") return rows.filter((r) => r.needsReply);
  if (filter === "low") return rows.filter((r) => r.stars <= 2);
  if (filter === "high") return rows.filter((r) => r.stars >= 4);
  return rows;
}

/** "62%" or "—". */
export function share(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 100)}%`;
}

/** Toggle a tag in a guest's choice, keeping the fixed order. */
export function toggleTag(chosen: RatingTag[], tag: RatingTag, offered: RatingTag[]): RatingTag[] {
  const next = chosen.includes(tag) ? chosen.filter((t) => t !== tag) : [...chosen, tag];
  return offered.filter((t) => next.includes(t));
}
