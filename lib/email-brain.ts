/**
 * The Email Marketing brain, per person (SPEC-368, backend SPEC-378) — the pure half of the
 * screens: how the audience's best send hour reads, whether "Best time for this audience" can
 * be chosen, and what the review shows of the per-customer picks. Every figure here is the
 * server's (`GET /campaigns/{id}/checks`); nothing is computed beyond wording and order.
 */
import type { BestTime, CampaignPick } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

/** The backend's own reason when an audience has too little order history for a best hour. */
export const BEST_TIME_UNAVAILABLE = "Not enough order history to pick a time for this audience — choose a time.";

/** How many picks the review lists. */
export const PICKS_SHOWN = 5;

/** A store-local hour as the owner reads it: `7 pm`, `12 am`, `12 pm`. */
export function spokenHour(hour: number): string {
  const h = ((Math.trunc(hour) % 24) + 24) % 24;
  const twelve = h % 12 === 0 ? 12 : h % 12;
  return `${twelve} ${h < 12 ? "am" : "pm"}`;
}

/** The best-time choice's line: when it lands, and what the hour was read from. */
export function bestTimeDetail(best: BestTime): string {
  const at = `Each customer at ${spokenHour(best.hour)} their time`;
  return best.basis === "audience"
    ? `${at} — when most of this audience orders (from ${formatNumber(best.customers)} customers)`
    : `${at} — when your store gets most orders`;
}

/** What the builder knows of the audience's best hour: still reading it, not readable before the
 * draft is saved, the read failed, or the server's answer (null when the history is too thin). */
export type BestTimeState =
  | { status: "pending" }
  | { status: "unsaved" }
  | { status: "error" }
  | { status: "ready"; bestTime: BestTime | null };

export interface BestTimeChoice {
  available: boolean;
  detail: string;
}

/** Whether "Best time for this audience" can be chosen, and the line under it — the hour when it
 * can, the reason when it cannot. */
export function bestTimeChoice(state: BestTimeState): BestTimeChoice {
  switch (state.status) {
    case "pending":
      return { available: false, detail: "Reading when this audience orders…" };
    case "unsaved":
      return { available: false, detail: "Save the draft to read when this audience orders." };
    case "error":
      return { available: false, detail: "Could not read when this audience orders — choose a time, or come back to this step." };
    case "ready":
      return state.bestTime ? { available: true, detail: bestTimeDetail(state.bestTime) } : { available: false, detail: BEST_TIME_UNAVAILABLE };
  }
}

export interface PicksSummary {
  /** The most-picked products, most customers first. */
  rows: CampaignPick[];
  /** Customers the listed picks cover. */
  customers: number;
}

/** The review's "What customers will be shown": the top five picks, most customers first (ties by
 * title, then id, so the order never shuffles between reads). */
export function picksSummary(picks: readonly CampaignPick[] | undefined): PicksSummary {
  const rows = [...(picks ?? [])]
    .filter((pick) => pick.customers > 0)
    .sort((a, b) => b.customers - a.customers || a.title.localeCompare(b.title) || a.productId - b.productId)
    .slice(0, PICKS_SHOWN);
  return { rows, customers: rows.reduce((sum, pick) => sum + pick.customers, 0) };
}
