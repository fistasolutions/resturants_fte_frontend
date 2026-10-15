/**
 * Restaurant OS screens' pure half (frontend SPEC-379): the kitchen's columns and next stage,
 * ticket age, topping labels, building cart lines from the item builder, reorders, the tracker's
 * steps and the request bodies; and (SPEC-380) the POS payment choices, change, tenders and the
 * drawer's lines. Prices are never computed here — the backend prices every cart.
 */
import { attributionBody } from "@/lib/attribution";
import type {
  Amount,
  CallerLookup,
  CartLineInput,
  CartModifierInput,
  CashDrawer,
  DrawerKind,
  MenuEntry,
  NativeOrder,
  OrderChannel,
  OrderDetail,
  OrderInput,
  OrderStage,
  PaymentMethod,
  Portion,
  Tender,
} from "@/types/restaurant-os";

// ── the kitchen ──────────────────────────────────────────────────────────────

export const KITCHEN_COLUMNS: { key: string; label: string; stages: OrderStage[] }[] = [
  { key: "new", label: "New", stages: ["received", "accepted"] },
  { key: "making", label: "Making", stages: ["making"] },
  { key: "oven", label: "Oven", stages: ["baking"] },
  { key: "ready", label: "Ready", stages: ["ready"] },
];

export const STAGE_LABELS: Record<OrderStage, string> = {
  awaiting_payment: "Awaiting payment",
  received: "Received",
  accepted: "Accepted",
  making: "Making",
  baking: "In the oven",
  ready: "Ready",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  picked_up: "Picked up",
  cancelled: "Cancelled",
};

export const CHANNEL_NAMES: Record<OrderChannel, string> = {
  delivery: "Delivery",
  carryout: "Carryout",
  dine_in: "Dine-in",
  catering: "Catering",
};

/** The one bump a kitchen ticket offers, or null when dispatch takes it from here. */
export function nextStage(stage: OrderStage, channel: OrderChannel): { to: OrderStage; label: string } | null {
  switch (stage) {
    case "received":
      return { to: "accepted", label: "Accept" };
    case "accepted":
      return { to: "making", label: "Start making" };
    case "making":
      return { to: "baking", label: "Into the oven" };
    case "baking":
      return { to: "ready", label: "Ready" };
    case "ready":
      return channel === "delivery" ? null : { to: "picked_up", label: "Picked up" };
    case "out_for_delivery":
      return { to: "delivered", label: "Delivered" };
    default:
      return null;
  }
}

export function isOpenStage(stage: OrderStage): boolean {
  return !["delivered", "picked_up", "cancelled"].includes(stage);
}

/** Whole minutes since `fromISO` at `nowISO` (never negative). */
export function minutesSince(fromISO: string, nowISO: string): number {
  return Math.max(0, Math.floor((Date.parse(nowISO) - Date.parse(fromISO)) / 60000));
}

/** Past its quoted time and still not done. */
export function isLate(order: Pick<NativeOrder, "stage" | "quotedReadyAt" | "quotedDeliveryAt" | "channel">, nowISO: string): boolean {
  if (!isOpenStage(order.stage)) return false;
  const due = order.channel === "delivery" ? order.quotedDeliveryAt : order.quotedReadyAt;
  return due != null && Date.parse(nowISO) > Date.parse(due);
}

export function columnOf(stage: OrderStage): string | null {
  return KITCHEN_COLUMNS.find((c) => c.stages.includes(stage))?.key ?? null;
}

// ── toppings ─────────────────────────────────────────────────────────────────

export const PORTION_LABELS: Record<Portion, string> = { whole: "Whole", left: "Left half", right: "Right half" };
export const AMOUNT_LABELS: Record<Amount, string> = { light: "Light", regular: "Regular", extra: "Extra" };

/** "Pepperoni (left half), Extra mushrooms, Thin". */
export function describeModifiers(mods: { name: string; portion: Portion; amount: Amount }[]): string {
  return mods
    .map((m) => {
      const amount = m.amount === "regular" ? "" : `${AMOUNT_LABELS[m.amount]} `;
      const name = amount ? `${amount}${m.name.toLowerCase()}` : m.name;
      return m.portion === "whole" ? name : `${name} (${PORTION_LABELS[m.portion].toLowerCase()})`;
    })
    .join(", ");
}

// ── the item builder ─────────────────────────────────────────────────────────

export interface Selection {
  optionId: number;
  portion: Portion;
  amount: Amount;
}

/** What the builder opens with: the first available size, the item's included toppings, and the
 * first option of every required single choice. */
export function builderDefaults(item: MenuEntry): { sizeId: number | null; selections: Selection[] } {
  const size = item.sizes.find((s) => s.available) ?? null;
  const selections: Selection[] = [];
  for (const group of item.groups) {
    for (const option of group.options) {
      if (option.isDefault && option.available) selections.push({ optionId: option.id, portion: "whole", amount: "regular" });
    }
    const chosen = selections.filter((s) => group.options.some((o) => o.id === s.optionId)).length;
    if (group.minSelect >= 1 && group.maxSelect === 1 && chosen === 0) {
      const first = group.options.find((o) => o.available);
      if (first) selections.push({ optionId: first.id, portion: "whole", amount: "regular" });
    }
  }
  return { sizeId: size?.id ?? null, selections };
}

/** Toggle an option in the builder; a single-choice group replaces its choice. */
export function toggleSelection(item: MenuEntry, selections: Selection[], optionId: number): Selection[] {
  const group = item.groups.find((g) => g.options.some((o) => o.id === optionId));
  if (!group) return selections;
  if (selections.some((s) => s.optionId === optionId)) return selections.filter((s) => s.optionId !== optionId);
  const next: Selection = { optionId, portion: "whole", amount: "regular" };
  if (group.maxSelect === 1) {
    const ids = new Set(group.options.map((o) => o.id));
    return [...selections.filter((s) => !ids.has(s.optionId)), next];
  }
  return [...selections, next];
}

export function setSelection(selections: Selection[], optionId: number, change: Partial<Selection>): Selection[] {
  return selections.map((s) => (s.optionId === optionId ? { ...s, ...change } : s));
}

/** What the builder still needs before it can be added (a size, a required choice). */
export function builderProblems(item: MenuEntry, sizeId: number | null, selections: Selection[]): string[] {
  const out: string[] = [];
  if (item.sizes.length && sizeId == null) out.push("Choose a size.");
  for (const group of item.groups) {
    const count = selections.filter((s) => group.options.some((o) => o.id === s.optionId)).length;
    if (count < group.minSelect) out.push(`Choose ${group.minSelect === 1 ? "a" : group.minSelect} ${group.name.toLowerCase()}.`);
    if (group.maxSelect != null && count > group.maxSelect) out.push(`At most ${group.maxSelect} ${group.name.toLowerCase()}.`);
  }
  return out;
}

let lineCounter = 0;

export function lineKey(): string {
  lineCounter += 1;
  return `l${Date.now().toString(36)}${lineCounter}`;
}

export function cartLine(item: MenuEntry, sizeId: number | null, selections: Selection[], quantity: number, note: string | null): CartLineInput {
  const size = item.sizes.find((s) => s.id === sizeId);
  const names = new Map(item.groups.flatMap((g) => g.options.map((o) => [o.id, o.name] as const)));
  const mods: CartModifierInput[] = selections.map((s) => ({ optionId: s.optionId, portion: s.portion, amount: s.amount }));
  return {
    key: lineKey(),
    itemId: item.id,
    sizeId,
    quantity,
    modifiers: mods,
    note: note?.trim() || null,
    label: size ? `${size.name} ${item.name}` : item.name,
    detail: describeModifiers(selections.map((s) => ({ name: names.get(s.optionId) ?? "", portion: s.portion, amount: s.amount }))),
  };
}

/** A past order's lines that are still on the menu, ready to add again. */
export function reorderLines(order: NonNullable<CallerLookup["recentOrders"]>[number], menu: MenuEntry[]): CartLineInput[] {
  const byId = new Map(menu.map((m) => [m.id, m]));
  const out: CartLineInput[] = [];
  for (const line of order.lines) {
    const item = line.menuItemId != null ? byId.get(line.menuItemId) : undefined;
    if (!item || !item.available) continue;
    const size = item.sizes.find((s) => line.name.startsWith(`${s.name} `) && s.available) ?? null;
    if (item.sizes.length && !size) continue;
    const valid = new Set(item.groups.flatMap((g) => g.options.filter((o) => o.available).map((o) => o.id)));
    const selections = line.modifiers
      .filter((m) => valid.has(m.optionId))
      .map((m) => ({ optionId: m.optionId, portion: m.portion, amount: m.amount }));
    out.push(cartLine(item, size?.id ?? null, selections, line.quantity, null));
  }
  return out;
}

// ── request bodies ───────────────────────────────────────────────────────────

export function orderBody(input: OrderInput): Record<string, unknown> {
  return {
    branch_id: input.branchId,
    channel: input.channel,
    lines: input.lines.map((l) => ({
      item_id: l.itemId,
      size_id: l.sizeId,
      quantity: l.quantity,
      note: l.note,
      modifiers: l.modifiers.map((m) => ({ option_id: m.optionId, portion: m.portion, amount: m.amount })),
    })),
    coupon: input.coupon || null,
    tip: input.tip ?? 0,
    customer_name: input.customerName || null,
    customer_phone: input.customerPhone || null,
    customer_email: input.customerEmail || null,
    marketing_opt_in: input.marketingOptIn ?? null,
    address: input.address
      ? {
          line1: input.address.line1,
          line2: input.address.line2 || null,
          city: input.address.city || null,
          state: input.address.state || null,
          postal_code: input.address.postalCode || null,
          instructions: input.address.instructions || null,
        }
      : null,
    notes: input.notes || null,
    payment_method: input.paymentMethod ?? "cash",
    source: input.source ?? null,
    tender: input.tender ? { method: input.tender.method, amount_tendered: input.tender.amountTendered ?? null, code: input.tender.code ?? null } : null,
    gift_card_code: input.giftCardCode || null,
    reward_id: input.rewardId ?? null,
    loyalty_join: input.loyaltyJoin ?? false,
    attribution: attributionBody(input.attribution),
  };
}

// ── the tracker ──────────────────────────────────────────────────────────────

export interface TrackStep {
  key: string;
  label: string;
  at: string | null;
  done: boolean;
  current: boolean;
}

export function trackSteps(order: Pick<NativeOrder, "stage" | "channel" | "times">): TrackStep[] {
  const delivery = order.channel === "delivery";
  const steps: { key: string; label: string; at: string | null; stages: OrderStage[] }[] = [
    { key: "placed", label: "Order placed", at: order.times.received, stages: ["received", "accepted"] },
    { key: "make", label: "Being made", at: order.times.accepted, stages: ["making"] },
    { key: "bake", label: "In the oven", at: order.times.baking, stages: ["baking"] },
    delivery
      ? { key: "out", label: "Out for delivery", at: order.times.outForDelivery, stages: ["ready", "out_for_delivery"] }
      : { key: "ready", label: "Ready for pickup", at: order.times.ready, stages: ["ready"] },
    { key: "done", label: delivery ? "Delivered" : "Picked up", at: order.times.delivered ?? order.times.completed, stages: ["delivered", "picked_up"] },
  ];
  const currentIndex = steps.findIndex((s) => s.stages.includes(order.stage));
  return steps.map((s, i) => ({
    key: s.key,
    label: s.label,
    at: s.at,
    done: currentIndex > i || (i === steps.length - 1 && currentIndex === i),
    current: currentIndex === i,
  }));
}

// ── opening hours ────────────────────────────────────────────────────────────

const SPAN = /^([01]?\d|2[0-3]):([0-5]\d)\s*-\s*([01]?\d|2[0-3]):([0-5]\d)$/;

function pad(time: string): string {
  const [h, m] = time.split(":");
  return `${h.padStart(2, "0")}:${m}`;
}

/** {"0": [["11:00","23:00"]]} → {"0": "11:00-23:00"} for editing. */
export function hoursToText(hours: Record<string, string[][]>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [day, spans] of Object.entries(hours)) out[day] = spans.map(([a, b]) => `${a}-${b}`).join(", ");
  return out;
}

/** The editor's text → the backend's hours. Every day blank = always open ({}); a blank day among
 * filled ones is closed. Null when a span is not "HH:MM-HH:MM". */
export function hoursFromText(text: Record<string, string>): Record<string, string[][]> | null {
  const filled = Object.values(text).some((v) => v.trim() !== "");
  if (!filled) return {};
  const out: Record<string, string[][]> = {};
  for (let day = 0; day < 7; day += 1) {
    const raw = (text[String(day)] ?? "").trim();
    const spans: string[][] = [];
    if (raw) {
      for (const part of raw.split(",")) {
        const match = SPAN.exec(part.trim());
        if (!match) return null;
        spans.push([pad(`${match[1]}:${match[2]}`), pad(`${match[3]}:${match[4]}`)]);
      }
    }
    out[String(day)] = spans;
  }
  return out;
}

/** What a cart's price depends on — the cache key of its quote (labels are display only). */
export function quoteKeyLines(lines: CartLineInput[]): unknown[] {
  return lines.map((l) => [l.itemId, l.sizeId, l.quantity, l.note, l.modifiers.map((m) => [m.optionId, m.portion, m.amount])]);
}

// ── payments and the drawer (SPEC-380 / backend SPEC-395) ────────────────────

export const POS_TABS = ["new", "orders"] as const;
export type PosTab = (typeof POS_TABS)[number];
export const POS_TAB_LABELS: Record<PosTab, string> = { new: "New order", orders: "Orders" };

export function readPosTab(value: string | null | undefined): PosTab {
  return (POS_TABS as readonly string[]).includes(value ?? "") ? (value as PosTab) : "new";
}

/** How the counter is paid: now (a tender goes with the order) or later (what the guest said). */
export interface PaymentChoice {
  key: string;
  label: string;
  method: PaymentMethod;
  tender: Tender["method"] | null;
}

export const POS_PAYMENT_CHOICES: PaymentChoice[] = [
  { key: "cash_now", label: "Cash now", method: "cash", tender: "cash" },
  { key: "card_now", label: "Card now", method: "card", tender: "card_present" },
  { key: "cash_later", label: "Cash at the door / pick-up", method: "cash", tender: null },
  { key: "card_later", label: "Card at the door", method: "card_on_delivery", tender: null },
  { key: "store_later", label: "Pay at the store", method: "pay_at_store", tender: null },
];

export const PAYMENT_LABELS: Record<string, string> = {
  cash: "Cash",
  card: "Card",
  card_present: "Card",
  card_on_delivery: "Card at the door",
  pay_at_store: "Pay at the store",
  card_online: "Card online",
  gift_card: "Gift card",
  marketplace: "Marketplace",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  unpaid: "Unpaid",
  paid: "Paid",
  partially_refunded: "Part refunded",
  refunded: "Refunded",
};

export function paymentLabel(method: string | null | undefined): string {
  return method ? (PAYMENT_LABELS[method] ?? method.replace(/_/g, " ")) : "—";
}

/** Change for `given` cash on `total`, to the cent; null when the cash does not cover it or is not
 * a number. The backend computes the change it records — this is what the cashier sees first. */
export function changeDue(total: number, given: string): number | null {
  const cash = Number(given);
  if (!given.trim() || !Number.isFinite(cash) || cash + 1e-9 < total) return null;
  return Math.round((cash - total) * 100) / 100;
}

/** A finishing move (picked up / delivered) on an order still owed takes its tender with it. */
export function needsTender(order: Pick<NativeOrder, "paymentStatus">, to: OrderStage): boolean {
  return (to === "picked_up" || to === "delivered") && order.paymentStatus === "unpaid";
}

/** What is still refundable on an order: each taken payment less what it already gave back. */
export function refundable(detail: Pick<OrderDetail, "payments" | "status">): number {
  if (detail.status !== "completed" && detail.status !== "voided") return 0;
  const cents = detail.payments
    .filter((p) => p.status !== "pending" && p.status !== "failed")
    .reduce((sum, p) => sum + Math.round(p.amount * 100) - Math.round(p.refunded * 100), 0);
  return Math.max(0, cents) / 100;
}

export const DRAWER_LABELS: Record<DrawerKind, string> = {
  cash_sale: "Cash sales",
  gift_card_sale: "Gift card sales",
  paid_in: "Paid in",
  paid_out: "Paid out",
  cash_refund: "Cash refunds",
  drop: "Drops",
};

/** One movement's name in the drawer's list. */
export const MOVEMENT_LABELS: Record<DrawerKind, string> = {
  cash_sale: "Cash sale",
  gift_card_sale: "Gift card sold",
  paid_in: "Paid in",
  paid_out: "Paid out",
  cash_refund: "Cash refund",
  drop: "Drop to safe",
};

/** The drawer's reconciliation, line by line, with the sign each line has. */
export function drawerLines(drawer: CashDrawer): { label: string; amount: number; sign: 1 | -1 }[] {
  const order: DrawerKind[] = ["cash_sale", "gift_card_sale", "paid_in", "paid_out", "cash_refund", "drop"];
  const sign: Record<DrawerKind, 1 | -1> = { cash_sale: 1, gift_card_sale: 1, paid_in: 1, paid_out: -1, cash_refund: -1, drop: -1 };
  return [
    { label: "Opening float", amount: drawer.openingFloat, sign: 1 },
    ...order.map((k) => ({ label: DRAWER_LABELS[k], amount: drawer.byKind[k] ?? 0, sign: sign[k] })),
  ];
}
