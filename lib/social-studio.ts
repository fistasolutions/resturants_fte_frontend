/**
 * Content Studio — per-platform generation logic (SPEC-133). Pure and
 * unit-testable: no JSX, no data fetching. Instagram + Facebook only. Shared by
 * the Content Studio tab so the channel-selection mapping, the per-platform
 * caption limits, and the variant lookup each have exactly one definition.
 */
import type { CaptionVariant, GeneratedPost, ProductCreative } from "@/types/social";

/** The two channels Content Studio generates for. */
export const STUDIO_CHANNELS = ["instagram", "facebook"] as const;
export type StudioChannel = (typeof STUDIO_CHANNELS)[number];

/** The segmented-control selection driving what `generate` requests. */
export type ChannelSelection = StudioChannel | "both";

/** Selection → the channels a `POST /social/generate` request should ask for. */
export function channelsForSelection(selection: ChannelSelection): StudioChannel[] {
  return selection === "both" ? ["instagram", "facebook"] : [selection];
}

/**
 * Per-platform caption soft limits. Instagram truncates captions past ~2,200
 * characters; Facebook allows far more (its post body cap is 63,206). These
 * drive the counter + a gentle over-limit warning — the backend is the
 * authority and its 422 is surfaced if it rejects.
 */
export const CAPTION_LIMITS: Record<StudioChannel, number> = {
  instagram: 2200,
  facebook: 63206,
};

/** The caption limit for a channel; unknown channels fall back to the IG limit. */
export function captionLimit(channel: string): number {
  return CAPTION_LIMITS[channel as StudioChannel] ?? CAPTION_LIMITS.instagram;
}

export interface CaptionCount {
  /** Emoji-safe code-point length of the caption. */
  count: number;
  limit: number;
  /** `limit - count` — negative once over. */
  remaining: number;
  /** True strictly past the limit (== limit is still allowed). */
  over: boolean;
}

/** Per-platform character count + over-limit state for the caption editor. */
export function captionCount(channel: string, text: string): CaptionCount {
  const limit = captionLimit(channel);
  // Spread counts code points so a surrogate-pair emoji is one character, the
  // way the platforms count it — not two UTF-16 units.
  const count = [...text].length;
  return { count, limit, remaining: limit - count, over: count > limit };
}

/**
 * Whether Save must be blocked. Only an empty/whitespace caption is a hard
 * block (the backend 422s on empty); an over-limit caption is a *gentle*
 * warning, left savable so the backend stays the single authority.
 */
export function captionSaveBlocked(text: string): boolean {
  return text.trim().length === 0;
}

const CHANNEL_ORDER: Record<string, number> = { instagram: 0, facebook: 1 };

/**
 * Stable Instagram → Facebook ordering for the side-by-side preview cards, so
 * the layout is deterministic regardless of the order the backend returns.
 */
export function sortStudioPosts(posts: GeneratedPost[]): GeneratedPost[] {
  return [...posts].sort(
    (a, b) => (CHANNEL_ORDER[a.channel] ?? 99) - (CHANNEL_ORDER[b.channel] ?? 99),
  );
}

/** The active caption variant, falling back to the first for an unknown/empty id. */
export function findVariant(
  creative: ProductCreative,
  id: string | null,
): CaptionVariant | null {
  return (
    creative.captionVariants.find((v) => v.id === id) ??
    creative.captionVariants[0] ??
    null
  );
}

/**
 * The drafts that belong to the current "Generate for" selection (SPEC-133 fix).
 *
 * The toggle is a VIEW filter, not only a generate instruction. Previously the
 * studio rendered every persisted draft regardless of selection, so switching
 * from Facebook to Instagram left the Facebook draft on screen — the page
 * appeared not to respond to the toggle at all. Selecting a channel now shows
 * that channel: its draft if one exists, nothing (i.e. the generate prompt) if
 * it does not.
 */
export function draftsForSelection<T extends { channel: string }>(
  drafts: T[] | null,
  selection: ChannelSelection,
): T[] | null {
  if (drafts === null) return null;
  const wanted = new Set<string>(channelsForSelection(selection));
  return drafts.filter((draft) => wanted.has(draft.channel));
}
