"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { CHANNEL_LABELS, HELPDESK_PROVIDERS } from "@/lib/helpdesk-providers";
import {
  HANDLING_DAYS_ERROR,
  handlingDaysOf,
  MAX_HANDLING_DAYS,
  MIN_HANDLING_DAYS,
  parseHandlingDays,
} from "@/lib/support-handling";
import type { BusinessHours, ChannelSla, HelpdeskProviderKey } from "@/types/customer-support";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/**
 * Settings → Hours & SLAs (SPEC-346): when the shop answers, and the first-response target per
 * channel the SLA clock counts against. Only the helpdesk's own channels are listed.
 *
 * SPEC-364: the store's handling time — the days an order may wait before it ships, which the
 * agent's late-order line counts against — saves with the hours.
 */
export function HoursCard({
  hours,
  slas,
  provider,
  busy,
  onSave,
}: {
  hours: BusinessHours;
  slas: ChannelSla[];
  provider: HelpdeskProviderKey;
  busy: boolean;
  onSave: (hours: BusinessHours, slas: ChannelSla[]) => void;
}) {
  const [days, setDays] = useState(hours.days);
  const [handling, setHandling] = useState(() => String(handlingDaysOf(hours)));
  const handlingDays = parseHandlingDays(handling);
  const badHandling = handlingDays === null;
  const channels = HELPDESK_PROVIDERS[provider].capabilities.channels.filter((c) => c !== "phone");
  const [targets, setTargets] = useState<Record<string, number>>(
    Object.fromEntries(channels.map((c) => [c, slas.find((s) => s.channel === c)?.firstResponseMinutes ?? 240])),
  );
  const badTimes = days.some((d) => d && d.open >= d.close);
  const badSla = Object.values(targets).some((v) => !Number.isFinite(v) || v <= 0);

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        if (badTimes || badSla || handlingDays === null) return;
        onSave({ ...hours, days, handlingDays }, channels.map((channel) => ({ channel, firstResponseMinutes: targets[channel] })));
      }}
    >
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Business hours · {hours.timezone.replace("_", " ")}</legend>
        <ul className="space-y-1.5">
          {DAYS.map((day, index) => {
            const value = days[index];
            return (
              <li key={day} className="flex flex-wrap items-center gap-3 text-sm">
                <span className="w-24 text-muted-foreground">{day}</span>
                <Switch
                  checked={value !== null}
                  aria-label={`Open on ${day}`}
                  onCheckedChange={(on) => setDays((current) => current.map((d, i) => (i === index ? (on ? { open: "09:00", close: "17:00" } : null) : d)))}
                />
                {value ? (
                  <span className="flex items-center gap-1.5">
                    <Input
                      type="time"
                      aria-label={`${day} opens`}
                      className="w-28"
                      value={value.open}
                      onChange={(event) => setDays((current) => current.map((d, i) => (i === index && d ? { ...d, open: event.target.value } : d)))}
                    />
                    –
                    <Input
                      type="time"
                      aria-label={`${day} closes`}
                      className="w-28"
                      value={value.close}
                      onChange={(event) => setDays((current) => current.map((d, i) => (i === index && d ? { ...d, close: event.target.value } : d)))}
                    />
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">Closed</span>
                )}
              </li>
            );
          })}
        </ul>
        {badTimes ? <p className="text-xs text-destructive">Each day must close after it opens.</p> : null}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Handling time (days)</legend>
        <p className="text-xs text-muted-foreground">
          How long an order may wait before it ships. The agent calls an unshipped order late once it has waited longer.
        </p>
        <Input
          type="number"
          inputMode="numeric"
          min={MIN_HANDLING_DAYS}
          max={MAX_HANDLING_DAYS}
          step={1}
          className="h-8 w-24"
          aria-label="Handling time in days"
          aria-invalid={badHandling}
          value={handling}
          onChange={(event) => setHandling(event.target.value)}
        />
        {badHandling ? <p className="text-xs text-destructive">{HANDLING_DAYS_ERROR}</p> : null}
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">First-response target per channel</legend>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {channels.map((channel) => (
            <label key={channel} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
              {CHANNEL_LABELS[channel]}
              <span className="flex items-center gap-1.5">
                <Input
                  type="number"
                  min={1}
                  className="h-8 w-20"
                  aria-label={`${CHANNEL_LABELS[channel]} target in minutes`}
                  value={Number.isFinite(targets[channel]) ? targets[channel] : ""}
                  onChange={(event) => setTargets((current) => ({ ...current, [channel]: Number.parseInt(event.target.value, 10) }))}
                />
                <span className="text-xs text-muted-foreground">min</span>
              </span>
            </label>
          ))}
        </div>
        {badSla ? <p className="text-xs text-destructive">Every target needs a time above zero.</p> : null}
      </fieldset>
      <Button type="submit" size="sm" disabled={badTimes || badSla || badHandling || busy}>
        {busy ? "Saving…" : "Save hours and SLAs"}
      </Button>
    </form>
  );
}
