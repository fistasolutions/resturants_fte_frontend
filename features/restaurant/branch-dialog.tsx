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
import { FormError } from "@/features/restaurant/parts";
import { useApiQuery } from "@/hooks/use-api-query";
import { RESTAURANT_KEY, restaurantQueries } from "@/lib/queries/restaurant";
import { BRANCH_STATUS_LABELS } from "@/lib/restaurant";
import { createBranch, updateBranch, type BranchInput } from "@/services/restaurant-actions";
import type { Branch, BranchStatus } from "@/types/restaurant";

const NONE = "none";

interface BranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Editing this branch; null = a new one. */
  branch?: Branch | null;
}

function text(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

/** Add or edit a branch (backend SPEC-387) — head office only. */
export function BranchDialog({ open, onOpenChange, branch = null }: BranchDialogProps) {
  const queryClient = useQueryClient();
  const franchisees = useApiQuery(restaurantQueries.franchisees());
  const regions = useApiQuery(restaurantQueries.regions());
  const [form, setForm] = useState(() => ({
    code: branch?.code ?? "",
    name: branch?.name ?? "",
    externalRef: branch?.externalRef ?? "",
    status: (branch?.status ?? "open") as BranchStatus,
    franchiseeId: branch ? String(branch.franchiseeId) : NONE,
    regionId: branch?.regionId != null ? String(branch.regionId) : NONE,
    addressLine: branch?.addressLine ?? "",
    city: branch?.city ?? "",
    state: branch?.state ?? "",
    postalCode: branch?.postalCode ?? "",
    phone: branch?.phone ?? "",
    ianaTimezone: branch?.ianaTimezone ?? "",
    managerName: branch?.managerName ?? "",
    managerEmail: branch?.managerEmail ?? "",
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (key: keyof typeof form) => (value: string) => setForm((f) => ({ ...f, [key]: value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const input: BranchInput = {
      code: form.code.trim(),
      name: form.name.trim(),
      externalRef: text(form.externalRef),
      status: form.status,
      franchiseeId: form.franchiseeId === NONE ? null : Number(form.franchiseeId),
      regionId: form.regionId === NONE ? null : Number(form.regionId),
      addressLine: text(form.addressLine),
      city: text(form.city),
      state: text(form.state),
      postalCode: text(form.postalCode),
      phone: text(form.phone),
      ianaTimezone: text(form.ianaTimezone),
      managerName: text(form.managerName),
      managerEmail: text(form.managerEmail),
    };
    try {
      if (branch) await updateBranch(branch.id, input);
      else await createBranch(input);
      await queryClient.invalidateQueries({ queryKey: RESTAURANT_KEY });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Saving the branch failed.");
    } finally {
      setBusy(false);
    }
  };

  const field = (key: keyof typeof form, label: string, props: React.ComponentProps<typeof Input> = {}) => (
    <div className="space-y-1.5">
      <Label htmlFor={`branch-${key}`}>{label}</Label>
      <Input id={`branch-${key}`} value={form[key]} onChange={(e) => set(key)(e.target.value)} {...props} />
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{branch ? `Edit #${branch.code}` : "Add a branch"}</DialogTitle>
          <DialogDescription>
            The store number is how your team and reports name it; the POS store id is how your POS data finds it.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            {field("code", "Store number", { required: true, maxLength: 40 })}
            <div className="sm:col-span-2">{field("name", "Name", { required: true, maxLength: 160 })}</div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Franchisee</Label>
              <Select value={form.franchiseeId} onValueChange={set("franchiseeId")}>
                <SelectTrigger aria-label="Franchisee">
                  <SelectValue placeholder="The brand's own (corporate)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>The brand&apos;s own (corporate)</SelectItem>
                  {(franchisees.data ?? []).map((f) => (
                    <SelectItem key={f.id} value={String(f.id)}>
                      {f.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Region</Label>
              <Select value={form.regionId} onValueChange={set("regionId")}>
                <SelectTrigger aria-label="Region">
                  <SelectValue placeholder="No region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>No region</SelectItem>
                  {(regions.data ?? []).map((r) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(value) => set("status")(value)}>
                <SelectTrigger aria-label="Status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(BRANCH_STATUS_LABELS) as BranchStatus[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {BRANCH_STATUS_LABELS[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {field("externalRef", "POS store id", { maxLength: 80 })}
          </div>
          {field("addressLine", "Address", { maxLength: 255 })}
          <div className="grid gap-4 sm:grid-cols-3">
            {field("city", "City", { maxLength: 120 })}
            {field("state", "State", { maxLength: 80 })}
            {field("postalCode", "Postal code", { maxLength: 20 })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("phone", "Phone", { maxLength: 40 })}
            {field("ianaTimezone", "Timezone (blank = the brand's)", { placeholder: "America/Chicago", maxLength: 64 })}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {field("managerName", "General manager", { maxLength: 160 })}
            {field("managerEmail", "Manager email", { type: "email", maxLength: 255 })}
          </div>
          <FormError message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <RoleButton need={["network.manage"]} type="submit" disabled={busy || !form.code.trim() || !form.name.trim()}>
              {busy ? "Saving…" : branch ? "Save" : "Add branch"}
            </RoleButton>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
