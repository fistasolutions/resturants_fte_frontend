/**
 * Restaurant brand reads (frontend SPEC-377 / backend SPEC-387–389), through the client cache
 * (SPEC-230). Every filter that changes an answer is in its key.
 */
import { defineQuery } from "@/lib/query-def";
import { fromApi } from "@/lib/restaurant-api";
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
  Speed,
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
  royalties: (filters: RestaurantFilters) =>
    defineQuery<Royalties>(
      [...RESTAURANT_KEY, "royalties", ...filterKey({ ...filters, branchId: null })],
      async (api) => fromApi<Royalties>(await api(restaurantPaths.royalties(filters))),
    ),
};
