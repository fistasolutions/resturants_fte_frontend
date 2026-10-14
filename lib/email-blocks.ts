/**
 * The email builder's block catalogue, pure (SPEC-350). The advice block's label and starter
 * text follow the store's trade — the backend sends them as `content.adviceBlock`, from the
 * store's Brand Brain store type (backend SPEC-360). These defaults are only the fallback for an
 * older backend that does not send it yet.
 */
import type { AdviceBlock, BlockKind, ContentBlock } from "@/types/email-marketing";

export const BLOCK_LABELS: Record<BlockKind, string> = {
  hero: "Hero",
  product_grid: "Product grid",
  size_advice: "Size advice",
  blog_teaser: "Blog teaser",
  ugc: "Customer photos",
  text: "Text",
  picked_for_you: "Picked for you",
  footer: "Footer",
};

export const ADDABLE_BLOCKS: BlockKind[] = ["hero", "product_grid", "picked_for_you", "size_advice", "blog_teaser", "ugc", "text"];

const NEW_BLOCK: Record<BlockKind, Omit<ContentBlock, "id">> = {
  hero: { kind: "hero", title: "A headline", body: "One or two sentences on why this matters." },
  product_grid: { kind: "product_grid", title: "Picked for you", body: "", productIds: [] },
  size_advice: {
    kind: "size_advice",
    title: "Find your size",
    body: "Most customers keep their usual size; where a style runs small or large we say so.",
  },
  blog_teaser: { kind: "blog_teaser", title: "From the journal", body: "The latest post." },
  ugc: { kind: "ugc", title: "In your homes", body: "Photos customers shared this month." },
  text: { kind: "text", title: "Text", body: "" },
  // SPEC-368: the fallback product is chosen in the editor; until it is, the content step says so.
  picked_for_you: {
    kind: "picked_for_you",
    title: "Picked for you",
    body: "Chosen for you, from what you bought before.",
    productIds: [],
  },
  footer: { kind: "footer", title: "Footer", body: "" },
};

/** The label a block kind shows — the advice block named for the store's trade. */
export function blockLabel(kind: BlockKind, advice?: AdviceBlock): string {
  return kind === "size_advice" && advice ? advice.label : BLOCK_LABELS[kind];
}

/** A new block of `kind`, with the advice block's starter text for the store's trade. */
export function newBlock(kind: BlockKind, id: string, advice?: AdviceBlock): ContentBlock {
  const base = NEW_BLOCK[kind];
  const text = kind === "size_advice" && advice ? { title: advice.title, body: advice.body } : {};
  return { ...base, ...text, id, ...(base.productIds ? { productIds: [] } : {}) };
}

/** The advice block's mark in the preview. */
export type AdviceIcon = "ruler" | "info";

/**
 * SPEC-364: a ruler only for a clothing store — whose advice block the backend names "Size
 * advice" — and a neutral info mark for every other trade. An older backend that sends no advice
 * block falls back to "Size advice", and so to the ruler, as before.
 */
export function adviceIcon(advice?: AdviceBlock): AdviceIcon {
  return blockLabel("size_advice", advice) === BLOCK_LABELS.size_advice ? "ruler" : "info";
}

/** SPEC-368: whether the email carries a Picked for you block. */
export function hasPickedForYou(blocks: readonly ContentBlock[]): boolean {
  return blocks.some((block) => block.kind === "picked_for_you");
}

/** The fallback product a Picked for you block shows anyone without a pick; null until chosen. */
export function pickFallback(block: ContentBlock): number | null {
  return block.kind === "picked_for_you" ? (block.productIds?.[0] ?? null) : null;
}

/** What the blocks still need before they can be saved, in the owner's words; null when ready.
 * A Picked for you block needs its fallback product (backend SPEC-378 requires it). */
export function blocksProblem(blocks: readonly ContentBlock[]): string | null {
  const missing = blocks.some((block) => block.kind === "picked_for_you" && pickFallback(block) === null);
  return missing ? "Choose the fallback product for Picked for you — anyone without a pick sees it." : null;
}
