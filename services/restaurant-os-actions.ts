/**
 * Restaurant OS writes for signed-in members (frontend SPEC-379 / backend SPEC-392–393), through
 * the proxy. Reads live in `lib/queries/restaurant.ts`. Every function's permission is in
 * `lib/action-permissions.ts`, the same one the backend's route policy enforces.
 */
import { proxyUrl } from "@/lib/client-api";
import { fromApi, toApi } from "@/lib/restaurant-api";
import { orderBody } from "@/lib/restaurant-os";
import { RestaurantRequestError } from "@/services/restaurant-actions";
import type {
  BranchMenu,
  BranchService,
  CashDrawer,
  CoachDay,
  CoachEmailResult,
  ReplyState,
  DeliveryZone,
  DriverLink,
  CatalogCategory,
  CatalogGroup,
  CatalogItem,
  Deal,
  Driver,
  NativeOrder,
  GiftCardDetail,
  GiftCardSale,
  LoyaltyProgram,
  LoyaltyReward,
  MemberDetail,
  OrderDetail,
  OrderInput,
  OrderQuote,
  PaymentAccount,
  Tender,
} from "@/types/restaurant-os";

async function send<T>(method: string, path: string, body: unknown, fallback: string): Promise<T> {
  const response = await fetch(proxyUrl(path), {
    method,
    headers: body === undefined ? undefined : { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as
      | { error?: { message?: string; details?: { message: string }[] } }
      | null;
    const details = (payload?.error?.details ?? []).map((d) => d.message);
    const message = payload?.error?.message ?? `${fallback} (${response.status}).`;
    throw new RestaurantRequestError(details.length ? `${message} ${details.join(" ")}` : message, response.status);
  }
  if (response.status === 204) return undefined as T;
  return fromApi<T>(await response.json());
}

// ── the catalog ──────────────────────────────────────────────────────────────

export function createCategory(input: { name: string; sort?: number }): Promise<CatalogCategory> {
  return send("POST", "/restaurant/menu/categories", input, "Adding the category failed");
}

export function updateCategory(id: number, input: { name?: string; sort?: number; isActive?: boolean }): Promise<CatalogCategory> {
  return send("PATCH", `/restaurant/menu/categories/${id}`, toApi({ ...input }), "Saving the category failed");
}

export function deleteCategory(id: number): Promise<void> {
  return send("DELETE", `/restaurant/menu/categories/${id}`, undefined, "Deleting the category failed");
}

export interface ItemInput {
  name?: string;
  description?: string | null;
  categoryId?: number | null;
  kind?: string;
  price?: number;
  foodCost?: number | null;
  sort?: number;
  isActive?: boolean;
}

export function createItem(input: ItemInput): Promise<CatalogItem> {
  return send("POST", "/restaurant/menu/items", toApi({ ...input }), "Adding the item failed");
}

export function updateItem(id: number, input: ItemInput): Promise<CatalogItem> {
  return send("PATCH", `/restaurant/menu/items/${id}`, toApi({ ...input }), "Saving the item failed");
}

export function retireItem(id: number): Promise<CatalogItem> {
  return send("DELETE", `/restaurant/menu/items/${id}`, undefined, "Retiring the item failed");
}

export function setItemSizes(id: number, sizes: { id?: number | null; name: string; price: number; foodCost?: number | null }[]): Promise<CatalogItem> {
  return send(
    "PUT",
    `/restaurant/menu/items/${id}/sizes`,
    { sizes: sizes.map((s) => ({ id: s.id ?? null, name: s.name, price: s.price, food_cost: s.foodCost ?? null })) },
    "Saving the sizes failed",
  );
}

export function setItemGroups(id: number, groupIds: number[]): Promise<CatalogItem> {
  return send("PUT", `/restaurant/menu/items/${id}/groups`, { group_ids: groupIds }, "Saving the item's choices failed");
}

export interface GroupInput {
  name?: string;
  kind?: string;
  minSelect?: number;
  maxSelect?: number | null;
  allowHalves?: boolean;
  allowAmounts?: boolean;
  freeQuantity?: number;
}

export function createGroup(input: GroupInput): Promise<CatalogGroup> {
  return send("POST", "/restaurant/menu/modifier-groups", toApi({ ...input }), "Adding the group failed");
}

export function updateGroup(id: number, input: GroupInput): Promise<CatalogGroup> {
  return send("PATCH", `/restaurant/menu/modifier-groups/${id}`, toApi({ ...input }), "Saving the group failed");
}

export function setGroupOptions(
  id: number,
  options: { id?: number | null; name: string; price: number; sizePrices: Record<string, number>; foodCost?: number | null; isDefault: boolean; isActive: boolean }[],
): Promise<CatalogGroup> {
  return send(
    "PUT",
    `/restaurant/menu/modifier-groups/${id}/options`,
    {
      options: options.map((o) => ({
        id: o.id ?? null,
        name: o.name,
        price: o.price,
        size_prices: o.sizePrices,
        food_cost: o.foodCost ?? null,
        is_default: o.isDefault,
        is_active: o.isActive,
      })),
    },
    "Saving the options failed",
  );
}

export type DealInput = Partial<Omit<Deal, "id">>;

export function createDeal(input: DealInput): Promise<Deal> {
  return send("POST", "/restaurant/menu/deals", toApi({ ...input }), "Adding the offer failed");
}

export function updateDeal(id: number, input: DealInput): Promise<Deal> {
  return send("PATCH", `/restaurant/menu/deals/${id}`, toApi({ ...input }), "Saving the offer failed");
}

// ── a branch ─────────────────────────────────────────────────────────────────

export interface OverrideChange {
  target: "item" | "size" | "option";
  targetId: number;
  price?: number | null;
  available?: boolean;
}

function changes(list: OverrideChange[]): { changes: Record<string, unknown>[] } {
  return { changes: list.map((c) => ({ target: c.target, target_id: c.targetId, price: c.price ?? null, available: c.available ?? true })) };
}

export function setBranchPrices(branchId: number, list: OverrideChange[]): Promise<BranchMenu> {
  return send("PUT", `/restaurant/menu/branches/${branchId}/prices`, changes(list), "Saving the branch's prices failed");
}

export function setBranchAvailability(branchId: number, list: OverrideChange[]): Promise<BranchMenu> {
  return send("PUT", `/restaurant/menu/branches/${branchId}/availability`, changes(list), "Changing what is available failed");
}

export function saveBranchService(branchId: number, input: Partial<Omit<BranchService, "branchId">>): Promise<BranchService> {
  return send("PUT", `/restaurant/branches/${branchId}/service`, toApi({ ...input }), "Saving the branch's service failed");
}

// ── orders ───────────────────────────────────────────────────────────────────

export function quoteOrder(input: OrderInput): Promise<OrderQuote> {
  return send("POST", "/restaurant/pos/quote", orderBody(input), "Pricing the order failed");
}

export function placeOrder(input: OrderInput): Promise<NativeOrder> {
  return send("POST", "/restaurant/pos/orders", orderBody(input), "Placing the order failed");
}

function tenderBody(tender: Tender | null | undefined): Record<string, unknown> | null {
  return tender ? { method: tender.method, amount_tendered: tender.amountTendered ?? null, code: tender.code ?? null } : null;
}

/** Move an order on; finishing an unpaid one takes its tender (SPEC-380). */
export function advanceOrder(id: number, to: string, tender?: Tender | null): Promise<NativeOrder> {
  return send("POST", `/restaurant/kitchen/orders/${id}/advance`, { to, tender: tenderBody(tender) }, "Moving the order failed");
}

export function cancelOrder(id: number, reason: string): Promise<NativeOrder> {
  return send("POST", `/restaurant/kitchen/orders/${id}/cancel`, { to: "cancelled", reason }, "Cancelling the order failed");
}

export function dispatchOrder(id: number, driverId: number): Promise<NativeOrder> {
  return send("POST", `/restaurant/kitchen/orders/${id}/dispatch`, { driver_id: driverId }, "Sending the order out failed");
}

export function addDriver(branchId: number, name: string, phone: string | null): Promise<Driver> {
  return send("POST", `/restaurant/kitchen/branches/${branchId}/drivers`, { name, phone }, "Adding the driver failed");
}

export function updateDriver(id: number, input: Partial<Pick<Driver, "name" | "phone" | "isActive" | "status">>): Promise<Driver> {
  return send("PATCH", `/restaurant/kitchen/drivers/${id}`, toApi({ ...input }), "Saving the driver failed");
}

// ── payments, refunds and the drawer (SPEC-380 / backend SPEC-395) ───────────

export function connectPayments(
  franchiseeId: number,
  input: { publishableKey: string; secretKey?: string | null; webhookSecret?: string | null },
): Promise<PaymentAccount> {
  return send(
    "PUT",
    `/restaurant/franchisees/${franchiseeId}/payments`,
    { publishable_key: input.publishableKey, secret_key: input.secretKey || null, webhook_secret: input.webhookSecret || null },
    "Connecting the payment account failed",
  );
}

export function disconnectPayments(franchiseeId: number): Promise<void> {
  return send("DELETE", `/restaurant/franchisees/${franchiseeId}/payments`, undefined, "Disconnecting the account failed");
}

export function payOrder(id: number, tender: Tender): Promise<OrderDetail> {
  return send("POST", `/restaurant/pos/orders/${id}/pay`, tenderBody(tender), "Taking the payment failed");
}

export function refundOrder(id: number, amount: number, reason: string): Promise<OrderDetail> {
  return send("POST", `/restaurant/pos/orders/${id}/refund`, { amount, reason }, "The refund failed");
}

export function openDrawer(branchId: number, openingFloat: number, date?: string | null): Promise<CashDrawer> {
  return send("POST", `/restaurant/cash/branches/${branchId}/open`, { opening_float: openingFloat, date: date ?? null }, "Opening the drawer failed");
}

export function recordDrawerMovement(drawerId: number, kind: "paid_in" | "paid_out" | "drop", amount: number, note: string | null): Promise<CashDrawer> {
  return send("POST", `/restaurant/cash/drawers/${drawerId}/movements`, { kind, amount, note }, "Recording the cash failed");
}

export function closeDrawer(drawerId: number, countedCash: number, notes: string | null): Promise<CashDrawer> {
  return send("POST", `/restaurant/cash/drawers/${drawerId}/close`, { counted_cash: countedCash, notes }, "Closing the day failed");
}

export function reopenDrawer(drawerId: number): Promise<CashDrawer> {
  return send("POST", `/restaurant/cash/drawers/${drawerId}/reopen`, undefined, "Reopening the day failed");
}

// ── loyalty and gift cards (SPEC-383 / backend SPEC-398) ─────────────────────

export function saveLoyaltyProgram(input: Partial<LoyaltyProgram>): Promise<LoyaltyProgram> {
  return send("PUT", "/restaurant/loyalty", toApi({ ...input }), "Saving the program failed");
}

export type RewardInput = Partial<Pick<LoyaltyReward, "name" | "points" | "kind" | "value" | "itemId" | "isActive" | "sort">>;

export function createReward(input: RewardInput): Promise<LoyaltyReward> {
  return send("POST", "/restaurant/loyalty/rewards", toApi({ ...input }), "Adding the reward failed");
}

export function updateReward(id: number, input: RewardInput): Promise<LoyaltyReward> {
  return send("PATCH", `/restaurant/loyalty/rewards/${id}`, toApi({ ...input }), "Saving the reward failed");
}

export function adjustPoints(guestId: number, points: number, note: string): Promise<MemberDetail> {
  return send("POST", `/restaurant/loyalty/members/${guestId}/adjust`, { points, note }, "Adjusting the points failed");
}

export function enrollGuest(input: { phone: string; name?: string | null; email?: string | null; branchId?: number | null }): Promise<MemberDetail & { joined: boolean }> {
  return send(
    "POST",
    "/restaurant/pos/loyalty/enroll",
    { phone: input.phone, name: input.name || null, email: input.email || null, branch_id: input.branchId ?? null },
    "Joining the program failed",
  );
}

export interface GiftCardSaleInput {
  branchId: number;
  amount: number;
  tender: { method: "cash" | "card_present"; amountTendered?: number | null };
  recipientName?: string | null;
  recipientEmail?: string | null;
}

export function sellGiftCard(input: GiftCardSaleInput): Promise<GiftCardSale> {
  return send(
    "POST",
    "/restaurant/pos/gift-cards",
    {
      branch_id: input.branchId,
      amount: input.amount,
      tender: { method: input.tender.method, amount_tendered: input.tender.amountTendered ?? null },
      recipient_name: input.recipientName || null,
      recipient_email: input.recipientEmail || null,
    },
    "Selling the gift card failed",
  );
}

export function reloadGiftCard(input: Omit<GiftCardSaleInput, "recipientName" | "recipientEmail"> & { code: string }): Promise<GiftCardSale> {
  return send(
    "POST",
    "/restaurant/pos/gift-cards/reload",
    {
      branch_id: input.branchId,
      code: input.code,
      amount: input.amount,
      tender: { method: input.tender.method, amount_tendered: input.tender.amountTendered ?? null },
    },
    "Reloading the gift card failed",
  );
}

export function lookUpGiftCard(code: string): Promise<{ id: number; last4: string; balance: number; status: string }> {
  return send("POST", "/restaurant/pos/gift-cards/lookup", { code }, "Looking up the gift card failed");
}

export function setGiftCardStatus(id: number, active: boolean): Promise<GiftCardDetail> {
  return send("POST", `/restaurant/gift-cards/${id}/${active ? "enable" : "disable"}`, undefined, "Changing the card failed");
}

export function adjustGiftCard(id: number, amount: number, note: string): Promise<GiftCardDetail> {
  return send("POST", `/restaurant/gift-cards/${id}/adjust`, { amount, note }, "Adjusting the card failed");
}

// ── delivery zones, driver links, runs (SPEC-384 / backend SPEC-400) ─────────

export type ZoneInput = Partial<Pick<DeliveryZone, "name" | "polygon" | "fee" | "minimum" | "extraMinutes" | "isActive" | "sort">>;

export function createZone(branchId: number, input: ZoneInput): Promise<DeliveryZone> {
  return send("POST", `/restaurant/branches/${branchId}/zones`, toApi({ ...input }), "Saving the zone failed");
}

export function updateZone(branchId: number, zoneId: number, input: ZoneInput): Promise<DeliveryZone> {
  return send("PATCH", `/restaurant/branches/${branchId}/zones/${zoneId}`, toApi({ ...input }), "Saving the zone failed");
}

export function deleteZone(branchId: number, zoneId: number): Promise<void> {
  return send("DELETE", `/restaurant/branches/${branchId}/zones/${zoneId}`, undefined, "Deleting the zone failed");
}

export function issueDriverLink(driverId: number): Promise<DriverLink> {
  return send("POST", `/restaurant/kitchen/drivers/${driverId}/link`, undefined, "Making the driver's link failed");
}

export function revokeDriverLink(driverId: number): Promise<void> {
  return send("DELETE", `/restaurant/kitchen/drivers/${driverId}/link`, undefined, "Revoking the link failed");
}

export function dispatchRun(driverId: number, orderIds: number[]): Promise<{ orders: NativeOrder[] }> {
  return send("POST", "/restaurant/kitchen/dispatch", { driver_id: driverId, order_ids: orderIds }, "Sending the run out failed");
}

// ── the Ops Coach (SPEC-385 / backend SPEC-402) ──────────────────────────────

export function runOpsCoach(date: string | null): Promise<CoachDay> {
  return send("POST", "/restaurant/coach/run", { date }, "Running the Ops Coach failed");
}

// ── the Reputation Manager (SPEC-390 / backend SPEC-408) ──────────────────────

export function draftRatingReply(ratingId: number): Promise<ReplyState> {
  return send("POST", `/restaurant/reputation/${ratingId}/draft`, undefined, "Drafting the reply failed");
}

export function editRatingReply(ratingId: number, reply: string): Promise<ReplyState> {
  return send("PATCH", `/restaurant/reputation/${ratingId}`, { reply }, "Saving the reply failed");
}

export function sendRatingReply(ratingId: number, reply: string | null): Promise<ReplyState> {
  return send("POST", `/restaurant/reputation/${ratingId}/send`, { reply }, "Sending the reply failed");
}

export function emailOpsCoach(date: string): Promise<CoachEmailResult> {
  return send("POST", "/restaurant/coach/email", { date }, "Emailing the briefs failed");
}
