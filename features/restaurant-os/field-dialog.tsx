"use client";

import { useId, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormError } from "@/features/restaurant/parts";
import type { Parsed } from "@/lib/restaurant-forms";

export interface DialogField {
  key: string;
  label: string;
  defaultValue: string;
  inputMode?: "numeric" | "decimal" | "text";
  placeholder?: string;
}

/**
 * A small form in a dialog (SPEC-398): labelled inputs, an inline reason when a value is refused,
 * and the server's own message when the save fails. It closes only after a successful save.
 */
export function FieldDialog<T>({
  title,
  description,
  fields,
  confirmLabel,
  parse,
  save,
  onClose,
}: {
  title: string;
  description: string;
  fields: DialogField[];
  confirmLabel: string;
  parse: (values: Record<string, string>) => Parsed<T>;
  save: (value: T) => Promise<unknown>;
  onClose: () => void;
}) {
  const id = useId();
  const [values, setValues] = useState<Record<string, string>>(() => Object.fromEntries(fields.map((f) => [f.key, f.defaultValue])));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const parsed = parse(values);
    if (!parsed.ok) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await save(parsed.value);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "That did not work.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && !saving && onClose()}>
      <DialogContent className="sm:max-w-md">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            void submit();
          }}
        >
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>
          <div className={fields.length > 1 ? "grid gap-3 sm:grid-cols-2" : "grid gap-3"}>
            {fields.map((f, i) => (
              <div key={f.key} className="space-y-2">
                <Label htmlFor={`${id}-${f.key}`}>{f.label}</Label>
                <Input
                  id={`${id}-${f.key}`}
                  inputMode={f.inputMode ?? "text"}
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  autoFocus={i === 0}
                  onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                />
              </div>
            ))}
          </div>
          <FormError message={error} />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : confirmLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
