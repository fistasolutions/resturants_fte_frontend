"use client";

import { Input } from "@/components/ui/input";
import { CODE_LENGTH, codeDigits } from "@/lib/auth-flows";

/**
 * The 6-digit code (SPEC-312): one field, digits only, paste-friendly, and the
 * phone's one-time-code autofill works. `onComplete` fires at the sixth digit.
 */
export function CodeInput({
  id,
  value,
  onChange,
  onComplete,
  disabled,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  describedBy?: string;
}) {
  return (
    <Input
      id={id}
      value={value}
      disabled={disabled}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="[0-9]*"
      maxLength={CODE_LENGTH}
      placeholder="••••••"
      aria-describedby={describedBy}
      className="h-12 text-center font-mono text-2xl tracking-widest"
      onChange={(event) => {
        const digits = codeDigits(event.target.value);
        onChange(digits);
        if (digits.length === CODE_LENGTH) onComplete?.(digits);
      }}
    />
  );
}
