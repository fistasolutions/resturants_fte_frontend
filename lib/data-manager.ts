/**
 * Data Manager (SPEC-374) — the pure half: tabs, links, and reading an uploaded sheet into an
 * exact copy. Nothing here calculates a business figure (root Rule 8); the profit figures come
 * from the backend, and a sheet is copied character for character, never cleaned or rounded.
 */
import type { FieldType, Meaning, SourceField } from "@/types/data-manager";

export const DATA_MANAGER_BASE = "/data-manager";
export const DATA_MANAGER_TITLE = "Data Manager";

export const DATA_TAB_IDS = ["overview", "sources", "tables", "matching", "profit", "changes", "settings"] as const;
export type DataTab = (typeof DATA_TAB_IDS)[number];

export const DATA_TAB_LABELS: Record<DataTab, string> = {
  overview: "Overview",
  sources: "Sources",
  tables: "Tables",
  matching: "Matching",
  profit: "Real profit",
  changes: "Changes",
  settings: "Settings",
};

export function normalizeDataTab(value: string | null | undefined): DataTab {
  return DATA_TAB_IDS.includes(value as DataTab) ? (value as DataTab) : "overview";
}

export function dataTabHref(tab: DataTab, extra?: Record<string, string>): string {
  const params = new URLSearchParams(tab === "overview" ? {} : { tab });
  for (const [key, value] of Object.entries(extra ?? {})) params.set(key, value);
  const query = params.toString();
  return query ? `${DATA_MANAGER_BASE}?${query}` : DATA_MANAGER_BASE;
}

export const MEANING_LABELS: Record<Meaning, string> = {
  sku: "Variant SKU",
  style: "Style number",
  product: "Product name",
  vendor: "Vendor",
  unit_cost: "Unit cost (goods)",
  freight: "Freight",
  duty: "Duty rate",
  landed_cost: "Landed cost",
  list_price: "List price",
  quantity: "Quantity",
  size_breakdown: "Quantity by size",
  po_number: "Purchase order",
  invoice_number: "Invoice number",
  amount: "Amount",
  location: "Location",
  season: "Season",
  date: "Date",
  payment_status: "Payment status",
  ignore: "Not used",
};

/** Upload types the Sources tab accepts. CSV and TSV are read in the browser for a preview;
 * Excel, PDF and image invoices are read by the import engine. */
export const UPLOAD_ACCEPT = ".csv,.tsv,.txt,.xlsx,.xls,.pdf,.png,.jpg,.jpeg";

export function isPreviewable(fileName: string): boolean {
  return /\.(csv|tsv|txt)$/i.test(fileName);
}

/**
 * Reads delimited text into rows exactly as written: quotes are unwrapped (RFC 4180) and nothing
 * else changes — no trimming, no number parsing, so "00123", "12.50" and a lone "." survive as-is.
 * The delimiter is the one the first line uses most (tab, semicolon or comma).
 */
export function parseDelimited(text: string): string[][] {
  const source = text.startsWith("﻿") ? text.slice(1) : text;
  const firstLine = source.split(/\r?\n/, 1)[0] ?? "";
  const counts: [string, number][] = [
    ["\t", firstLine.split("\t").length - 1],
    [";", firstLine.split(";").length - 1],
    [",", firstLine.split(",").length - 1],
  ];
  const delimiter = counts.reduce((best, next) => (next[1] > best[1] ? next : best))[0];

  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (quoted) {
      if (char === '"' && source[i + 1] === '"') {
        cell += '"';
        i += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        cell += char;
      }
    } else if (char === '"' && cell === "") {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell);
      cell = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && source[i + 1] === "\n") i += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows.filter((r) => r.some((value) => value.trim() !== ""));
}

/** The header row as field names; a blank header becomes "Column N" so no column is lost. */
export function headerFields(rows: string[][]): SourceField[] {
  const header = rows[0] ?? [];
  const width = Math.max(header.length, ...rows.map((r) => r.length));
  return Array.from({ length: width }, (_, i) => {
    const name = (header[i] ?? "").trim() || `Column ${i + 1}`;
    return { name, type: guessFieldType(rows.slice(1), i) };
  });
}

/** Rows under the header, padded to the field count so every cell has a place. */
export function bodyRows(rows: string[][], width: number): string[][] {
  return rows.slice(1).map((r) => Array.from({ length: width }, (_, i) => r[i] ?? ""));
}

/** A display hint only (alignment, a type chip): the value itself is never converted. */
export function guessFieldType(rows: string[][], column: number): FieldType {
  const values = rows
    .slice(0, 100)
    .map((r) => (r[column] ?? "").trim())
    .filter((v) => v !== "");
  if (values.length === 0) return "text";
  if (values.every((v) => /^-?[$€£]\s?[\d,]*\.?\d+$/.test(v))) return "currency";
  if (values.every((v) => /^-?[\d,]*\.?\d+\s?%$/.test(v))) return "percent";
  if (values.every((v) => /^-?\d{1,3}(,\d{3})*(\.\d+)?$|^-?\d+(\.\d+)?$/.test(v))) {
    // Codes with leading zeros are identifiers, not numbers.
    return values.some((v) => /^0\d/.test(v)) ? "text" : "number";
  }
  if (values.every((v) => /^\d{1,4}[/-]\d{1,2}[/-]\d{1,4}$/.test(v))) return "date";
  if (values.every((v) => /^(true|false|yes|no|✓|x)$/i.test(v))) return "checkbox";
  return "text";
}

const MEANING_RULES: [RegExp, Meaning, number][] = [
  [/\b(sku|barcode|upc|ean)\b/i, "sku", 97],
  [/style\s*(no|#|code|number)?/i, "style", 92],
  [/landed/i, "landed_cost", 95],
  [/\b(fob|unit\s*cost|cost\s*price|unit\s*price|cost)\b/i, "unit_cost", 90],
  [/freight|shipping/i, "freight", 88],
  [/duty|tariff/i, "duty", 90],
  [/retail|msrp|list\s*price|\bprice\b/i, "list_price", 86],
  [/vendor|supplier|factory/i, "vendor", 95],
  [/qty\s*by\s*size|size\s*(run|breakdown)/i, "size_breakdown", 90],
  [/\b(qty|quantity|units|pcs)\b|total\s*qty/i, "quantity", 88],
  [/\bpo\b|purchase\s*order/i, "po_number", 90],
  [/invoice/i, "invoice_number", 90],
  [/amount|line\s*total|total|balance/i, "amount", 82],
  [/location|store|warehouse/i, "location", 85],
  [/season/i, "season", 92],
  [/date|delivery|updated|modified/i, "date", 80],
  [/verified|paid|status/i, "payment_status", 75],
  [/desc|name|title|product/i, "product", 78],
];

/** The employee's first suggestion for what a column means, from its name. The owner confirms it. */
export function suggestMeaning(fieldName: string): { meaning: Meaning; confidence: number } {
  for (const [pattern, meaning, confidence] of MEANING_RULES) {
    if (pattern.test(fieldName)) return { meaning, confidence };
  }
  return { meaning: "ignore", confidence: 40 };
}

export function isNumericType(type: FieldType): boolean {
  return type === "number" || type === "currency" || type === "percent" || type === "formula";
}

/** The margin gap's tone: how far Shopify's cost overstates the real margin. */
export function gapTone(gapPoints: number): "destructive" | "warning" | "neutral" {
  if (gapPoints > 8) return "destructive";
  if (gapPoints > 5) return "warning";
  return "neutral";
}
