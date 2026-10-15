/** A restaurant brand's Content Studio (frontend SPEC-389 / backend SPEC-406): dishes as studio items. Pure. */
import type { StudioProduct } from "@/types/social";

export interface MenuPostItem {
  id: number;
  name: string;
  category: string;
  priceLabel: string;
  reason: "best_seller" | "profit_pick" | "new_item" | string;
  reasonDetail: string;
  units30d: number;
}

export const MENU_REASON_LABELS: Record<string, string> = {
  best_seller: "Best seller",
  profit_pick: "Worth pushing",
  new_item: "New on the menu",
};

/** The studio's item shape; a dish has no photo, and the first best seller is the suggestion. */
export function menuItemsToStudio(items: MenuPostItem[]): StudioProduct[] {
  return items.map((item, index) => ({
    id: String(item.id),
    name: item.name,
    category: item.category,
    priceLabel: item.priceLabel,
    imageUrl: null,
    reason: item.reason,
    reasonDetail: item.reasonDetail,
    suggested: index === 0 && item.reason === "best_seller",
  }));
}

/** Filter by reason ("all" keeps every dish). */
export function menuByReason(items: StudioProduct[], reason: string): StudioProduct[] {
  return reason === "all" ? items : items.filter((item) => item.reason === reason);
}
