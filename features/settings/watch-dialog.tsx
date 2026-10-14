"use client";

import { useState } from "react";
import { Eye } from "lucide-react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  PERIOD_LABELS,
  RECIPIENT_LABELS,
  UNIT_SUFFIX,
  emptyForm,
  formFromWatch,
  metricNeedsProduct,
  metricTakesProduct,
  previewRule,
  validateWatchForm,
  type WatchFormValue,
} from "@/lib/watchlist";
import { cn } from "@/lib/utils";
import type { Watch, WatchMetric, WatchRecipient } from "@/types/watch";
import { currencySymbol } from "@/utils/format";

const RECIPIENT_KEYS = Object.keys(RECIPIENT_LABELS) as WatchRecipient[];

interface WatchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  metrics: WatchMetric[];
  recipients: Record<WatchRecipient, boolean>;
  /** Edit when given, create otherwise. */
  initial?: Watch;
  /** Resolves when saved; rejects with the message to show. */
  onSubmit: (value: WatchFormValue) => Promise<void>;
}

/**
 * New / edit watch (SPEC-262): what to watch, the product when it takes one, the
 * period, the line and the direction, and who is told. The metric's own unit
 * labels the threshold, the preview line reads the rule back in the backend's
 * wording, and a role email that is not set in Settings warns before the save.
 * The form mounts with the dialog so every open starts clean.
 */
export function WatchDialog({ open, onOpenChange, metrics, recipients, initial, onSubmit }: WatchDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <WatchForm
          metrics={metrics}
          recipients={recipients}
          initial={initial}
          onSubmit={onSubmit}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

function WatchForm({
  metrics,
  recipients,
  initial,
  onSubmit,
  onClose,
}: {
  metrics: WatchMetric[];
  recipients: Record<WatchRecipient, boolean>;
  initial?: Watch;
  onSubmit: (value: WatchFormValue) => Promise<void>;
  onClose: () => void;
}) {
  const editing = initial !== undefined;
  const [value, setValue] = useState<WatchFormValue>(() =>
    initial ? formFromWatch(initial) : emptyForm(metrics),
  );
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const metric = metrics.find((m) => m.key === value.metric);
  const symbol = currencySymbol();
  const errors = validateWatchForm(value, metrics);
  const preview = previewRule(value, metrics);
  const emailMissing = value.notifyEmail !== "" && !recipients[value.notifyEmail];

  function patch(next: Partial<WatchFormValue>) {
    setValue((current) => ({ ...current, ...next }));
    setServerError(null);
    setCandidates([]);
  }

  function pickMetric(key: string) {
    const picked = metrics.find((m) => m.key === key);
    patch({
      metric: key,
      period: picked?.periods[0] ?? "",
      productQuery: metricTakesProduct(picked) ? value.productQuery : "",
    });
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0 || saving) return;
    setSaving(true);
    setServerError(null);
    try {
      await onSubmit(value);
      onClose();
    } catch (failure) {
      const message = failure instanceof Error ? failure.message : "Saving the watch failed.";
      setServerError(message);
      const list = (failure as { candidates?: string[] }).candidates;
      setCandidates(Array.isArray(list) ? list : []);
      setSaving(false);
    }
  }

  const show = (field: keyof WatchFormValue) => (touched ? errors[field] : undefined);

  return (
    <form onSubmit={submit} className="space-y-4" data-watch-form>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Eye className="size-4 text-ai" aria-hidden />
          {editing ? "Edit watch" : "New watch"}
        </DialogTitle>
        <DialogDescription>
          {editing
            ? "Changing the line re-arms the watch from where the figure stands now."
            : "Checked on every sync. It fires once when the line is crossed and again only after the figure comes back inside."}
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-2">
        <Label htmlFor="watch-metric">Watch</Label>
        <Select value={value.metric} onValueChange={pickMetric} disabled={editing}>
          <SelectTrigger id="watch-metric" className="h-9 w-full" data-watch-metric>
            <SelectValue placeholder="What to watch" />
          </SelectTrigger>
          <SelectContent>
            {metrics.map((m) => (
              <SelectItem key={m.key} value={m.key}>
                {m.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {metric && <p className="text-xs text-muted-foreground">{metric.hint}</p>}
      </div>

      {metricTakesProduct(metric) && (
        <div className="space-y-2">
          <Label htmlFor="watch-product">
            Product{metricNeedsProduct(metric) ? "" : <span className="text-muted-foreground"> — optional, whole store when empty</span>}
          </Label>
          <Input
            id="watch-product"
            value={value.productQuery}
            onChange={(event) => patch({ productQuery: event.target.value })}
            placeholder="Linen Shirt – Natural"
            disabled={editing}
            aria-invalid={show("productQuery") ? true : undefined}
            data-watch-product
          />
          {show("productQuery") && <p className="text-xs text-destructive">{errors.productQuery}</p>}
          {candidates.length > 0 && (
            <div className="flex flex-wrap gap-1.5" data-watch-candidates>
              {candidates.map((name) => (
                <button
                  key={name}
                  type="button"
                  onClick={() => patch({ productQuery: name })}
                  className="rounded-md border bg-background px-2 py-0.5 text-xs font-medium transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring outline-none"
                >
                  {name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={cn("grid gap-3", metric && metric.periods.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
        <div className="space-y-2">
          <Label htmlFor="watch-direction">When it goes</Label>
          <Select value={value.direction} onValueChange={(d) => patch({ direction: d as WatchFormValue["direction"] })}>
            <SelectTrigger id="watch-direction" className="h-9 w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="above">Above</SelectItem>
              <SelectItem value="below">Below</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="watch-threshold">The line</Label>
          <div className="relative">
            {metric?.unit === "usd" && (
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-muted-foreground">{symbol}</span>
            )}
            <Input
              id="watch-threshold"
              inputMode="decimal"
              value={value.threshold}
              onChange={(event) => patch({ threshold: event.target.value })}
              placeholder={metric?.unit === "pct" ? "20" : "0"}
              className={cn(metric?.unit === "usd" && (symbol.length > 1 ? "pl-10" : "pl-7"), metric && metric.unit !== "usd" && UNIT_SUFFIX[metric.unit] && "pr-12")}
              aria-invalid={show("threshold") ? true : undefined}
              data-watch-threshold
            />
            {metric && metric.unit !== "usd" && UNIT_SUFFIX[metric.unit] && (
              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-xs text-muted-foreground">
                {UNIT_SUFFIX[metric.unit]}
              </span>
            )}
          </div>
          {show("threshold") && <p className="text-xs text-destructive">{errors.threshold}</p>}
        </div>
        {metric && metric.periods.length > 0 && (
          <div className="space-y-2">
            <Label htmlFor="watch-period">Over</Label>
            <Select value={value.period} onValueChange={(p) => patch({ period: p })}>
              <SelectTrigger id="watch-period" className="h-9 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {metric.periods.map((p) => (
                  <SelectItem key={p} value={p}>
                    {PERIOD_LABELS[p] ?? p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      <div className="space-y-2 rounded-lg border bg-muted/40 p-3">
        <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">Tell</p>
        <label className="flex items-center justify-between gap-3 text-sm">
          <span>
            Nudge on the Ask Glisp button
            <span className="block text-xs text-muted-foreground">On every page, the moment it fires.</span>
          </span>
          <Switch
            checked={value.notifyNudge}
            onCheckedChange={(checked) => patch({ notifyNudge: checked })}
            aria-label="Nudge on the button"
            className="data-[state=checked]:bg-ai"
          />
        </label>
        <div className="flex items-center justify-between gap-3 text-sm">
          <Label htmlFor="watch-email" className="font-normal">
            Email
          </Label>
          <Select
            value={value.notifyEmail === "" ? "none" : value.notifyEmail}
            onValueChange={(v) => patch({ notifyEmail: v === "none" ? "" : (v as WatchRecipient) })}
          >
            <SelectTrigger id="watch-email" className="h-8 w-56" data-watch-email>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nobody</SelectItem>
              {RECIPIENT_KEYS.map((key) => (
                <SelectItem key={key} value={key}>
                  {RECIPIENT_LABELS[key]}
                  {!recipients[key] && <span className="text-muted-foreground"> · not set</span>}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {emailMissing && (
          <p className="text-xs text-warning">
            That address is not set in Settings → Manager Notifications yet — the nudge still shows; the email will say why it did not go.
          </p>
        )}
        {show("notifyEmail") && <p className="text-xs text-destructive">{errors.notifyEmail}</p>}
      </div>

      <p className="min-h-4 text-xs text-muted-foreground" data-watch-preview>
        {serverError ? (
          <span className="text-destructive">{serverError}</span>
        ) : preview ? (
          <>
            Rule: <span className="font-medium text-foreground">{preview}</span>
          </>
        ) : (
          "Fill in the line to see the rule."
        )}
      </p>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving} data-watch-save>
          {saving ? "Saving…" : editing ? "Save" : "Start watching"}
        </Button>
      </DialogFooter>
    </form>
  );
}
