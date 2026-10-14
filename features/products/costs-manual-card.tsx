"use client";

import { useEffect, useState } from "react";
import { LoaderCircle, Search } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  assumedLabel,
  describeApiError,
  emptyManualForm,
  manualCostBody,
  validateManualForm,
  type ManualCostForm,
} from "@/lib/costs";
import { costsPaths } from "@/lib/queries/costs";
import { cn } from "@/lib/utils";
import type { ApiCostVariant, ApiLandedRow } from "@/types/costs";
import { formatCurrency, formatDate } from "@/utils/format";

interface Props {
  baseCurrency: string;
  onSaved: () => void;
}

const FIELD = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";
const SEARCH_MIN = 2;
const DEBOUNCE_MS = 250;

/**
 * Enter one variant by hand (SPEC-251 §4): search by SKU or product, pick, fill the
 * per-unit components in the purchase currency, `PUT /costs/variants/{id}`. The
 * response's row is shown back with the assumed components named.
 */
export function CostsManualCard({ baseCurrency, onSaved }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ApiCostVariant[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<ApiCostVariant | null>(null);
  const [form, setForm] = useState<ManualCostForm>(() => emptyManualForm(baseCurrency, today));
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState<ApiLandedRow | null>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < SEARCH_MIN) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearching(true);
      try {
        const response = await fetch(`/api/proxy${costsPaths.variants(term)}`, { signal: controller.signal });
        const body = await response.json().catch(() => null);
        setResults(response.ok && body ? (body.variants as ApiCostVariant[]) : []);
      } catch {
        if (!controller.signal.aborted) setResults([]);
      } finally {
        if (!controller.signal.aborted) setSearching(false);
      }
    }, DEBOUNCE_MS);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [query]);

  const foreign = form.currency.trim().toUpperCase() !== baseCurrency.toUpperCase();

  function set<K extends keyof ManualCostForm>(key: K, value: ManualCostForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(null);
  }

  async function save() {
    if (!picked) return;
    const problems = validateManualForm(form, baseCurrency);
    if (problems.length > 0) {
      setErrors(problems);
      return;
    }
    setBusy(true);
    setErrors([]);
    try {
      const response = await fetch(`/api/proxy/costs/variants/${picked.variant_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(manualCostBody(form, baseCurrency)),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        const shaped = describeApiError(body, `Could not save (${response.status}).`);
        setErrors([shaped.message, ...shaped.rows]);
        return;
      }
      setSaved((body as { row: ApiLandedRow }).row);
      onSaved();
    } catch {
      setErrors(["Could not save — check the connection and try again."]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Enter one variant by hand</h2>
        <p className="text-xs text-muted-foreground">
          For a cost that never came on a shipment. Per unit, in the purchase currency; blank
          duty or handling uses the assumption.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
        <Input
          aria-label="Search variants by SKU or product"
          placeholder="SKU or product name"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < SEARCH_MIN) setResults([]);
            setPicked(null);
            setSaved(null);
          }}
          className="pl-8"
        />
      </div>

      {!picked && query.trim().length >= SEARCH_MIN && (
        <ul className="max-h-56 overflow-y-auto rounded-md border text-sm" aria-busy={searching}>
          {searching && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">Searching…</li>
          )}
          {!searching && results.length === 0 && (
            <li className="px-3 py-2 text-xs text-muted-foreground">No variant matches.</li>
          )}
          {results.map((v) => (
            <li key={v.variant_id}>
              <button
                type="button"
                onClick={() => {
                  setPicked(v);
                  setErrors([]);
                  setForm(emptyManualForm(baseCurrency, today));
                }}
                className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">
                    {v.sku ?? "no SKU"} · {v.product_title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {v.variant_title}
                    {v.vendor ? ` · ${v.vendor}` : ""}
                  </span>
                </span>
                <span className="shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                  <span className="block">
                    Shopify {v.shopify_cost === null ? "—" : formatCurrency(v.shopify_cost)}
                  </span>
                  <span className={cn("block", v.landed ? "text-foreground" : "")}>
                    Landed {v.landed ? formatCurrency(v.landed.total_unit_cost) : "—"}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}

      {picked && (
        <div className="flex flex-col gap-3 rounded-md border p-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {picked.sku ?? "no SKU"} · {picked.product_title}
              </p>
              <p className="text-xs text-muted-foreground">
                Shopify cost {picked.shopify_cost === null ? "none" : formatCurrency(picked.shopify_cost)}
                {picked.landed
                  ? ` · landed ${formatCurrency(picked.landed.total_unit_cost)} from ${formatDate(picked.landed.effective_date)} (${picked.landed.source})`
                  : " · no landed cost yet"}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setPicked(null)}>
              Change
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <F label="Effective from" id="man-date">
              <Input id="man-date" type="date" value={form.effectiveDate} onChange={(e) => set("effectiveDate", e.target.value)} />
            </F>
            <F label="Currency" id="man-ccy">
              <Input id="man-ccy" maxLength={3} value={form.currency} onChange={(e) => set("currency", e.target.value.toUpperCase())} />
            </F>
            {foreign && (
              <F label={`${baseCurrency} per 1 ${form.currency || "unit"}`} id="man-fx">
                <Input id="man-fx" inputMode="decimal" value={form.fxRate} onChange={(e) => set("fxRate", e.target.value)} />
              </F>
            )}
            <F label="Unit cost" id="man-unit">
              <Input id="man-unit" inputMode="decimal" value={form.unitCost} onChange={(e) => set("unitCost", e.target.value)} placeholder="0.00" />
            </F>
            <F label="Freight / unit" id="man-freight">
              <Input id="man-freight" inputMode="decimal" value={form.freight} onChange={(e) => set("freight", e.target.value)} placeholder="0.00" />
            </F>
            <F label="Brokerage / unit" id="man-brokerage">
              <Input id="man-brokerage" inputMode="decimal" value={form.brokerage} onChange={(e) => set("brokerage", e.target.value)} placeholder="0.00" />
            </F>
            <F label="Insurance / unit" id="man-insurance">
              <Input id="man-insurance" inputMode="decimal" value={form.insurance} onChange={(e) => set("insurance", e.target.value)} placeholder="0.00" />
            </F>
            <F label="Duty / unit" id="man-duty">
              <Input id="man-duty" inputMode="decimal" value={form.duty} onChange={(e) => set("duty", e.target.value)} placeholder="blank = assumption" />
            </F>
            <F label="Handling / unit" id="man-handling">
              <Input id="man-handling" inputMode="decimal" value={form.handling} onChange={(e) => set("handling", e.target.value)} placeholder="blank = assumption" />
            </F>
            <F label="Source document" id="man-doc">
              <Input id="man-doc" value={form.sourceDocument} onChange={(e) => set("sourceDocument", e.target.value)} placeholder="Optional" />
            </F>
          </div>
          {errors.length > 0 && (
            <ul role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-2 text-xs text-destructive">
              {errors.map((error) => (
                <li key={error}>{error}</li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <RoleButton need="products.manage" size="sm" onClick={() => void save()} disabled={busy}>
              {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
              Save landed cost
            </RoleButton>
            {saved && (
              <span role="status" className="text-xs text-success">
                Saved: {formatCurrency(saved.total_unit_cost)} per unit from {formatDate(saved.effective_date)} —{" "}
                {assumedLabel(saved.assumed_components)}.
              </span>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function F({ label, id, children }: { label: string; id: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <Label htmlFor={id} className={FIELD}>
        {label}
      </Label>
      {children}
    </div>
  );
}
