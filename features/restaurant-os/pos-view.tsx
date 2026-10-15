"use client";

import { useMemo, useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Phone, RotateCcw, Search } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyPanel, FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { BranchPicker, useBranchChoice } from "@/features/restaurant-os/branch-picker";
import { CartPanel } from "@/features/restaurant-os/cart-panel";
import { ItemBuilder } from "@/features/restaurant-os/item-builder";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { CHANNEL_NAMES, quoteKeyLines, reorderLines } from "@/lib/restaurant-os";
import { cn } from "@/lib/utils";
import { placeOrder, quoteOrder } from "@/services/restaurant-os-actions";
import type { CartLineInput, MenuEntry, NativeOrder, OrderChannel, OrderInput, PaymentMethod } from "@/types/restaurant-os";
import { formatCurrency, formatTime } from "@/utils/format";

const CHANNELS: OrderChannel[] = ["carryout", "delivery", "dine_in"];
const PAYMENTS: { key: PaymentMethod; label: string }[] = [
  { key: "cash", label: "Cash" },
  { key: "card_on_delivery", label: "Card at the door / counter" },
  { key: "pay_at_store", label: "Pay at the store" },
];

/** Order Taking (SPEC-379 over backend SPEC-393): the counter and the phone. */
export function PosView() {
  const queryClient = useQueryClient();
  const { branches, branch, loading, error: branchError } = useBranchChoice();
  const menu = useApiQuery(branch ? restaurantQueries.branchMenu(branch.id) : null);
  const [category, setCategory] = useState<string | null>(null);
  const [building, setBuilding] = useState<MenuEntry | null>(null);
  const [lines, setLines] = useState<CartLineInput[]>([]);
  const [channel, setChannel] = useState<OrderChannel>("carryout");
  const [phone, setPhone] = useState("");
  const [lookup, setLookup] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [address, setAddress] = useState({ line1: "", city: "", postalCode: "", instructions: "" });
  const [coupon, setCoupon] = useState("");
  const [tip, setTip] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>("cash");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<NativeOrder | null>(null);
  const caller = useApiQuery(lookup ? restaurantQueries.caller(lookup) : null);

  const input: OrderInput | null = branch
    ? {
        branchId: branch.id,
        channel,
        lines,
        coupon: coupon.trim() || null,
        tip: Number(tip) || 0,
        customerName: name.trim() || null,
        customerPhone: phone.trim() || null,
        address: channel === "delivery" && address.line1.trim() ? { line1: address.line1.trim(), city: address.city.trim() || null, postalCode: address.postalCode.trim() || null, instructions: address.instructions.trim() || null } : null,
        notes: notes.trim() || null,
        paymentMethod: payment,
        source: phone.trim() ? "phone" : "walk_in",
      }
    : null;
  const quoteKey = input ? { b: input.branchId, c: channel, l: quoteKeyLines(lines), coupon: input.coupon, tip: input.tip } : null;
  const quote = useQuery({
    queryKey: [...RESTAURANT_KEY, "pos-quote", quoteKey],
    queryFn: () => quoteOrder(input as OrderInput),
    enabled: Boolean(input && lines.length > 0),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
  });

  const sections = useMemo(() => menu.data?.sections ?? [], [menu.data]);
  const activeSection = sections.find((s) => s.name === category) ?? sections[0];
  const allItems = useMemo(() => sections.flatMap((s) => s.items), [sections]);

  if (branchError) return <QueryErrorState error={branchError} onRetry={() => window.location.reload()} />;
  if (loading) return <RestaurantSkeleton tiles={0} />;
  if (!branch) return <EmptyPanel title="No branch to take orders for" body="Your access covers no open branch." />;

  const place = async () => {
    if (!input) return;
    setBusy(true);
    setError(null);
    try {
      const order = await placeOrder(input);
      setPlaced(order);
      setLines([]);
      setCoupon("");
      setTip("");
      setNotes("");
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "board", branch.id] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Placing the order failed.");
    } finally {
      setBusy(false);
    }
  };

  const startNew = () => {
    setPlaced(null);
    setPhone("");
    setLookup(null);
    setName("");
    setAddress({ line1: "", city: "", postalCode: "", instructions: "" });
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
      <section className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <BranchPicker branches={branches} branch={branch} />
          <div className="flex rounded-lg border border-border bg-card p-0.5" role="group" aria-label="Order type">
            {CHANNELS.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={channel === c}
                onClick={() => setChannel(c)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  channel === c ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {CHANNEL_NAMES[c]}
              </button>
            ))}
          </div>
        </div>
        {menu.isError ? (
          <QueryErrorState error={menu.error} onRetry={() => void menu.refetch()} />
        ) : !menu.data ? (
          <RestaurantSkeleton tiles={0} />
        ) : sections.length === 0 ? (
          <EmptyPanel title="No menu yet" body="Head office builds the menu on Menu › Catalog." />
        ) : (
          <>
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Menu categories">
              {sections.map((s) => (
                <button
                  key={s.name}
                  type="button"
                  role="tab"
                  aria-selected={activeSection?.name === s.name}
                  onClick={() => setCategory(s.name)}
                  className={cn(
                    "rounded-full border px-3 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    activeSection?.name === s.name ? "border-foreground/40 bg-muted font-semibold" : "border-border text-muted-foreground",
                  )}
                >
                  {s.name}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
              {activeSection?.items.map((item) => {
                const from = item.sizes.length ? Math.min(...item.sizes.map((s) => s.price)) : item.price;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!item.available}
                    onClick={() => setBuilding(item)}
                    className="flex min-h-20 flex-col justify-between rounded-xl border border-border bg-card p-3 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                  >
                    <span className="text-sm font-semibold text-foreground">{item.name}</span>
                    <span className="text-xs tabular-nums text-muted-foreground">
                      {item.available ? `${item.sizes.length ? "from " : ""}${formatCurrency(from)}` : "86'd"}
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </section>

      <aside className="space-y-4 rounded-2xl border border-border bg-card p-4">
        {placed ? (
          <div className="space-y-2 rounded-xl border border-border bg-muted/40 p-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CheckCircle2 className="size-4 text-success" aria-hidden /> Order #{placed.orderNumber} placed — {formatCurrency(placed.total)}
            </p>
            <p className="text-xs text-muted-foreground">
              Ready about {placed.quotedReadyAt ? formatTime(placed.quotedReadyAt) : "—"}
              {placed.quotedDeliveryAt ? ` · at the door about ${formatTime(placed.quotedDeliveryAt)}` : ""}
            </p>
            <Button size="sm" variant="outline" onClick={startNew}>
              New order
            </Button>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="pos-phone">Caller</Label>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (phone.trim()) setLookup(phone.trim());
            }}
          >
            <div className="relative flex-1">
              <Phone className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <Input id="pos-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" className="pl-8" inputMode="tel" />
            </div>
            <Button type="submit" variant="outline" size="icon" aria-label="Look up the caller">
              <Search aria-hidden />
            </Button>
          </form>
          {caller.data ? (
            caller.data.found ? (
              <div className="space-y-2 rounded-lg border border-border p-2 text-sm">
                <p className="font-medium text-foreground">{caller.data.guest?.name ?? "Known guest"}</p>
                {caller.data.addresses?.slice(0, 3).map((a) => (
                  <button
                    key={a.id}
                    type="button"
                    className="block w-full truncate rounded px-1 text-left text-xs text-muted-foreground hover:bg-muted"
                    onClick={() => {
                      setChannel("delivery");
                      setAddress({ line1: a.line1, city: a.city ?? "", postalCode: a.postalCode ?? "", instructions: a.instructions ?? "" });
                    }}
                  >
                    {[a.line1, a.city, a.postalCode].filter(Boolean).join(", ")}
                  </button>
                ))}
                {caller.data.recentOrders?.slice(0, 3).map((o) => (
                  <div key={o.id} className="flex items-center justify-between gap-2 text-xs">
                    <span className="truncate text-muted-foreground">
                      {o.lines.map((l) => `${l.quantity}× ${l.name}`).join(", ")}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 shrink-0"
                      onClick={() => {
                        setLines((cur) => [...cur, ...reorderLines(o, allItems)]);
                        if (!name && caller.data?.guest?.name) setName(caller.data.guest.name);
                      }}
                    >
                      <RotateCcw aria-hidden /> Reorder
                    </Button>
                  </div>
                ))}
                {!name && caller.data.guest?.name ? (
                  <Button size="sm" variant="ghost" className="h-7" onClick={() => setName(caller.data?.guest?.name ?? "")}>
                    Use this name
                  </Button>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">New caller — they are saved with this order.</p>
            )
          ) : null}
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Guest name" aria-label="Guest name" maxLength={200} />
          {channel === "delivery" ? (
            <div className="grid gap-2">
              <Input value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} placeholder="Street address" aria-label="Street address" />
              <div className="grid grid-cols-2 gap-2">
                <Input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="City" aria-label="City" />
                <Input value={address.postalCode} onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))} placeholder="Postal code" aria-label="Postal code" />
              </div>
              <Input value={address.instructions} onChange={(e) => setAddress((a) => ({ ...a, instructions: e.target.value }))} placeholder="Delivery instructions" aria-label="Delivery instructions" />
            </div>
          ) : null}
        </div>

        <CartPanel
          lines={lines}
          priced={quote.data?.cart ?? null}
          pricing={quote.isFetching}
          onQuantity={(key, q) => setLines((cur) => cur.map((l) => (l.key === key ? { ...l, quantity: q } : l)))}
          onRemove={(key) => setLines((cur) => cur.filter((l) => l.key !== key))}
        />
        {quote.error ? <FormError message={quote.error.message} /> : null}

        {lines.length ? (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <Input value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} placeholder="Coupon code" aria-label="Coupon code" maxLength={40} />
              <Input value={tip} onChange={(e) => setTip(e.target.value)} placeholder="Tip" aria-label="Tip" inputMode="decimal" />
            </div>
            <Select value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)}>
              <SelectTrigger aria-label="Payment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENTS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Order note" aria-label="Order note" maxLength={2000} />
            {quote.data?.quote ? (
              <p className="text-xs text-muted-foreground">
                Ready in about {quote.data.quote.readyMinutes} min
                {quote.data.quote.deliveryMinutes ? ` · at the door in about ${quote.data.quote.deliveryMinutes} min` : ""}
                {quote.data.quote.busy ? " · the kitchen is very busy" : ""}
              </p>
            ) : null}
            <FormError message={error} />
            <RoleButton
              need={["orders.take"]}
              className="w-full"
              disabled={busy || !quote.data || quote.data.cart.errors.length > 0 || (channel === "delivery" && !address.line1.trim())}
              onClick={() => void place()}
            >
              {busy ? "Placing…" : quote.data ? `Place order · ${formatCurrency(quote.data.cart.total)}` : "Place order"}
            </RoleButton>
          </div>
        ) : null}
      </aside>
      {building ? <ItemBuilder item={building} onClose={() => setBuilding(null)} onAdd={(line) => setLines((cur) => [...cur, line])} /> : null}
    </div>
  );
}
