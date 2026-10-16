"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { RoleButton } from "@/components/shared/role-gate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MarketplacesPanel } from "@/features/restaurant/marketplaces-panel";
import { FormError, RestaurantSkeleton } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { WEEKDAY_NAMES } from "@/lib/restaurant";
import { saveRestaurantSettings } from "@/services/restaurant-actions";
import { setOrderTaker } from "@/services/restaurant-os-actions";
import type { RestaurantRules } from "@/types/restaurant";

function Form({ rules }: { rules: RestaurantRules }) {
  const queryClient = useQueryClient();
  const [fees, setFees] = useState(rules.royaltyIncludesDeliveryFees);
  const [weekStart, setWeekStart] = useState(String(rules.royaltyWeekStartsOn));
  const [minimum, setMinimum] = useState(rules.minimumWeeklyRoyalty == null ? "" : String(rules.minimumWeeklyRoyalty));
  const [target, setTarget] = useState(String(rules.onTimeTargetMinutes));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      await saveRestaurantSettings({
        royaltyIncludesDeliveryFees: fees,
        royaltyWeekStartsOn: Number(weekStart),
        minimumWeeklyRoyalty: minimum.trim() === "" ? null : Number(minimum),
        onTimeTargetMinutes: Number(target),
      });
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving the rules failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="max-w-2xl space-y-6 rounded-2xl border border-border bg-card p-6">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Royalty basis</h2>
        <label className="flex items-start justify-between gap-4">
          <span>
            <span className="block text-sm font-medium text-foreground">Count delivery charges</span>
            <span className="block text-xs text-muted-foreground">
              The delivery charge the store keeps counts toward gross sales, as most franchise agreements define it.
            </span>
          </span>
          <Switch checked={fees} onCheckedChange={setFees} aria-label="Count delivery charges" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Royalty week starts on</Label>
            <Select value={weekStart} onValueChange={setWeekStart}>
              <SelectTrigger aria-label="Royalty week starts on">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAY_NAMES.map((day, i) => (
                  <SelectItem key={day} value={String(i)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="min-royalty">Minimum weekly royalty per branch</Label>
            <Input id="min-royalty" inputMode="decimal" value={minimum} onChange={(e) => setMinimum(e.target.value)} placeholder="None" />
          </div>
        </div>
        <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
          {rules.basisRules.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-foreground">Service standards</h2>
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="on-time">Delivery on-time target (minutes)</Label>
          <Input id="on-time" type="number" min={5} max={180} value={target} onChange={(e) => setTarget(e.target.value)} />
        </div>
      </section>
      <FormError message={error} />
      {saved ? <p className="text-sm text-success">Saved. Figures use the new rules from now on.</p> : null}
      <RoleButton need={["network.manage"]} type="submit" disabled={busy}>
        {busy ? "Saving…" : "Save rules"}
      </RoleButton>
    </form>
  );
}

/** Network › Settings (SPEC-378 over backend SPEC-390): the brand's rules, head office only. */
/** SPEC-392: the Order Taker chat on the brand's ordering page — off until head office turns it on. */
function OrderTakerSwitch() {
  const queryClient = useQueryClient();
  const query = useApiQuery(restaurantQueries.orderTaker());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!query.data) return null;
  const toggle = async (enabled: boolean) => {
    setBusy(true);
    setError(null);
    try {
      queryClient.setQueryData([...RESTAURANT_KEY, "order-taker"], await setOrderTaker(enabled));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="max-w-2xl space-y-2 rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <span>
          <span className="block text-sm font-medium text-foreground">Order by chat</span>
          <span className="block text-sm text-muted-foreground">
            Guests can tell the Order Taker what they want on your ordering page. It builds the order from the branch&apos;s menu and
            prices it; the guest checks out as usual.
          </span>
        </span>
        <RoleGateSwitch checked={query.data.enabled} disabled={busy} onChange={(v) => void toggle(v)} />
      </div>
      <FormError message={error} />
    </section>
  );
}

function RoleGateSwitch({ checked, disabled, onChange }: { checked: boolean; disabled: boolean; onChange: (v: boolean) => void }) {
  const can = useCan();
  const gate = can(["network.manage"]);
  return (
    <span className="flex flex-col items-end gap-1">
      <Switch aria-label="Order by chat" checked={checked} disabled={disabled || !gate.allowed} onCheckedChange={onChange} />
      {!gate.allowed ? <span className="text-xs text-muted-foreground">{gate.reason}</span> : null}
    </span>
  );
}

export function BrandSettingsTab() {
  const query = useApiQuery(restaurantQueries.settings());
  if (query.isError) return <QueryErrorState error={query.error} onRetry={() => void query.refetch()} />;
  if (!query.data) return <RestaurantSkeleton tiles={0} />;
  return (
    <div className="space-y-4">
      <Form rules={query.data} />
      <OrderTakerSwitch />
      <MarketplacesPanel />
    </div>
  );
}
