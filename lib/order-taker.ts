/** The Order Taker chat's pure half (frontend SPEC-392 / backend SPEC-412). */
import type { CartLineInput, OrderTakerAnswer, OrderTakerProposal, OrderTakerTurn } from "@/types/restaurant-os";

export const MAX_TURNS = 20;
export const MAX_LENGTH = 500;

export function canSend(history: OrderTakerTurn[], text: string): boolean {
  const used = history.filter((t) => t.role === "user").length;
  const clean = text.trim();
  return clean.length > 0 && clean.length <= MAX_LENGTH && used < MAX_TURNS;
}

/** The proposed cart as checkout lines, labelled with the engine's names in the same order. */
export function proposalToCart(proposal: OrderTakerProposal, quote: OrderTakerAnswer["quote"], stamp: string): CartLineInput[] {
  return proposal.lines.map((line, index) => {
    const priced = quote?.lines[index];
    const detail = (priced?.modifiers ?? []).map((m) => m.name).filter(Boolean).join(", ");
    return {
      key: `ot-${stamp}-${index}`,
      itemId: line.itemId,
      sizeId: line.sizeId,
      quantity: line.quantity,
      modifiers: line.modifiers.map((m) => ({ optionId: m.optionId, portion: "whole", amount: "regular" })),
      note: null,
      label: priced?.name ?? "Dish",
      detail,
    };
  });
}
