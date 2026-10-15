"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Bike, Clock, Copy, Link2, UserPlus, X } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { BranchPicker, useBranchChoice } from "@/features/restaurant-os/branch-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import {
  CHANNEL_NAMES,
  KITCHEN_COLUMNS,
  describeModifiers,
  isLate,
  minutesSince,
  needsTender,
  nextStage,
} from "@/lib/restaurant-os";
import { formatCodeInput, isCompleteCode } from "@/lib/loyalty";
import { cn } from "@/lib/utils";
import {
  addDriver,
  advanceOrder,
  cancelOrder,
  dispatchOrder,
  dispatchRun,
  issueDriverLink,
  revokeDriverLink,
  updateDriver,
} from "@/services/restaurant-os-actions";
import { GeoMap, type MapMarker, type MapPolygon } from "@/features/restaurant-os/geo-map";
import { ageLabel, formatKm, isFresh } from "@/lib/geo-map";
import type { Driver, KitchenBoard, NativeOrder, OrderStage } from "@/types/restaurant-os";
import { formatCurrency, formatTime } from "@/utils/format";

export type KitchenTab = "kitchen" | "dispatch" | "drivers";

function useActions(branchId: number) {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const run = async (work: () => Promise<unknown>) => {
    setError(null);
    try {
      await work();
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "board", branchId] });
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "drivers", branchId] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    }
  };
  return { error, run };
}

/** Finishing with a gift card at the door: the code, then the move (SPEC-383). */
function GiftCardFinish({ order, to, onRun }: { order: NativeOrder; to: OrderStage; onRun: (work: () => Promise<unknown>) => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  if (!open) {
    return (
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        Gift card
      </Button>
    );
  }
  return (
    <span className="flex w-full gap-1.5">
      <Input value={code} onChange={(e) => setCode(formatCodeInput(e.target.value))} placeholder="Card code" aria-label="Gift card code" className="h-8" autoComplete="off" />
      <Button size="sm" disabled={!isCompleteCode(code)} onClick={() => void onRun(() => advanceOrder(order.id, to, { method: "gift_card", code }))}>
        Paid
      </Button>
    </span>
  );
}

/** Finishing an order: one button, or — when the money is still owed — how it was paid. */
function FinishButtons({
  order,
  to,
  label,
  variant = "default",
  onRun,
}: {
  order: NativeOrder;
  to: OrderStage;
  label: string;
  variant?: "default" | "outline";
  onRun: (work: () => Promise<unknown>) => Promise<void>;
}) {
  if (!needsTender(order, to)) {
    return (
      <Button size="sm" variant={variant} onClick={() => void onRun(() => advanceOrder(order.id, to))}>
        {label}
      </Button>
    );
  }
  return (
    <>
      <Button size="sm" variant={variant} onClick={() => void onRun(() => advanceOrder(order.id, to, { method: "cash" }))}>
        {label} · paid cash
      </Button>
      <Button size="sm" variant="outline" onClick={() => void onRun(() => advanceOrder(order.id, to, { method: "card_present" }))}>
        Paid card
      </Button>
      <GiftCardFinish order={order} to={to} onRun={onRun} />
    </>
  );
}

function Ticket({ order, now, onRun }: { order: NativeOrder; now: string; onRun: (work: () => Promise<unknown>) => Promise<void> }) {
  const [cancelling, setCancelling] = useState(false);
  const [reason, setReason] = useState("");
  const next = nextStage(order.stage, order.channel);
  const late = isLate(order, now);
  return (
    <article className={cn("space-y-2 rounded-xl border bg-card p-3", late ? "border-warning" : "border-border")}>
      <header className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-bold tabular-nums text-foreground">#{order.orderNumber}</p>
          <p className="text-xs text-muted-foreground">
            {CHANNEL_NAMES[order.channel]}
            {order.customerName ? ` · ${order.customerName}` : ""}
          </p>
        </div>
        <span className={cn("flex items-center gap-1 text-xs tabular-nums", late ? "font-semibold text-warning" : "text-muted-foreground")}>
          <Clock className="size-3" aria-hidden />
          {minutesSince(order.placedAt, now)} min
        </span>
      </header>
      <ul className="space-y-1">
        {order.lines.map((line, i) => (
          <li key={i} className="text-sm">
            <span className="font-semibold tabular-nums">{line.quantity}×</span> {line.name}
            {line.modifiers.length ? <span className="block text-xs text-muted-foreground">{describeModifiers(line.modifiers)}</span> : null}
            {line.note ? <span className="block text-xs italic text-muted-foreground">“{line.note}”</span> : null}
          </li>
        ))}
      </ul>
      {order.notes ? <p className="rounded-md bg-muted px-2 py-1 text-xs text-foreground">{order.notes}</p> : null}
      <RoleGate need={["kitchen.operate"]}>
        <div className="flex flex-wrap gap-1.5">
          {next ? <FinishButtons order={order} to={next.to} label={next.label} onRun={onRun} /> : null}
          <Button size="sm" variant="ghost" onClick={() => setCancelling((v) => !v)}>
            Cancel
          </Button>
        </div>
        {cancelling ? (
          <div className="flex gap-1.5">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Why" aria-label="Why it is cancelled" className="h-8" maxLength={255} />
            <Button size="sm" variant="outline" disabled={!reason.trim()} onClick={() => void onRun(() => cancelOrder(order.id, reason.trim()))}>
              Cancel order
            </Button>
          </div>
        ) : null}
      </RoleGate>
    </article>
  );
}

function Kitchen({ board, onRun }: { board: KitchenBoard; onRun: (work: () => Promise<unknown>) => Promise<void> }) {
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {KITCHEN_COLUMNS.map((column) => {
        const orders = board.orders.filter((o) => column.stages.includes(o.stage) && !(column.key === "ready" && o.channel === "delivery"));
        return (
          <section key={column.key} className="space-y-2 rounded-2xl bg-muted/40 p-2">
            <h2 className="flex items-center justify-between px-1 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">
              {column.label}
              <span className="tabular-nums">{orders.length}</span>
            </h2>
            {orders.map((order) => (
              <Ticket key={order.id} order={order} now={board.now} onRun={onRun} />
            ))}
          </section>
        );
      })}
    </div>
  );
}

function RunsPanel({
  branchId,
  board,
  onRun,
}: {
  branchId: number;
  board: KitchenBoard;
  onRun: (work: () => Promise<unknown>) => Promise<void>;
}) {
  const suggestions = useApiQuery(restaurantQueries.batches(branchId), { refetchInterval: 10_000 });
  const [chosen, setChosen] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();
  const available = board.drivers.filter((d) => d.isActive && d.status !== "off");
  const runs = (suggestions.data?.runs ?? []).filter((r) => r.orderIds.length > 1);
  const home = suggestions.data?.branchPoint ?? null;
  const ready = board.orders.filter((o) => o.channel === "delivery" && o.stage === "ready");
  const polygons: MapPolygon[] = [];
  const markers: MapMarker[] = [
    ...(home ? [{ id: "branch", point: home, kind: "branch" as const, label: "B", title: board.branchName }] : []),
    ...ready.flatMap((o) =>
      o.deliveryAddress?.lat != null && o.deliveryAddress?.lng != null
        ? [{ id: `o${o.id}`, point: { lat: o.deliveryAddress.lat, lng: o.deliveryAddress.lng }, kind: "order" as const, label: String(o.orderNumber), title: `#${o.orderNumber} · ${o.deliveryAddress.line1 ?? ""}` }]
        : [],
    ),
    ...board.drivers.flatMap((d) =>
      d.location && isFresh(d.location.locatedAt, Date.parse(board.now))
        ? [{ id: `d${d.id}`, point: { lat: d.location.lat, lng: d.location.lng }, kind: "driver" as const, label: d.name.slice(0, 1).toUpperCase(), title: `${d.name} · ${ageLabel(d.location.locatedAt, Date.parse(board.now))}` }]
        : [],
    ),
  ];
  const send = (key: string, orderIds: number[]) =>
    onRun(async () => {
      await dispatchRun(Number(chosen[key]), orderIds);
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "batches", branchId] });
    });
  return (
    <section className="space-y-3">
      <GeoMap label="Ready deliveries and drivers" polygons={polygons} markers={markers} fitKey={`${branchId}-${ready.map((o) => o.id).join(",")}`} fallbackCentre={home} />
      {runs.length ? (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <h2 className="border-b border-border px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Suggested runs · {runs.length}</h2>
          <ul className="divide-y divide-border">
            {runs.map((r) => {
              const key = r.orderIds.join("-");
              return (
                <li key={key} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {r.orders.map((o) => `#${o.orderNumber}`).join(" → ")} <span className="font-normal text-muted-foreground">· {formatKm(r.km)}</span>
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{r.orders.map((o) => o.address ?? "—").join(" · ")}</p>
                  </div>
                  <RoleGate need={["kitchen.operate"]}>
                    <div className="flex items-center gap-1.5">
                      <Select value={chosen[key]} onValueChange={(v) => setChosen((c) => ({ ...c, [key]: v }))}>
                        <SelectTrigger className="h-8 w-[150px]" aria-label="Driver for the run">
                          <SelectValue placeholder="Driver" />
                        </SelectTrigger>
                        <SelectContent>
                          {available.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)}>
                              {d.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" disabled={!chosen[key]} onClick={() => void send(key, r.orderIds)}>
                        <Bike aria-hidden /> Send together
                      </Button>
                    </div>
                  </RoleGate>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function Dispatch({ board, onRun }: { board: KitchenBoard; onRun: (work: () => Promise<unknown>) => Promise<void> }) {
  const [chosen, setChosen] = useState<Record<number, string>>({});
  const ready = board.orders.filter((o) => o.channel === "delivery" && o.stage === "ready");
  const out = board.orders.filter((o) => o.stage === "out_for_delivery");
  const available = board.drivers.filter((d) => d.isActive && d.status !== "off");
  const row = (order: NativeOrder, action: React.ReactNode) => (
    <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground">
          #{order.orderNumber} · {formatCurrency(order.total)}
          {order.paymentStatus === "unpaid" ? <Badge variant="outline" className="ml-2">Collect {order.paymentMethod === "cash" ? "cash" : "payment"}</Badge> : null}
          {order.paymentStatus === "paid" ? <Badge variant="outline" className="ml-2">Paid</Badge> : null}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {[order.deliveryAddress?.line1, order.deliveryAddress?.city, order.deliveryAddress?.postalCode].filter(Boolean).join(", ")}
          {order.quotedDeliveryAt ? ` · due ${formatTime(order.quotedDeliveryAt)}` : ""}
        </p>
      </div>
      <RoleGate need={["kitchen.operate"]}>{action}</RoleGate>
    </li>
  );
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">Ready to go · {ready.length}</h2>
        {ready.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No delivery is waiting.</p> : null}
        <ul className="divide-y divide-border">
          {ready.map((order) =>
            row(
              order,
              <div className="flex items-center gap-1.5">
                <Select value={chosen[order.id]} onValueChange={(v) => setChosen((c) => ({ ...c, [order.id]: v }))}>
                  <SelectTrigger className="h-8 w-[150px]" aria-label="Driver">
                    <SelectValue placeholder="Driver" />
                  </SelectTrigger>
                  <SelectContent>
                    {available.map((d) => (
                      <SelectItem key={d.id} value={String(d.id)}>
                        {d.name} {d.status === "on_delivery" ? "(out)" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" disabled={!chosen[order.id]} onClick={() => void onRun(() => dispatchOrder(order.id, Number(chosen[order.id])))}>
                  <Bike aria-hidden /> Send out
                </Button>
              </div>,
            ),
          )}
        </ul>
      </section>
      <section className="overflow-hidden rounded-2xl border border-border bg-card">
        <h2 className="border-b border-border px-4 py-2 text-[11px] font-extrabold uppercase tracking-widest text-muted-foreground">On the road · {out.length}</h2>
        {out.length === 0 ? <p className="px-4 py-6 text-sm text-muted-foreground">No driver is out.</p> : null}
        <ul className="divide-y divide-border">
          {out.map((order) =>
            row(
              order,
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{order.driverName}</span>
                <FinishButtons order={order} to="delivered" label="Delivered" variant="outline" onRun={onRun} />
              </div>,
            ),
          )}
        </ul>
      </section>
    </div>
  );
}

function DriverLinkButton({ driver, onRun }: { driver: Driver; onRun: (work: () => Promise<unknown>) => Promise<void> }) {
  const [link, setLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const issue = () =>
    onRun(async () => {
      const made = await issueDriverLink(driver.id);
      setLink(`${window.location.origin}${made.path}`);
      setCopied(false);
    });
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <Button size="sm" variant="outline" onClick={() => void issue()}>
        <Link2 aria-hidden /> {driver.hasLink ? "New link" : "Driver link"}
      </Button>
      {driver.hasLink ? (
        <Button size="sm" variant="ghost" onClick={() => void onRun(() => revokeDriverLink(driver.id))}>
          Revoke
        </Button>
      ) : null}
      {link ? (
        <span className="flex w-full items-center gap-1.5">
          <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{link}</code>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              void navigator.clipboard.writeText(link).then(
                () => setCopied(true),
                () => setCopied(false),
              );
            }}
          >
            <Copy aria-hidden /> {copied ? "Copied" : "Copy"}
          </Button>
        </span>
      ) : null}
    </span>
  );
}

function Drivers({ branchId, drivers, onRun, now }: { branchId: number; drivers: Driver[]; onRun: (work: () => Promise<unknown>) => Promise<void>; now: string }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  return (
    <div className="max-w-2xl space-y-3">
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void onRun(() => addDriver(branchId, name.trim(), phone.trim() || null)).then(() => {
            setName("");
            setPhone("");
          });
        }}
      >
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Driver name" aria-label="Driver name" className="max-w-xs" maxLength={120} />
        <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone" aria-label="Driver phone" className="max-w-[180px]" maxLength={40} />
        <RoleButton need={["kitchen.operate"]} type="submit" disabled={!name.trim()}>
          <UserPlus aria-hidden /> Add driver
        </RoleButton>
      </form>
      {drivers.length === 0 ? <EmptyPanel title="No drivers yet" body="Add the drivers on shift so dispatch can send orders out." /> : null}
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {drivers.map((d) => (
          <li key={d.id} className="flex items-center justify-between gap-2 px-4 py-3">
            <div>
              <p className={cn("text-sm font-medium", d.isActive ? "text-foreground" : "text-muted-foreground line-through")}>{d.name}</p>
              <p className="text-xs text-muted-foreground">
                {d.phone ?? "—"} · {d.location ? `seen ${ageLabel(d.location.locatedAt, Date.parse(now)).toLowerCase()}` : "no position yet"}
              </p>
            </div>
            <RoleGate need={["kitchen.operate"]}>
              <div className="flex flex-wrap items-center justify-end gap-1.5">
                <DriverLinkButton driver={d} onRun={onRun} />
                <Select value={d.status} onValueChange={(v) => void onRun(() => updateDriver(d.id, { status: v as Driver["status"] }))}>
                  <SelectTrigger className="h-8 w-[140px]" aria-label={`${d.name}'s status`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="on_delivery">On a delivery</SelectItem>
                    <SelectItem value="off">Off shift</SelectItem>
                  </SelectContent>
                </Select>
                <Button size="icon" variant="ghost" aria-label={d.isActive ? `Deactivate ${d.name}` : `Reactivate ${d.name}`} onClick={() => void onRun(() => updateDriver(d.id, { isActive: !d.isActive }))}>
                  <X aria-hidden />
                </Button>
              </div>
            </RoleGate>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Kitchen & Dispatch (SPEC-379 over backend SPEC-393): the live board, refreshed every 10 s. */
export function KitchenView({ tab }: { tab: KitchenTab }) {
  const { branches, branch, loading, error: branchError } = useBranchChoice();
  const board = useApiQuery(branch ? restaurantQueries.board(branch.id) : null, { refetchInterval: 10_000 });
  const { error, run } = useActions(branch?.id ?? 0);
  if (branchError) return <QueryErrorState error={branchError} onRetry={() => window.location.reload()} />;
  if (loading) return <RestaurantSkeleton tiles={0} />;
  if (!branch) return <EmptyPanel title="No branch to run" body="Your access covers no open branch." />;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <BranchPicker branches={branches} branch={branch} />
        {board.data ? (
          <p className="text-xs text-muted-foreground">
            {board.data.orders.filter((o) => !["delivered", "picked_up", "cancelled"].includes(o.stage)).length} open ·{" "}
            {board.data.orders.filter((o) => o.stage === "cancelled").length} cancelled in the last hour · refreshes every 10 seconds
          </p>
        ) : null}
      </div>
      <FormError message={error} />
      {board.isError ? (
        <QueryErrorState error={board.error} onRetry={() => void board.refetch()} />
      ) : !board.data ? (
        <RestaurantSkeleton tiles={0} />
      ) : tab === "dispatch" ? (
        <div className="space-y-4">
          <RunsPanel branchId={branch.id} board={board.data} onRun={run} />
          <Dispatch board={board.data} onRun={run} />
        </div>
      ) : tab === "drivers" ? (
        <Drivers branchId={branch.id} drivers={board.data.drivers} onRun={run} now={board.data.now} />
      ) : board.data.orders.length === 0 ? (
        <EmptyPanel title="The board is clear" body="New orders from the POS and the online store appear here as they come in." />
      ) : (
        <Kitchen board={board.data} onRun={run} />
      )}
    </div>
  );
}
