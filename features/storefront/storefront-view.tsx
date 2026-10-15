"use client";

import { useState } from "react";
import Link from "next/link";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { ArrowLeft, Bike, MapPin, ShoppingBag, Store } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { FormError } from "@/features/restaurant/parts";
import { CartPanel } from "@/features/restaurant-os/cart-panel";
import { ItemBuilder } from "@/features/restaurant-os/item-builder";
import { usePublicQuery } from "@/features/storefront/use-public-query";
import { storefrontQueries } from "@/lib/queries/storefront";
import { quoteKeyLines } from "@/lib/restaurant-os";
import { cn } from "@/lib/utils";
import { placePublicOrder, quotePublicOrder } from "@/services/storefront-actions";
import type { CartLineInput, MenuEntry, OrderChannel, OrderInput, PaymentMethod, PlacedOrder, PublicBranch } from "@/types/restaurant-os";
import { formatCurrency, formatTime } from "@/utils/format";

type Mode = "delivery" | "carryout";

function Header({ name }: { name: string | undefined }) {
  return (
    <header className="border-b border-border bg-card">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-4">
        <Store className="size-5" aria-hidden />
        <span className="font-heading text-xl tracking-wide">{name ?? "…"}</span>
      </div>
    </header>
  );
}

function BranchChoice({ branches, onPick }: { branches: PublicBranch[]; onPick: (b: PublicBranch) => void }) {
  if (branches.length === 0) return <p className="text-sm text-muted-foreground">No branch matches yet.</p>;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {branches.map((b) => (
        <li key={b.id}>
          <button
            type="button"
            onClick={() => onPick(b)}
            className="w-full rounded-xl border border-border bg-card p-4 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <p className="font-semibold text-foreground">{b.name}</p>
            <p className="text-sm text-muted-foreground">{b.address || b.city}</p>
            <p className={cn("mt-1 text-xs font-medium", b.openNow ? "text-success" : "text-muted-foreground")}>{b.openNow ? "Open now" : "Closed now"}</p>
          </button>
        </li>
      ))}
    </ul>
  );
}

function Checkout({
  slug,
  branch,
  mode,
  postal,
  lines,
  onPlaced,
}: {
  slug: string;
  branch: PublicBranch;
  mode: Mode;
  postal: string;
  lines: CartLineInput[];
  onPlaced: (order: PlacedOrder) => void;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [optIn, setOptIn] = useState(false);
  const [line1, setLine1] = useState("");
  const [city, setCity] = useState("");
  const [instructions, setInstructions] = useState("");
  const [payment, setPayment] = useState<PaymentMethod>(mode === "delivery" ? "card_on_delivery" : "pay_at_store");
  const [tip, setTip] = useState("");
  const [coupon, setCoupon] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const input: OrderInput = {
    branchId: branch.id,
    channel: mode as OrderChannel,
    lines,
    coupon: coupon.trim() || null,
    tip: Number(tip) || 0,
    customerName: name.trim() || null,
    customerPhone: phone.trim() || null,
    customerEmail: email.trim() || null,
    marketingOptIn: optIn,
    address: mode === "delivery" ? { line1: line1.trim() || "-", city: city.trim() || null, postalCode: postal, instructions: instructions.trim() || null } : null,
    paymentMethod: payment,
  };
  const quote = useQuery({
    queryKey: ["storefront", "quote", slug, branch.id, mode, quoteKeyLines(lines), input.coupon, input.tip],
    queryFn: () => quotePublicOrder(slug, input),
    enabled: lines.length > 0,
    placeholderData: keepPreviousData,
    retry: false,
  });

  const place = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      onPlaced(await placePublicOrder(slug, input));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Placing the order failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={place} className="space-y-4">
      <CartPanel lines={lines} priced={quote.data?.cart ?? null} pricing={quote.isFetching} onQuantity={() => undefined} onRemove={() => undefined} />
      {quote.error ? <FormError message={quote.error.message} /> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="co-name">Name</Label>
          <Input id="co-name" value={name} onChange={(e) => setName(e.target.value)} required maxLength={200} autoComplete="name" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-phone">Phone</Label>
          <Input id="co-phone" value={phone} onChange={(e) => setPhone(e.target.value)} required inputMode="tel" autoComplete="tel" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="co-email">Email (optional)</Label>
        <Input id="co-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      {mode === "delivery" ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="co-line1">Street address</Label>
            <Input id="co-line1" value={line1} onChange={(e) => setLine1(e.target.value)} required autoComplete="street-address" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co-city">City</Label>
            <Input id="co-city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="co-instr">Instructions</Label>
            <Input id="co-instr" value={instructions} onChange={(e) => setInstructions(e.target.value)} placeholder="Gate code, floor…" />
          </div>
        </div>
      ) : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label>Pay</Label>
          <Select value={payment} onValueChange={(v) => setPayment(v as PaymentMethod)}>
            <SelectTrigger aria-label="Payment">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {mode === "delivery" ? <SelectItem value="card_on_delivery">Card at the door</SelectItem> : <SelectItem value="pay_at_store">Pay at the store</SelectItem>}
              <SelectItem value="cash">Cash</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-tip">Tip</Label>
          <Input id="co-tip" inputMode="decimal" value={tip} onChange={(e) => setTip(e.target.value)} placeholder="0" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="co-coupon">Coupon</Label>
          <Input id="co-coupon" value={coupon} onChange={(e) => setCoupon(e.target.value.toUpperCase())} maxLength={40} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <Checkbox checked={optIn} onCheckedChange={(v) => setOptIn(v === true)} /> Send me offers by email and text
      </label>
      <FormError message={error} />
      <Button type="submit" className="w-full" size="lg" disabled={busy || !quote.data || quote.data.cart.errors.length > 0 || !name.trim() || !phone.trim()}>
        {busy ? "Placing…" : quote.data ? `Place order · ${formatCurrency(quote.data.cart.total)}` : "Place order"}
      </Button>
      {quote.data?.quote ? (
        <p className="text-center text-xs text-muted-foreground">
          {mode === "delivery" ? `At your door in about ${quote.data.quote.deliveryMinutes} minutes` : `Ready in about ${quote.data.quote.readyMinutes} minutes`}
        </p>
      ) : null}
    </form>
  );
}

/** The brand's own online ordering (SPEC-379 over backend SPEC-394). */
export function StorefrontView({ slug }: { slug: string }) {
  const brand = usePublicQuery(storefrontQueries.brand(slug));
  const [mode, setMode] = useState<Mode | null>(null);
  const [postal, setPostal] = useState("");
  const [searched, setSearched] = useState<string | null>(null);
  const located = usePublicQuery(searched ? storefrontQueries.locate(slug, searched) : null);
  const [branch, setBranch] = useState<PublicBranch | null>(null);
  const menu = usePublicQuery(branch ? storefrontQueries.menu(slug, branch.id) : null);
  const [lines, setLines] = useState<CartLineInput[]>([]);
  const [building, setBuilding] = useState<MenuEntry | null>(null);
  const [checkout, setCheckout] = useState(false);
  const [placed, setPlaced] = useState<PlacedOrder | null>(null);

  if (brand.isError) {
    return (
      <>
        <Header name={undefined} />
        <main className="mx-auto max-w-6xl px-4 py-16 text-center">
          <p className="text-lg font-semibold">This ordering page is not available.</p>
        </main>
      </>
    );
  }

  let body: React.ReactNode;
  if (!brand.data) {
    body = <Skeleton className="h-64 rounded-2xl" />;
  } else if (placed) {
    body = (
      <section className="mx-auto max-w-md space-y-3 rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-sm text-muted-foreground">Thank you — your order is in.</p>
        <p className="text-3xl font-bold tabular-nums">#{placed.orderNumber}</p>
        <p className="text-sm">
          {placed.quotedDeliveryAt ? `At your door about ${formatTime(placed.quotedDeliveryAt)}` : placed.quotedReadyAt ? `Ready about ${formatTime(placed.quotedReadyAt)}` : ""}
        </p>
        <Link href={placed.trackingPath} className="inline-flex h-10 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground">
          Follow your order
        </Link>
      </section>
    );
  } else if (!mode) {
    body = (
      <div className="mx-auto grid max-w-xl gap-3 sm:grid-cols-2">
        {(
          [
            { key: "delivery", label: "Delivery", icon: Bike },
            { key: "carryout", label: "Carryout", icon: ShoppingBag },
          ] as const
        ).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            onClick={() => setMode(key)}
            className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-card p-8 outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Icon className="size-8" aria-hidden />
            <span className="text-lg font-semibold">{label}</span>
          </button>
        ))}
      </div>
    );
  } else if (!branch) {
    body = (
      <section className="mx-auto max-w-2xl space-y-4">
        <button type="button" onClick={() => setMode(null)} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Back
        </button>
        {mode === "delivery" ? (
          <>
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                if (postal.trim()) setSearched(postal.trim());
              }}
            >
              <div className="relative flex-1">
                <MapPin className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
                <Input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="Your postal code" aria-label="Your postal code" className="pl-8" autoComplete="postal-code" />
              </div>
              <Button type="submit">Find</Button>
            </form>
            {located.data ? (
              located.data.length ? (
                <BranchChoice branches={located.data} onPick={setBranch} />
              ) : (
                <p className="text-sm text-muted-foreground">We do not deliver there yet — try carryout.</p>
              )
            ) : null}
          </>
        ) : (
          <BranchChoice branches={brand.data.branches.filter((b) => b.carryout)} onPick={setBranch} />
        )}
      </section>
    );
  } else {
    const sections = menu.data?.sections ?? [];
    body = (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <section className="space-y-6">
          <button type="button" onClick={() => { setBranch(null); setLines([]); setCheckout(false); }} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" aria-hidden /> {branch.name}
          </button>
          {menu.data?.ordering.busy ? <p className="rounded-lg bg-muted px-3 py-2 text-sm">The kitchen is very busy right now; times may run long.</p> : null}
          {!menu.data ? <Skeleton className="h-64 rounded-2xl" /> : null}
          {sections.map((section) => (
            <div key={section.name} className="space-y-2">
              <h2 className="text-lg font-semibold">{section.name}</h2>
              <div className="grid gap-2 sm:grid-cols-2">
                {section.items.map((item) => {
                  const from = item.sizes.length ? Math.min(...item.sizes.map((s) => s.price)) : item.price;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setBuilding(item)}
                      className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-left outline-none transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="font-medium">{item.name}</span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        {item.sizes.length ? "from " : ""}
                        {formatCurrency(from)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </section>
        <aside className="h-fit space-y-4 rounded-2xl border border-border bg-card p-4 lg:sticky lg:top-4">
          <h2 className="font-semibold">Your order</h2>
          {checkout ? (
            <Checkout slug={slug} branch={branch} mode={mode} postal={searched ?? ""} lines={lines} onPlaced={setPlaced} />
          ) : (
            <>
              <CartPanel
                lines={lines}
                priced={null}
                pricing={false}
                onQuantity={(key, q) => setLines((cur) => cur.map((l) => (l.key === key ? { ...l, quantity: q } : l)))}
                onRemove={(key) => setLines((cur) => cur.filter((l) => l.key !== key))}
              />
              {menu.data && mode === "delivery" && menu.data.ordering.deliveryMinimum > 0 ? (
                <p className="text-xs text-muted-foreground">Delivery minimum {formatCurrency(menu.data.ordering.deliveryMinimum)} · fee {formatCurrency(menu.data.ordering.deliveryFee)}</p>
              ) : null}
              <Button className="w-full" disabled={lines.length === 0} onClick={() => setCheckout(true)}>
                Checkout
              </Button>
            </>
          )}
        </aside>
        {building ? <ItemBuilder item={building} onClose={() => setBuilding(null)} onAdd={(line) => setLines((cur) => [...cur, line])} /> : null}
      </div>
    );
  }

  return (
    <>
      <Header name={brand.data?.name} />
      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8">{body}</main>
    </>
  );
}
