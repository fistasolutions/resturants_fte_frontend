"use client";

import { Check, Phone } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { GeoMap } from "@/features/restaurant-os/geo-map";
import { RateOrder } from "@/features/storefront/rate-order";
import { usePublicQuery } from "@/features/storefront/use-public-query";
import { distanceKm, formatKm } from "@/lib/geo-map";
import { storefrontQueries } from "@/lib/queries/storefront";
import { describeModifiers, paymentLabel, trackSteps } from "@/lib/restaurant-os";
import { cn } from "@/lib/utils";
import { formatCurrency, formatTime } from "@/utils/format";

/** The guest's live order tracker (SPEC-379 over backend SPEC-394), refreshed every 20 seconds — and
 * every 5 while an online card payment is being confirmed (SPEC-380). */
export function TrackView({ token, paid = false }: { token: string; paid?: boolean }) {
  const query = usePublicQuery(storefrontQueries.track(token), (data) =>
    data?.stage === "awaiting_payment" ? 5_000 : data?.stage === "out_for_delivery" ? 10_000 : 20_000,
  );
  if (query.isError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">We could not find this order.</p>
        <p className="mt-1 text-sm text-muted-foreground">Check the link in your confirmation.</p>
      </main>
    );
  }
  if (!query.data) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-10">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 rounded-2xl" />
      </main>
    );
  }
  const order = query.data;
  const cancelled = order.stage === "cancelled";
  const awaiting = order.stage === "awaiting_payment";
  const steps = trackSteps(order);
  const due = order.channel === "delivery" ? order.quotedDeliveryAt : order.quotedReadyAt;
  return (
    <main className="mx-auto max-w-lg space-y-6 px-4 py-10">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">{order.brand} · {order.branchName}</p>
        <h1 className="text-2xl font-bold">
          {order.customerFirstName ? `${order.customerFirstName}, ` : ""}order #{order.orderNumber}
        </h1>
        {cancelled ? (
          <p className="text-sm font-medium text-destructive">
            {order.paymentMethod === "card_online" && order.paymentStatus === "unpaid"
              ? "The card payment was not completed, so this order was cancelled. You have not been charged."
              : "This order was cancelled. Please call the store."}
          </p>
        ) : awaiting ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {paid
              ? "Payment received — confirming with the store…"
              : "Waiting for your card payment. The kitchen starts as soon as it is through; an unpaid order is cancelled after 30 minutes."}
          </p>
        ) : due ? (
          <p className="text-sm text-muted-foreground">
            {order.channel === "delivery" ? "Expected at your door" : "Expected ready"} about <span className="font-semibold text-foreground">{formatTime(due)}</span>
          </p>
        ) : null}
      </header>

      {!cancelled && !awaiting ? (
        <ol className="space-y-0" aria-label="Order progress">
          {steps.map((step, i) => (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full border text-xs font-bold",
                    step.done ? "border-success bg-success text-background" : step.current ? "border-primary text-primary" : "border-border text-muted-foreground",
                  )}
                  aria-current={step.current ? "step" : undefined}
                >
                  {step.done ? <Check className="size-4" aria-hidden /> : i + 1}
                </span>
                {i < steps.length - 1 ? <span className={cn("h-8 w-px", step.done ? "bg-success" : "bg-border")} aria-hidden /> : null}
              </div>
              <div className="pb-6">
                <p className={cn("text-sm font-medium", step.current ? "text-foreground" : step.done ? "text-foreground" : "text-muted-foreground")}>{step.label}</p>
                {step.at ? <p className="text-xs text-muted-foreground">{formatTime(step.at)}</p> : null}
                {step.key === "out" && step.current && order.driverName ? <p className="text-xs text-muted-foreground">{order.driverName} is on the way.</p> : null}
              </div>
            </li>
          ))}
        </ol>
      ) : null}

      {order.stage === "out_for_delivery" && (order.driverLocation || order.destination) ? (
        <section className="space-y-2">
          <GeoMap
            label="Your driver and your door"
            markers={[
              ...(order.driverLocation ? [{ id: "driver", point: order.driverLocation, kind: "driver" as const, label: (order.driverName ?? "D").slice(0, 1), title: order.driverName ?? "Your driver" }] : []),
              ...(order.destination ? [{ id: "home", point: order.destination, kind: "home" as const, label: "⌂", title: "Your door" }] : []),
            ]}
            fitKey={order.driverLocation ? `${order.driverLocation.lat},${order.driverLocation.lng}` : "home"}
            className="h-64"
          />
          {order.driverLocation && order.destination ? (
            <p className="text-sm text-muted-foreground">
              {order.driverName ?? "Your driver"} is about {formatKm(distanceKm(order.driverLocation, order.destination))} away.
            </p>
          ) : null}
        </section>
      ) : null}

      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <h2 className="text-sm font-semibold">Your order</h2>
        <ul className="space-y-1.5">
          {order.lines.map((line, i) => (
            <li key={i} className="flex justify-between gap-3 text-sm">
              <span>
                {line.quantity}× {line.name}
                {line.modifiers.length ? <span className="block text-xs text-muted-foreground">{describeModifiers(line.modifiers)}</span> : null}
              </span>
              <span className="tabular-nums">{formatCurrency(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="flex justify-between border-t border-border pt-2 text-sm font-bold">
          <span>Total</span>
          <span className="tabular-nums">{formatCurrency(order.total)}</span>
        </div>
        {order.pointsEarned ? (
          <p className="text-sm font-medium text-foreground">You earned {order.pointsEarned} points with this order.</p>
        ) : null}
        <p className="text-xs text-muted-foreground">
          {paymentLabel(order.paymentMethod)} · {order.paymentStatus === "paid" ? "paid" : order.paymentStatus === "unpaid" ? "to pay" : (order.paymentStatus ?? "").replace(/_/g, " ")}
        </p>
      </section>
      {order.branchPhone ? (
        <a href={`tel:${order.branchPhone}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <Phone className="size-4" aria-hidden /> {order.branchPhone}
        </a>
      ) : null}
      {order.canRate || order.rating ? <RateOrder token={token} canRate={!!order.canRate} rating={order.rating ?? null} /> : null}
      <p className="text-xs text-muted-foreground">This page updates by itself.</p>
    </main>
  );
}
