"use client";

import { useState } from "react";
import { CalendarClock, LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RecipientPicker } from "@/features/report-fte/recipient-picker";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  CADENCES,
  MODES,
  WEEKDAYS,
  defaultChoice,
  initialRecipients,
  scheduleBody,
  scheduleProblem,
  twoDigits,
} from "@/lib/report-fte-delivery";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { cn } from "@/lib/utils";
import type { ScheduleChoice, ScheduleResult } from "@/types/report-fte";

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const MINUTES = [0, 15, 30, 45];
const DAYS = Array.from({ length: 28 }, (_, d) => d + 1);

/**
 * Approve & schedule (SPEC-335): how often, which day, what time, to whom, and whether
 * each run sends itself (a notification after) or waits for approval (a notification
 * asking). At every scheduled time the report is rebuilt with the latest figures.
 */
export function ScheduleReportDialog({
  open,
  onOpenChange,
  title,
  suggestedCadence,
  scheduledRecipients,
  onSchedule,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  suggestedCadence: string | null | undefined;
  scheduledRecipients: string[] | null | undefined;
  onSchedule: (body: Record<string, unknown>) => Promise<ScheduleResult>;
}) {
  const directory = useApiQuery(open ? reportFteQueries.recipients() : null);
  const [edited, setEdited] = useState<ScheduleChoice | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choice =
    edited ??
    defaultChoice(suggestedCadence, initialRecipients(directory.data?.default ?? [], scheduledRecipients));
  const set = (patch: Partial<ScheduleChoice>) => setEdited({ ...choice, ...patch });
  const problem = scheduleProblem(choice);

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await onSchedule(scheduleBody(choice));
      onOpenChange(false);
      setEdited(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Scheduling failed.");
    }
    setSaving(false);
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!saving) onOpenChange(next);
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Schedule “{title}”</DialogTitle>
          <DialogDescription>
            At each time below it is rebuilt with the latest figures and sent to the people you choose.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">How often</legend>
            <div role="radiogroup" aria-label="How often" className="inline-flex rounded-lg border border-border p-0.5">
              {CADENCES.map((c) => (
                <button
                  key={c.key}
                  type="button"
                  role="radio"
                  aria-checked={choice.cadence === c.key}
                  onClick={() => set({ cadence: c.key })}
                  className={cn(
                    "rounded-md px-3 py-1 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    choice.cadence === c.key ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-3 sm:grid-cols-2">
            {choice.cadence === "weekly" ? (
              <div className="space-y-1.5">
                <Label htmlFor="schedule-day">Day</Label>
                <Select value={String(choice.weekday)} onValueChange={(v) => set({ weekday: Number(v) })}>
                  <SelectTrigger id="schedule-day" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKDAYS.map((day, index) => (
                      <SelectItem key={day} value={String(index)}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            {choice.cadence === "monthly" ? (
              <div className="space-y-1.5">
                <Label htmlFor="schedule-date">Day of the month</Label>
                <Select value={String(choice.dayOfMonth)} onValueChange={(v) => set({ dayOfMonth: Number(v) })}>
                  <SelectTrigger id="schedule-date" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DAYS.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
            <div className="space-y-1.5">
              <Label htmlFor="schedule-hour">Time</Label>
              <div className="flex items-center gap-1.5">
                <Select value={String(choice.hour)} onValueChange={(v) => set({ hour: Number(v) })}>
                  <SelectTrigger id="schedule-hour" className="w-full" aria-label="Hour">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h} value={String(h)}>
                        {twoDigits(h)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span aria-hidden>:</span>
                <Select value={String(choice.minute)} onValueChange={(v) => set({ minute: Number(v) })}>
                  <SelectTrigger className="w-full" aria-label="Minute">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MINUTES.map((m) => (
                      <SelectItem key={m} value={String(m)}>
                        {twoDigits(m)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-muted-foreground">In your store&rsquo;s time zone.</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="schedule-to">Send to</Label>
            <RecipientPicker
              id="schedule-to"
              value={choice.recipients}
              onChange={(recipients) => set({ recipients })}
              options={directory.data?.items ?? []}
              loading={directory.isPending}
            />
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">When it runs</legend>
            <div role="radiogroup" aria-label="When it runs" className="grid gap-2 sm:grid-cols-2">
              {MODES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  role="radio"
                  aria-checked={choice.mode === m.key}
                  onClick={() => set({ mode: m.key })}
                  className={cn(
                    "rounded-xl border border-border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                    choice.mode === m.key ? "border-primary bg-primary/5" : "hover:bg-muted/50",
                  )}
                >
                  <span className="block text-sm font-semibold">{m.label}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{m.detail}</span>
                </button>
              ))}
            </div>
          </fieldset>

          <label className="flex cursor-pointer items-start gap-2.5 text-sm">
            <Checkbox
              checked={choice.showOnReports}
              onCheckedChange={(checked) => set({ showOnReports: checked === true })}
              className="mt-0.5"
            />
            <span>
              Also show it on the Daily Reports page
              <span className="block text-xs text-muted-foreground">
                Each run appears there under its {choice.cadence} tab.
              </span>
            </span>
          </label>
        </div>

        {error ? (
          <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}
        <DialogFooter className="items-center">
          {problem ? <p className="mr-auto text-xs text-muted-foreground">{problem}</p> : null}
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={saving || problem !== null}>
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
            ) : (
              <CalendarClock className="size-4" aria-hidden />
            )}
            {saving ? "Saving…" : "Approve & save schedule"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
