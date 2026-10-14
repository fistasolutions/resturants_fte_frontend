/**
 * Report FTE delivery (SPEC-335 / backend SPEC-343) — pure: who a report goes to, and the
 * schedule the owner picks. The dialogs are presentational over these.
 */
import type {
  RecipientOption,
  ScheduleCadence,
  ScheduleChoice,
  ScheduleMode,
  ScheduleResult,
} from "@/types/report-fte";

export const MAX_RECIPIENTS = 20;

/** The backend's own rule (`recipients.EMAIL`): something@domain.tld, no spaces or commas. */
const EMAIL = /^[^@\s,;<>]+@[^@\s,;<>]+\.[^@\s,;<>]{2,}$/;

export function isEmail(value: string): boolean {
  return EMAIL.test(value.trim());
}

/** Add one address: trimmed, valid, not already there (case-insensitive), within the cap. */
export function addRecipient(
  current: string[],
  value: string,
): { next: string[]; error: string | null } {
  const address = value.trim().replace(/[,;]+$/, "");
  if (!address) return { next: current, error: null };
  if (!isEmail(address)) return { next: current, error: `${address} is not an email address.` };
  if (current.some((a) => a.toLowerCase() === address.toLowerCase())) return { next: current, error: null };
  if (current.length >= MAX_RECIPIENTS) {
    return { next: current, error: `A report can go to at most ${MAX_RECIPIENTS} people.` };
  }
  return { next: [...current, address], error: null };
}

export function removeRecipient(current: string[], address: string): string[] {
  return current.filter((a) => a.toLowerCase() !== address.toLowerCase());
}

export function toggleRecipient(current: string[], address: string): string[] {
  return current.some((a) => a.toLowerCase() === address.toLowerCase())
    ? removeRecipient(current, address)
    : addRecipient(current, address).next;
}

/** Where a dialog starts: a scheduled run's own people, else the owner. */
export function initialRecipients(defaults: string[], scheduled: string[] | null | undefined): string[] {
  return (scheduled && scheduled.length ? scheduled : defaults).filter(isEmail);
}

/** "Owner", "Manager · Jackson" — the label a chip shows; an unknown address shows itself. */
export function recipientLabel(address: string, options: RecipientOption[]): string | null {
  return options.find((o) => o.email.toLowerCase() === address.toLowerCase())?.label ?? null;
}

export const CADENCES: { key: ScheduleCadence; label: string }[] = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
];

export const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export const MODES: { key: ScheduleMode; label: string; detail: string }[] = [
  {
    key: "auto",
    label: "Send automatically",
    detail: "It is rebuilt with the latest figures and sent. You get a notification after.",
  },
  {
    key: "ask",
    label: "Ask me first",
    detail: "It is rebuilt and waits. A notification asks you to approve it.",
  },
];

/** The dialog's opening values: the cadence the plan suggests, Monday or the 1st, 07:00. */
export function defaultChoice(cadence: string | null | undefined, recipients: string[]): ScheduleChoice {
  const known: ScheduleCadence = cadence === "daily" || cadence === "monthly" ? cadence : "weekly";
  return {
    cadence: known,
    weekday: 0,
    dayOfMonth: 1,
    hour: known === "daily" ? 6 : 7,
    minute: 0,
    recipients,
    mode: "auto",
    showOnReports: true,
  };
}

/** The request body for `POST /report-fte/runs/{id}/schedule`. */
export function scheduleBody(choice: ScheduleChoice): Record<string, unknown> {
  return {
    cadence: choice.cadence,
    weekday: choice.cadence === "weekly" ? choice.weekday : null,
    day_of_month: choice.cadence === "monthly" ? choice.dayOfMonth : null,
    hour: choice.hour,
    minute: choice.minute,
    recipients: choice.recipients,
    mode: choice.mode,
    show_on_reports: choice.showOnReports,
  };
}

/** Why the Save button is off, or null when the choice can be saved. */
export function scheduleProblem(choice: ScheduleChoice): string | null {
  if (!choice.recipients.length) return "Choose at least one person to send it to.";
  if (choice.hour < 0 || choice.hour > 23 || choice.minute < 0 || choice.minute > 59) return "Pick a valid time.";
  if (choice.cadence === "monthly" && (choice.dayOfMonth < 1 || choice.dayOfMonth > 28)) {
    return "Pick a day between the 1st and the 28th.";
  }
  return null;
}

/** "✓ Weekly · Mon 07:00 · 3 people" — the button after a save, from what was saved. */
export function savedScheduleLabel(result: ScheduleResult): string {
  const cadence = CADENCES.find((c) => c.key === result.cadence)?.label;
  const when = result.cadence === "daily" ? result.runs.replace(/^Daily /, "") : result.runs;
  const people = result.recipients?.length ?? 0;
  const parts = [cadence, when, people ? `${people} ${people === 1 ? "person" : "people"}` : null];
  return parts.filter(Boolean).join(" · ");
}

/** The cadence a plan's "Runs" line implies ("Daily 06:00", "Mon 07:00", "1st monthly 07:00"). */
export function cadenceFromRuns(runs: string | null | undefined): ScheduleCadence {
  const text = (runs ?? "").toLowerCase();
  if (text.startsWith("daily")) return "daily";
  if (text.includes("monthly")) return "monthly";
  return "weekly";
}

export function twoDigits(n: number): string {
  return String(n).padStart(2, "0");
}
