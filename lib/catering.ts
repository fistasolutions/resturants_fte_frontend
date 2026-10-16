/** The Catering Desk's pure half (frontend SPEC-391 / backend SPEC-410). */
import type { BranchMenu, CateringInquiry, CateringStatus } from "@/types/restaurant-os";

export const STATUS_LABELS: Record<CateringStatus, string> = {
  new: "New",
  quoted: "Quoted",
  won: "Won",
  lost: "Lost",
};

export const STATUS_ORDER: CateringStatus[] = ["new", "quoted", "won", "lost"];

/** The dishes a quote can use: available items on the branch's menu, by section then name. */
export function quotableDishes(menu: BranchMenu | undefined): { id: number; name: string; section: string }[] {
  if (!menu) return [];
  return menu.sections.flatMap((section) =>
    section.items.filter((item) => item.available).map((item) => ({ id: item.id, name: item.name, section: section.name })),
  );
}

export interface DraftLine {
  menuItemId: number;
  quantity: number;
}

/** Add a dish (or more of it) to a draft quote. */
export function addLine(lines: DraftLine[], menuItemId: number, quantity: number): DraftLine[] {
  const qty = Math.max(1, Math.min(1000, Math.floor(quantity)));
  const found = lines.find((l) => l.menuItemId === menuItemId);
  if (found) return lines.map((l) => (l.menuItemId === menuItemId ? { ...l, quantity: Math.min(1000, l.quantity + qty) } : l));
  return [...lines, { menuItemId, quantity: qty }];
}

export function removeLine(lines: DraftLine[], menuItemId: number): DraftLine[] {
  return lines.filter((l) => l.menuItemId !== menuItemId);
}

/** The draft an inquiry's saved quote starts from. */
export function draftFrom(inquiry: CateringInquiry): DraftLine[] {
  return inquiry.quote.lines.map((l) => ({ menuItemId: l.menuItemId, quantity: l.quantity }));
}

/** "Fri 23 Oct · 12:30 · 30 guests · delivery". */
export function eventLine(inquiry: CateringInquiry): string {
  const day = new Date(`${inquiry.eventDate}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });
  return [day, inquiry.eventTime, `${inquiry.guests} guests`, inquiry.fulfilment].filter(Boolean).join(" · ");
}
