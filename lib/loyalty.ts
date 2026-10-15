/**
 * Loyalty and gift cards' pure half (frontend SPEC-383 over backend SPEC-398): the page's tabs, the
 * labels, a reward described in a few words, the gift card code as a cashier types it, the points an
 * order will earn, and the settlement's reading. Points and balances are always the backend's.
 */
import type { GiftCardTransaction, LedgerRow, LoyaltyReward, RewardKind } from "@/types/restaurant-os";

export const LOYALTY_TABS = ["program", "members", "gift-cards", "settlement"] as const;
export type LoyaltyTab = (typeof LOYALTY_TABS)[number];
export const LOYALTY_TAB_LABELS: Record<LoyaltyTab, string> = {
  program: "Program",
  members: "Members",
  "gift-cards": "Gift cards",
  settlement: "Settlement",
};
/** Head office's alone (the brand's money between franchises). */
export const LOYALTY_HQ_TABS: ReadonlySet<LoyaltyTab> = new Set<LoyaltyTab>(["settlement"]);

export function readLoyaltyTab(value: string | null | undefined): LoyaltyTab {
  return (LOYALTY_TABS as readonly string[]).includes(value ?? "") ? (value as LoyaltyTab) : "program";
}

export const REWARD_KIND_LABELS: Record<RewardKind, string> = {
  amount_off: "Amount off",
  free_item: "Free item",
};

export const LEDGER_LABELS: Record<LedgerRow["kind"], string> = {
  welcome: "Welcome",
  earn: "Earned",
  redeem: "Redeemed",
  reverse: "Taken back (refund)",
  restore: "Given back (cancelled)",
  adjust: "Adjusted",
};

export const GIFT_TXN_LABELS: Record<GiftCardTransaction["kind"], string> = {
  issue: "Sold",
  reload: "Reloaded",
  redeem: "Spent",
  refund: "Refunded onto the card",
  adjust: "Adjusted",
};

/** "Free Garlic Knots" or "5.00 off", with the item's name when the menu knows it. */
export function rewardSummary(
  reward: Pick<LoyaltyReward, "kind" | "value" | "itemId">,
  itemName: (id: number) => string | undefined,
  money: (value: number) => string,
): string {
  if (reward.kind === "free_item") {
    const name = reward.itemId != null ? itemName(reward.itemId) : undefined;
    return name ? `Free ${name}` : "A free item";
  }
  return `${money(reward.value ?? 0)} off`;
}

const NOT_CODE = /[^A-Z0-9]/g;

/** What a cashier typed, as the card prints it: upper case, groups of four, at most sixteen. */
export function formatCodeInput(raw: string): string {
  const clean = raw.toUpperCase().replace(NOT_CODE, "").slice(0, 16);
  return clean.match(/.{1,4}/g)?.join("-") ?? "";
}

export function isCompleteCode(raw: string): boolean {
  return raw.toUpperCase().replace(NOT_CODE, "").length === 16;
}

/** The points an order's food will earn — what the backend credits when the order is finished. */
export function earnPreview(food: number, pointsPerUnit: number): number {
  if (!(food > 0) || !(pointsPerUnit > 0)) return 0;
  return Math.floor(Math.round(food * pointsPerUnit * 1e6) / 1e6);
}

/** How to read a franchise's net in the settlement: it holds money other guests will spend, or it
 * served guests who paid somewhere else. */
export function settlementReading(net: number): string {
  if (Math.abs(net) < 0.005) return "Even";
  return net > 0 ? "Holds gift-card money" : "Served cards sold elsewhere";
}

/** The last calendar month, `[from, to]` as `YYYY-MM-DD`, for the settlement's first look. */
export function lastMonth(today: Date): [string, string] {
  const first = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - 1, 1));
  const last = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 0));
  return [first.toISOString().slice(0, 10), last.toISOString().slice(0, 10)];
}
