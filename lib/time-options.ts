/**
 * The options of a time dropdown (SPEC-324) — 15-minute steps across the day, labelled in the
 * 12-hour clock, always including the value already saved so choosing nothing changes nothing.
 * Pure. Values are `HH:MM` (24-hour), the shape every schedule endpoint takes.
 */

export interface TimeOption {
  value: string;
  label: string;
}

const STEP_MINUTES = 15;

export function isTimeValue(value: string | null | undefined): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** `07:00` → `7:00 AM`, `13:45` → `1:45 PM`, `00:15` → `12:15 AM`. */
export function timeLabel(value: string): string {
  if (!isTimeValue(value)) return value;
  const [h, m] = value.split(":").map(Number);
  const suffix = h < 12 ? "AM" : "PM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
}

export function timeOptions(current?: string | null, step: number = STEP_MINUTES): TimeOption[] {
  const values = new Set<string>();
  for (let minutes = 0; minutes < 24 * 60; minutes += step) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    values.add(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
  }
  if (isTimeValue(current)) values.add(current);
  return [...values].sort().map((value) => ({ value, label: timeLabel(value) }));
}
