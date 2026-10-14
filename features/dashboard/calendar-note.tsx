import Link from "next/link";
import { CalendarDays } from "lucide-react";

import { calendarNoteView, type CalendarNote } from "@/lib/calendar-note";
import { cn } from "@/lib/utils";

/**
 * One line under the KPIs (SPEC-307): which festivals the range and the compared window
 * held, and — when they differ — that the comparison is not like for like, with the switch
 * to the Hebrew calendar. Nothing renders when neither window holds a festival.
 */
export function CalendarNoteLine({ note, hebrewHref }: { note: CalendarNote | null; hebrewHref: string }) {
  const view = calendarNoteView(note);
  if (!view) return null;
  return (
    <div
      role="note"
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border px-3 py-2 text-sm",
        view.tone === "warn" ? "border-warning/40 bg-warning/5" : "border-border bg-card",
      )}
    >
      <CalendarDays className={cn("size-4 shrink-0", view.tone === "warn" ? "text-warning" : "text-muted-foreground")} aria-hidden />
      <p className="min-w-0 flex-1">{view.text}</p>
      {view.suggestHebrew && (
        <Link
          href={hebrewHref}
          scroll={false}
          prefetch={false}
          className="shrink-0 rounded-md border border-border bg-background px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Compare by Hebrew calendar
        </Link>
      )}
    </div>
  );
}
