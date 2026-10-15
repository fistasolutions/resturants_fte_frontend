"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Store } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/features/restaurant/parts";
import { RESTAURANT_KEY } from "@/lib/queries/restaurant";
import { setUpRestaurant } from "@/services/restaurant-actions";

/** First run for a restaurant brand: name it, give its clock and currency (backend SPEC-387). */
export function SetupCard() {
  const queryClient = useQueryClient();
  const [brandName, setBrandName] = useState("");
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC");
  const [currency, setCurrency] = useState("USD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await setUpRestaurant({ brandName: brandName.trim(), timezone: timezone.trim(), currency: currency.trim() });
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setting up the brand failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted">
          <Store className="size-5 text-foreground" aria-hidden />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-foreground">Set up your restaurant brand</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            This creates your brand&apos;s network: a first region and your corporate entity. Then add your
            franchisees and branches, and bring your POS data in on the Data tab.
          </p>
        </div>
      </div>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="brand-name">Brand name</Label>
          <Input id="brand-name" value={brandName} onChange={(e) => setBrandName(e.target.value)} required maxLength={255} />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="brand-timezone">Timezone</Label>
            <Input id="brand-timezone" value={timezone} onChange={(e) => setTimezone(e.target.value)} required placeholder="America/New_York" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="brand-currency">Currency</Label>
            <Input id="brand-currency" value={currency} onChange={(e) => setCurrency(e.target.value.toUpperCase())} required maxLength={3} />
          </div>
        </div>
        <FormError message={error} />
        <RoleButton need={["network.manage"]} type="submit" disabled={busy || !brandName.trim()}>
          {busy ? "Setting up…" : "Set up the brand"}
        </RoleButton>
      </form>
    </section>
  );
}
