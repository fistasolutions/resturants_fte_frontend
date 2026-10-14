/**
 * Pure helpers for Products → Costs (SPEC-251): tile building, shipment-header
 * validation, the multipart body, the CSV template, error shaping. Nothing here
 * computes a cost — every figure comes from the backend (root Rule 8).
 */
import type { StripTile } from "@/lib/kpi-strip";
import type {
  AllocationMethod,
  ApiCostCoverage,
  ApiCostReconciliation,
  ApiErrorEnvelope,
} from "@/types/costs";
import { formatCurrency, formatNumber, formatPercent } from "@/utils/format";

export const ALLOCATION_METHODS: Array<{ value: AllocationMethod; label: string; hint: string }> = [
  { value: "value", label: "By line value", hint: "each line carries the share its goods value earns" },
  { value: "units", label: "By units", hint: "every unit carries the same share" },
  { value: "weight", label: "By weight", hint: "needs a weight column on every line" },
];

/** The four-column file the shipment importer reads; `weight` is optional. */
export const CSV_TEMPLATE = "sku,quantity,unit_cost,weight\nEXAMPLE-SKU-1,10,30.00,0.50\n";

export function coverageTiles(coverage: ApiCostCoverage, shipmentsInPeriod: number): StripTile[] {
  const pct = coverage.coverage_pct;
  const landed = coverage.landed_pct;
  return [
    {
      key: "coverage",
      label: "Cost coverage",
      value: pct === null ? "—" : formatPercent(pct),
      delta: null,
      invertDelta: false,
      sub: coverage.flagged
        ? `below the ${formatPercent(coverage.min_coverage_pct)} floor — margins are flagged`
        : "of sales on lines with a known cost",
      tone: coverage.flagged ? "bad" : pct === null ? "neutral" : "good",
    },
    {
      key: "landed",
      label: "Landed coverage",
      value: landed === null ? "—" : formatPercent(landed),
      delta: null,
      invertDelta: false,
      sub: `${formatNumber(coverage.lines_landed)} of ${formatNumber(coverage.lines)} lines carry a landed cost`,
      tone: landed !== null && landed > 0 ? "good" : "neutral",
    },
    {
      key: "variants",
      label: "Variants costed",
      value: formatNumber(coverage.variants_with_landed),
      suffix: `/${formatNumber(coverage.variants_selling)}`,
      delta: null,
      invertDelta: false,
      sub: `${formatNumber(coverage.variants_with_shopify_cost)} carry only Shopify's cost`,
      tone: "neutral",
    },
    {
      key: "shipments",
      label: "Shipments recorded",
      value: formatNumber(shipmentsInPeriod),
      delta: null,
      invertDelta: false,
      sub: "received in this period",
      tone: "neutral",
    },
  ];
}

export interface ShipmentHeaderForm {
  reference: string;
  supplier: string;
  receivedDate: string;
  currency: string;
  fxRate: string;
  fxRateDate: string;
  allocationMethod: AllocationMethod;
  freightTotal: string;
  dutyTotal: string;
  brokerageTotal: string;
  insuranceTotal: string;
  handlingTotal: string;
  sourceDocument: string;
  notes: string;
}

export function emptyShipmentHeader(baseCurrency: string, today: string): ShipmentHeaderForm {
  return {
    reference: "",
    supplier: "",
    receivedDate: today,
    currency: baseCurrency,
    fxRate: "",
    fxRateDate: "",
    allocationMethod: "value",
    freightTotal: "",
    dutyTotal: "",
    brokerageTotal: "",
    insuranceTotal: "",
    handlingTotal: "",
    sourceDocument: "",
    notes: "",
  };
}

const MONEY_FIELDS: Array<[keyof ShipmentHeaderForm, string]> = [
  ["freightTotal", "Freight"],
  ["dutyTotal", "Duty"],
  ["brokerageTotal", "Brokerage"],
  ["insuranceTotal", "Insurance"],
  ["handlingTotal", "Handling"],
];

function isMoney(value: string): boolean {
  const cleaned = value.trim().replace(/,/g, "");
  return cleaned === "" || (/^\d+(\.\d+)?$/.test(cleaned) && Number(cleaned) >= 0);
}

/** Client-side refusal before the round trip — the backend validates again. */
export function validateShipmentHeader(
  form: ShipmentHeaderForm,
  baseCurrency: string,
  file: File | null,
): string[] {
  const errors: string[] = [];
  if (!form.reference.trim()) errors.push("Reference is required (the shipment or invoice number).");
  if (!form.receivedDate) errors.push("Received date is required.");
  const currency = form.currency.trim().toUpperCase();
  if (currency.length !== 3) errors.push("Currency must be a 3-letter code.");
  if (currency !== baseCurrency.toUpperCase()) {
    const rate = Number(form.fxRate);
    if (!form.fxRate.trim() || !Number.isFinite(rate) || rate <= 0) {
      errors.push(`FX rate is required for a ${currency} invoice (${baseCurrency} per 1 ${currency}).`);
    }
  }
  for (const [key, label] of MONEY_FIELDS) {
    if (!isMoney(form[key])) errors.push(`${label} total must be a number (or blank).`);
  }
  if (!file) errors.push("Choose the shipment CSV.");
  return errors;
}

/** The multipart body both preview and record send — blank money fields are omitted,
 * which is how the backend learns "not on the invoice". */
export function shipmentFormData(form: ShipmentHeaderForm, baseCurrency: string, file: File): FormData {
  const body = new FormData();
  body.append("file", file);
  body.append("reference", form.reference.trim());
  body.append("received_date", form.receivedDate);
  body.append("allocation_method", form.allocationMethod);
  const currency = form.currency.trim().toUpperCase();
  body.append("currency", currency);
  if (currency !== baseCurrency.toUpperCase()) body.append("fx_rate", form.fxRate.trim());
  const optional: Array<[string, string]> = [
    ["supplier", form.supplier],
    ["fx_rate_date", form.fxRateDate],
    ["freight_total", form.freightTotal],
    ["duty_total", form.dutyTotal],
    ["brokerage_total", form.brokerageTotal],
    ["insurance_total", form.insuranceTotal],
    ["handling_total", form.handlingTotal],
    ["source_document", form.sourceDocument],
    ["notes", form.notes],
  ];
  for (const [key, value] of optional) {
    if (value.trim() !== "") body.append(key, value.trim());
  }
  return body;
}

export interface ManualCostForm {
  effectiveDate: string;
  currency: string;
  fxRate: string;
  unitCost: string;
  freight: string;
  duty: string;
  brokerage: string;
  insurance: string;
  handling: string;
  sourceDocument: string;
}

export function emptyManualForm(baseCurrency: string, today: string): ManualCostForm {
  return {
    effectiveDate: today,
    currency: baseCurrency,
    fxRate: "",
    unitCost: "",
    freight: "",
    duty: "",
    brokerage: "",
    insurance: "",
    handling: "",
    sourceDocument: "",
  };
}

export function validateManualForm(form: ManualCostForm, baseCurrency: string): string[] {
  const errors: string[] = [];
  if (!form.effectiveDate) errors.push("Effective date is required.");
  if (!isMoney(form.unitCost) || form.unitCost.trim() === "") errors.push("Unit cost is required.");
  const currency = form.currency.trim().toUpperCase();
  if (currency.length !== 3) errors.push("Currency must be a 3-letter code.");
  if (currency !== baseCurrency.toUpperCase()) {
    const rate = Number(form.fxRate);
    if (!form.fxRate.trim() || !Number.isFinite(rate) || rate <= 0) {
      errors.push(`FX rate is required for a ${currency} entry.`);
    }
  }
  for (const key of ["freight", "duty", "brokerage", "insurance", "handling"] as const) {
    if (!isMoney(form[key])) errors.push(`${key} must be a number (or blank).`);
  }
  return errors;
}

/** The JSON body for `PUT /costs/variants/{id}` — blank duty / handling stay absent. */
export function manualCostBody(form: ManualCostForm, baseCurrency: string): Record<string, unknown> {
  const currency = form.currency.trim().toUpperCase();
  const num = (value: string): number | undefined => {
    const cleaned = value.trim().replace(/,/g, "");
    return cleaned === "" ? undefined : Number(cleaned);
  };
  return {
    effective_date: form.effectiveDate,
    currency,
    fx_rate: currency === baseCurrency.toUpperCase() ? 1 : num(form.fxRate),
    unit_cost: num(form.unitCost),
    freight: num(form.freight),
    duty: num(form.duty),
    brokerage: num(form.brokerage),
    insurance: num(form.insurance),
    handling: num(form.handling),
    source_document: form.sourceDocument.trim() || undefined,
  };
}

/** "3 rows could not be read" + every row named — from the backend's envelope. */
export function describeApiError(body: unknown, fallback: string): { message: string; rows: string[] } {
  const envelope = (body ?? {}) as ApiErrorEnvelope;
  const message = envelope.error?.message ?? fallback;
  const rows = (envelope.error?.details ?? []).map((d) => `${d.field}: ${d.message}`);
  return { message, rows };
}

export function reconciliationLines(
  rec: ApiCostReconciliation,
): Array<{ label: string; value: string; tone: "plain" | "muted" | "warn" }> {
  const lines: Array<{ label: string; value: string; tone: "plain" | "muted" | "warn" }> = [
    { label: "Landed cost recorded", value: formatCurrency(rec.landed_recorded), tone: "plain" },
    { label: "Invoices entered", value: formatCurrency(rec.invoices_entered), tone: "plain" },
    { label: "Variance", value: formatCurrency(rec.variance), tone: rec.variance === 0 ? "muted" : "plain" },
  ];
  for (const line of rec.variance_lines) {
    lines.push({
      label: `↳ ${line.label}`,
      value: formatCurrency(line.amount),
      tone: line.label.startsWith("Unexplained") ? "warn" : "muted",
    });
  }
  return lines;
}

/** Which of a landed row's components were assumed, in the owner's words. */
export function assumedLabel(components: string[]): string {
  if (components.length === 0) return "all from the invoice";
  return `${components.join(", ")} from assumptions`;
}

export function rateLabel(currency: string, baseCurrency: string, fxRate: number): string {
  if (currency === baseCurrency) return currency;
  return `${currency} @ ${fxRate}`;
}
