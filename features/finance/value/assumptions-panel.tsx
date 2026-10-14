"use client";

import { useState } from "react";
import { ExternalLink } from "lucide-react";

import { StatusBadge } from "@/components/shared/status-badge";
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
import { Section } from "@/features/finance/finance-ui";
import { assumptionDisplay, changedAssumptions } from "@/lib/finance-value";
import type { ValueAssumption, ValueExposure } from "@/types/finance";

/**
 * The numbers the books cannot know (SPEC-330): an hour's cost, what idle cash earns, how
 * often a vendor really charges a late fee. Each shows its value, where the default came
 * from, and whether it is a cited benchmark or our own estimate. Measured money never
 * depends on any of them.
 */
export function AssumptionsPanel({
  assumptions,
  editable,
  saving,
  onSave,
}: {
  assumptions: ValueAssumption[];
  editable: boolean;
  saving: boolean;
  onSave: (values: Record<string, number>) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Section
      title="Assumptions"
      meta="estimates only — measured money never uses these"
      actions={
        editable ? (
          <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
            Edit
          </Button>
        ) : null
      }
    >
      <ul className="divide-y divide-border">
        {assumptions.map((a) => (
          <li key={a.key} className="space-y-1 px-3 py-2.5">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-sm font-medium">{a.label}</span>
              <span className="ml-auto text-sm font-semibold tabular-nums">{assumptionDisplay(a)}</span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
              <StatusBadge tone={a.kind === "benchmark" ? "neutral" : "warning"}>
                {a.kind === "benchmark" ? "Benchmark" : "Our estimate"}
              </StatusBadge>
              {a.value !== a.default && <span>Default {assumptionDisplay(a, a.default)}</span>}
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {a.source}
              {a.url && (
                <>
                  {" "}
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-0.5 underline underline-offset-2 hover:text-foreground"
                  >
                    Source <ExternalLink className="size-3" aria-hidden />
                  </a>
                </>
              )}
            </p>
          </li>
        ))}
      </ul>
      {open && (
        <AssumptionsDialog
          assumptions={assumptions}
          saving={saving}
          onClose={() => setOpen(false)}
          onSave={async (values) => {
            if (await onSave(values)) setOpen(false);
          }}
        />
      )}
    </Section>
  );
}

function AssumptionsDialog({
  assumptions,
  saving,
  onClose,
  onSave,
}: {
  assumptions: ValueAssumption[];
  saving: boolean;
  onClose: () => void;
  onSave: (values: Record<string, number>) => Promise<void>;
}) {
  const [inputs, setInputs] = useState<Record<string, string>>(() =>
    Object.fromEntries(assumptions.map((a) => [a.key, String(a.value)])),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            const result = changedAssumptions(assumptions, inputs);
            setErrors(result.errors);
            if (Object.keys(result.errors).length) return;
            if (!Object.keys(result.values).length) return onClose();
            void onSave(result.values);
          }}
        >
          <DialogHeader>
            <DialogTitle>Value assumptions</DialogTitle>
            <DialogDescription>
              Set these to your business. They change the estimates only — money kept from your books is never
              estimated.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {assumptions.map((a) => (
              <div key={a.key} className="space-y-1">
                <Label htmlFor={`assumption-${a.key}`}>{a.label}</Label>
                <Input
                  id={`assumption-${a.key}`}
                  inputMode="decimal"
                  value={inputs[a.key] ?? ""}
                  aria-invalid={errors[a.key] != null}
                  aria-describedby={errors[a.key] ? `assumption-${a.key}-error` : undefined}
                  onChange={(event) => setInputs((current) => ({ ...current, [a.key]: event.target.value }))}
                />
                {errors[a.key] ? (
                  <p id={`assumption-${a.key}-error`} className="text-xs text-destructive">
                    {errors[a.key]}
                  </p>
                ) : (
                  <p className="text-[11px] text-muted-foreground">Default {assumptionDisplay(a, a.default)}</p>
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/** Industry context, never added to any total: how big the risk is, not what happened here. */
export function ExposurePanel({ exposure }: { exposure: ValueExposure[] }) {
  if (!exposure.length) return null;
  return (
    <Section title="Fraud exposure" meta="industry figures — not added to any total">
      <ul className="divide-y divide-border">
        {exposure.map((item) => (
          <li key={item.source} className="space-y-1 px-3 py-2.5 text-sm">
            <p className="leading-relaxed">{item.text}</p>
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-0.5 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground"
            >
              {item.source} <ExternalLink className="size-3" aria-hidden />
            </a>
          </li>
        ))}
      </ul>
      <p className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
        Finance flags new vendors and bills that look like a second copy — the patterns these frauds use.
      </p>
    </Section>
  );
}
