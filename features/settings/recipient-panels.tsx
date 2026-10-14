"use client";

import { useState } from "react";
import { Check, LoaderCircle, MapPin, Users, X } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ReturnLink } from "@/features/settings/return-link";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { useSettingsField } from "@/features/settings/use-settings-field";
import { useCan } from "@/hooks/use-can";
import { isValidEmail } from "@/lib/manager-emails";
import { cn } from "@/lib/utils";
import type { LocationManager } from "@/types/store";

/**
 * Settings → Manager notifications (SPEC-324 over SPEC-057/147/148/149/234). One row per
 * recipient: a location's manager, or the warehouse, support and returns leads. Each row saves
 * on its own to the same endpoint as before, and keeps the deep-link contract — the row a send
 * page points at (`?focus=location-12`, `warehouse`, `support`, `returns`) scrolls into view,
 * takes focus and stays ringed until touched; its save returns to `?return=`.
 */

type RowState = "idle" | "saving" | "saved" | "error";

async function saveRecipient(endpoint: string, email: string, failure: string): Promise<void> {
  const res = await fetch(`/api/proxy${endpoint}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim() || null }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error?.message ?? failure);
  }
}

function RecipientRow({
  anchor,
  inputId,
  label,
  description,
  endpoint,
  placeholder,
  initialEmail,
  failure,
  focused,
  returnTo,
}: {
  anchor: string;
  inputId: string;
  label: string;
  description?: string;
  endpoint: string;
  placeholder: string;
  initialEmail: string | null;
  failure: string;
  focused: boolean;
  returnTo: string | null;
}) {
  const { containerRef, inputRef, highlighted, touched, saved } = useSettingsField({ focused, returnTo });
  const can = useCan();
  const gate = can("settings.manage");
  const [email, setEmail] = useState(initialEmail ?? "");
  const [savedEmail, setSavedEmail] = useState(initialEmail ?? "");
  const [state, setState] = useState<RowState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function persist(value: string) {
    setState("saving");
    setError(null);
    try {
      await saveRecipient(endpoint, value, failure);
      setEmail(value);
      setSavedEmail(value);
      setState("saved");
      saved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save — try again.");
      setState("error");
    }
  }

  function handleSave() {
    const trimmed = email.trim();
    if (trimmed && !isValidEmail(trimmed)) {
      setError("Enter a valid email address.");
      setState("error");
      return;
    }
    void persist(trimmed);
  }

  const dirty = email.trim() !== savedEmail;
  const errorId = `${inputId}-error`;

  return (
    <div
      ref={containerRef}
      id={anchor}
      className={cn(
        "grid grid-cols-1 gap-3 border-t border-border px-5 py-4 first:border-t-0 sm:px-6 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] md:items-center md:gap-8",
        highlighted && "relative z-10 rounded-lg ring-2 ring-primary ring-offset-2 ring-offset-background",
      )}
    >
      <label htmlFor={inputId} className="min-w-0">
        <span className="flex items-center gap-2 text-sm font-medium text-foreground">
          {label}
          {!savedEmail ? (
            <Badge variant="outline" className="h-5 border-warning/30 bg-warning/10 px-1.5 text-[11px] text-warning">
              Missing
            </Badge>
          ) : null}
        </span>
        {description ? <span className="mt-0.5 block text-sm text-muted-foreground">{description}</span> : null}
      </label>
      <div className="flex min-w-0 flex-col gap-2">
        <div className="flex items-center gap-2 md:justify-end">
          <Input
            ref={inputRef}
            id={inputId}
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              touched();
              if (state !== "idle") setState("idle");
            }}
            placeholder={placeholder}
            disabled={!gate.allowed}
            title={gate.reason ?? undefined}
            aria-invalid={state === "error" ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className="w-full md:max-w-sm"
          />
          {savedEmail ? (
            <RoleGate need="settings.manage">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => void persist("")}
                disabled={state === "saving"}
                aria-label={`Remove the email for ${label}`}
                className="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="size-4" aria-hidden />
              </Button>
            </RoleGate>
          ) : null}
          <RoleButton
            need="settings.manage"
            type="button"
            variant="outline"
            onClick={handleSave}
            disabled={state === "saving" || !dirty}
            className="w-20 shrink-0"
          >
            {state === "saving" ? (
              <LoaderCircle className="size-4 animate-spin" aria-label="Saving" />
            ) : state === "saved" && !dirty ? (
              <>
                <Check className="size-4 text-success" aria-hidden />
                <span className="sr-only">Saved</span>
              </>
            ) : (
              "Save"
            )}
          </RoleButton>
        </div>
        {error ? (
          <p id={errorId} role="alert" className="text-sm text-destructive md:text-right">
            {error}
          </p>
        ) : null}
        {focused && returnTo ? (
          <div className="md:self-end">
            <ReturnLink returnTo={returnTo} />
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function LocationManagersPanel({
  locations,
  focusLocationId = null,
  returnTo = null,
}: {
  locations: LocationManager[];
  focusLocationId?: number | null;
  returnTo?: string | null;
}) {
  const configured = locations.filter((l) => l.managerEmail).length;
  return (
    <SettingsPanel
      title="Location managers"
      icon={MapPin}
      description="One contact per location. Dead-inventory alerts, overdue orders and stock transfers go only to the location they are about."
      action={
        locations.length > 0 ? (
          <Badge variant="outline" className="tabular-nums">
            {configured} of {locations.length} set
          </Badge>
        ) : null
      }
    >
      {locations.length > 0 ? (
        locations.map((location) => (
          <RecipientRow
            key={location.locationId}
            anchor={`location-${location.locationId}`}
            inputId={`location-manager-${location.locationId}`}
            label={location.name}
            endpoint={`/settings/locations/${location.locationId}/manager-email`}
            placeholder="manager@store.com"
            initialEmail={location.managerEmail}
            failure="Could not save this location's manager email."
            focused={location.locationId === focusLocationId}
            returnTo={returnTo}
          />
        ))
      ) : (
        <p className="px-5 py-6 text-sm text-muted-foreground sm:px-6">
          No locations synced yet. They appear here after the first Shopify sync.
        </p>
      )}
    </SettingsPanel>
  );
}

export function TeamRecipientsPanel({
  warehouseEmail,
  supportEmail,
  returnsEmail,
  focus,
  returnTo = null,
}: {
  warehouseEmail: string | null;
  supportEmail: string | null;
  returnsEmail: string | null;
  focus: "warehouse" | "support" | "returns" | null;
  returnTo?: string | null;
}) {
  return (
    <SettingsPanel
      title="Team leads"
      icon={Users}
      description="The one person each team's nudges go to."
    >
      <RecipientRow
        anchor="warehouse"
        inputId="warehouse-email"
        label="Warehouse manager"
        description="Runs online fulfillment. The Warehouse page's “email the manager” nudge goes here when the backlog ages."
        endpoint="/settings/warehouse-email"
        placeholder="warehouse@store.com"
        initialEmail={warehouseEmail}
        failure="Could not save the warehouse manager email."
        focused={focus === "warehouse"}
        returnTo={returnTo}
      />
      <RecipientRow
        anchor="support"
        inputId="support-email"
        label="Support lead"
        description="Coaches the support team. Team Performance's “email the lead” nudge goes here when response times slip."
        endpoint="/settings/support-email"
        placeholder="support-lead@store.com"
        initialEmail={supportEmail}
        failure="Could not save the support lead email."
        focused={focus === "support"}
        returnTo={returnTo}
      />
      <RecipientRow
        anchor="returns"
        inputId="returns-email"
        label="Returns lead"
        description="Clears the returns queue. The Returns page's “email the lead” nudge goes here when returns pile up."
        endpoint="/settings/returns-email"
        placeholder="returns@store.com"
        initialEmail={returnsEmail}
        failure="Could not save the returns lead email."
        focused={focus === "returns"}
        returnTo={returnTo}
      />
    </SettingsPanel>
  );
}
