"use client";

import { useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compareHref } from "@/lib/calendar-note";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { COMPARE_MODES, compareModesFor, resolveCompareMode, type CompareMode } from "@/lib/date-range";

/**
 * What the Dashboard's figures are compared with (SPEC-307): the previous period, the
 * same dates last year, the same Hebrew dates last year (backend SPEC-305), or nothing.
 * Writes `?compare=` and keeps the range — the date picker owns only range params.
 */
export function ComparePicker() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  // SPEC-318: the Hebrew comparison only for an organization on the Hebrew calendar.
  const { calendarSystem } = useWorkspace();
  const current = resolveCompareMode(params.get("compare"), calendarSystem);

  function pick(value: string) {
    const mode = value as CompareMode;
    if (mode === current) return;
    startTransition(() => {
      router.replace(compareHref(pathname, new URLSearchParams(params.toString()), mode), { scroll: false });
    });
  }

  return (
    <Select value={current} onValueChange={pick}>
      <SelectTrigger className="h-9 w-auto min-w-44" aria-label="Compare with" data-pending={pending || undefined}>
        <span className="text-muted-foreground">Compare:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {compareModesFor(calendarSystem).map((mode) => (
          <SelectItem key={mode} value={mode}>
            {COMPARE_MODES[mode].label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
