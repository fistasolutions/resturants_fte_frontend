"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import {
  isValid,
  validateCampaignDraft,
  type CampaignDraftInput,
  type ValidationErrors,
} from "@/lib/ads-controls";
import { restaurantQueries } from "@/lib/queries/restaurant";
import { createCampaign } from "@/services/ads-actions";

const EMPTY: CampaignDraftInput = {
  name: "",
  channel: "meta",
  objective: "Conversions",
  persona: "",
  offer: "",
  dailyCap: "",
  totalCap: "",
};

function Field({
  id,
  label,
  value,
  onChange,
  error,
  placeholder,
  inputMode,
}: {
  id: keyof CampaignDraftInput;
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
  inputMode?: "decimal";
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        value={value}
        placeholder={placeholder}
        inputMode={inputMode}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
      />
      {error && (
        <p id={`${id}-error`} role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * Creates a campaign (SPEC-183).
 *
 * The copy is deliberate: a campaign is born a **draft** and spends nothing. Only an
 * approved spend gate makes it live, so this dialog must never read like a launch
 * button — that is the trust model the whole feature is built on.
 */
export function CreateCampaignDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CampaignDraftInput>(EMPTY);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, startTransition] = useTransition();
  const can = useCan();
  // SPEC-387: a restaurant brand may aim a campaign at one branch (local store marketing).
  const restaurant = useWorkspace().features.includes("restaurant");
  const branches = useApiQuery(restaurant && open ? restaurantQueries.branches({ status: "open" }) : null);
  const [branchId, setBranchId] = useState("");

  const set = (key: keyof CampaignDraftInput) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const submit = () => {
    const found = validateCampaignDraft(form);
    setErrors(found);
    setFailure(null);
    if (!isValid(found)) return;
    startTransition(async () => {
      try {
        await createCampaign({
          name: form.name.trim(),
          channel: form.channel,
          objective: form.objective.trim(),
          persona: form.persona.trim(),
          offer: form.offer.trim(),
          daily_cap: form.dailyCap.trim(),
          total_cap: form.totalCap.trim() || "0",
          ...(restaurant && branchId ? { branch_id: Number(branchId) } : {}),
        });
        setForm(EMPTY);
        setBranchId("");
        setOpen(false);
        router.refresh();
      } catch (cause) {
        setFailure(cause instanceof Error ? cause.message : "That did not save.");
      }
    });
  };

  // A role without campaign management sees the button disabled with the reason (SPEC-358).
  if (!can("ads.manage").allowed) {
    return (
      <RoleButton need="ads.manage" size="sm">
        <Plus className="size-4" aria-hidden />
        New campaign
      </RoleButton>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" aria-hidden />
          New campaign
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>New campaign</DialogTitle>
          <DialogDescription>
            This creates a <strong>draft</strong>. It spends nothing until you approve
            the request to launch it, and it can never spend past the caps you set here.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Field
            id="name"
            label="Name"
            value={form.name}
            onChange={set("name")}
            error={errors.name}
            placeholder={restaurant ? "Downtown — Tuesday pizza night" : "Fall dresses — prospecting"}
          />
          <div className="space-y-1.5">
            <Label htmlFor="channel">Channel</Label>
            <select
              id="channel"
              value={form.channel}
              onChange={(event) => set("channel")(event.target.value)}
              className="h-10 w-full rounded-input border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <option value="meta">Meta</option>
              <option value="google">Google</option>
            </select>
          </div>
          <Field
            id="objective"
            label="Objective"
            value={form.objective}
            onChange={set("objective")}
            error={errors.objective}
          />
          <Field
            id="persona"
            label="Target persona"
            value={form.persona}
            onChange={set("persona")}
            error={errors.persona}
            placeholder="The First-Time Visitor"
          />
          <Field
            id="offer"
            label="Offer"
            value={form.offer}
            onChange={set("offer")}
            error={errors.offer}
            placeholder={restaurant ? "Two large pizzas for $20" : "Fall dresses"}
          />
          {restaurant ? (
            <div className="space-y-1.5">
              <Label htmlFor="branch">Branch</Label>
              <select
                id="branch"
                value={branchId}
                onChange={(event) => setBranchId(event.target.value)}
                className="h-10 w-full rounded-input border border-input bg-background px-3 text-sm text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <option value="">Every branch (brand campaign)</option>
                {(branches.data ?? []).map((branch) => (
                  <option key={branch.id} value={String(branch.id)}>
                    #{branch.code} {branch.name}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                A branch campaign is read against that branch&apos;s sales, and its ad link opens the branch&apos;s page.
              </p>
            </div>
          ) : null}
          <div className="grid grid-cols-2 gap-3">
            <Field
              id="dailyCap"
              label="Daily cap"
              value={form.dailyCap}
              onChange={set("dailyCap")}
              error={errors.dailyCap}
              placeholder="100"
              inputMode="decimal"
            />
            <Field
              id="totalCap"
              label="Total cap"
              value={form.totalCap}
              onChange={set("totalCap")}
              error={errors.totalCap}
              placeholder="1000"
              inputMode="decimal"
            />
          </div>
          {failure && (
            <p role="alert" className="text-sm text-destructive">
              {failure}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
            Cancel
          </Button>
          <RoleButton need="ads.manage" onClick={submit} disabled={busy}>
            Create draft
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
