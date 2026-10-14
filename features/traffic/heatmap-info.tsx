"use client";

import { CalendarDays, Clock, Footprints, Info, MousePointerClick } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { storeTimeZone } from "@/utils/format";

const SHADES = ["bg-muted/40", "bg-primary/15", "bg-primary/35", "bg-primary/55", "bg-primary/85"];
const HOURS: [string, string][] = [
  ["10a", "10 AM"],
  ["12p", "noon"],
  ["3p", "3 PM"],
  ["9p", "9 PM"],
];

function Row({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-sm font-medium">{title}</p>
        <p className="text-xs leading-relaxed text-muted-foreground">{children}</p>
      </div>
    </div>
  );
}

/** Info button + premium modal explaining how to read the footfall heatmap
 * (SPEC-113): a visual shade legend, hour-notation chips, and iconed notes. */
export function HeatmapInfo() {
  return (
    <Dialog>
      <DialogTrigger
        aria-label="How to read this heatmap"
        className="flex size-6 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Info className="size-3.5" aria-hidden />
      </DialogTrigger>

      <DialogContent className="max-w-lg gap-5">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Footprints className="size-5" aria-hidden />
            </span>
            <div>
              <DialogTitle>Reading the heatmap</DialogTitle>
              <DialogDescription>Footfall by day and hour, at a glance.</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Visual shade legend */}
        <div className="rounded-xl border border-border bg-muted/30 p-3">
          <p className="mb-2 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Cell shade = how busy
          </p>
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-muted-foreground">Quiet</span>
            <div className="flex flex-1 gap-1">
              {SHADES.map((s) => (
                <span key={s} className={`h-5 flex-1 rounded ${s}`} aria-hidden />
              ))}
            </div>
            <span className="text-[11px] text-muted-foreground">Busy</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            The number in each cell is visitors counted that hour; blank cells had no
            recorded footfall.
          </p>
        </div>

        {/* Hour notation chips */}
        <div className="space-y-2">
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Columns = hours of the day
          </p>
          <div className="flex flex-wrap gap-1.5">
            {HOURS.map(([short, full]) => (
              <span
                key={short}
                className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs"
              >
                <span className="font-semibold">{short}</span>
                <span className="text-muted-foreground">{full}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Iconed notes */}
        <div className="space-y-3">
          <Row icon={<CalendarDays className="size-4" aria-hidden />} title="Rows = days of the week">
            Monday through Sunday.
          </Row>
          <Row icon={<MousePointerClick className="size-4" aria-hidden />} title="Hover a cell">
            Shows that hour&apos;s conversion — the share of visitors who bought.
          </Row>
          <Row icon={<Clock className="size-4" aria-hidden />} title="Times are store-local">
            Shown in your store&apos;s timezone ({storeTimeZone()}). V-Count data lands
            about a day later, so use recent complete days — not today.
          </Row>
        </div>
      </DialogContent>
    </Dialog>
  );
}
