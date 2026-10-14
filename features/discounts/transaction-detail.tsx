import { MapPin, Monitor, User, UserRound } from "lucide-react";

import { OrderItemsTable } from "@/features/discounts/order-items-table";
import { formatCurrency, formatPercent } from "@/utils/format";
import type { DiscountTransactionDetail } from "@/types/discounts";

/** Discount-percentage severity → tone (presentation only; mirrors the backend
 * policy thresholds so the visual matches the alert engine). */
function pctTone(pct: number | null): string {
  if (pct === null) return "text-muted-foreground";
  if (pct >= 40) return "text-destructive";
  if (pct >= 25) return "text-warning";
  return "text-foreground";
}

function pctChipCls(pct: number | null): string {
  if (pct === null) return "bg-muted text-muted-foreground";
  if (pct >= 40) return "bg-destructive/10 text-destructive ring-1 ring-destructive/20";
  if (pct >= 25) return "bg-warning/10 text-warning ring-1 ring-warning/20";
  return "bg-muted text-foreground";
}

function Meta({ icon: Icon, label, value }: { icon: typeof MapPin; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

/** One transaction + its discount applications + discounted items (SPEC-098). */
export function TransactionDetailView({ detail }: { detail: DiscountTransactionDetail }) {
  const pct = detail.discount_pct;
  return (
    <div className="space-y-4">
      {/* Hero: original → final + a severity-colored % badge. */}
      <div className="rounded-card bg-card p-5 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Order total after discount</p>
            <div className="mt-1 flex items-baseline gap-3">
              <span className="text-lg tabular-nums text-muted-foreground line-through">
                {formatCurrency(detail.original_value)}
              </span>
              <span className="font-heading text-3xl tracking-wide tabular-nums text-foreground">
                {formatCurrency(detail.final_value)}
              </span>
            </div>
          </div>
          <div className="text-right">
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 font-heading text-2xl tracking-wide tabular-nums ${pctChipCls(pct)}`}
            >
              {pct === null ? "—" : `${formatPercent(pct)} off`}
            </span>
            <p className={`mt-1 text-sm font-medium tabular-nums ${pctTone(pct)}`}>
              −{formatCurrency(detail.discount)}
            </p>
          </div>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-4 border-t border-border pt-4 sm:grid-cols-2 lg:grid-cols-4">
          <Meta icon={MapPin} label="Location" value={detail.location} />
          <Meta icon={Monitor} label="Register" value={detail.device_id ?? "—"} />
          <Meta
            icon={User}
            label="Employee"
            value={detail.staff_name ?? (detail.staff_user_id ? `Staff ${detail.staff_user_id}` : "—")}
          />
          <Meta icon={UserRound} label="Customer" value={detail.customer_name ?? "—"} />
        </div>
      </div>

      {/* Discounts applied. */}
      <div className="rounded-card bg-card p-4 ring-1 ring-foreground/10">
        <h2 className="text-sm font-semibold text-foreground">Discounts applied</h2>
        <ul className="mt-3 divide-y divide-border">
          {detail.applications.map((a, i) => (
            <li key={i} className="flex items-center justify-between gap-3 py-2 text-sm first:pt-0 last:pb-0">
              <span className="flex min-w-0 items-center gap-2">
                <span className="rounded bg-muted px-1.5 py-0.5 text-xs font-medium capitalize text-foreground">
                  {a.type.replace("_", " ")}
                </span>
                {a.reason_captured ? (
                  <span className="truncate text-foreground">“{a.label}”</span>
                ) : (
                  <span className="text-xs italic text-muted-foreground">reason not captured</span>
                )}
              </span>
              <span className="shrink-0 font-medium tabular-nums text-foreground">
                −{formatCurrency(a.amount)}
              </span>
            </li>
          ))}
        </ul>
        {detail.applications.some((a) => !a.reason_captured) ? (
          <p className="mt-3 text-xs text-muted-foreground">
            Some manual discounts have no reason label — enabling a reason prompt in the
            POS would capture one every time.
          </p>
        ) : null}
      </div>

      <OrderItemsTable items={detail.items} orderLevelDiscount={detail.order_level_discount} />
    </div>
  );
}
