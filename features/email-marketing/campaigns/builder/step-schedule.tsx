"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bestTimeChoice, type BestTimeState } from "@/lib/email-brain";
import { THROTTLE_PERCENTS, wallClock, type BuilderDraft } from "@/lib/email-builder";
import { hourLabel } from "@/lib/email-marketing";
import { can } from "@/lib/email-providers";
import { cn } from "@/lib/utils";
import type { EmailProviderKey, Guardrails, SendStrategy } from "@/types/email-marketing";

function localDateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function tomorrowAt10(): Date {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(10, 0, 0, 0);
  return d;
}

/** Step 6 — when it goes. A set time lands at that hour in each customer's own timezone;
 * smart send time and throttling appear only where the platform can do them. A time inside
 * quiet hours is flagged at review. The audience's best time (SPEC-368) is the hour it orders
 * most, read by the server from the saved draft; without one it is shown disabled with why. */
export function StepSchedule({
  draft,
  provider,
  guardrails,
  today,
  bestTime,
  onChange,
}: {
  draft: BuilderDraft;
  provider: EmailProviderKey;
  guardrails: Guardrails;
  today: string;
  /** What the server knows of this audience's best send hour. */
  bestTime: BestTimeState;
  onChange: (strategy: SendStrategy) => void;
}) {
  const s = draft.strategy;
  // A set time is a wall clock (no zone); a throttled send starts at one moment (UTC).
  const wall = s.kind === "static" ? s.at : s.kind === "throttled" ? wallClock(new Date(s.at)) : wallClock(tomorrowAt10());
  const moment = s.kind === "throttled" ? s.at : new Date(wall).toISOString();
  const best = bestTimeChoice(bestTime);
  const options: { kind: SendStrategy["kind"]; label: string; detail: string; show: boolean; disabled?: boolean }[] = [
    { kind: "best_time", label: "Best time for this audience", detail: best.detail, show: true, disabled: !best.available },
    { kind: "smart", label: "Smart send time", detail: "Each customer gets it at the hour they usually open.", show: can(provider, "smartSendTime") },
    { kind: "static", label: "At a set time", detail: "At the time you choose, in each customer's timezone.", show: true },
    { kind: "throttled", label: "Throttled", detail: "Spread over hours — kinder to a new sending domain.", show: can(provider, "throttledSend") },
    { kind: "immediate", label: "Now", detail: "As soon as you approve.", show: true },
  ];
  // A day carries over between the two day-only choices.
  const day = s.kind === "smart" || s.kind === "best_time" ? s.date : today;
  const pick = (kind: SendStrategy["kind"]) => {
    if (kind === "immediate") onChange({ kind });
    else if (kind === "smart" || kind === "best_time") onChange({ kind, date: day });
    else if (kind === "static") onChange({ kind, at: wall });
    else onChange({ kind, at: moment, percent: s.kind === "throttled" ? s.percent : 10 });
  };
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">When</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {options
            .filter((o) => o.show)
            .map((o) => (
              <label
                key={o.kind}
                className={cn(
                  "flex gap-3 rounded-xl border p-3 transition-colors",
                  s.kind === o.kind ? "border-primary bg-primary/5" : "border-border",
                  o.disabled && s.kind !== o.kind ? "cursor-not-allowed opacity-60" : "cursor-pointer",
                  !o.disabled && s.kind !== o.kind && "hover:bg-muted/50",
                )}
              >
                <input
                  type="radio"
                  name="strategy"
                  className="mt-1 accent-primary"
                  checked={s.kind === o.kind}
                  disabled={o.disabled && s.kind !== o.kind}
                  onChange={() => pick(o.kind)}
                />
                <span>
                  <span className="block text-sm font-medium">{o.label}</span>
                  <span className="block text-xs text-muted-foreground">{o.detail}</span>
                </span>
              </label>
            ))}
        </div>
      </fieldset>
      {s.kind === "smart" || s.kind === "best_time" ? (
        <div className="max-w-xs space-y-1.5">
          <Label htmlFor="smart-date">Day</Label>
          <Input
            id="smart-date"
            type="date"
            min={today}
            value={s.date}
            onChange={(event) => onChange({ kind: s.kind, date: event.target.value })}
          />
        </div>
      ) : null}
      {s.kind === "best_time" && !best.available ? (
        <p className="text-xs text-warning" role="status">
          {best.detail}
        </p>
      ) : null}
      {s.kind === "static" || s.kind === "throttled" ? (
        <div className="flex flex-wrap gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="send-at">{s.kind === "static" ? "Time, in each customer's timezone" : "Starts (your time)"}</Label>
            <Input
              id="send-at"
              type="datetime-local"
              value={s.kind === "static" ? s.at.slice(0, 16) : localDateTime(s.at)}
              onChange={(event) => {
                const value = event.target.value;
                if (!value) return;
                onChange(s.kind === "static" ? { kind: "static", at: value } : { ...s, at: new Date(value).toISOString() });
              }}
            />
          </div>
          {s.kind === "throttled" ? (
            <div className="space-y-1.5">
              <Label htmlFor="per-hour">Share of the audience each hour</Label>
              <Select value={String(s.percent)} onValueChange={(value) => onChange({ ...s, percent: Number(value) })}>
                <SelectTrigger id="per-hour" className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {THROTTLE_PERCENTS.map((p) => (
                    <SelectItem key={p} value={String(p)}>
                      {p}%
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Your quiet hours are {hourLabel(guardrails.quietHours.start)}–{hourLabel(guardrails.quietHours.end)}. A set time is read in each customer&rsquo;s timezone; now and throttled sends use the store&rsquo;s clock. A send that lands inside quiet hours is flagged at review.
      </p>
    </div>
  );
}
