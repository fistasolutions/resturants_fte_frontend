/** Catalogue data trust (SPEC-217; backend SPEC-225). */

export type DataTrustSeverity = "excluded" | "high" | "medium" | "low";

export interface DataTrustSample {
  productId: number;
  title: string;
  detail: string;
}

export interface DataTrustRule {
  key: string;
  label: string;
  severity: DataTrustSeverity;
  count: number;
  /** Null where no honest dollar figure exists — never a fabricated one. */
  valueImpact: number | null;
  /** True only when this rule actually changed the numbers. */
  excluded: boolean;
  affects: string[];
  explanation: string;
  action: string;
  samples: DataTrustSample[];
}

export interface DataTrustSummary {
  rulesTriggered: number;
  productsExcluded: number;
  /** What the figures would say with no correction applied. */
  stockValueReported: number;
  stockValueExcluded: number;
  /** What every other surface in the platform now reports. */
  stockValueTrusted: number;
  excludedSharePct: number;
}

export interface DataTrustReport {
  summary: DataTrustSummary;
  rules: DataTrustRule[];
}

/** The raw backend shape, before adaptation to camelCase. */
export interface DataTrustApiResponse {
  summary: {
    rules_triggered: number;
    products_excluded: number;
    stock_value_reported: number;
    stock_value_excluded: number;
    stock_value_trusted: number;
    excluded_share_pct: number;
  };
  rules: Array<{
    key: string;
    label: string;
    severity: string;
    count: number;
    value_impact: number | null;
    excluded: boolean;
    affects: string[];
    explanation: string;
    action: string;
    samples: Array<{ product_id: number; title: string; detail: string }>;
  }>;
}
