"use client";

import { useRef, useState } from "react";
import { Download, FileUp, LoaderCircle } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ALLOCATION_METHODS,
  CSV_TEMPLATE,
  assumedLabel,
  describeApiError,
  emptyShipmentHeader,
  shipmentFormData,
  validateShipmentHeader,
  type ShipmentHeaderForm,
} from "@/lib/costs";
import { cn } from "@/lib/utils";
import type { ApiShipmentAllocation } from "@/types/costs";
import { formatCurrency, formatNumber } from "@/utils/format";

interface Props {
  baseCurrency: string;
  onRecorded: () => void;
}

const FIELD = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";
const HEAD =
  "px-2 py-1.5 text-right text-[10px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const CELL = "px-2 py-1.5 text-right text-xs tabular-nums whitespace-nowrap";

/**
 * Record a shipment (SPEC-251 §3): the invoice header, the CSV, a preview of every
 * line's allocated landed cost from `POST /costs/shipments/preview`, then the
 * identical form to `POST /costs/shipments`. Every backend refusal is shown with
 * the rows it names. The card never computes a cent itself.
 */
export function CostsShipmentCard({ baseCurrency, onRecorded }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<ShipmentHeaderForm>(() => emptyShipmentHeader(baseCurrency, today));
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [preview, setPreview] = useState<ApiShipmentAllocation | null>(null);
  const [busy, setBusy] = useState<"preview" | "record" | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const foreign = form.currency.trim().toUpperCase() !== baseCurrency.toUpperCase();

  function set<K extends keyof ShipmentHeaderForm>(key: K, value: ShipmentHeaderForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setPreview(null);
    setDone(null);
  }

  async function submit(mode: "preview" | "record") {
    const problems = validateShipmentHeader(form, baseCurrency, file);
    if (problems.length > 0 || !file) {
      setErrors(problems);
      return;
    }
    setBusy(mode);
    setErrors([]);
    setDone(null);
    try {
      const path = mode === "preview" ? "/api/proxy/costs/shipments/preview" : "/api/proxy/costs/shipments";
      const response = await fetch(path, { method: "POST", body: shipmentFormData(form, baseCurrency, file) });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const shaped = describeApiError(body, `Could not ${mode} the shipment (${response.status}).`);
        setErrors([shaped.message, ...shaped.rows]);
        return;
      }
      const allocation = body as ApiShipmentAllocation;
      setPreview(allocation);
      if (mode === "record") {
        setDone(
          `${allocation.reference} recorded — ${formatNumber(allocation.lines_count)} lines, ` +
            `${formatNumber(allocation.lines_resolved ?? 0)} order lines re-costed in ${allocation.resolve_ms ?? 0} ms.`,
        );
        setForm(emptyShipmentHeader(baseCurrency, today));
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
        onRecorded();
      }
    } catch {
      setErrors([`Could not ${mode} the shipment — check the connection and try again.`]);
    } finally {
      setBusy(null);
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(new Blob([CSV_TEMPLATE], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "shipment-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card className="gap-4 p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Record a shipment</h2>
          <p className="text-xs text-muted-foreground">
            The invoice totals and a CSV of the lines — the engine allocates freight, duty,
            brokerage, insurance and handling across them to the cent and prices every unit.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={downloadTemplate}>
          <Download className="size-4" aria-hidden />
          CSV template
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <Field label="Reference" htmlFor="ship-reference">
          <Input id="ship-reference" value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder="INV-2026-091" />
        </Field>
        <Field label="Supplier" htmlFor="ship-supplier">
          <Input id="ship-supplier" value={form.supplier} onChange={(e) => set("supplier", e.target.value)} placeholder="Optional" />
        </Field>
        <Field label="Received date" htmlFor="ship-received">
          <Input id="ship-received" type="date" value={form.receivedDate} onChange={(e) => set("receivedDate", e.target.value)} />
        </Field>
        <Field label="Allocate" htmlFor="ship-method">
          <Select value={form.allocationMethod} onValueChange={(v) => set("allocationMethod", v as ShipmentHeaderForm["allocationMethod"])}>
            <SelectTrigger id="ship-method" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ALLOCATION_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="Invoice currency" htmlFor="ship-currency">
          <Input id="ship-currency" value={form.currency} maxLength={3} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
        </Field>
        {foreign && (
          <>
            <Field label={`${baseCurrency} per 1 ${form.currency.toUpperCase() || "unit"}`} htmlFor="ship-fx">
              <Input id="ship-fx" inputMode="decimal" value={form.fxRate} onChange={(e) => set("fxRate", e.target.value)} placeholder="1.0850" />
            </Field>
            <Field label="Rate date" htmlFor="ship-fx-date">
              <Input id="ship-fx-date" type="date" value={form.fxRateDate} onChange={(e) => set("fxRateDate", e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Freight total" htmlFor="ship-freight">
          <Input id="ship-freight" inputMode="decimal" value={form.freightTotal} onChange={(e) => set("freightTotal", e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Brokerage total" htmlFor="ship-brokerage">
          <Input id="ship-brokerage" inputMode="decimal" value={form.brokerageTotal} onChange={(e) => set("brokerageTotal", e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Insurance total" htmlFor="ship-insurance">
          <Input id="ship-insurance" inputMode="decimal" value={form.insuranceTotal} onChange={(e) => set("insuranceTotal", e.target.value)} placeholder="0.00" />
        </Field>
        <Field label="Duty total" htmlFor="ship-duty" hint="blank = not on the invoice, use the assumption">
          <Input id="ship-duty" inputMode="decimal" value={form.dutyTotal} onChange={(e) => set("dutyTotal", e.target.value)} placeholder="blank" />
        </Field>
        <Field label="Handling total" htmlFor="ship-handling" hint="blank = use the per-unit assumption">
          <Input id="ship-handling" inputMode="decimal" value={form.handlingTotal} onChange={(e) => set("handlingTotal", e.target.value)} placeholder="blank" />
        </Field>
        <Field label="Source document" htmlFor="ship-doc">
          <Input id="ship-doc" value={form.sourceDocument} onChange={(e) => set("sourceDocument", e.target.value)} placeholder="Invoice no. / file name" />
        </Field>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setPreview(null);
            setDone(null);
          }}
        />
        <Button variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={busy !== null}>
          <FileUp className="size-4" aria-hidden />
          {file ? file.name : "Choose CSV"}
        </Button>
        <RoleButton need="products.manage" variant="secondary" size="sm" onClick={() => void submit("preview")} disabled={busy !== null}>
          {busy === "preview" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          Preview
        </RoleButton>
        <RoleButton need="products.manage" size="sm" onClick={() => void submit("record")} disabled={busy !== null || preview === null || preview.reference_exists === true}>
          {busy === "record" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          Record shipment
        </RoleButton>
        {preview && !done && (
          <span className="text-xs text-muted-foreground">Preview only — nothing is recorded until you confirm.</span>
        )}
      </div>

      {errors.length > 0 && (
        <ul role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-xs text-destructive">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
      {done && (
        <p role="status" className="text-sm text-success">
          {done}
        </p>
      )}

      {preview && (
        <div className="flex flex-col gap-2">
          {preview.reference_exists && (
            <p className="text-xs font-medium text-warning">
              A shipment with reference {preview.reference} is already recorded — delete it first or use a new reference.
            </p>
          )}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Stat label="Lines / units" value={`${formatNumber(preview.lines_count)} / ${formatNumber(preview.units_total)}`} />
            <Stat label={`Invoices (${preview.base_currency})`} value={formatCurrency(preview.invoices_total)} />
            <Stat label="From assumptions" value={formatCurrency(preview.assumed_total)} />
            <Stat label="Landed total" value={formatCurrency(preview.landed_total)} strong />
          </div>
          <div className="overflow-x-auto rounded-md border">
            <table className="w-full min-w-[720px] text-left">
              <thead className="bg-muted/40">
                <tr>
                  <th className={cn(HEAD, "text-left")}>SKU</th>
                  <th className={HEAD}>Qty</th>
                  <th className={HEAD}>Unit ({preview.currency})</th>
                  <th className={HEAD}>Freight</th>
                  <th className={HEAD}>Duty</th>
                  <th className={HEAD}>Brokerage</th>
                  <th className={HEAD}>Insurance</th>
                  <th className={HEAD}>Handling</th>
                  <th className={HEAD}>Shrinkage</th>
                  <th className={HEAD}>Landed / unit</th>
                  <th className={cn(HEAD, "text-left")}>Assumed</th>
                </tr>
              </thead>
              <tbody>
                {preview.lines.map((line) => (
                  <tr key={line.variant_id} className="border-t">
                    <td className={cn(CELL, "text-left font-medium text-foreground")}>{line.sku}</td>
                    <td className={CELL}>{formatNumber(line.quantity)}</td>
                    <td className={CELL}>{line.unit_cost_ccy.toFixed(2)}</td>
                    <td className={CELL}>{line.unit_freight.toFixed(4)}</td>
                    <td className={CELL}>{line.unit_duty.toFixed(4)}</td>
                    <td className={CELL}>{line.unit_brokerage.toFixed(4)}</td>
                    <td className={CELL}>{line.unit_insurance.toFixed(4)}</td>
                    <td className={CELL}>{line.unit_handling.toFixed(4)}</td>
                    <td className={CELL}>{line.unit_shrinkage.toFixed(4)}</td>
                    <td className={cn(CELL, "font-semibold text-foreground")}>{line.total_unit_cost.toFixed(4)}</td>
                    <td className={cn(CELL, "text-left text-muted-foreground")}>{assumedLabel(line.assumed_components)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </Card>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={htmlFor} className={FIELD}>
        {label}
      </Label>
      {children}
      {hint && <span className="text-[10px] leading-tight text-muted-foreground">{hint}</span>}
    </div>
  );
}

function Stat({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="rounded-md border p-2">
      <p className={FIELD}>{label}</p>
      <p className={cn("text-sm tabular-nums", strong ? "font-bold text-foreground" : "font-medium text-foreground")}>{value}</p>
    </div>
  );
}
