"use client";

import { useMemo } from "react";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { timeOptions } from "@/lib/time-options";

/**
 * A time of day, from the design-system dropdown (SPEC-324) — never the browser's time picker.
 * 15-minute steps in the 12-hour clock; the saved value is always one of the options, so a
 * stored `06:50` is shown as it is and never rounded away.
 */
export function TimeSelect({
  id,
  value,
  onChange,
  disabled,
  ariaLabel,
  ariaDescribedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
}) {
  const options = useMemo(() => timeOptions(value), [value]);
  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger
        id={id}
        className="w-40"
        aria-label={ariaLabel}
        aria-describedby={ariaDescribedBy}
      >
        <SelectValue placeholder="Choose a time" />
      </SelectTrigger>
      <SelectContent position="popper" className="max-h-72">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
