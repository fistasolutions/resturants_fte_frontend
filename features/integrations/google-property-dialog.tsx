"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Check, LoaderCircle, RefreshCw } from "lucide-react";

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
import { Skeleton } from "@/components/ui/skeleton";
import { useApiQuery } from "@/hooks/use-api-query";
import { defaultProperty, permissionLabel, propertyDisplay } from "@/lib/gsc-sync";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";
import { chooseGoogleProperty } from "@/services/google-actions";
import type { GoogleProperty, GoogleStatus } from "@/types/spotlight";

interface GooglePropertyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The property currently stored for the store — pre-selected when reopened
   * from "Change property". */
  current: string | null;
  /** Called with the status the backend returned after the choice — already
   * `sync.state === "running"`. */
  onChosen: (status: GoogleStatus) => void;
}

/**
 * The property picker (SPEC-250; backend SPEC-257). Opens on return from Google's
 * consent screen and from "Change property". Lists every Search Console property
 * the connected account can see as a radio group: the store's own site first and
 * pre-selected, unverified sites disabled with the reason. "Use this property"
 * persists the choice and the first pull starts on the server before it returns.
 */
export function GooglePropertyDialog({
  open,
  onOpenChange,
  current,
  onChosen,
}: GooglePropertyDialogProps) {
  const queryClient = useQueryClient();
  const query = useApiQuery(open ? integrationQueries.googleProperties() : null, {
    staleTime: 0,
  });
  // The owner's explicit pick; until they make one the selection is derived —
  // the stored property if still selectable, else the recommended one.
  const [override, setOverride] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const properties = query.data?.properties ?? [];
  const selected = override ?? defaultProperty(properties, query.data?.selected ?? current);

  function setSelected(siteUrl: string) {
    setOverride(siteUrl);
  }

  function close() {
    setOverride(null);
    setError(null);
    setSaving(false);
    onOpenChange(false);
  }

  async function handleUse() {
    if (!selected) return;
    setSaving(true);
    setError(null);
    try {
      const status = await chooseGoogleProperty(selected);
      queryClient.setQueryData(integrationQueries.googleStatus().queryKey, status);
      onChosen(status);
      close();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the property. Try again.");
      setSaving(false);
    }
  }

  /** Roving tabindex: arrow keys move focus *and* selection through the enabled
   * radios, wrapping — the WAI-ARIA radio-group pattern. */
  function moveSelection(group: HTMLDivElement, direction: 1 | -1) {
    const radios = Array.from(
      group.querySelectorAll<HTMLButtonElement>('[role="radio"]:not([disabled])'),
    );
    if (radios.length === 0) return;
    const active = radios.findIndex((radio) => radio === document.activeElement);
    const from = active >= 0 ? active : radios.findIndex((radio) => radio.dataset.siteUrl === selected);
    const next = radios[(from + direction + radios.length) % radios.length];
    next.focus();
    if (next.dataset.siteUrl) setSelected(next.dataset.siteUrl);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (saving) return;
        if (next) onOpenChange(true);
        else close();
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose a Search Console property</DialogTitle>
          <DialogDescription>
            {query.data?.selected
              ? "Pick the property the platform should read search data from. Changing it re-syncs at once."
              : "Google is connected. Pick the property the platform should read search data from — the first sync starts as soon as you choose."}
          </DialogDescription>
        </DialogHeader>

        {query.isPending ? (
          <div className="space-y-2" aria-busy="true" aria-label="Loading properties">
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        ) : query.isError ? (
          <div className="space-y-3">
            <p role="alert" className="text-sm text-destructive">
              {query.error.message}
            </p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              <RefreshCw className="size-4" aria-hidden />
              Try again
            </Button>
          </div>
        ) : properties.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              This Google account can&apos;t see any Search Console property. In Search
              Console, add it as a user on your site&apos;s property, then refresh.
            </p>
            <Button variant="outline" size="sm" onClick={() => void query.refetch()}>
              <RefreshCw className="size-4" aria-hidden />
              Refresh
            </Button>
          </div>
        ) : (
          <div
            role="radiogroup"
            aria-label="Search Console properties"
            className="max-h-[50vh] space-y-2 overflow-y-auto pr-1"
            onKeyDown={(event) => {
              if (event.key === "ArrowDown" || event.key === "ArrowRight") {
                event.preventDefault();
                moveSelection(event.currentTarget, 1);
              } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
                event.preventDefault();
                moveSelection(event.currentTarget, -1);
              }
            }}
          >
            {properties.map((property) => (
              <PropertyRow
                key={property.siteUrl}
                property={property}
                checked={property.siteUrl === selected}
                disabled={!property.selectable || saving}
                onSelect={() => setSelected(property.siteUrl)}
              />
            ))}
          </div>
        )}

        {error && (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={saving}>
            Cancel
          </Button>
          <RoleButton need="integrations.manage" onClick={handleUse} disabled={!selected || saving || query.isPending}>
            {saving ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden />
                Saving…
              </>
            ) : (
              "Use this property"
            )}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PropertyRow({
  property,
  checked,
  disabled,
  onSelect,
}: {
  property: GoogleProperty;
  checked: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  const { name, kind } = propertyDisplay(property.siteUrl);
  return (
    <button
      type="button"
      role="radio"
      aria-checked={checked}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      data-site-url={property.siteUrl}
      tabIndex={checked ? 0 : -1}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60",
        disabled && "cursor-not-allowed opacity-60 hover:bg-transparent",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex size-4 shrink-0 items-center justify-center rounded-full border",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border",
        )}
      >
        {checked && <Check className="size-3" />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-foreground">{name}</span>
          {property.recommended && (
            <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 text-[10px] font-medium tracking-wide text-success uppercase">
              Recommended
            </span>
          )}
        </span>
        <span className="block truncate text-xs text-muted-foreground">
          {kind} · {permissionLabel(property.permissionLevel)}
        </span>
      </span>
    </button>
  );
}
