"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";

import { Panel } from "@/components/shared/panel";
import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { BranchPicker, useBranchChoice } from "@/features/restaurant-os/branch-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import {
  CHANNEL_NAMES,
  PAYMENT_STATUS_LABELS,
  STAGE_LABELS,
  changeDue,
  describeModifiers,
  paymentLabel,
  refundable,
} from "@/lib/restaurant-os";
import { cn } from "@/lib/utils";
import { payOrder, refundOrder } from "@/services/restaurant-os-actions";
import type { DayOrderRow, OrderDetail } from "@/types/restaurant-os";
import { formatCurrency, formatDateTime, formatTime } from "@/utils/format";

function useRefresh(branchId: number, orderId: number) {
  const queryClient = useQueryClient();
  return async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "order", orderId] }),
      queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "day-orders", branchId] }),
      queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "cash", branchId] }),
    ]);
  };
}

function TakePayment({ order, onDone }: { order: OrderDetail; onDone: () => Promise<void> }) {
  const [given, setGiven] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const change = given.trim() ? changeDue(order.total, given) : null;
  const take = async (method: "cash" | "card_present") => {
    setBusy(true);
    setError(null);
    try {
      await payOrder(order.id, { method, amountTendered: method === "cash" && given.trim() ? Number(given) : null });
      setGiven("");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Taking the payment failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-sm font-semibold text-foreground">Take payment · {formatCurrency(order.total)}</p>
      <div className="flex flex-wrap items-center gap-2">
        <Input value={given} onChange={(e) => setGiven(e.target.value)} placeholder="Cash given" aria-label="Cash given" inputMode="decimal" className="max-w-[160px]" />
        <span className="text-sm tabular-nums text-muted-foreground" aria-live="polite">
          {given.trim() ? (change == null ? "Not enough" : `Change ${formatCurrency(change)}`) : null}
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <RoleButton need={["orders.take"]} size="sm" disabled={busy || (given.trim() !== "" && change == null)} onClick={() => void take("cash")}>
          Paid cash
        </RoleButton>
        <RoleButton need={["orders.take"]} size="sm" variant="outline" disabled={busy} onClick={() => void take("card_present")}>
          Paid card
        </RoleButton>
      </div>
      <FormError message={error} />
    </div>
  );
}

function Refund({ order, onDone }: { order: OrderDetail; onDone: () => Promise<void> }) {
  const left = refundable(order);
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (left <= 0) return null;
  const value = Number(amount);
  const valid = amount.trim() !== "" && Number.isFinite(value) && value > 0 && value <= left + 1e-9 && reason.trim() !== "";
  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await refundOrder(order.id, value, reason.trim());
      setAmount("");
      setReason("");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The refund failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2 rounded-xl border border-border p-3">
      <p className="text-sm font-semibold text-foreground">Refund · up to {formatCurrency(left)}</p>
      <p className="text-xs text-muted-foreground">
        A card paid online goes back to the guest&apos;s card through Stripe; cash comes out of today&apos;s drawer; a card taken at the
        counter is refunded on the card terminal and recorded here.
      </p>
      <div className="flex flex-wrap gap-2">
        <Input value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" aria-label="Refund amount" inputMode="decimal" className="max-w-[120px]" />
        <Button size="sm" variant="ghost" onClick={() => setAmount(left.toFixed(2))}>
          All
        </Button>
        <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why" aria-label="Refund reason" maxLength={255} className="min-w-[160px] flex-1" />
      </div>
      <RoleButton need={["orders.refund"]} size="sm" variant="outline" disabled={busy || !valid} onClick={() => void send()}>
        {busy ? "Refunding…" : "Refund"}
      </RoleButton>
      <FormError message={error} />
    </div>
  );
}

function Detail({ branchId, orderId, onClose }: { branchId: number; orderId: number; onClose: () => void }) {
  const detail = useApiQuery(restaurantQueries.orderDetail(orderId));
  const refresh = useRefresh(branchId, orderId);
  if (detail.isError) return <QueryErrorState error={detail.error} onRetry={() => void detail.refetch()} />;
  if (!detail.data) return <RestaurantSkeleton tiles={0} />;
  const o = detail.data;
  return (
    <Panel
      title={`Order #${o.orderNumber}`}
      aside={
        <Button size="icon" variant="ghost" onClick={onClose} aria-label="Close the order">
          <X aria-hidden />
        </Button>
      }
    >
      <div className="space-y-3 p-4">
        <p className="text-sm text-muted-foreground">
          {CHANNEL_NAMES[o.channel]} · {STAGE_LABELS[o.stage]} · {o.customerName ?? "Walk-in"}
          {o.cancelReason ? ` · cancelled: ${o.cancelReason}` : ""}
        </p>
        <ul className="space-y-1 text-sm">
          {o.lines.map((line, i) => (
            <li key={i} className="flex justify-between gap-2">
              <span>
                <span className="font-semibold tabular-nums">{line.quantity}×</span> {line.name}
                {line.modifiers.length ? <span className="block text-xs text-muted-foreground">{describeModifiers(line.modifiers)}</span> : null}
              </span>
              <span className="tabular-nums">{formatCurrency(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <dl className="grid grid-cols-2 gap-x-4 gap-y-1 border-t border-border pt-2 text-sm tabular-nums">
          <dt className="text-muted-foreground">Total</dt>
          <dd className="text-right font-semibold">{formatCurrency(o.total)}</dd>
          {o.refundTotal > 0 ? (
            <>
              <dt className="text-muted-foreground">Refunded</dt>
              <dd className="text-right">−{formatCurrency(o.refundTotal)}</dd>
            </>
          ) : null}
          <dt className="text-muted-foreground">Payment</dt>
          <dd className="text-right">{PAYMENT_STATUS_LABELS[o.paymentStatus ?? ""] ?? "—"}</dd>
        </dl>
        {o.payments.length ? (
          <ul className="space-y-1 text-xs text-muted-foreground">
            {o.payments.map((p) => (
              <li key={p.id} className="flex justify-between gap-2">
                <span>
                  {paymentLabel(p.method)} · {p.status.replace(/_/g, " ")}
                  {p.tendered != null ? ` · given ${formatCurrency(p.tendered)}, change ${formatCurrency(p.changeDue ?? 0)}` : ""}
                </span>
                <span className="tabular-nums">{formatCurrency(p.amount)}</span>
              </li>
            ))}
            {o.refunds.map((r) => (
              <li key={`r${r.id}`} className="flex justify-between gap-2">
                <span>
                  Refund · {r.reason}
                  {r.createdAt ? ` · ${formatDateTime(r.createdAt)}` : ""}
                </span>
                <span className="tabular-nums">−{formatCurrency(r.amount)}</span>
              </li>
            ))}
          </ul>
        ) : null}
        {o.paymentStatus === "unpaid" && o.stage !== "cancelled" && o.stage !== "awaiting_payment" ? <TakePayment order={o} onDone={refresh} /> : null}
        <Refund order={o} onDone={refresh} />
      </div>
    </Panel>
  );
}

function Row({ row, selected, onSelect }: { row: DayOrderRow; selected: boolean; onSelect: () => void }) {
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={cn(
          "flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring",
          selected ? "bg-muted/60" : "",
        )}
      >
        <span className="min-w-0">
          <span className="text-sm font-semibold tabular-nums text-foreground">#{row.orderNumber ?? "—"}</span>{" "}
          <span className="text-sm text-foreground">{row.customerName ?? "Walk-in"}</span>
          <span className="block text-xs text-muted-foreground">
            {row.placedAt ? formatTime(row.placedAt) : "—"} · {CHANNEL_NAMES[row.channel]} · {row.stage ? STAGE_LABELS[row.stage] : row.status}
          </span>
        </span>
        <span className="flex items-center gap-2">
          {row.refundTotal > 0 ? <Badge variant="outline">−{formatCurrency(row.refundTotal)}</Badge> : null}
          <Badge variant="outline">{PAYMENT_STATUS_LABELS[row.paymentStatus ?? ""] ?? "—"}</Badge>
          <span className="text-sm font-semibold tabular-nums">{formatCurrency(row.total)}</span>
        </span>
      </button>
    </li>
  );
}

/** Order Taking › Orders (SPEC-380): the branch's day — find an order, take its payment, refund it. */
export function PosOrders() {
  const { branches, branch, loading, error: branchError } = useBranchChoice();
  const [date, setDate] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState<string | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const list = useApiQuery(branch ? restaurantQueries.dayOrders(branch.id, date || null, query) : null, { refetchInterval: 30_000 });
  if (branchError) return <QueryErrorState error={branchError} onRetry={() => window.location.reload()} />;
  if (loading) return <RestaurantSkeleton tiles={0} />;
  if (!branch) return <EmptyPanel title="No branch to look at" body="Your access covers no open branch." />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end gap-3">
        <BranchPicker branches={branches} branch={branch} />
        <div className="space-y-1">
          <Label htmlFor="pos-orders-date" className="text-xs text-muted-foreground">
            Business day
          </Label>
          <Input id="pos-orders-date" type="date" value={date || list.data?.date || ""} onChange={(e) => setDate(e.target.value)} className="h-9 w-[160px]" />
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setQuery(search.trim() || null);
          }}
        >
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Order #, phone or name" aria-label="Search orders" className="h-9 w-[220px]" />
          <Button type="submit" variant="outline" size="icon" aria-label="Search">
            <Search aria-hidden />
          </Button>
        </form>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_420px]">
        {list.isError ? (
          <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : !list.data ? (
          <RestaurantSkeleton tiles={0} />
        ) : list.data.orders.length === 0 ? (
          <EmptyPanel title={query ? "No order matches" : "No orders that day"} body="Orders taken at the counter, on the phone and online appear here." />
        ) : (
          <Panel title="Orders" count={String(list.data.orders.length)}>
            <ul className="divide-y divide-border">
              {list.data.orders.map((row) => (
                <Row key={row.id} row={row} selected={selected === row.id} onSelect={() => setSelected(row.id)} />
              ))}
            </ul>
          </Panel>
        )}
        {selected != null ? (
          <Detail branchId={branch.id} orderId={selected} onClose={() => setSelected(null)} />
        ) : (
          <p className="hidden text-sm text-muted-foreground lg:block">Pick an order to see its payments, take a payment or refund it.</p>
        )}
      </div>
    </div>
  );
}
