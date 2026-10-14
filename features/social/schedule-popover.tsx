"use client";

import { useState } from "react";
import { CalendarX, Check, Link2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { dateToISO } from "@/utils/date";

function todayISO(): string {
  return dateToISO(new Date());
}

/** Copy-to-clipboard for a post's UTM-tagged product link. Shared by the
 * Calendar rows and the schedule popover (SPEC-132). */
export function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (insecure context / denied) — leave state untouched.
    }
  }
  return (
    <Button type="button" variant="ghost" size="sm" onClick={copy}>
      {copied ? <Check className="size-3.5" aria-hidden /> : <Link2 className="size-3.5" aria-hidden />}
      {copied ? "Copied" : "Copy tracked link"}
    </Button>
  );
}

/**
 * The shared scheduling surface: a day picker plus unschedule + copy actions,
 * anchored to whatever trigger the caller passes in. Driven by primitive props
 * so both the Calendar tab (reschedule chips/rows) and the Approvals tab
 * (inline Approve & Schedule) render the identical picker (SPEC-131 → SPEC-132).
 */
export function SchedulePopover({
  productName,
  scheduledFor,
  trackedLink,
  pending,
  onPick,
  onClear,
  children,
  open: controlledOpen,
  onOpenChange,
}: {
  productName: string;
  /** "YYYY-MM-DD" when already dated, else null. */
  scheduledFor: string | null;
  /** UTM-tagged product URL for manual posting today, or null/undefined. */
  trackedLink?: string | null;
  pending: boolean;
  onPick: (dateISO: string) => void;
  onClear: () => void;
  children: React.ReactNode;
  /** Optional controlled open state (SPEC-143) — lets a chip's actions menu open
   * the reschedule picker programmatically. Falls back to internal state. */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const selected = scheduledFor
    ? new Date(`${scheduledFor}T00:00:00`)
    : undefined;
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto max-w-[calc(100vw-2rem)] p-0">
        <div className="border-b border-border p-3">
          <p className="text-sm font-medium text-foreground">{productName}</p>
          <p className="text-xs text-muted-foreground">
            {scheduledFor
              ? "Pick a new day, or clear the date to unschedule."
              : "Pick a day to schedule this post."}
          </p>
        </div>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          disabled={{ before: new Date(`${todayISO()}T00:00:00`) }}
          onSelect={(d) => {
            if (!d) return;
            onPick(dateToISO(d));
            setOpen(false);
          }}
        />
        <div className="flex flex-col gap-1 border-t border-border p-2">
          {trackedLink && <CopyLinkButton link={trackedLink} />}
          {scheduledFor && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              <CalendarX className="size-3.5" aria-hidden />
              Unschedule
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
