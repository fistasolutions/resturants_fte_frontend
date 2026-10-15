/**
 * Restaurant OS view models (frontend SPEC-379 over backend SPEC-392/393/394). Prices and totals
 * are always the backend's; these only carry them.
 */

export type ItemKind = "simple" | "pizza" | "combo";
export type GroupKind = "toppings" | "choice";
export type Portion = "whole" | "left" | "right";
export type Amount = "light" | "regular" | "extra";
export type OrderChannel = "delivery" | "carryout" | "dine_in" | "catering";
export type PaymentMethod = "cash" | "card_on_delivery" | "pay_at_store" | "marketplace";
export type OrderStage =
  | "received"
  | "accepted"
  | "making"
  | "baking"
  | "ready"
  | "out_for_delivery"
  | "delivered"
  | "picked_up"
  | "cancelled";
export type DealKind = "percent_off" | "amount_off" | "free_delivery" | "size_price";

// ── the catalog (head office) ────────────────────────────────────────────────

export interface CatalogCategory {
  id: number;
  name: string;
  sort: number;
  isActive: boolean;
}

export interface CatalogSize {
  id: number;
  name: string;
  price: number;
  foodCost: number | null;
  sort: number;
}

export interface CatalogItem {
  id: number;
  externalRef: string;
  name: string;
  description: string | null;
  categoryId: number | null;
  category: string;
  kind: ItemKind;
  price: number;
  foodCost: number | null;
  isActive: boolean;
  sort: number;
  sizes: CatalogSize[];
  groupIds: number[];
}

export interface CatalogOption {
  id: number;
  name: string;
  price: number;
  sizePrices: Record<string, number>;
  foodCost: number | null;
  isDefault: boolean;
  isActive: boolean;
  sort: number;
}

export interface CatalogGroup {
  id: number;
  name: string;
  kind: GroupKind;
  minSelect: number;
  maxSelect: number | null;
  allowHalves: boolean;
  allowAmounts: boolean;
  freeQuantity: number;
  sort: number;
  options: CatalogOption[];
}

export interface Deal {
  id: number;
  name: string;
  code: string | null;
  kind: DealKind;
  value: number;
  categoryId: number | null;
  sizeName: string | null;
  minSubtotal: number;
  channels: string[];
  weekdays: number[];
  startsOn: string | null;
  endsOn: string | null;
  isActive: boolean;
}

export interface Catalog {
  categories: CatalogCategory[];
  items: CatalogItem[];
  groups: CatalogGroup[];
  deals: Deal[];
}

// ── a branch's effective menu ────────────────────────────────────────────────

export interface MenuOption {
  id: number;
  name: string;
  price: number;
  sizePrices: Record<string, number>;
  isDefault: boolean;
  available: boolean;
}

export interface MenuGroup {
  id: number;
  name: string;
  kind: GroupKind;
  minSelect: number;
  maxSelect: number | null;
  allowHalves: boolean;
  allowAmounts: boolean;
  freeQuantity: number;
  options: MenuOption[];
}

export interface MenuEntry {
  id: number;
  name: string;
  categoryId: number | null;
  category: string;
  kind: ItemKind;
  price: number;
  available: boolean;
  sizes: { id: number; name: string; price: number; available: boolean }[];
  groups: MenuGroup[];
}

export interface MenuSection {
  categoryId: number | null;
  name: string;
  items: MenuEntry[];
}

export interface BranchMenu {
  branchId: number;
  sections: MenuSection[];
}

// ── the cart and its price ───────────────────────────────────────────────────

export interface CartModifierInput {
  optionId: number;
  portion: Portion;
  amount: Amount;
}

export interface CartLineInput {
  /** A client-side key, so the same item twice stays two lines. */
  key: string;
  itemId: number;
  sizeId: number | null;
  quantity: number;
  modifiers: CartModifierInput[];
  note: string | null;
  /** For display while the backend prices: the item's name and the choices' names. */
  label: string;
  detail: string;
}

export interface PricedLine {
  itemId: number;
  sizeId: number | null;
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number;
  modifiers: { optionId: number; group: string; name: string; portion: Portion; amount: Amount; price: number }[];
  note: string | null;
}

export interface PricedCart {
  lines: PricedLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  total: number;
  itemsCount: number;
  deal: { id: number; name: string; code: string | null } | null;
  errors: { line: number | null; message: string }[];
}

export interface OrderQuote {
  cart: PricedCart;
  quote: { readyMinutes: number; deliveryMinutes: number | null; readyAt: string; deliveryAt: string | null; busy: boolean };
}

export interface DeliveryAddress {
  line1: string;
  line2?: string | null;
  city?: string | null;
  state?: string | null;
  postalCode?: string | null;
  instructions?: string | null;
}

export interface OrderInput {
  branchId: number;
  channel: OrderChannel;
  lines: CartLineInput[];
  coupon?: string | null;
  tip?: number;
  customerName?: string | null;
  customerPhone?: string | null;
  customerEmail?: string | null;
  marketingOptIn?: boolean | null;
  address?: DeliveryAddress | null;
  notes?: string | null;
  paymentMethod?: PaymentMethod;
  source?: string | null;
}

// ── orders ───────────────────────────────────────────────────────────────────

export interface StageTimes {
  received: string | null;
  accepted: string | null;
  baking: string | null;
  ready: string | null;
  outForDelivery: string | null;
  delivered: string | null;
  completed: string | null;
  cancelled: string | null;
}

export interface OrderLine {
  name: string;
  category: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  modifiers: { optionId: number; group: string; name: string; portion: Portion; amount: Amount; price: number }[];
  note: string | null;
}

export interface NativeOrder {
  id: number;
  orderNumber: number;
  branchId: number;
  branchCode: string | null;
  branchName: string | null;
  channel: OrderChannel;
  source: string;
  stage: OrderStage;
  status: string;
  placedAt: string;
  businessDate: string | null;
  quotedReadyAt: string | null;
  quotedDeliveryAt: string | null;
  scheduledFor: string | null;
  times: StageTimes;
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  deliveryFee: number;
  tax: number;
  tip: number;
  total: number;
  promoCode: string | null;
  paymentMethod: PaymentMethod | null;
  paymentStatus: string | null;
  driverName: string | null;
  trackingPath: string | null;
  customerName?: string | null;
  customerPhone?: string | null;
  deliveryAddress?: DeliveryAddress | null;
  notes?: string | null;
  driverId?: number | null;
  cancelReason?: string | null;
}

export interface Driver {
  id: number;
  branchId: number;
  name: string;
  phone: string | null;
  isActive: boolean;
  status: "available" | "on_delivery" | "off";
}

export interface KitchenBoard {
  branchId: number;
  branchName: string;
  now: string;
  orders: NativeOrder[];
  drivers: Driver[];
}

export interface CallerLookup {
  found: boolean;
  phone: string;
  guest?: { id: number; name: string | null; email: string | null; marketingOptIn: boolean };
  addresses?: (DeliveryAddress & { id: number })[];
  recentOrders?: {
    id: number;
    placedAt: string;
    channel: OrderChannel;
    total: number;
    lines: { menuItemId: number | null; name: string; quantity: number; modifiers: { optionId: number; name: string; portion: Portion; amount: Amount }[] }[];
  }[];
}

export interface BranchService {
  branchId: number;
  acceptingOrders: boolean;
  acceptsDelivery: boolean;
  acceptsCarryout: boolean;
  acceptsOnline: boolean;
  taxRate: number;
  deliveryFee: number;
  deliveryMinimum: number;
  deliveryPostalCodes: string[];
  prepMinutes: number;
  deliveryMinutes: number;
  capacityPer15: number;
  hours: Record<string, string[][]>;
  halfToppingPricing: "half" | "full";
}

// ── the public storefront ────────────────────────────────────────────────────

export interface PublicBranch {
  id: number;
  code: string;
  name: string;
  address: string;
  city: string | null;
  phone: string | null;
  openNow: boolean;
  delivery: boolean;
  carryout: boolean;
}

export interface PublicBrand {
  name: string;
  slug: string;
  currency: string;
  branches: PublicBranch[];
}

export interface PublicMenu {
  branch: PublicBranch;
  sections: MenuSection[];
  ordering: {
    currency: string;
    deliveryFee: number;
    deliveryMinimum: number;
    carryoutMinutes: number;
    deliveryMinutes: number | null;
    busy: boolean;
  };
}

export interface PlacedOrder {
  orderNumber: number;
  trackingPath: string;
  quotedReadyAt: string | null;
  quotedDeliveryAt: string | null;
  total: number;
}

export interface TrackedOrder extends NativeOrder {
  brand: string;
  currency: string;
  branchPhone: string | null;
  customerFirstName: string | null;
}
