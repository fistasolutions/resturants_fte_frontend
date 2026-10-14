"use client";

import { useMemo, useState } from "react";
import { ArrowRight, Check, Mail, Package } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import type { DeadInventoryAlert, DeadInventorySendResult } from "@/types/analysis";
import { formatCurrency, formatNumber, storeTimeZone } from "@/utils/format";

function formatIdleLong(days: number | null): string {
  if (days === null) return "No recorded sale here";
  if (days === 0) return "Sold today, now idle";
  return `${formatNumber(days)}d since last sale here`;
}

function formatSentLong(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const sameDay =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate();
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: storeTimeZone(),
  });
  if (sameDay) return `today at ${time}`;
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: storeTimeZone(),
  });
}

/** Best destination = the highest-selling location among the "selling elsewhere" set. */
function bestDestination(alert: DeadInventoryAlert) {
  return alert.selling_elsewhere.reduce<(typeof alert.selling_elsewhere)[number] | null>(
    (best, e) => (best === null || e.units_sold > best.units_sold ? e : best),
    null,
  );
}

async function sendAlert(
  productId: number,
  locationId: number,
): Promise<DeadInventorySendResult> {
  const res = await fetch("/api/proxy/analysis/inventory/dead-inventory-alerts/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product_id: productId, location_id: locationId }),
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.error?.message ?? `Could not send (${res.status}).`;
    throw new Error(message);
  }
  return body as DeadInventorySendResult;
}

function totalUnits(alert: DeadInventoryAlert): number {
  if (alert.size_breakdown.length === 0) return alert.stock;
  return alert.size_breakdown.reduce((sum, s) => sum + s.units, 0);
}

interface DeadInventoryDetailProps {
  alert: DeadInventoryAlert;
  windowDays: number;
}

export function DeadInventoryDetail({
  alert: initialAlert,
  windowDays,
}: DeadInventoryDetailProps) {
  const [alert, setAlert] = useState(initialAlert);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const top = bestDestination(alert);
  const toMove = totalUnits(alert);
  // Highest-impact sizes first — the backend doesn't guarantee an order.
  const sortedSizes = useMemo(
    () => [...alert.size_breakdown].sort((a, b) => b.units - a.units),
    [alert.size_breakdown],
  );

  async function handleSend() {
    if (alert.sent || sending) return;
    setSending(true);
    setError(null);
    try {
      const result = await sendAlert(alert.product_id, alert.location_id);
      if (!result.email_sent) {
        setError(result.email_error ?? "Send did not go through — try again.");
      } else {
        setAlert((prev) => ({ ...prev, sent: true, sent_at: new Date().toISOString() }));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send — try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Image-led hero: product on the left, decision context on the right. */}
      <section className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
        <div className="grid lg:grid-cols-[minmax(20rem,2fr)_minmax(0,3fr)]">
          <div className="relative min-h-80 overflow-hidden border-b border-border bg-muted lg:min-h-[32rem] lg:border-b-0 lg:border-r">
            {alert.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={alert.image_url}
                alt={alert.title}
                className="absolute inset-0 size-full object-contain p-4"
              />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <Package className="size-10" aria-hidden />
                <p className="text-sm">Product image unavailable</p>
              </div>
            )}
          </div>

          <div className="flex min-w-0 flex-col p-4 sm:p-6">
            <div className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <Badge
                  variant="outline"
                  className="border-warning/30 font-normal text-warning"
                >
                  Misplaced stock opportunity
                </Badge>
                <h1 className="mt-3 font-heading text-3xl tracking-wide text-foreground">
                  {alert.title}
                </h1>
                <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                  This style has stock at {alert.location_name} but recorded no sales
                  there in the last {formatNumber(windowDays)} days, while demand exists
                  at another location.
                </p>
              </div>

              <div className="flex shrink-0 flex-col items-start gap-2 sm:items-end">
                {alert.sent ? (
                  <>
                    <span className="flex items-center gap-2 text-xs font-medium text-success">
                      <Check className="size-4" aria-hidden />
                      Sent to {alert.location_name}&apos;s manager
                    </span>
                    <p className="text-xs text-muted-foreground">
                      {formatSentLong(alert.sent_at)}
                    </p>
                  </>
                ) : (
                  <>
                    <RoleButton
                      need={["messages.send", "inventory.view"]}
                      size="sm"
                      disabled={sending}
                      onClick={handleSend}
                    >
                      <Mail aria-hidden />
                      {sending ? "Sending…" : `Send to ${alert.location_name}'s manager`}
                    </RoleButton>
                    {error ? (
                      <p className="max-w-48 text-xs text-destructive sm:text-right">
                        {error}
                      </p>
                    ) : null}
                  </>
                )}
              </div>
            </div>

            <div className="border-b border-border py-6">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Recommended transfer
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <div>
                  <p className="text-xs text-muted-foreground">Move from</p>
                  <p className="font-semibold text-warning">{alert.location_name}</p>
                </div>
                <div className="flex size-8 items-center justify-center rounded-full bg-muted">
                  <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Best destination</p>
                  <p className="font-semibold text-success">
                    {top === null ? "Selling location" : top.location_name}
                  </p>
                </div>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {top === null
                  ? "No destination sales are available for this window."
                  : `${formatNumber(top.units_sold)} units sold there in the last ${formatNumber(windowDays)} days.`}
              </p>
            </div>

            <dl className="grid grid-cols-2 border-b border-border py-2 sm:grid-cols-4">
              <div className="border-b border-r border-border p-3 sm:border-b-0">
                <dt className="text-xs text-muted-foreground">Stock here</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatNumber(alert.stock)}
                </dd>
              </div>
              <div className="border-b border-border p-3 sm:border-b-0 sm:border-r">
                <dt className="text-xs text-muted-foreground">Stuck value</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-warning">
                  {formatCurrency(alert.stock_value)}
                </dd>
              </div>
              <div className="border-r border-border p-3">
                <dt className="text-xs text-muted-foreground">Sales gap</dt>
                <dd className="mt-1 text-lg font-semibold tabular-nums text-foreground">
                  {formatNumber(alert.sales_gap)}
                </dd>
              </div>
              <div className="p-3">
                <dt className="text-xs text-muted-foreground">Last sale here</dt>
                <dd className="mt-1 text-sm font-semibold text-foreground">
                  {formatIdleLong(alert.days_since_last_sale)}
                </dd>
              </div>
            </dl>

            <div className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-foreground">
                    Selling elsewhere
                  </h2>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Demand by location over the last {formatNumber(windowDays)} days
                  </p>
                </div>
                <Badge variant="secondary" className="font-normal">
                  {formatNumber(alert.selling_elsewhere.length)} locations
                </Badge>
              </div>

              <div className="mt-3 divide-y divide-border rounded-table border border-border">
                {alert.selling_elsewhere.length === 0 ? (
                  <p className="p-3 text-sm text-muted-foreground">
                    No selling locations are available for this window.
                  </p>
                ) : (
                  alert.selling_elsewhere.map((location) => (
                    <div
                      key={location.location_id}
                      className="flex items-center justify-between gap-4 px-3 py-2"
                    >
                      <span className="text-sm font-medium text-foreground">
                        {location.location_name}
                      </span>
                      <span className="text-sm tabular-nums text-success">
                        {formatNumber(location.units_sold)} units sold
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Full-width operational table, visually separate from product context. */}
      <section className="overflow-hidden rounded-card bg-card ring-1 ring-foreground/10">
        <div className="border-b border-border px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-semibold text-foreground">Sizes to move</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Complete variant breakdown at {alert.location_name}
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              {formatNumber(alert.size_breakdown.length)} size
              {alert.size_breakdown.length === 1 ? "" : "s"} · {formatNumber(toMove)} units total
            </p>
          </div>
        </div>

        {alert.size_breakdown.length === 0 ? (
          <div className="px-4 py-6 sm:px-6">
            <p className="text-sm text-muted-foreground">
              No variant-level stock recorded — the {formatNumber(alert.stock)} unit
              {alert.stock === 1 ? "" : "s"} to move are untracked by size at{" "}
              {alert.location_name}.
            </p>
          </div>
        ) : (
          <>
            {/* Capped height + sticky header: 49 sizes shouldn't force the
                whole page to scroll past the point. Sorted highest-units
                first so the sizes worth moving most are seen without
                scrolling at all. */}
            <div className="max-h-96 overflow-auto px-4 sm:px-6">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border bg-card text-left">
                    <th
                      scope="col"
                      className="sticky top-0 bg-card py-3 pr-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      Size
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 bg-card py-3 pr-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      SKU
                    </th>
                    <th
                      scope="col"
                      className="sticky top-0 bg-card py-3 pr-0 text-right text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                    >
                      Units stuck
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedSizes.map((size, i) => (
                    <tr
                      key={`${size.sku ?? size.variant_title}-${i}`}
                      className="border-b border-border/60 last:border-0 transition-colors hover:bg-muted/40"
                    >
                      <td className="py-2 pr-4 font-medium text-foreground">
                        {size.variant_title}
                      </td>
                      <td className="py-2 pr-4 text-xs text-muted-foreground">
                        {size.sku ?? "—"}
                      </td>
                      <td className="py-2 pr-0 text-right tabular-nums text-foreground">
                        {formatNumber(size.units)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* Fixed total — outside the scroll area, always visible. */}
            <div className="flex items-center justify-between border-t border-border bg-muted/30 px-4 py-3 sm:px-6">
              <p className="text-sm font-semibold text-foreground">Total to move</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {formatNumber(toMove)} units
              </p>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
