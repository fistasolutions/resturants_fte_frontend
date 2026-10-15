/**
 * Restaurant brand reads (frontend SPEC-377 / backend SPEC-387–389), through the client cache
 * (SPEC-230). Every filter that changes an answer is in its key.
 */
import { defineQuery } from "@/lib/query-def";
import { fromApi } from "@/lib/restaurant-api";
import type {
  BranchMenu,
  BranchService,
  CallerLookup,
  CashDay,
  CoachDay,
  Catalog,
  DayOrders,
  DeliveryZone,
  Driver,
  GiftCardDetail,
  GiftCardList,
  GiftCardSettlement,
  KitchenBoard,
  LoyaltyMember,
  LoyaltyOverview,
  MemberDetail,
  OrderDetail,
  PaymentAccount,
  RunSuggestions,
} from "@/types/restaurant-os";
import type {
  Branch,
  Channels,
  Dayparts,
  Franchisee,
  FranchiseTeam,
  Guests,
  IngestKey,
  League,
  MenuEngineering,
  NetworkMember,
  NetworkOverview,
  Region,
  RestaurantFilters,
  RestaurantSetup,
  Royalties,
  Scorecard,
  RestaurantRules,
  Speed,
  StatementList,
  StatementStatus,
} from "@/types/restaurant";

export const RESTAURANT_KEY = ["restaurant"] as const;

/** `?from=…&to=…&franchisee_id=…` for the filters that are set. */
export function filterQuery(filters: RestaurantFilters): string {
  const params = new URLSearchParams({ from: filters.from, to: filters.to });
  if (filters.franchiseeId != null) params.set("franchisee_id", String(filters.franchiseeId));
  if (filters.regionId != null) params.set("region_id", String(filters.regionId));
  if (filters.branchId != null) params.set("branch_id", String(filters.branchId));
  if (filters.target != null) params.set("target", String(filters.target));
  return params.toString();
}

/** The cache key part for a set of filters — every value, in a fixed order. */
function filterKey(filters: RestaurantFilters): (string | number | null)[] {
  return [
    filters.from,
    filters.to,
    filters.franchiseeId ?? null,
    filters.regionId ?? null,
    filters.branchId ?? null,
    filters.target ?? null,
  ];
}

export interface BranchListFilters {
  franchiseeId?: number | null;
  regionId?: number | null;
  status?: string | null;
  q?: string | null;
}

export const restaurantPaths = {
  setup: (): string => "/restaurant/setup",
  regions: (): string => "/restaurant/regions",
  franchisees: (): string => "/restaurant/franchisees",
  franchisee: (id: number): string => `/restaurant/franchisees/${id}`,
  team: (id: number): string => `/restaurant/franchisees/${id}/team`,
  branches: (filters: BranchListFilters = {}): string => {
    const params = new URLSearchParams();
    if (filters.franchiseeId != null) params.set("franchisee_id", String(filters.franchiseeId));
    if (filters.regionId != null) params.set("region_id", String(filters.regionId));
    if (filters.status) params.set("status", filters.status);
    if (filters.q) params.set("q", filters.q);
    const query = params.toString();
    return query ? `/restaurant/branches?${query}` : "/restaurant/branches";
  },
  branch: (id: number): string => `/restaurant/branches/${id}`,
  scorecard: (id: number, filters: RestaurantFilters): string =>
    `/restaurant/branches/${id}/scorecard?${filterQuery({ ...filters, branchId: null })}`,
  members: (): string => "/restaurant/members",
  ingestKeys: (): string => "/restaurant/ingest-keys",
  overview: (filters: RestaurantFilters): string => `/restaurant/overview?${filterQuery(filters)}`,
  league: (filters: RestaurantFilters): string =>
    `/restaurant/league?${filterQuery({ ...filters, branchId: null })}`,
  dayparts: (filters: RestaurantFilters): string => `/restaurant/dayparts?${filterQuery(filters)}`,
  channels: (filters: RestaurantFilters): string => `/restaurant/channels?${filterQuery(filters)}`,
  menu: (filters: RestaurantFilters): string =>
    `/restaurant/menu/engineering?${filterQuery(filters)}`,
  speed: (filters: RestaurantFilters): string => `/restaurant/speed?${filterQuery(filters)}`,
  guests: (filters: RestaurantFilters): string => `/restaurant/guests?${filterQuery(filters)}`,
  statements: (status: StatementStatus | null = null): string =>
    status ? `/restaurant/royalties/statements?status=${status}` : "/restaurant/royalties/statements",
  settings: (): string => "/restaurant/settings",
  catalog: (): string => "/restaurant/menu/catalog",
  branchMenu: (id: number): string => `/restaurant/menu/branches/${id}`,
  service: (id: number): string => `/restaurant/branches/${id}/service`,
  board: (id: number): string => `/restaurant/kitchen/branches/${id}/orders`,
  drivers: (id: number): string => `/restaurant/kitchen/branches/${id}/drivers`,
  caller: (phone: string): string => `/restaurant/pos/customers?phone=${encodeURIComponent(phone)}`,
  paymentAccount: (franchiseeId: number): string => `/restaurant/franchisees/${franchiseeId}/payments`,
  dayOrders: (branchId: number, date: string | null, q: string | null): string => {
    const params = new URLSearchParams();
    if (date) params.set("date", date);
    if (q) params.set("q", q);
    const query = params.toString();
    return `/restaurant/pos/branches/${branchId}/orders${query ? `?${query}` : ""}`;
  },
  orderDetail: (id: number): string => `/restaurant/pos/orders/${id}`,
  loyalty: (): string => "/restaurant/loyalty",
  zones: (branchId: number): string => `/restaurant/branches/${branchId}/zones`,
  coach: (date: string | null): string => `/restaurant/coach${date ? `?date=${encodeURIComponent(date)}` : ""}`,
  batches: (branchId: number): string => `/restaurant/kitchen/branches/${branchId}/batches`,
  loyaltyMembers: (q: string | null): string => `/restaurant/loyalty/members${q ? `?q=${encodeURIComponent(q)}` : ""}`,
  loyaltyMember: (id: number): string => `/restaurant/loyalty/members/${id}`,
  giftCards: (last4: string | null, status: string | null): string => {
    const params = new URLSearchParams();
    if (last4) params.set("last4", last4);
    if (status) params.set("status", status);
    const query = params.toString();
    return `/restaurant/gift-cards${query ? `?${query}` : ""}`;
  },
  giftCard: (id: number): string => `/restaurant/gift-cards/${id}`,
  settlement: (from: string, to: string): string =>
    `/restaurant/gift-cards/settlement?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`,
  cashDay: (branchId: number, date: string | null): string =>
    `/restaurant/cash/branches/${branchId}${date ? `?date=${encodeURIComponent(date)}` : ""}`,
  royalties: (filters: RestaurantFilters): string =>
    `/restaurant/royalties?${filterQuery({ ...filters, branchId: null })}`,
} as const;

export const restaurantQueries = {
  setup: () =>
    defineQuery<RestaurantSetup>([...RESTAURANT_KEY, "setup"], async (api) =>
      fromApi<RestaurantSetup>(await api(restaurantPaths.setup())),
    ),
  regions: () =>
    defineQuery<Region[]>([...RESTAURANT_KEY, "regions"], async (api) =>
      fromApi<{ regions: Region[] }>(await api(restaurantPaths.regions())).regions,
    ),
  franchisees: () =>
    defineQuery<Franchisee[]>([...RESTAURANT_KEY, "franchisees"], async (api) =>
      fromApi<{ franchisees: Franchisee[] }>(await api(restaurantPaths.franchisees())).franchisees,
    ),
  franchisee: (id: number) =>
    defineQuery<Franchisee>([...RESTAURANT_KEY, "franchisee", id], async (api) =>
      fromApi<Franchisee>(await api(restaurantPaths.franchisee(id))),
    ),
  team: (id: number) =>
    defineQuery<FranchiseTeam>([...RESTAURANT_KEY, "team", id], async (api) =>
      fromApi<FranchiseTeam>(await api(restaurantPaths.team(id))),
    ),
  branches: (filters: BranchListFilters = {}) =>
    defineQuery<Branch[]>(
      [
        ...RESTAURANT_KEY,
        "branches",
        filters.franchiseeId ?? null,
        filters.regionId ?? null,
        filters.status ?? null,
        filters.q ?? null,
      ],
      async (api) => fromApi<{ branches: Branch[] }>(await api(restaurantPaths.branches(filters))).branches,
    ),
  branch: (id: number) =>
    defineQuery<Branch>([...RESTAURANT_KEY, "branch", id], async (api) =>
      fromApi<Branch>(await api(restaurantPaths.branch(id))),
    ),
  scorecard: (id: number, filters: RestaurantFilters) =>
    defineQuery<Scorecard>([...RESTAURANT_KEY, "scorecard", id, ...filterKey(filters)], async (api) =>
      fromApi<Scorecard>(await api(restaurantPaths.scorecard(id, filters))),
    ),
  members: () =>
    defineQuery<NetworkMember[]>([...RESTAURANT_KEY, "members"], async (api) =>
      fromApi<{ members: NetworkMember[] }>(await api(restaurantPaths.members())).members,
    ),
  ingestKeys: () =>
    defineQuery<IngestKey[]>([...RESTAURANT_KEY, "ingest-keys"], async (api) =>
      fromApi<{ keys: IngestKey[] }>(await api(restaurantPaths.ingestKeys())).keys,
    ),
  overview: (filters: RestaurantFilters) =>
    defineQuery<NetworkOverview>([...RESTAURANT_KEY, "overview", ...filterKey(filters)], async (api) =>
      fromApi<NetworkOverview>(await api(restaurantPaths.overview(filters))),
    ),
  league: (filters: RestaurantFilters) =>
    defineQuery<League>(
      [...RESTAURANT_KEY, "league", ...filterKey({ ...filters, branchId: null })],
      async (api) => fromApi<League>(await api(restaurantPaths.league(filters))),
    ),
  dayparts: (filters: RestaurantFilters) =>
    defineQuery<Dayparts>([...RESTAURANT_KEY, "dayparts", ...filterKey(filters)], async (api) =>
      fromApi<Dayparts>(await api(restaurantPaths.dayparts(filters))),
    ),
  channels: (filters: RestaurantFilters) =>
    defineQuery<Channels>([...RESTAURANT_KEY, "channels", ...filterKey(filters)], async (api) =>
      fromApi<Channels>(await api(restaurantPaths.channels(filters))),
    ),
  menu: (filters: RestaurantFilters) =>
    defineQuery<MenuEngineering>([...RESTAURANT_KEY, "menu", ...filterKey(filters)], async (api) =>
      fromApi<MenuEngineering>(await api(restaurantPaths.menu(filters))),
    ),
  speed: (filters: RestaurantFilters) =>
    defineQuery<Speed>([...RESTAURANT_KEY, "speed", ...filterKey(filters)], async (api) =>
      fromApi<Speed>(await api(restaurantPaths.speed(filters))),
    ),
  guests: (filters: RestaurantFilters) =>
    defineQuery<Guests>([...RESTAURANT_KEY, "guests", ...filterKey(filters)], async (api) =>
      fromApi<Guests>(await api(restaurantPaths.guests(filters))),
    ),
  statements: (status: StatementStatus | null = null) =>
    defineQuery<StatementList>([...RESTAURANT_KEY, "statements", status], async (api) =>
      fromApi<StatementList>(await api(restaurantPaths.statements(status))),
    ),
  settings: () =>
    defineQuery<RestaurantRules>([...RESTAURANT_KEY, "settings"], async (api) =>
      fromApi<RestaurantRules>(await api(restaurantPaths.settings())),
    ),
  catalog: () =>
    defineQuery<Catalog>([...RESTAURANT_KEY, "catalog"], async (api) =>
      fromApi<Catalog>(await api(restaurantPaths.catalog())),
    ),
  branchMenu: (id: number) =>
    defineQuery<BranchMenu>([...RESTAURANT_KEY, "branch-menu", id], async (api) =>
      fromApi<BranchMenu>(await api(restaurantPaths.branchMenu(id))),
    ),
  service: (id: number) =>
    defineQuery<BranchService>([...RESTAURANT_KEY, "service", id], async (api) =>
      fromApi<BranchService>(await api(restaurantPaths.service(id))),
    ),
  board: (id: number) =>
    defineQuery<KitchenBoard>([...RESTAURANT_KEY, "board", id], async (api) =>
      fromApi<KitchenBoard>(await api(restaurantPaths.board(id))),
    ),
  drivers: (id: number) =>
    defineQuery<Driver[]>([...RESTAURANT_KEY, "drivers", id], async (api) =>
      fromApi<{ drivers: Driver[] }>(await api(restaurantPaths.drivers(id))).drivers,
    ),
  caller: (phone: string) =>
    defineQuery<CallerLookup>([...RESTAURANT_KEY, "caller", phone], async (api) =>
      fromApi<CallerLookup>(await api(restaurantPaths.caller(phone))),
    ),
  paymentAccount: (franchiseeId: number) =>
    defineQuery<PaymentAccount>([...RESTAURANT_KEY, "payment-account", franchiseeId], async (api) =>
      fromApi<PaymentAccount>(await api(restaurantPaths.paymentAccount(franchiseeId))),
    ),
  dayOrders: (branchId: number, date: string | null, q: string | null) =>
    defineQuery<DayOrders>([...RESTAURANT_KEY, "day-orders", branchId, date, q], async (api) =>
      fromApi<DayOrders>(await api(restaurantPaths.dayOrders(branchId, date, q))),
    ),
  orderDetail: (id: number) =>
    defineQuery<OrderDetail>([...RESTAURANT_KEY, "order", id], async (api) =>
      fromApi<OrderDetail>(await api(restaurantPaths.orderDetail(id))),
    ),
  cashDay: (branchId: number, date: string | null) =>
    defineQuery<CashDay>([...RESTAURANT_KEY, "cash", branchId, date], async (api) =>
      fromApi<CashDay>(await api(restaurantPaths.cashDay(branchId, date))),
    ),
  coach: (date: string | null) =>
    defineQuery<CoachDay>([...RESTAURANT_KEY, "coach", date], async (api) =>
      fromApi<CoachDay>(await api(restaurantPaths.coach(date))),
    ),
  zones: (branchId: number) =>
    defineQuery<DeliveryZone[]>([...RESTAURANT_KEY, "zones", branchId], async (api) =>
      fromApi<{ zones: DeliveryZone[] }>(await api(restaurantPaths.zones(branchId))).zones,
    ),
  batches: (branchId: number) =>
    defineQuery<RunSuggestions>([...RESTAURANT_KEY, "batches", branchId], async (api) =>
      fromApi<RunSuggestions>(await api(restaurantPaths.batches(branchId))),
    ),
  loyalty: () =>
    defineQuery<LoyaltyOverview>([...RESTAURANT_KEY, "loyalty"], async (api) =>
      fromApi<LoyaltyOverview>(await api(restaurantPaths.loyalty())),
    ),
  loyaltyMembers: (q: string | null) =>
    defineQuery<LoyaltyMember[]>([...RESTAURANT_KEY, "loyalty-members", q], async (api) =>
      fromApi<{ members: LoyaltyMember[] }>(await api(restaurantPaths.loyaltyMembers(q))).members,
    ),
  loyaltyMember: (id: number) =>
    defineQuery<MemberDetail>([...RESTAURANT_KEY, "loyalty-member", id], async (api) =>
      fromApi<MemberDetail>(await api(restaurantPaths.loyaltyMember(id))),
    ),
  giftCards: (last4: string | null, status: string | null) =>
    defineQuery<GiftCardList>([...RESTAURANT_KEY, "gift-cards", last4, status], async (api) =>
      fromApi<GiftCardList>(await api(restaurantPaths.giftCards(last4, status))),
    ),
  giftCard: (id: number) =>
    defineQuery<GiftCardDetail>([...RESTAURANT_KEY, "gift-card", id], async (api) =>
      fromApi<GiftCardDetail>(await api(restaurantPaths.giftCard(id))),
    ),
  settlement: (from: string, to: string) =>
    defineQuery<GiftCardSettlement>([...RESTAURANT_KEY, "settlement", from, to], async (api) =>
      fromApi<GiftCardSettlement>(await api(restaurantPaths.settlement(from, to))),
    ),
  royalties: (filters: RestaurantFilters) =>
    defineQuery<Royalties>(
      [...RESTAURANT_KEY, "royalties", ...filterKey({ ...filters, branchId: null })],
      async (api) => fromApi<Royalties>(await api(restaurantPaths.royalties(filters))),
    ),
};
