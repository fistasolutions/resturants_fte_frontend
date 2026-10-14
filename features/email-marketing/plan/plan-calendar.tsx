"use client";

import { useState } from "react";

import { formatMoney } from "@/lib/email-marketing";
import { monthGrid, slotsByDate, weekDays, type CalendarDay, type PlanView } from "@/lib/email-plan";
import { cn } from "@/lib/utils";
import type { PlanSlot } from "@/types/email-marketing";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function SlotChip({
  slot,
  selected,
  onSelect,
  draggable,
}: {
  slot: PlanSlot;
  selected: boolean;
  onSelect: (id: string) => void;
  draggable: boolean;
}) {
  return (
    <button
      type="button"
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", slot.id);
        event.dataTransfer.effectAllowed = "move";
      }}
      onClick={() => onSelect(slot.id)}
      aria-pressed={selected}
      className={cn(
        "block w-full rounded-md border px-1.5 py-1 text-left text-[11px] leading-tight transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
        slot.state === "accepted" ? "border-success/40 bg-success/10" : "border-dashed border-border bg-card",
        slot.kind === "flow_change" && "border-info/40",
        selected && "ring-2 ring-primary",
        draggable && "cursor-grab active:cursor-grabbing",
      )}
    >
      <span className="line-clamp-2 font-medium text-foreground">{slot.title}</span>
      <span className="block text-muted-foreground tabular-nums">≈ {formatMoney(slot.expectedProfit, true)}</span>
    </button>
  );
}

function DayCell({
  day,
  slots,
  tall,
  today,
  selectedId,
  onSelect,
  onDropSlot,
}: {
  day: CalendarDay;
  slots: PlanSlot[];
  tall: boolean;
  today: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDropSlot: (id: string, date: string) => void;
}) {
  const [over, setOver] = useState(false);
  const past = day.date < today;
  return (
    <div
      onDragOver={(event) => {
        if (past) return;
        event.preventDefault();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault();
        setOver(false);
        const id = event.dataTransfer.getData("text/plain");
        if (id && !past) onDropSlot(id, day.date);
      }}
      className={cn(
        "flex min-w-0 flex-col gap-1 rounded-lg border p-1.5",
        tall ? "min-h-48" : "min-h-24",
        day.inMonth ? "border-border bg-background" : "border-transparent bg-muted/40",
        day.isToday && "border-primary",
        over && "bg-muted",
      )}
    >
      <span className={cn("text-[11px] font-semibold tabular-nums", day.inMonth ? "text-foreground" : "text-muted-foreground", day.isToday && "text-primary")}>
        {day.day}
        <span className="sr-only">{day.isToday ? " (today)" : ""}</span>
      </span>
      {slots.map((slot) => (
        <SlotChip key={slot.id} slot={slot} selected={slot.id === selectedId} onSelect={onSelect} draggable={!past} />
      ))}
    </div>
  );
}

/** The plan as a calendar (SPEC-345). Slots drag between days; every move is also possible
 * from the slot's panel with the keyboard. Past days take no drops. */
export function PlanCalendar({
  view,
  anchor,
  today,
  slots,
  selectedId,
  onSelect,
  onMove,
}: {
  view: PlanView;
  anchor: string;
  today: string;
  slots: PlanSlot[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onMove: (id: string, date: string) => void;
}) {
  const byDate = slotsByDate(slots);
  const weeks = view === "month" ? monthGrid(anchor, today) : [weekDays(anchor, today)];
  return (
    <div className="overflow-x-auto">
      <div className="grid min-w-[640px] grid-cols-7 gap-1" role="grid" aria-label="Email plan calendar">
        {WEEKDAYS.map((name) => (
          <div key={name} role="columnheader" className="px-1.5 pb-1 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">
            {name}
          </div>
        ))}
        {weeks.flat().map((day) => (
          <div key={day.date} role="gridcell">
            <DayCell
              day={day}
              slots={byDate.get(day.date) ?? []}
              tall={view === "week"}
              today={today}
              selectedId={selectedId}
              onSelect={onSelect}
              onDropSlot={onMove}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
