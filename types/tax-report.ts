/** sales/tax reports (SPEC-166; backend SPEC-171). */

export type ReconciliationStatus = "RECONCILED" | "REVIEW REQUIRED";

export interface TaxReportSummary {
  id: number;
  period_label: string;
  month_label: string;
  year: number;
  month: number;
  first_day: number;
  last_day: number;
  period_start: string;
  period_end: string;
  status: ReconciliationStatus;
  reconciled: boolean;
  row_count: number;
  total_sales: number;
  taxable_sales: number;
  non_taxable_sales: number;
  total_tax: number;
  file_name: string;
  generated_at: string;
}

/** A discrepancy the engine refused to adjust away (backend SPEC-169 §3.3). */
export interface TaxReportIssue {
  area: string;
  expected: string | number | null;
  calculated: string | number | null;
  difference: string | number | null;
  note: string;
}

export interface TaxReportDetail extends TaxReportSummary {
  issues: TaxReportIssue[];
  /** The definitions the figures were produced under — a stored number is
   *  worthless later if these are lost. */
  config: Record<string, string | boolean>;
}

/** The client's ten columns, in his exact order — keys match the Excel headers. */
export interface TaxReportRow {
  Month: string;
  "Sales Channel": string;
  "POS Location Name": string;
  "Taxable Sales": number;
  "Non-Taxable Sales": number;
  "Total Sales": number;
  "Total Tax Rate (%)": number;
  "Tax 1 Amount": number;
  "Tax 2 Amount": number;
  "Tax 3 Amount": number;
}

export interface TaxReportRows {
  period_label: string;
  rows: TaxReportRow[];
  reconciliation: { reconciled: boolean; issues: TaxReportIssue[] };
}
