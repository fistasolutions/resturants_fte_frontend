"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { RoleButton } from "@/components/shared/role-gate";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { FormError } from "@/features/restaurant/parts";
import { RESTAURANT_KEY } from "@/lib/queries/restaurant";
import { createFranchisee, updateFranchisee, type FranchiseeInput } from "@/services/restaurant-actions";
import type { Franchisee, FranchiseeStatus } from "@/types/restaurant";

const STATUSES: { key: FranchiseeStatus; label: string }[] = [
  { key: "onboarding", label: "Onboarding" },
  { key: "active", label: "Active" },
  { key: "terminated", label: "Terminated" },
];

/** "6" (percent, as typed) → 0.06. */
function rate(value: string): number {
  const n = Number(value.replace("%", "").trim());
  return Number.isFinite(n) ? Math.round(n * 100) / 10000 : 0;
}

function percentText(value: number | undefined): string {
  return value == null ? "" : String(Math.round(value * 10000) / 100);
}

/** Add or edit a franchisee — the company that runs some of the brand's branches. */
export function FranchiseeDialog({
  open,
  onOpenChange,
  franchisee = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  franchisee?: Franchisee | null;
}) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(() => ({
    name: franchisee?.name ?? "",
    status: (franchisee?.status ?? "active") as FranchiseeStatus,
    contactName: franchisee?.contactName ?? "",
    contactEmail: franchisee?.contactEmail ?? "",
    contactPhone: franchisee?.contactPhone ?? "",
    royalty: percentText(franchisee?.royaltyRate ?? 0),
    adFund: percentText(franchisee?.adFundRate ?? 0),
    agreementStart: franchisee?.agreementStart ?? "",
    agreementEnd: franchisee?.agreementEnd ?? "",
    notes: franchisee?.notes ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));
  const corporate = franchisee?.kind === "corporate";

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const input: FranchiseeInput = {
      name: form.name.trim(),
      status: form.status,
      contactName: form.contactName.trim() || null,
      contactEmail: form.contactEmail.trim() || null,
      contactPhone: form.contactPhone.trim() || null,
      royaltyRate: rate(form.royalty),
      adFundRate: rate(form.adFund),
      agreementStart: form.agreementStart || null,
      agreementEnd: form.agreementEnd || null,
      notes: form.notes.trim() || null,
    };
    try {
      if (franchisee) await updateFranchisee(franchisee.id, input);
      else await createFranchisee(input);
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving the franchisee failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{franchisee ? `Edit ${franchisee.name}` : "Add a franchisee"}</DialogTitle>
          <DialogDescription>
            The royalty and ad-fund rates are shares of net sales; the Royalties page bills each period by them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="f-name">Company name</Label>
            <Input id="f-name" value={form.name} onChange={(e) => set("name")(e.target.value)} required maxLength={160} />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={set("status")}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => (
                    <SelectItem key={s.key} value={s.key}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-royalty">Royalty %</Label>
              <Input id="f-royalty" inputMode="decimal" value={form.royalty} onChange={(e) => set("royalty")(e.target.value)} disabled={corporate} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-fund">Ad fund %</Label>
              <Input id="f-fund" inputMode="decimal" value={form.adFund} onChange={(e) => set("adFund")(e.target.value)} disabled={corporate} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="f-contact">Contact</Label>
              <Input id="f-contact" value={form.contactName} onChange={(e) => set("contactName")(e.target.value)} maxLength={160} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-email">Email</Label>
              <Input id="f-email" type="email" value={form.contactEmail} onChange={(e) => set("contactEmail")(e.target.value)} maxLength={255} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-phone">Phone</Label>
              <Input id="f-phone" value={form.contactPhone} onChange={(e) => set("contactPhone")(e.target.value)} maxLength={40} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="f-start">Agreement starts</Label>
              <Input id="f-start" type="date" value={form.agreementStart} onChange={(e) => set("agreementStart")(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="f-end">Agreement ends</Label>
              <Input id="f-end" type="date" value={form.agreementEnd} onChange={(e) => set("agreementEnd")(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="f-notes">Notes</Label>
            <Textarea id="f-notes" value={form.notes} onChange={(e) => set("notes")(e.target.value)} maxLength={4000} rows={3} />
          </div>
          <FormError message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <RoleButton need={["network.manage"]} type="submit" disabled={busy || !form.name.trim()}>
              {busy ? "Saving…" : franchisee ? "Save" : "Add franchisee"}
            </RoleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
