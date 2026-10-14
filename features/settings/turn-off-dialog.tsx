"use client";

import { useId, useState } from "react";
import { TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCan } from "@/hooks/use-can";
import { usedElsewhere, type UnitSwitch } from "@/lib/company-switches";
import { integrationName } from "@/lib/disclosure";
import type { Visibility } from "@/lib/guided-view";
import type { Permission } from "@/lib/permissions";
import { cn } from "@/lib/utils";
import { disconnectMetaAds } from "@/services/ad-platforms-actions";
import { setEmployeeActive } from "@/services/employees-actions";
import { disconnectAllQuickBooks } from "@/services/finance-actions";
import { disconnectGoogle } from "@/services/google-actions";
import { disconnectIntegration } from "@/services/integration-hub-actions";
import { disconnectMeta } from "@/services/meta-actions";
import { setPageEnabled } from "@/services/workspace-actions";

/** Turning a page off for everyone is a company setting (backend SPEC-368's policy). */
const COMPANY_NEED: Permission = "settings.manage";

/** What disconnecting each system needs — the same permissions its own disconnect checks. */
const DISCONNECT_NEED: Readonly<Record<string, readonly Permission[]>> = {
  quickbooks: ["finance.manage", "integrations.manage"],
  meta_ads: ["ads.manage", "integrations.manage"],
};
const DEFAULT_DISCONNECT_NEED: readonly Permission[] = ["integrations.manage"];

async function disconnect(integration: string): Promise<void> {
  switch (integration) {
    case "google":
      await disconnectGoogle();
      return;
    case "meta":
      await disconnectMeta();
      return;
    case "meta_ads":
      await disconnectMetaAds();
      return;
    case "quickbooks":
      await disconnectAllQuickBooks();
      return;
    default:
      await disconnectIntegration(integration);
  }
}

type Choice = "me" | "everyone";

/**
 * Turning a row off, for an owner or admin (SPEC-360): hide it for me only (the personal choice
 * every member has), or turn it off for everyone — optionally disconnecting what it reads, with
 * a warning naming everything else that reads the same system. Turning off never deletes data.
 */
export function TurnOffDialog({
  unit,
  visibility,
  connected,
  onHideForMe,
  onDone,
  onClose,
}: {
  unit: UnitSwitch | null;
  visibility: Visibility;
  connected: readonly string[];
  onHideForMe: (unit: UnitSwitch) => void;
  onDone: (message: string) => void;
  onClose: () => void;
}) {
  const can = useCan();
  const [choice, setChoice] = useState<Choice>("me");
  const [drop, setDrop] = useState<ReadonlySet<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const meId = useId();
  const everyoneId = useId();

  const reset = () => {
    setChoice("me");
    setDrop(new Set());
    setError(null);
    setBusy(false);
  };
  const close = () => {
    reset();
    onClose();
  };

  if (!unit) return null;
  const disconnectable = unit.integrations.filter(
    (key) => connected.includes(key) && can([...(DISCONNECT_NEED[key] ?? DEFAULT_DISCONNECT_NEED)]).allowed,
  );
  const canCompany = can(COMPANY_NEED).allowed;

  const confirm = async () => {
    if (choice === "me") {
      onHideForMe(unit);
      close();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (unit.kind === "employee") await setEmployeeActive(unit.unit, false);
      else await setPageEnabled(unit.unit, false);
      const dropped = [...drop];
      for (const key of dropped) await disconnect(key);
      onDone(
        dropped.length
          ? `${unit.label} is off for everyone, and ${dropped.map(integrationName).join(" and ")} is disconnected.`
          : `${unit.label} is off for everyone.`,
      );
      close();
    } catch (cause) {
      setBusy(false);
      setError(cause instanceof Error ? cause.message : "Couldn't turn it off.");
    }
  };

  const option = (id: string, value: Choice, title: string, body: string) => (
    <label
      htmlFor={id}
      className={cn(
        "flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors",
        choice === value ? "border-foreground bg-muted/40" : "border-border hover:bg-muted/30",
      )}
    >
      <input
        id={id}
        type="radio"
        name="turn-off"
        className="mt-1 accent-primary"
        checked={choice === value}
        onChange={() => setChoice(value)}
      />
      <span>
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{body}</span>
      </span>
    </label>
  );

  return (
    <Dialog open onOpenChange={(open) => (open ? undefined : close())}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Turn off {unit.label}?</DialogTitle>
          <DialogDescription>Choose who it goes away for. Nothing is deleted either way.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          {option(meId, "me", "Hide it for me only", "Everyone else keeps it. Bring it back here any time.")}
          {canCompany
            ? option(
                everyoneId,
                "everyone",
                "Turn it off for everyone",
                "It leaves everyone's sidebar. Its data stays, and an owner or admin can turn it back on.",
              )
            : null}
          {choice === "everyone" && disconnectable.length > 0 ? (
            <div className="space-y-2 rounded-xl border border-border p-3">
              {disconnectable.map((key) => {
                const others = usedElsewhere(visibility, key, unit.unit);
                const checked = drop.has(key);
                const id = `${meId}-${key}`;
                return (
                  <div key={key} className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id={id}
                        checked={checked}
                        onCheckedChange={(value) => {
                          const next = new Set(drop);
                          if (value === true) next.add(key);
                          else next.delete(key);
                          setDrop(next);
                        }}
                      />
                      <label htmlFor={id} className="text-sm">
                        Also disconnect {integrationName(key)}
                      </label>
                    </div>
                    {checked && others.length > 0 ? (
                      <p className="flex gap-2 rounded-lg bg-warning/10 px-2.5 py-2 text-xs text-warning">
                        <TriangleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                        <span>
                          {integrationName(key)} is also used by {others.join(", ")}. Disconnecting stops those too;
                          what they already synced stays.
                        </span>
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          ) : null}
          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void confirm()} disabled={busy}>
            {busy ? "Turning off…" : choice === "me" ? "Hide for me" : "Turn off for everyone"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
