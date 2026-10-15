/**
 * Restaurant brand view models (frontend SPEC-377 over backend SPEC-387/388/389). Every figure
 * is computed by the backend; these only carry it.
 */

export type FranchiseeKind = "corporate" | "franchise";
export type FranchiseeStatus = "onboarding" | "active" | "terminated";
export type BranchStatus = "coming_soon" | "open" | "temporarily_closed" | "closed";
export type MenuClass = "star" | "plowhorse" | "puzzle" | "dog" | "no_cost";
export type ImportKind = "orders" | "menu" | "labor";

export interface BranchScope {
  franchiseeId: number | null;
  branchIds: number[] | null;
  isHq: boolean;
}

export interface RestaurantSetup {
  ready: boolean;
  storeId: number | null;
  brandName: string | null;
  timezone: string | null;
  currency: string | null;
  branches: number;
  franchisees: number;
  scope: BranchScope;
}

export interface Region {
  id: number;
  name: string;
  branches: number;
}

export interface Franchisee {
  id: number;
  name: string;
  kind: FranchiseeKind;
  status: FranchiseeStatus;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  royaltyRate: number;
  adFundRate: number;
  agreementStart: string | null;
  agreementEnd: string | null;
  notes: string | null;
  branches: number;
  openBranches: number;
}

export interface Branch {
  id: number;
  code: string;
  name: string;
  externalRef: string | null;
  status: BranchStatus;
  franchiseeId: number;
  franchiseeName: string;
  regionId: number | null;
  regionName: string | null;
  addressLine: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
  ianaTimezone: string | null;
  openedOn: string | null;
  seats: number | null;
  deliveryRadiusMiles: number | null;
  managerName: string | null;
  managerEmail: string | null;
}

export interface Kpi {
  value: number | null;
  previous: number | null;
  change: number | null;
}

export type KpiKey =
  | "net_sales"
  | "gross_sales"
  | "transactions"
  | "average_ticket"
  | "guests"
  | "discount_rate"
  | "voids"
  | "void_amount"
  | "labor_pct"
  | "food_cost_pct"
  | "prime_cost_pct"
  | "third_party_share"
  | "on_time_rate"
  | "avg_delivery_minutes";

export interface Period {
  from: string;
  to: string;
}

export interface RankedBranch {
  branchId: number;
  code: string;
  name: string;
  franchiseeName: string;
  netSales: number;
}

export interface NetworkOverview {
  period: Period;
  previousPeriod: Period;
  onTimeTargetMinutes: number;
  kpis: Record<KpiKey, Kpi>;
  trend: { date: string; netSales: number; transactions: number }[];
  branches: number;
  top: RankedBranch[];
  bottom: RankedBranch[];
}

export interface LeagueRow {
  branchId: number;
  code: string;
  name: string;
  status: BranchStatus;
  franchiseeId: number;
  franchiseeName: string;
  regionName: string | null;
  netSales: number;
  change: number | null;
  transactions: number;
  averageTicket: number | null;
  laborPct: number | null;
  avgDeliveryMinutes: number | null;
  onTimeRate: number | null;
  rank: number;
  quartile: number;
}

export interface League {
  period: Period;
  onTimeTargetMinutes: number;
  branches: LeagueRow[];
}

export interface Scorecard extends NetworkOverview {
  branchId: number;
  rank: number;
  of: number;
  franchiseeAverageNetSales: number | null;
  networkAverageNetSales: number | null;
}

export interface Daypart {
  key: string;
  label: string;
  hours: string;
  netSales: number;
  transactions: number;
  averageTicket: number | null;
  share: number | null;
}

export interface Dayparts {
  period: Period;
  dayparts: Daypart[];
  /** 7 weekdays (Monday first) × 24 hours. */
  grid: { netSales: number; transactions: number }[][];
}

export interface MixRow {
  key: string;
  netSales: number;
  transactions: number;
  averageTicket: number | null;
  share: number | null;
  orderShare: number | null;
}

export interface Channels {
  period: Period;
  channels: MixRow[];
  sources: MixRow[];
}

export interface MenuItemRow {
  key: string;
  name: string;
  category: string;
  units: number;
  mix: number;
  revenue: number;
  price: number;
  foodCost: number | null;
  foodCostPct: number | null;
  margin: number | null;
  contribution: number | null;
  class: MenuClass;
  action: string;
}

export interface MenuEngineering {
  period: Period;
  items: MenuItemRow[];
  popularityThreshold: number;
  marginThreshold: number | null;
  counts: Record<MenuClass, number>;
  categories: { category: string; units: number; revenue: number }[];
  units: number;
}

export interface SpeedSummary {
  orders: number;
  avgMinutes: number | null;
  p90Minutes: number | null;
  onTimeRate?: number | null;
  lateRate?: number | null;
}

export interface Speed {
  period: Period;
  onTimeTargetMinutes: number;
  delivery: SpeedSummary;
  carryout: SpeedSummary;
  branches: {
    branchId: number;
    code: string;
    name: string;
    franchiseeName: string;
    delivery: SpeedSummary;
    carryout: SpeedSummary;
  }[];
}

export interface TopGuest {
  guestId: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  marketingOptIn: boolean;
  orders: number;
  netSales: number;
  lastOrder: string | null;
}

export interface Guests {
  period: Period;
  knownGuests: number;
  active: number;
  new: number;
  returning: number;
  lapsed: number;
  lost: number;
  ordersPerGuest: number | null;
  top: TopGuest[];
}

export interface RoyaltyBranchLine {
  branchId: number;
  code: string;
  name: string;
  basis: number;
  royalty: number;
  adFund: number;
  minimumTopup: number;
}

export interface RoyaltyStatement {
  franchiseeId: number;
  name: string;
  kind: FranchiseeKind;
  branchesTrading: number;
  netSales: number;
  basisSales: number;
  minimumTopup: number;
  lines: RoyaltyBranchLine[];
  royaltyRate: number;
  adFundRate: number;
  royalty: number;
  adFund: number;
  totalDue: number;
}

export interface Royalties {
  period: Period;
  basis: string;
  basisRules: string[];
  statements: RoyaltyStatement[];
  totals: { netSales: number; royalty: number; adFund: number; totalDue: number };
}

export interface NetworkMember {
  membershipId: number;
  userId: number;
  name: string;
  email: string;
  roleKey: string;
  roleName: string;
  status: string;
  isOwner: boolean;
  franchiseeId: number | null;
  franchiseeName: string | null;
  branchIds: number[] | null;
}

export interface FranchiseRole {
  id: number;
  key: string;
  name: string;
  description: string;
  permissions: string[];
  own: boolean;
}

export interface FranchiseTeam {
  franchisee: { id: number; name: string };
  members: {
    membershipId: number;
    userId: number;
    name: string;
    email: string;
    roleKey: string;
    roleName: string;
    status: string;
    branchIds: number[] | null;
  }[];
  invitations: {
    id: number;
    email: string;
    roleKey: string;
    roleName: string;
    branchIds: number[] | null;
    expiresAt: string;
  }[];
  roles: FranchiseRole[];
}

export interface IngestKey {
  id: number;
  name: string;
  prefix: string;
  createdAt: string | null;
  lastUsedAt: string | null;
  revokedAt: string | null;
}

export interface ImportReport {
  kind: ImportKind;
  dryRun: boolean;
  rows: number;
  records: number;
  columns: Record<string, string>;
  unmapped: string[];
  preview: Record<string, unknown>[];
  errors: { row: number; message: string }[];
  result: { received: number; created: number; updated: number; rejected: number } | null;
}

export interface BranchImportReport {
  dryRun: boolean;
  rows: number;
  created: number;
  updated: number;
  unchanged: number;
  newFranchisees: number;
  newRegions: number;
  errors: { row: number; message: string }[];
  columns: Record<string, string>;
  unmapped: string[];
}

/** What every restaurant read is narrowed by — all of it URL state. */
export interface RestaurantFilters {
  from: string;
  to: string;
  franchiseeId?: number | null;
  regionId?: number | null;
  branchId?: number | null;
  target?: number | null;
}

export type StatementStatus = "draft" | "issued" | "paid" | "void";

/** One franchisee's weekly royalty bill (backend SPEC-390). */
export interface WeeklyStatement {
  id: number;
  franchiseeId: number;
  franchiseeName: string;
  periodStart: string;
  periodEnd: string;
  status: StatementStatus;
  basisSales: number;
  royalty: number;
  adFund: number;
  minimumTopup: number;
  totalDue: number;
  lines: RoyaltyBranchLine[];
  issuedAt: string | null;
  paidAt: string | null;
  paidReference: string | null;
}

export interface StatementList {
  statements: WeeklyStatement[];
  lastCompleteWeek: Period;
}

/** A brand's rules (backend SPEC-390). */
export interface RestaurantRules {
  royaltyIncludesDeliveryFees: boolean;
  royaltyWeekStartsOn: number;
  minimumWeeklyRoyalty: number | null;
  onTimeTargetMinutes: number;
  basisRules: string[];
}
