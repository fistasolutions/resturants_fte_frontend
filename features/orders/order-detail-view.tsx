import Image from "next/image";
import { PackageX } from "lucide-react";

import { Card } from "@/components/ui/card";
import type { OrderDetail } from "@/types/orders";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

function statusBadge(label: string, tone: "success" | "warning" | "destructive" | "muted") {
  const cls = {
    success: "bg-success/10 text-success border-success/20",
    warning: "bg-warning/10 text-warning border-warning/20",
    destructive: "bg-destructive/10 text-destructive border-destructive/20",
    muted: "bg-muted text-muted-foreground border-border",
  }[tone];
  return (
    <span
      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-bold tracking-wider uppercase border ${cls}`}
    >
      {label}
    </span>
  );
}

function fulfillmentTone(status: string | null): "success" | "warning" | "destructive" {
  if (status === "fulfilled") return "success";
  if (status === "partial") return "warning";
  return "destructive";
}

function financialTone(status: string): "success" | "warning" | "destructive" | "muted" {
  if (status === "paid") return "success";
  if (status === "refunded" || status === "voided") return "destructive";
  if (status === "partially_refunded") return "warning";
  return "muted";
}

/** Full order detail (SPEC-061, backend SPEC-055) — the `/orders/[id]` page's content. */
export function OrderDetailView({ detail }: { detail: OrderDetail }) {
  return (
    <div className="space-y-6">
      {/* Status + channel/location */}
      <div className="flex flex-wrap items-center gap-2">
        {statusBadge(detail.financialStatus, financialTone(detail.financialStatus))}
        {statusBadge(
          detail.fulfillmentStatus ?? "unfulfilled",
          fulfillmentTone(detail.fulfillmentStatus),
        )}
        <span className="text-sm text-muted-foreground">
          {detail.locationName ?? "Online"}
          {detail.sourceName ? ` · ${detail.sourceName}` : ""}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Main column: items + refunds */}
        <div className="space-y-6 lg:col-span-2">
          <Card className="gap-0 p-0">
            <div className="border-b border-border px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Items ({detail.lineItems.length})
              </p>
            </div>
            <div className="divide-y divide-border">
              {detail.lineItems.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-4">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="size-14 shrink-0 rounded-md border border-border object-cover"
                    />
                  ) : (
                    <div className="flex size-14 shrink-0 items-center justify-center rounded-md border border-border bg-muted text-muted-foreground">
                      <PackageX className="size-5" aria-hidden />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.title}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[item.variantTitle, item.sku].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm tabular-nums text-foreground">
                      {item.quantity} × {formatCurrency(item.price)}
                    </p>
                    {item.totalDiscount > 0 && (
                      <p className="text-xs tabular-nums text-muted-foreground">
                        −{formatCurrency(item.totalDiscount)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {detail.refunds.length > 0 && (
            <Card className="gap-0 p-0">
              <div className="border-b border-border px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                  Refunds
                </p>
              </div>
              <div className="divide-y divide-border">
                {detail.refunds.map((refund) => (
                  <div key={refund.id} className="flex items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <p className="text-sm text-foreground">{refund.note || "Refund"}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(refund.createdAt)} · {formatTime(refund.createdAt)}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold tabular-nums text-destructive">
                      −{formatCurrency(refund.totalRefunded)}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar: totals + discounts + customer */}
        <div className="space-y-6">
          <Card className="gap-3 p-5">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Summary
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="tabular-nums text-foreground">
                  {formatCurrency(detail.subtotalPrice)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Discounts</span>
                <span className="tabular-nums text-foreground">
                  −{formatCurrency(detail.totalDiscounts)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tax</span>
                <span className="tabular-nums text-foreground">
                  {formatCurrency(detail.totalTax)}
                </span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 font-semibold">
                <span className="text-foreground">Total</span>
                <span className="tabular-nums text-foreground">
                  {formatCurrency(detail.totalPrice)}
                </span>
              </div>
            </div>

            {detail.discountCodes.length > 0 && (
              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                {detail.discountCodes.map((dc) => (
                  <span
                    key={dc.code}
                    className="inline-flex items-center gap-1 rounded bg-ai/10 px-2 py-0.5 text-xs font-semibold text-ai"
                  >
                    {dc.code}
                    {dc.amount !== null &&
                      (dc.valueType === "percentage"
                        ? ` −${dc.amount}%`
                        : ` −${formatCurrency(dc.amount)}`)}
                  </span>
                ))}
              </div>
            )}
          </Card>

          {detail.customer && (
            <Card className="gap-1 p-5">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                Customer
              </p>
              <p className="text-sm font-medium text-foreground">
                {detail.customer.name ?? "Guest"}
              </p>
              {detail.customer.email && (
                <p className="text-xs text-muted-foreground">{detail.customer.email}</p>
              )}
              <p className="mt-2 text-xs text-muted-foreground">
                {detail.customer.ordersCount} order{detail.customer.ordersCount === 1 ? "" : "s"} ·{" "}
                {formatCurrency(detail.customer.totalSpent)} lifetime
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
