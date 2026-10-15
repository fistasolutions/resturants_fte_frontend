"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { WEEKDAY_NAMES } from "@/lib/restaurant";
import { hoursFromText, hoursToText } from "@/lib/restaurant-os";
import { saveBranchService } from "@/services/restaurant-os-actions";
import type { BranchService } from "@/types/restaurant-os";

function Form({ branchId, service }: { branchId: number; service: BranchService }) {
  const queryClient = useQueryClient();
  const [flags, setFlags] = useState({
    acceptingOrders: service.acceptingOrders,
    acceptsDelivery: service.acceptsDelivery,
    acceptsCarryout: service.acceptsCarryout,
    acceptsOnline: service.acceptsOnline,
  });
  const [tax, setTax] = useState(String(Math.round(service.taxRate * 100000) / 1000));
  const [fee, setFee] = useState(String(service.deliveryFee));
  const [minimum, setMinimum] = useState(String(service.deliveryMinimum));
  const [postal, setPostal] = useState(service.deliveryPostalCodes.join(", "));
  const [prep, setPrep] = useState(String(service.prepMinutes));
  const [drive, setDrive] = useState(String(service.deliveryMinutes));
  const [capacity, setCapacity] = useState(String(service.capacityPer15));
  const [halves, setHalves] = useState(service.halfToppingPricing);
  const [hours, setHours] = useState(() => hoursToText(service.hours));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const parsed = hoursFromText(hours);
      if (parsed === null) throw new Error("Write hours like 11:00-23:00, or several spans as 11:00-14:00, 17:00-23:00. Blank = closed.");
      await saveBranchService(branchId, {
        ...flags,
        taxRate: (Number(tax) || 0) / 100,
        deliveryFee: Number(fee) || 0,
        deliveryMinimum: Number(minimum) || 0,
        deliveryPostalCodes: postal.split(/[,\s]+/).map((c) => c.trim()).filter(Boolean),
        prepMinutes: Number(prep) || 15,
        deliveryMinutes: Number(drive) || 0,
        capacityPer15: Number(capacity) || 1,
        halfToppingPricing: halves,
        hours: parsed,
      });
      await queryClient.invalidateQueries({ queryKey: [...RESTAURANT_KEY, "service", branchId] });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving the service failed.");
    } finally {
      setBusy(false);
    }
  };

  const flag = (key: keyof typeof flags, label: string) => (
    <label className="flex items-center gap-2 text-sm">
      <Switch checked={flags[key]} onCheckedChange={(on) => setFlags((f) => ({ ...f, [key]: on }))} aria-label={label} /> {label}
    </label>
  );

  return (
    <form onSubmit={submit} className="space-y-5 rounded-2xl border border-border bg-card p-5">
      <h2 className="text-sm font-semibold text-foreground">Service</h2>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {flag("acceptingOrders", "Taking orders")}
        {flag("acceptsOnline", "Online ordering")}
        {flag("acceptsDelivery", "Delivery")}
        {flag("acceptsCarryout", "Carryout")}
      </div>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div className="space-y-1.5">
          <Label htmlFor="svc-tax">Tax %</Label>
          <Input id="svc-tax" inputMode="decimal" value={tax} onChange={(e) => setTax(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-fee">Delivery fee</Label>
          <Input id="svc-fee" inputMode="decimal" value={fee} onChange={(e) => setFee(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-min">Delivery minimum</Label>
          <Input id="svc-min" inputMode="decimal" value={minimum} onChange={(e) => setMinimum(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-prep">Prep minutes</Label>
          <Input id="svc-prep" inputMode="numeric" value={prep} onChange={(e) => setPrep(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-drive">Drive minutes</Label>
          <Input id="svc-drive" inputMode="numeric" value={drive} onChange={(e) => setDrive(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="svc-cap">Orders / 15 min</Label>
          <Input id="svc-cap" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div className="space-y-1.5">
          <Label htmlFor="svc-postal">Delivery postal codes</Label>
          <Input id="svc-postal" value={postal} onChange={(e) => setPostal(e.target.value)} placeholder="12345, 12346" />
        </div>
        <div className="space-y-1.5">
          <Label>Half-pizza toppings</Label>
          <Select value={halves} onValueChange={(v) => setHalves(v as "half" | "full")}>
            <SelectTrigger aria-label="Half-pizza toppings">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="half">Half price</SelectItem>
              <SelectItem value="full">Full price</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Opening hours (local time; leave every day blank to stay always open)</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {WEEKDAY_NAMES.map((day, i) => (
            <label key={day} className="grid grid-cols-[96px_1fr] items-center gap-2 text-sm">
              {day}
              <Input
                value={hours[String(i)] ?? ""}
                onChange={(e) => setHours((h) => ({ ...h, [String(i)]: e.target.value }))}
                placeholder="11:00-23:00"
                aria-label={`${day} hours`}
                className="h-8"
              />
            </label>
          ))}
        </div>
      </fieldset>
      <FormError message={error} />
      {saved ? <p className="text-sm text-success">Saved.</p> : null}
      <RoleButton need={["branch.manage"]} type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save service"}
      </RoleButton>
    </form>
  );
}

/** A branch's service settings (SPEC-379 over backend SPEC-392). */
export function ServicePanel({ branchId }: { branchId: number }) {
  const query = useApiQuery(restaurantQueries.service(branchId));
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;
  return <Form branchId={branchId} service={query.data} />;
}
