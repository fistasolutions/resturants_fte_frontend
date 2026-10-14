/**
 * Data Manager (SPEC-374) — the shapes its screens read. They mirror the import engine's future
 * API, so wiring the backend swaps the data source in `services/data-manager.ts`, not a screen.
 */

/** How a field is held in the source: kept exactly, the type only drives alignment. */
export type FieldType = "text" | "number" | "currency" | "percent" | "date" | "select" | "link" | "checkbox" | "formula" | "attachment";

export interface SourceField {
  name: string;
  type: FieldType;
}

/** One table copied from Airtable or one uploaded sheet. Every cell is kept as written. */
export interface SourceTable {
  id: string;
  name: string;
  /** "airtable" tables belong to a base; "upload" tables are files. */
  origin: "airtable" | "upload";
  /** The base's name, or the file's name. */
  container: string;
  fields: SourceField[];
  /** Row count in the source; `rows` may be the first page of it. */
  rowCount: number;
  rows: string[][];
  matchedPct: number | null;
  readAt: string;
}

export interface AirtableBase {
  id: string;
  name: string;
  tableIds: string[];
}

/** What a column means, as the employee suggests it and the owner confirms it. */
export type Meaning =
  | "sku"
  | "style"
  | "product"
  | "vendor"
  | "unit_cost"
  | "freight"
  | "duty"
  | "landed_cost"
  | "list_price"
  | "quantity"
  | "size_breakdown"
  | "po_number"
  | "invoice_number"
  | "amount"
  | "location"
  | "season"
  | "date"
  | "payment_status"
  | "ignore";

export interface ColumnMeaning {
  field: string;
  meaning: Meaning;
  /** 0–100, how sure the suggestion is. */
  confidence: number;
  confirmed: boolean;
}

export interface MatchSummary {
  bySku: number;
  byBarcode: number;
  needsLook: number;
  notInShopify: number;
}

export interface MatchCandidate {
  sourceValue: string;
  product: string;
  shopifySku: string;
  likeness: number;
}

/** One row of Real profit, computed by the backend for a period and a grouping. */
export interface ProfitRow {
  name: string;
  unitsKept: number;
  realPrice: number;
  discountPct: number;
  realCost: number;
  realRevenue: number;
  realProfit: number;
  realMarginPct: number;
  shopifyMarginPct: number;
}

export type ProfitGrouping = "product" | "vendor" | "location";

export interface ProfitSummary {
  realRevenue: number;
  realProfit: number;
  realMarginPct: number;
  shopifyMarginPct: number;
  costCoveragePct: number;
  variantsWithCost: number;
  variants: number;
  rows: Record<ProfitGrouping, ProfitRow[]>;
}

export interface CellChange {
  key: string;
  label: string;
  field: string;
  was: string;
  now: string;
  kind: "changed" | "added" | "removed";
}

export interface PendingChanges {
  table: string;
  detectedAt: string;
  changes: CellChange[];
  profitEffect: number;
}

export interface ActivityItem {
  title: string;
  detail: string;
  at: string;
}

export interface DataManagerPreview {
  bases: AirtableBase[];
  tables: SourceTable[];
  meanings: Record<string, ColumnMeaning[]>;
  matches: MatchSummary;
  candidates: MatchCandidate[];
  profit: ProfitSummary;
  pending: PendingChanges;
  activity: ActivityItem[];
}
