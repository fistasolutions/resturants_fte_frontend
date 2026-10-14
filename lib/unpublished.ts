/**
 * Spotlight › Published › Unpublished (SPEC-280) — the pure half: the words for
 * why a post left the live set, the span it was live for, and the order of the
 * list. No fetch, no React — Vitest covers it.
 */

import type { PublishedPost } from "@/types/spotlight";

/** Backend SPEC-279's `unpublished_reason` values, in the owner's words. */
export const UNPUBLISHED_REASON_LABEL: Record<string, string> = {
  owner: "You unpublished it",
  hidden_on_shopify: "Hidden in Shopify admin",
  missing_on_shopify: "Gone from Shopify",
  unrecorded: "Before this was recorded",
};

export function unpublishedReasonLabel(reason: string | null): string {
  return (reason && UNPUBLISHED_REASON_LABEL[reason]) || UNPUBLISHED_REASON_LABEL.unrecorded;
}

/** "Live Aug 29 – Sep 17 · 19 days" ("Live Aug 29 · under a day" for a same-day
 * departure), or "Published Aug 29" when the departure is unrecorded, or "" when
 * neither date exists. */
export function liveSpanLabel(post: Pick<PublishedPost, "publishedAt" | "unpublishedAt">): string {
  const from = post.publishedAt ? new Date(post.publishedAt) : null;
  const to = post.unpublishedAt ? new Date(post.unpublishedAt) : null;
  const day = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (from && Number.isNaN(from.getTime())) return "";
  if (to && Number.isNaN(to.getTime())) return from ? `Published ${day(from)}` : "";
  if (from && to) {
    const days = Math.max(0, Math.round((to.getTime() - from.getTime()) / 86_400_000));
    if (days === 0) return `Live ${day(from)} · under a day`;
    return `Live ${day(from)} – ${day(to)} · ${days} ${days === 1 ? "day" : "days"}`;
  }
  if (from) return `Published ${day(from)}`;
  if (to) return `Unpublished ${day(to)}`;
  return "";
}

/** Newest departure first; a post with no recorded departure falls back to its
 * publish date, then to its id. Never mutates the input. */
export function sortUnpublished(posts: PublishedPost[]): PublishedPost[] {
  const stamp = (p: PublishedPost) => p.unpublishedAt ?? p.publishedAt ?? "";
  return [...posts].sort((a, b) => stamp(b).localeCompare(stamp(a)) || b.id - a.id);
}

export type PublishedView = "live" | "unpublished" | "refresh";

/** The third view is the refresh loop (SPEC-305): published posts ranking 8–20 for
 * searches they were never written for. It sits here rather than in a ninth Spotlight
 * tab because the posts in question are published posts — the owner is already here. */
export const PUBLISHED_VIEWS: { id: PublishedView; label: string }[] = [
  { id: "live", label: "Live" },
  { id: "unpublished", label: "Unpublished" },
  { id: "refresh", label: "Worth rewriting" },
];
