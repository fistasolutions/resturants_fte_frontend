"use client";

import { useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { describeApiError } from "@/lib/costs";
import type { ApiCostAssumptions } from "@/types/costs";

interface Props {
  assumptions: ApiCostAssumptions;
  onSaved: () => void;
}

const FIELD = "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

interface DutyRow {
  type: string;
  rate: string;
}

/**
 * The standing assumptions (SPEC-251 §5): shrinkage, inbound handling per unit,
 * default duty and duty by product type — what the engine uses when an invoice
 * does not carry the figure. Applies to what is recorded from now on, never to a
 * lot already recorded.
 */
export function CostsAssumptionsCard({ assumptions, onSaved }: Props) {
  const [shrinkage, setShrinkage] = useState(String(assumptions.shrinkage_rate_pct));
  const [handling, setHandling] = useState(String(assumptions.handling_per_unit));
  const [duty, setDuty] = useState(String(assumptions.default_duty_rate_pct));
  const [rows, setRows] = useState<DutyRow[]>(() =>
    Object.entries(assumptions.duty_rates_by_type).map(([type, rate]) => ({ type, rate: String(rate) })),
  );
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  function setRow(index: number, patch: Partial<DutyRow>) {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
    setNote(null);
  }

  async function save() {
    const byType: Record<string, number> = {};
    for (const row of rows) {
      const type = row.type.trim();
      if (!type) continue;
      const rate = Number(row.rate);
      if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
        setNote({ tone: "error", text: `Duty rate for "${type}" must be 0–100.` });
        return;
      }
      byType[type] = rate;
    }
    const body = {
      shrinkage_rate_pct: Number(shrinkage) || 0,
      handling_per_unit: Number(handling) || 0,
      default_duty_rate_pct: Number(duty) || 0,
      duty_rates_by_type: byType,
    };
    setBusy(true);
    setNote(null);
    try {
      const response = await fetch("/api/proxy/costs/assumptions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setNote({ tone: "error", text: describeApiError(data, `Could not save (${response.status}).`).message });
        return;
      }
      setNote({ tone: "ok", text: "Saved — applies to shipments and entries recorded from now on." });
      onSaved();
    } catch {
      setNote({ tone: "error", text: "Could not save — check the connection and try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="gap-3 p-4">
      <div>
        <h2 className="text-sm font-semibold text-foreground">Assumptions</h2>
        <p className="text-xs text-muted-foreground">
          Used only where an invoice carries no figure, and always named on the line as
          an assumption. Base currency: <span className="font-medium text-foreground">{assumptions.base_currency}</span>.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <Label htmlFor="asm-shrinkage" className={FIELD}>
            Shrinkage %
          </Label>
          <Input id="asm-shrinkage" inputMode="decimal" value={shrinkage} onChange={(e) => { setShrinkage(e.target.value); setNote(null); }} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="asm-handling" className={FIELD}>
            Handling / unit
          </Label>
          <Input id="asm-handling" inputMode="decimal" value={handling} onChange={(e) => { setHandling(e.target.value); setNote(null); }} />
        </div>
        <div className="flex flex-col gap-1">
          <Label htmlFor="asm-duty" className={FIELD}>
            Default duty %
          </Label>
          <Input id="asm-duty" inputMode="decimal" value={duty} onChange={(e) => { setDuty(e.target.value); setNote(null); }} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className={FIELD}>Duty % by product type</span>
          <Button variant="ghost" size="sm" onClick={() => setRows((prev) => [...prev, { type: "", rate: "" }])}>
            <Plus className="size-4" aria-hidden />
            Add type
          </Button>
        </div>
        {rows.length === 0 && (
          <p className="text-[11px] text-muted-foreground">No per-type rates — every product uses the default.</p>
        )}
        {rows.map((row, index) => (
          <div key={index} className="flex items-center gap-2">
            <Input
              aria-label="Product type"
              placeholder="Product type (as in Shopify)"
              value={row.type}
              onChange={(e) => setRow(index, { type: e.target.value })}
              className="min-w-0 flex-1"
            />
            <Input
              aria-label="Duty rate percent"
              placeholder="%"
              inputMode="decimal"
              value={row.rate}
              onChange={(e) => setRow(index, { rate: e.target.value })}
              className="w-20"
            />
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={`Remove ${row.type || "row"}`}
              onClick={() => setRows((prev) => prev.filter((_, i) => i !== index))}
            >
              <X className="size-3.5" aria-hidden />
            </Button>
          </div>
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <RoleButton need="products.manage" size="sm" onClick={() => void save()} disabled={busy}>
          {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          Save assumptions
        </RoleButton>
        {note && (
          <span role={note.tone === "error" ? "alert" : "status"} className={note.tone === "error" ? "text-xs text-destructive" : "text-xs text-success"}>
            {note.text}
          </span>
        )}
      </div>
    </Card>
  );
}
