/** The back office's pure half (frontend SPEC-394 / backend SPEC-414/415). */
import type { CrewRole } from "@/types/restaurant-os";

export const BACK_OFFICE_TABS = ["clock", "schedule", "inventory"] as const;
export type BackOfficeTab = (typeof BACK_OFFICE_TABS)[number];
export const BACK_OFFICE_TAB_LABELS: Record<BackOfficeTab, string> = {
  clock: "Time clock",
  schedule: "Schedule",
  inventory: "Inventory & food cost",
};

export function readBackOfficeTab(value: string | null | undefined): BackOfficeTab {
  return (BACK_OFFICE_TABS as readonly string[]).includes(value ?? "") ? (value as BackOfficeTab) : "clock";
}

export const ROLE_LABELS: Record<CrewRole, string> = {
  crew: "Crew",
  cook: "Cook",
  driver: "Driver",
  shift_lead: "Shift lead",
  manager: "Manager",
};

const pad = (n: number) => String(n).padStart(2, "0");
const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** The Monday of the week holding this local date ("YYYY-MM-DD"). */
export function mondayOf(day: string): string {
  const d = new Date(`${day}T00:00:00`);
  const back = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - back);
  return iso(d);
}

export function addDays(day: string, days: number): string {
  const d = new Date(`${day}T00:00:00`);
  d.setDate(d.getDate() + days);
  return iso(d);
}

/** "62%" or "—". */
export function pct(value: number | null): string {
  return value === null ? "—" : `${Math.round(value * 1000) / 10}%`;
}

export interface PlannedDraft {
  staffId: number;
  day: string;
  start: string;
  end: string;
}

/** Add a planned shift, refusing an exact repeat of one already planned. */
export function addPlanned(rows: PlannedDraft[], row: PlannedDraft): PlannedDraft[] {
  if (rows.some((r) => r.staffId === row.staffId && r.day === row.day && r.start === row.start)) return rows;
  return [...rows, row].sort((a, b) => (a.day + a.start).localeCompare(b.day + b.start));
}
