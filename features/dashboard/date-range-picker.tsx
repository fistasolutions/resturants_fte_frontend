"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar as CalendarIcon, LoaderCircle } from "lucide-react";
import type { DateRange as DayPickerRange } from "react-day-picker";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RANGE_PRESETS, type RangePreset } from "@/lib/date-range";
import { dateToISO } from "@/utils/date";

interface DateRangePickerProps {
  /** Null (with `allowAllTime`) = no range filter active. */
  from: string | null;
  to: string | null;
  preset: RangePreset | null;
  label: string;
  /** The page whose URL the picker commits to (SPEC-040). Required, no
   * default — an omitted basePath used to silently fall back to "/",
   * which redirects to /brief and drops every param (SPEC-058 Patch). */
  basePath: string;
  /** Orders: offer an "All time" entry that clears the range. */
  allowAllTime?: boolean;
  /** Brief reuses the "date" URL key for something unrelated (which
   * archived day's snapshot to show, SPEC-041/043) — set true there so
   * Apply doesn't clear it as a side effect (SPEC-075 Patch). Every other
   * consumer keeps clearing its own legacy single-day "date" param. */
  preserveDateParam?: boolean;
}

const PRESET_ORDER: RangePreset[] = [
  "today",
  "yesterday",
  "7d",
  "30d",
  "90d",
  "mtd",
  "qtd",
  "ytd",
  "bfcm",
];

/** Params the picker owns — rewritten on Apply, everything else survives.
 * "date" is conditionally owned — see `preserveDateParam`. */
const OWNED_PARAMS = ["range", "from", "to", "period", "page"];

function toLocalDate(iso: string): Date {
  return new Date(`${iso}T00:00:00`);
}

/**
 * Shopify-style range picker (SPEC-037; generalized in SPEC-040): presets,
 * two-month range calendar behind one trigger. Only Apply commits — into the
 * current URL, so page filters and search params survive a range change.
 */
export function DateRangePicker({
  from,
  to,
  preset,
  label,
  basePath,
  allowAllTime = false,
  preserveDateParam = false,
}: DateRangePickerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  // SPEC-028 Patches: the server refetch takes a moment — isPending drives
  // visible feedback so the selection never feels ignored.
  const [isPending, startTransition] = useTransition();
  const [draftPreset, setDraftPreset] = useState<RangePreset | null>(preset);
  const [draftAllTime, setDraftAllTime] = useState(from === null);
  const [draftRange, setDraftRange] = useState<DayPickerRange | undefined>(
    from ? { from: toLocalDate(from), to: toLocalDate(to ?? from) } : undefined,
  );

  function resetDraft() {
    setDraftPreset(preset);
    setDraftAllTime(from === null);
    setDraftRange(
      from ? { from: toLocalDate(from), to: toLocalDate(to ?? from) } : undefined,
    );
  }

  function selectPreset(key: RangePreset) {
    setDraftPreset(key);
    setDraftAllTime(false);
    const resolved = RANGE_PRESETS[key].resolve(dateToISO(new Date()));
    setDraftRange({
      from: toLocalDate(resolved.from),
      to: toLocalDate(resolved.to),
    });
  }

  function apply() {
    const params = new URLSearchParams(searchParams.toString());
    for (const owned of OWNED_PARAMS) params.delete(owned);
    if (!preserveDateParam) params.delete("date");
    if (draftAllTime) {
      // no range params — All time
    } else if (draftPreset) {
      params.set("range", draftPreset);
    } else if (draftRange?.from) {
      params.set("from", dateToISO(draftRange.from));
      params.set("to", dateToISO(draftRange.to ?? draftRange.from));
    } else {
      setOpen(false);
      return;
    }
    const query = params.toString();
    startTransition(() => {
      router.replace(query ? `${basePath}?${query}` : basePath, { scroll: false });
    });
    setOpen(false);
  }

  const canApply = draftAllTime || draftPreset !== null || !!draftRange?.from;

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) resetDraft();
      }}
    >
      <PopoverTrigger
        aria-label={`Change date range. Currently ${label}`}
        aria-busy={isPending}
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-lg border bg-card px-3 py-1.5 text-sm text-card-foreground transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-70 data-[state=open]:bg-accent"
      >
        {isPending ? (
          <LoaderCircle
            className="size-4 animate-spin text-muted-foreground"
            aria-hidden
          />
        ) : (
          <CalendarIcon className="size-4 text-muted-foreground" aria-hidden />
        )}
        {isPending ? "Loading…" : label}
        <span aria-live="polite" className="sr-only">
          {isPending ? "Loading data for the selected range" : ""}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <div className="flex flex-col sm:flex-row">
          <ul
            aria-label="Date range presets"
            className="flex shrink-0 flex-row flex-wrap gap-1 border-b p-2 sm:w-44 sm:flex-col sm:border-r sm:border-b-0"
          >
            {allowAllTime && (
              <li>
                <button
                  type="button"
                  aria-pressed={draftAllTime}
                  onClick={() => {
                    setDraftAllTime(true);
                    setDraftPreset(null);
                    setDraftRange(undefined);
                  }}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring ${
                    draftAllTime
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  All time
                </button>
              </li>
            )}
            {PRESET_ORDER.map((key) => (
              <li key={key}>
                <button
                  type="button"
                  aria-pressed={draftPreset === key}
                  onClick={() => selectPreset(key)}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring ${
                    draftPreset === key
                      ? "bg-accent font-medium text-accent-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  {RANGE_PRESETS[key].label}
                </button>
              </li>
            ))}
          </ul>
          <div>
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={draftRange}
              defaultMonth={draftRange?.from}
              disabled={{ after: new Date() }}
              className="hidden sm:block"
              onSelect={(range) => {
                setDraftRange(range);
                setDraftPreset(null);
                setDraftAllTime(false);
              }}
            />
            <Calendar
              mode="range"
              numberOfMonths={1}
              selected={draftRange}
              defaultMonth={draftRange?.from}
              disabled={{ after: new Date() }}
              className="sm:hidden"
              onSelect={(range) => {
                setDraftRange(range);
                setDraftPreset(null);
                setDraftAllTime(false);
              }}
            />
            <div className="flex flex-wrap items-center justify-end gap-2 border-t p-3">
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetDraft();
                    setOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button type="button" size="sm" disabled={!canApply} onClick={apply}>
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
