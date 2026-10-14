"use client";

import { useState } from "react";
import { LoaderCircle, RefreshCw, Trash2 } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { describeApiError, rateLabel } from "@/lib/costs";
import { cn } from "@/lib/utils";
import type { ApiCostShipment, ApiRefreshResult } from "@/types/costs";
import { formatCurrency, formatDate, formatNumber } from "@/utils/format";

interface Props {
  shipments: ApiCostShipment[];
  baseCurrency: string;
  onChanged: () => void;
}

const HEAD =
  "px-3 py-2 text-right text-[11px] font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap";
const CELL = "px-3 py-2.5 text-right text-sm tabular-nums whitespace-nowrap";

const METHOD_LABEL: Record<string, string> = { value: "value", units: "units", weight: "weight" };

/**
 * The latest shipments (SPEC-251 §7) with a confirmed delete, and the repair action
 * that re-resolves every order line on the store (`POST /costs/refresh`).
 */
export function CostsShipmentsTable({ shipments, baseCurrency, onChanged }: Props) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshNote, setRefreshNote] = useState<string | null>(null);

  async function refreshAll() {
    setRefreshing(true);
    setRefreshNote(null);
    try {
      const response = await fetch("/api/proxy/costs/refresh", { method: "POST" });
      const body = await response.json().catch(() => null);
      if (!response.ok) {
        setRefreshNote(describeApiError(body, `Could not re-resolve (${response.status}).`).message);
        return;
      }
      const result = body as ApiRefreshResult;
      setRefreshNote(
        `${formatNumber(result.lines_updated)} order lines changed in ${(result.elapsed_ms / 1000).toFixed(1)} s.`,
      );
      onChanged();
    } catch {
      setRefreshNote("Could not re-resolve — check the connection and try again.");
    } finally {
      setRefreshing(false);
    }
  }

  return (
    <Card className="gap-3 p-0">
      <div className="flex flex-wrap items-start justify-between gap-2 px-4 pt-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">Shipments</h2>
          <p className="text-xs text-muted-foreground">
            The latest {formatNumber(shipments.length)} recorded. Deleting one removes its
            rows and re-costs the affected order lines.
          </p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <RoleButton need="products.manage" variant="outline" size="sm" onClick={() => void refreshAll()} disabled={refreshing}>
            {refreshing ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <RefreshCw className="size-4" aria-hidden />
            )}
            Re-resolve all lines
          </RoleButton>
          <span className="text-[10px] text-muted-foreground">
            A repair action — about a minute on a large store.
          </span>
          {refreshNote && (
            <span role="status" className="text-xs text-muted-foreground">
              {refreshNote}
            </span>
          )}
        </div>
      </div>

      {shipments.length === 0 ? (
        <p className="px-4 pb-4 text-sm text-muted-foreground">
          No shipment recorded yet. Every margin still reads Shopify&apos;s unit cost.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead className="border-t bg-muted/40">
              <tr>
                <th className={cn(HEAD, "text-left")}>Reference</th>
                <th className={cn(HEAD, "text-left")}>Supplier</th>
                <th className={cn(HEAD, "text-left")}>Received</th>
                <th className={cn(HEAD, "text-left")}>Currency</th>
                <th className={cn(HEAD, "text-left")}>Allocated by</th>
                <th className={HEAD}>Lines</th>
                <th className={HEAD}>Units</th>
                <th className={HEAD}>Invoices</th>
                <th className={HEAD}>Assumed</th>
                <th className={HEAD}>Landed</th>
                <th className={HEAD} aria-label="Actions" />
              </tr>
            </thead>
            <tbody>
              {shipments.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className={cn(CELL, "text-left font-medium text-foreground")}>{s.reference}</td>
                  <td className={cn(CELL, "text-left text-muted-foreground")}>{s.supplier ?? "—"}</td>
                  <td className={cn(CELL, "text-left")}>{formatDate(s.received_date)}</td>
                  <td className={cn(CELL, "text-left")}>{rateLabel(s.currency, baseCurrency, s.fx_rate)}</td>
                  <td className={cn(CELL, "text-left text-muted-foreground")}>{METHOD_LABEL[s.allocation_method] ?? s.allocation_method}</td>
                  <td className={CELL}>{formatNumber(s.lines_count)}</td>
                  <td className={CELL}>{formatNumber(s.units_total)}</td>
                  <td className={CELL}>{formatCurrency(s.invoices_total)}</td>
                  <td className={cn(CELL, "text-muted-foreground")}>{formatCurrency(s.assumed_total)}</td>
                  <td className={cn(CELL, "font-semibold text-foreground")}>{formatCurrency(s.landed_total)}</td>
                  <td className={cn(CELL, "w-10")}>
                    <DeleteShipment shipment={s} onDeleted={onChanged} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

function DeleteShipment({ shipment, onDeleted }: { shipment: ApiCostShipment; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/proxy/costs/shipments/${shipment.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(describeApiError(body, `Could not delete (${response.status}).`).message);
      }
      setOpen(false);
      onDeleted();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not delete — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <AlertDialog
      open={open}
      onOpenChange={(next) => {
        if (busy) return;
        setOpen(next);
        if (!next) setError(null);
      }}
    >
      <RoleGate need="products.manage">
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={`Delete shipment ${shipment.reference}`}
            className="shrink-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-3.5" aria-hidden />
          </Button>
        </AlertDialogTrigger>
      </RoleGate>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete shipment {shipment.reference}?</AlertDialogTitle>
          <AlertDialogDescription>
            Its {formatNumber(shipment.lines_count)} landed-cost rows go with it and the order
            lines they priced fall back to the next cost in force — or to Shopify&apos;s unit
            cost. Nothing in Shopify is touched.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={busy}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {busy ? "Deleting…" : "Delete shipment"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
