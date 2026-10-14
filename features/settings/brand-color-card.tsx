"use client";

import { useId, useMemo, useState } from "react";
import { Check, LoaderCircle, TriangleAlert } from "lucide-react";

import { useConfirm } from "@/components/shared/confirm-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { BrandColorPreview } from "@/features/settings/brand-color-preview";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  NEAR_DESTRUCTIVE_NOTE,
  PLATFORM_RED,
  adjustedNote,
  brandTheme,
  colorChanged,
  hexFieldError,
  normaliseHex,
  textOn,
  type BrandColor,
  type BrandColorSource,
} from "@/lib/brand-color";
import { brandingQueries } from "@/lib/queries/branding";
import { cn } from "@/lib/utils";
import { PRODUCT } from "@/lib/product";

/** The colours read from the logo (backend SPEC-323): loading, failed with a retry, empty, or
 * the swatches. Only asked for when there is a logo to read. */
function LogoSwatches({
  enabled,
  selected,
  onPick,
}: {
  enabled: boolean;
  selected: string | null;
  onPick: (hex: string) => void;
}) {
  const palette = useApiQuery(enabled ? brandingQueries.palette() : null);

  if (!enabled) {
    return <p className="text-sm text-muted-foreground">Upload a logo to get colour suggestions.</p>;
  }
  if (palette.error) {
    return (
      <div className="flex flex-wrap items-center gap-3" role="alert">
        <p className="text-sm text-muted-foreground">The colours in your logo could not be read.</p>
        <Button size="sm" variant="outline" onClick={() => void palette.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  if (!palette.data) {
    return (
      <div className="flex gap-2" aria-busy="true" aria-label="Reading the colours in your logo">
        {Array.from({ length: 5 }, (_, i) => (
          <Skeleton key={i} className="size-10 rounded-full" />
        ))}
      </div>
    );
  }
  if (palette.data.colors.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No colours could be read from your logo — choose one below.
      </p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {palette.data.colors.map((hex) => {
        const active = hex === selected;
        return (
          <button
            key={hex}
            type="button"
            aria-pressed={active}
            aria-label={`Use ${hex}`}
            title={hex}
            onClick={() => onPick(hex)}
            // The swatch shows a colour from the data; it is the one place a value is drawn.
            style={{ backgroundColor: hex, color: textOn(hex) }}
            className={cn(
              "flex size-10 items-center justify-center rounded-full border border-border outline-none transition-shadow duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50",
              active && "ring-2 ring-foreground ring-offset-2 ring-offset-card",
            )}
          >
            {active ? <Check className="size-4" aria-hidden /> : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Settings → Branding → Brand colour (SPEC-322 §3): suggested from the logo or chosen freely,
 * previewed in both themes before it is saved. Save and Reset refresh the route, so the server
 * layout's `<style>` recolours the whole app at once. A viewer without `settings.manage` sees the
 * colour and its preview only.
 */
export function BrandColorCard({
  saved,
  hasLogo,
  canManage,
  onSave,
  onReset,
}: {
  saved: BrandColor | null;
  hasLogo: boolean;
  canManage: boolean;
  onSave: (hex: string, source: BrandColorSource) => Promise<void>;
  onReset: () => Promise<void>;
}) {
  const confirm = useConfirm();
  const hexId = useId();
  const [choice, setChoice] = useState<BrandColor | null>(saved);
  const [text, setText] = useState(saved?.hex ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useMemo(() => brandTheme(choice?.hex), [choice]);
  const fieldError = hexFieldError(text);
  const note = theme ? adjustedNote(theme.adjusted) : null;

  function choose(hex: string, source: BrandColorSource) {
    setChoice({ hex, source });
    setText(hex);
    setError(null);
  }

  function typed(value: string) {
    setText(value);
    const hex = normaliseHex(value);
    if (hex) setChoice({ hex, source: "custom" });
  }

  async function act(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "The colour could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    const yes = await confirm({
      title: `Reset to the ${PRODUCT.short} red?`,
      body: "The whole app and your login screen go back to the platform's own colours.",
      confirmLabel: "Reset",
      destructive: false,
    });
    if (yes) await act(onReset);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Brand colour</CardTitle>
        <CardDescription>
          Primary buttons, the active page in the sidebar, links, focus rings and your login screen take
          this colour, in both themes. Error, success and warning colours never change.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {canManage ? (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <section className="space-y-3" aria-labelledby={`${hexId}-logo`}>
              <h3 id={`${hexId}-logo`} className="text-sm font-medium">
                From your logo
              </h3>
              <LogoSwatches
                enabled={hasLogo}
                selected={choice?.source === "logo" ? choice.hex : null}
                onPick={(hex) => choose(hex, "logo")}
              />
            </section>
            <section className="space-y-3" aria-labelledby={`${hexId}-custom`}>
              <h3 id={`${hexId}-custom`} className="text-sm font-medium">
                Custom
              </h3>
              <div className="flex items-start gap-2">
                <input
                  type="color"
                  aria-label="Pick a colour"
                  value={choice?.hex ?? PLATFORM_RED}
                  onChange={(event) => choose(event.target.value.toLowerCase(), "custom")}
                  className="h-9 w-12 shrink-0 cursor-pointer rounded-md border border-input bg-card p-1"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <label htmlFor={hexId} className="sr-only">
                    Colour as a hex code
                  </label>
                  <Input
                    id={hexId}
                    value={text}
                    placeholder="#rrggbb"
                    spellCheck={false}
                    autoComplete="off"
                    maxLength={7}
                    aria-invalid={fieldError ? true : undefined}
                    aria-describedby={fieldError ? `${hexId}-error` : undefined}
                    onChange={(event) => typed(event.target.value)}
                    className="font-mono"
                  />
                  {fieldError ? (
                    <p id={`${hexId}-error`} className="text-xs text-destructive">
                      {fieldError}
                    </p>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            {saved ? (
              <>
                Your brand colour is <span className="font-mono text-foreground">{saved.hex}</span>.
              </>
            ) : (
              `Using the ${PRODUCT.short} red.`
            )}
          </p>
        )}

        <BrandColorPreview theme={theme} />

        {note || theme?.nearDestructive ? (
          <div className="space-y-1 text-xs text-muted-foreground">
            {note ? <p>{note}</p> : null}
            {theme?.nearDestructive ? (
              <p className="flex items-center gap-1.5">
                <TriangleAlert className="size-3.5 shrink-0 text-warning" aria-hidden />
                {NEAR_DESTRUCTIVE_NOTE}
              </p>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <p role="alert" className="text-sm text-destructive">
            {error}
          </p>
        ) : null}

        {canManage ? (
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              disabled={busy || fieldError !== null || !colorChanged(saved, choice)}
              onClick={() => {
                if (choice) void act(() => onSave(choice.hex, choice.source));
              }}
            >
              {busy ? <LoaderCircle className="animate-spin" aria-hidden /> : null}
              Save
            </Button>
            {saved ? (
              <Button size="sm" variant="outline" disabled={busy} onClick={() => void reset()}>
                Reset to the {PRODUCT.short} red
              </Button>
            ) : null}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
