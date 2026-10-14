export type OutcomeVerdict = "worked" | "early" | "none";

export type OutcomeLink =
  | { type: "overdue"; location_key: string }
  | { type: "orders"; location_key: string }
  | { type: "inventory"; location_key: string }
  | { type: "transfers"; location_key?: string }
  | { type: "dead_inventory"; product_id: number; location_id: number }
  | { type: "customers" }
  | { type: "traffic" }
  | { type: "discounts" }
  | { type: "warehouse" }
  | { type: "support" }
  | { type: "returns" };

/** Who a nudge went to (backend SPEC-248): a store, or a store-level role. */
export type OutcomeOwnerRole = "location" | "warehouse" | "support" | "returns";

export interface OutcomeOwner {
  role: OutcomeOwnerRole;
  locationId: number | null;
  locationName: string | null;
}

export interface OutcomeEntry {
  headline: string;
  meta: string;
  sentAt: string;
  verdict: OutcomeVerdict;
  detail: string;
  link: OutcomeLink;
  /** Null for winback — a Klaviyo list, not a person. */
  owner: OutcomeOwner | null;
  /** Hours from the nudge to the first order on the list that shipped; null where the
   * category cannot measure it. */
  respondedHours: number | null;
}

/** ── SPEC-241 / backend SPEC-248 — manager accountability ── */

export interface ManagerLatestOutcome extends OutcomeEntry {
  category: string;
}

export interface ManagerRow {
  key: string;
  /** Null when nobody is configured for this store or role. */
  email: string | null;
  name: string;
  roles: OutcomeOwner[];
  nudges: number;
  worked: number;
  none: number;
  early: number;
  /** worked ÷ (worked + none); null until something is measured. */
  actRate: number | null;
  medianRespondedHours: number | null;
  lastNudgeAt: string | null;
  daysSinceLast: number | null;
  byCategory: Record<string, number>;
  latest: ManagerLatestOutcome[];
  settingsHref: string;
}

export interface ManagerAccountability {
  generatedAt: string;
  summary: {
    managers: number;
    withEmail: number;
    neverNudged: number;
    nudges: number;
    worked: number;
    none: number;
    early: number;
  };
  managers: ManagerRow[];
}

export interface ReportCardScoreboard {
  health: number | null;
  healthPrev: number | null;
  netMarginPct: number | null;
  conversionPct: number | null;
  discountRatePct: number | null;
  discountDiscipline: string | null;
  returnRatePct: number | null;
  fulfillDays: number | null;
  rank: number | null;
  of: number;
}

export interface ReportCard {
  location: { id: number; name: string; managerEmail: string | null };
  week: { start: string; end: string };
  scoreboard: ReportCardScoreboard;
  nudges: ManagerLatestOutcome[];
  openNow: { unfulfilled48h: number; unfulfilled48hValue: number };
  subject: string;
  text: string;
}

export interface ReportCardSendEntry {
  locationId: number;
  locationName: string;
  recipient?: string;
  reason?: string;
}

export interface ReportCardSendResult {
  sent: ReportCardSendEntry[];
  skipped: ReportCardSendEntry[];
  failed: ReportCardSendEntry[];
}

export interface ResultsData {
  overdue: OutcomeEntry[];
  transfers: OutcomeEntry[];
  winback: OutcomeEntry[];
  deadInventory: OutcomeEntry[];
  orders: OutcomeEntry[];
  storeTraffic: OutcomeEntry[];
  discountReview: OutcomeEntry[];
  warehouse: OutcomeEntry[];
  support: OutcomeEntry[];
  returns: OutcomeEntry[];
}


/** The value ledger (backend SPEC-207 / frontend SPEC-188). */
export interface LedgerEntry {
  category: string;
  headline: string;
  detail: string;
  meta: string;
  sentAt: string;
  verdict: OutcomeVerdict;
  /** Null wherever a value cannot honestly be attributed — never 0. */
  value: number | null;
  valueBasis: string | null;
}

export interface LedgerCategory {
  category: string;
  actions: number;
  worked: number;
  value: number;
}

export interface ValueLedger {
  summary: {
    actionsTaken: number;
    worked: number;
    noEffect: number;
    stillMeasuring: number;
    measuredValue: number;
    actionsWithValue: number;
  };
  byCategory: LedgerCategory[];
  entries: LedgerEntry[];
}
