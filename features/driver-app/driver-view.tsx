"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { LocateFixed, Navigation, Phone } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { GeoMap, type MapMarker } from "@/features/restaurant-os/geo-map";
import { usePublicQuery } from "@/features/storefront/use-public-query";
import { navigationLink, shouldReport } from "@/lib/geo-map";
import { STOREFRONT_KEY, storefrontQueries } from "@/lib/queries/storefront";
import { paymentLabel } from "@/lib/restaurant-os";
import { markDeliveredByDriver, reportDriverLocation, setDriverAvailability } from "@/services/driver-app-actions";
import type { DriverApp, DriverStop } from "@/types/restaurant-os";
import { formatCurrency, formatTime } from "@/utils/format";

function addressLine(stop: DriverStop): string {
  const a = stop.address;
  return a ? [a.line1, a.line2, a.city, a.postalCode].filter(Boolean).join(", ") : "No address";
}

/** Shares the phone's position while on, at most every 15 seconds. */
function useLocationSharing(token: string, on: boolean): string | null {
  const last = useRef<number | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  useEffect(() => {
    if (!on) return;
    if (!("geolocation" in navigator)) {
      queueMicrotask(() => setProblem("This phone cannot share its location."));
      return;
    }
    const watch = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        if (!shouldReport(last.current, now)) return;
        last.current = now;
        setProblem(null);
        void reportDriverLocation(token, position.coords.latitude, position.coords.longitude, position.coords.accuracy ?? null).catch(() =>
          setProblem("Your location could not be sent; it will try again."),
        );
      },
      (error) => setProblem(error.code === error.PERMISSION_DENIED ? "Allow location for this page to share it." : "No location fix yet."),
      { enableHighAccuracy: true, maximumAge: 10_000, timeout: 30_000 },
    );
    return () => navigator.geolocation.clearWatch(watch);
  }, [token, on]);
  return problem;
}

function Stop({ token, stop, onDone }: { token: string; stop: DriverStop; onDone: (next: DriverApp) => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = navigationLink(stop.point, addressLine(stop));
  const deliver = async (tender: "cash" | "card_present" | null) => {
    setBusy(true);
    setError(null);
    try {
      onDone(await markDeliveredByDriver(token, stop.id, tender ? { method: tender } : null));
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <li className="space-y-3 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-lg font-bold tabular-nums">
            {stop.sequence ? `${stop.sequence}. ` : ""}#{stop.orderNumber}
          </p>
          <p className="text-sm text-foreground">{stop.customerName ?? "Guest"}</p>
        </div>
        {stop.amountDue > 0 ? <Badge variant="outline">Collect {formatCurrency(stop.amountDue)}</Badge> : <Badge variant="outline">Paid</Badge>}
      </div>
      <p className="text-sm">{addressLine(stop)}</p>
      {stop.address?.instructions ? <p className="rounded-md bg-muted px-2 py-1 text-sm">{stop.address.instructions}</p> : null}
      {stop.notes ? <p className="text-sm text-muted-foreground">{stop.notes}</p> : null}
      <p className="text-xs text-muted-foreground">
        {stop.items} items · {formatCurrency(stop.total)} · {paymentLabel(stop.paymentMethod)}
        {stop.quotedDeliveryAt ? ` · due ${formatTime(stop.quotedDeliveryAt)}` : ""}
      </p>
      <div className="flex flex-wrap gap-2">
        {navigate ? (
          <a href={navigate} target="_blank" rel="noreferrer" className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium">
            <Navigation className="size-4" aria-hidden /> Navigate
          </a>
        ) : null}
        {stop.customerPhone ? (
          <a href={`tel:${stop.customerPhone}`} className="inline-flex h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium">
            <Phone className="size-4" aria-hidden /> Call
          </a>
        ) : null}
      </div>
      {stop.amountDue > 0 ? (
        <div className="grid grid-cols-2 gap-2">
          <Button size="lg" disabled={busy} onClick={() => void deliver("cash")}>
            Delivered · paid cash
          </Button>
          <Button size="lg" variant="outline" disabled={busy} onClick={() => void deliver("card_present")}>
            Paid card
          </Button>
        </div>
      ) : (
        <Button size="lg" className="w-full" disabled={busy} onClick={() => void deliver(null)}>
          Delivered
        </Button>
      )}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </li>
  );
}

/** The driver's phone (SPEC-384): the run in order, navigation, delivered, and live location. */
export function DriverView({ token }: { token: string }) {
  const queryClient = useQueryClient();
  const query = usePublicQuery(storefrontQueries.driver(token), 15_000);
  const [sharing, setSharing] = useState(false);
  const problem = useLocationSharing(token, sharing);
  const [statusError, setStatusError] = useState<string | null>(null);

  if (query.isError) {
    return (
      <main className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="text-lg font-semibold">This driver link does not work.</p>
        <p className="mt-1 text-sm text-muted-foreground">Ask the store for a new one.</p>
      </main>
    );
  }
  if (!query.data) {
    return (
      <main className="mx-auto max-w-lg space-y-4 px-4 py-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-48 rounded-2xl" />
      </main>
    );
  }
  const app = query.data;
  const set = (next: DriverApp) => queryClient.setQueryData([...STOREFRONT_KEY, "driver", token], next);
  const markers: MapMarker[] = [
    ...(app.branch.lat != null && app.branch.lng != null ? [{ id: "b", point: { lat: app.branch.lat, lng: app.branch.lng }, kind: "branch" as const, label: "B", title: app.branch.name ?? "" }] : []),
    ...app.run.flatMap((s) => (s.point ? [{ id: `s${s.id}`, point: s.point, kind: "order" as const, label: String(s.sequence ?? s.orderNumber ?? ""), title: `#${s.orderNumber}` }] : [])),
    ...(app.location.lat != null && app.location.lng != null ? [{ id: "me", point: { lat: app.location.lat, lng: app.location.lng }, kind: "driver" as const, label: "Me" }] : []),
  ];
  const toggleShift = async (available: boolean) => {
    setStatusError(null);
    try {
      set(await setDriverAvailability(token, available ? "available" : "off"));
    } catch (err) {
      setStatusError(err instanceof Error ? err.message : "That did not work.");
    }
  };

  return (
    <main className="mx-auto max-w-lg space-y-4 px-4 py-6">
      <header className="space-y-1">
        <p className="text-sm text-muted-foreground">{app.branch.name}</p>
        <h1 className="text-2xl font-bold">{app.driver.name}</h1>
        <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
          <label className="flex items-center gap-2">
            <Switch checked={app.driver.status !== "off"} onCheckedChange={(on) => void toggleShift(on)} aria-label="On shift" />
            {app.driver.status === "off" ? "Off shift" : app.driver.status === "on_delivery" ? "On a delivery" : "Available"}
          </label>
          <label className="flex items-center gap-2">
            <Switch checked={sharing} onCheckedChange={setSharing} aria-label="Share my location" />
            <LocateFixed className="size-4" aria-hidden /> Share my location
          </label>
        </div>
        {sharing && problem ? <p className="text-sm text-destructive">{problem}</p> : null}
        {sharing && !problem ? <p className="text-xs text-muted-foreground">Your position goes to the store and to the guests you are driving to, while this page is open.</p> : null}
        {statusError ? <p className="text-sm text-destructive">{statusError}</p> : null}
      </header>
      {app.run.length ? <GeoMap label="Your run" markers={markers} fitKey={app.run.map((s) => s.id).join(",")} className="h-56" /> : null}
      {app.run.length === 0 ? (
        <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">No deliveries with you right now. This page refreshes by itself.</p>
      ) : (
        <ol className="space-y-3">
          {app.run.map((stop) => (
            <Stop key={stop.id} token={token} stop={stop} onDone={set} />
          ))}
        </ol>
      )}
      {app.branch.phone ? (
        <a href={`tel:${app.branch.phone}`} className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Phone className="size-4" aria-hidden /> Call the store
        </a>
      ) : null}
    </main>
  );
}
