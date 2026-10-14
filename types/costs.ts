/** Landed cost engine (backend SPEC-256 / frontend SPEC-251) — the `/costs/*` shapes. */

export type AllocationMethod = "value" | "weight" | "units";

export interface ApiCostAssumptions {
  base_currency: string;
  shrinkage_rate_pct: number;
  handling_per_unit: number;
  default_duty_rate_pct: number;
  duty_rates_by_type: Record<string, number>;
}

export interface ApiCostCoverage {
  revenue: number;
  cost_known_revenue: number;
  landed_revenue: number;
  coverage_pct: number | null;
  landed_pct: number | null;
  flagged: boolean;
  min_coverage_pct: number;
  variants_selling: number;
  variants_with_landed: number;
  variants_with_shopify_cost: number;
  lines: number;
  lines_landed: number;
}

export interface ApiVarianceLine {
  label: string;
  amount: number;
}

export interface ApiCostReconciliation {
  landed_recorded: number;
  invoices_entered: number;
  assumptions_applied: number;
  variance: number;
  variance_lines: ApiVarianceLine[];
  shipments: number;
  rows: number;
  manual_entries: number;
}

export interface ApiCostShipment {
  id: number;
  reference: string;
  supplier: string | null;
  received_date: string;
  currency: string;
  fx_rate: number;
  fx_rate_date: string | null;
  allocation_method: AllocationMethod;
  goods_total: number;
  freight_total: number;
  duty_total: number | null;
  brokerage_total: number;
  insurance_total: number;
  handling_total: number | null;
  units_total: number;
  lines_count: number;
  invoices_total: number;
  assumed_total: number;
  landed_total: number;
  source_document: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface ApiCostSummary {
  period: { start: string; end: string };
  base_currency: string;
  coverage: ApiCostCoverage;
  reconciliation: ApiCostReconciliation;
  assumptions: ApiCostAssumptions;
  shipments: ApiCostShipment[];
}

/** One allocated line of a shipment preview / commit response. */
export interface ApiAllocatedLine {
  variant_id: number;
  sku: string;
  quantity: number;
  unit_cost_ccy: number;
  goods: number;
  freight: number;
  duty: number;
  brokerage: number;
  insurance: number;
  handling: number;
  shrinkage: number;
  line_total: number;
  unit_cost: number;
  unit_freight: number;
  unit_duty: number;
  unit_brokerage: number;
  unit_insurance: number;
  unit_handling: number;
  unit_shrinkage: number;
  total_unit_cost: number;
  assumed_components: string[];
  assumed_total: number;
}

export interface ApiShipmentAllocation {
  reference: string;
  supplier: string | null;
  received_date: string;
  currency: string;
  base_currency: string;
  fx_rate: number;
  allocation_method: AllocationMethod;
  units_total: number;
  lines_count: number;
  goods_total_ccy: number;
  totals_base: Record<string, number>;
  invoices_total: number;
  assumed_total: number;
  landed_total: number;
  lines: ApiAllocatedLine[];
  /** Preview only. */
  reference_exists?: boolean;
  /** Commit only. */
  shipment_id?: number;
  lines_resolved?: number;
  resolve_ms?: number;
}

export interface ApiLandedRow {
  id: number;
  variant_id: number;
  effective_date: string;
  source: "manual" | "shipment";
  shipment_id: number | null;
  quantity: number | null;
  currency: string;
  fx_rate: number;
  fx_rate_date: string | null;
  unit_cost_ccy: number;
  unit_cost: number;
  freight: number;
  duty: number;
  brokerage: number;
  insurance: number;
  handling: number;
  shrinkage: number;
  total_unit_cost: number;
  line_total: number;
  assumed_components: string[];
  allocation_method: AllocationMethod | null;
  source_document: string | null;
}

export interface ApiCostVariant {
  variant_id: number;
  sku: string | null;
  variant_title: string;
  product_title: string;
  product_type: string | null;
  vendor: string | null;
  price: number;
  shopify_cost: number | null;
  landed: {
    effective_date: string;
    total_unit_cost: number;
    source: "manual" | "shipment";
    currency: string;
  } | null;
}

export interface ApiRefreshResult {
  lines_updated: number;
  elapsed_ms: number;
  only_unresolved: boolean;
}

/** The backend's error envelope, with SPEC-256's optional per-row details. */
export interface ApiErrorEnvelope {
  error?: { code?: string; message?: string; details?: Array<{ field: string; message: string }> };
}
