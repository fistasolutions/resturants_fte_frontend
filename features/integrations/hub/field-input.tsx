"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { TimeSelect } from "@/features/settings/time-select";
import type { FieldSpec } from "@/lib/integration-catalog";

/** One labelled field of a connection — a time is the design-system dropdown, never the
 * browser's picker; a secret is a password box that is never prefilled. */
export function FieldInput({
  id,
  field,
  value,
  secret = false,
  placeholder,
  onChange,
}: {
  id: string;
  field: FieldSpec;
  value: string;
  secret?: boolean;
  placeholder?: string;
  onChange: (value: string) => void;
}) {
  const hintId = field.hint ? `${id}-hint` : undefined;
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === "time" ? (
        <TimeSelect id={id} value={value} onChange={onChange} ariaDescribedBy={hintId} />
      ) : (
        <Input
          id={id}
          type={secret ? "password" : field.type === "number" ? "text" : (field.type ?? "text")}
          inputMode={field.type === "number" ? "numeric" : undefined}
          autoComplete="off"
          spellCheck={false}
          className={secret ? "font-mono" : undefined}
          value={value}
          placeholder={placeholder ?? field.placeholder}
          aria-describedby={hintId}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
      {field.hint ? (
        <p id={hintId} className="text-xs text-muted-foreground">
          {field.hint}
        </p>
      ) : null}
    </div>
  );
}
