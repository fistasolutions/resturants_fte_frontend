"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { parseRateInput } from "@/lib/finance-currency";

/**
 * An exchange rate QuickBooks cannot quote (SPEC-331 / backend SPEC-339). Every Finance
 * figure is in one reporting currency; a company whose books use a currency with no rate
 * sits out until one exists. This is where the owner gives it — used only while
 * QuickBooks has none, and labelled "your rate" wherever it is shown.
 */
export function RateDialog({
  currency,
  reporting,
  company,
  onClose,
  onSave,
}: {
  currency: string | null;
  reporting: string;
  company: string;
  onClose: () => void;
  onSave: (currency: string, rate: number) => Promise<boolean>;
}) {
  const [raw, setRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function close() {
    setRaw("");
    setError(null);
    onClose();
  }

  return (
    <Dialog open={currency !== null} onOpenChange={(open) => !open && !saving && close()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            if (!currency) return;
            const parsed = parseRateInput(raw);
            if (!parsed.ok) {
              setError(parsed.error);
              return;
            }
            setSaving(true);
            const saved = await onSave(currency, parsed.value);
            setSaving(false);
            if (saved) close();
          }}
        >
          <DialogHeader>
            <DialogTitle>
              Set a {currency} → {reporting} rate
            </DialogTitle>
            <DialogDescription>
              {company} keeps its books in {currency} and QuickBooks has no {currency} rate to quote, so its bills are held
              out of every total. Enter today&rsquo;s rate and the next read includes it. A QuickBooks rate replaces yours
              as soon as one exists.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5">
            <Label htmlFor="fx-rate">
              1 {currency} = ? {reporting}
            </Label>
            <Input
              id="fx-rate"
              inputMode="decimal"
              placeholder="0.7342"
              value={raw}
              aria-invalid={error != null}
              aria-describedby={error ? "fx-rate-error" : undefined}
              onChange={(event) => setRaw(event.target.value)}
            />
            {error && (
              <p id="fx-rate-error" className="text-xs text-destructive">
                {error}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save rate"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
