/**
 * The festival note under the Dashboard's KPIs (SPEC-307 / backend SPEC-305) — pure.
 *
 * The backend names the festivals in the selected range and in the window it compared
 * against, and whether they match. This turns that into one sentence, and says when a
 * comparison is not like for like — the moment a Gregorian "last year" is misleading.
 */
import { formatRangeLabel, type CompareMode } from "@/lib/date-range";

export interface ApiCompareMeta {
  mode: string;
  start: string;
  end: string;
  festivals?: string[];
  compare_festivals?: string[];
  aligned?: boolean;
}

export interface CalendarNote {
  mode: CompareMode;
  festivals: string[];
  compareFestivals: string[];
  aligned: boolean;
  compareFrom: string;
  compareTo: string;
}

/** The inclusive dates of a backend `[start, end)` window, in UTC. */
export function windowDates(meta: Pick<ApiCompareMeta, "start" | "end">): { from: string; to: string } {
  const from = new Date(meta.start).toISOString().slice(0, 10);
  const lastMoment = new Date(new Date(meta.end).getTime() - 1);
  const to = lastMoment.toISOString().slice(0, 10);
  return { from, to: to < from ? from : to };
}

/** The note, or null for an older backend that does not name festivals. */
export function adaptCalendarNote(meta: ApiCompareMeta | null | undefined): CalendarNote | null {
  if (!meta || !Array.isArray(meta.festivals) || !Array.isArray(meta.compare_festivals)) return null;
  const { from, to } = windowDates(meta);
  return {
    mode: meta.mode as CompareMode,
    festivals: meta.festivals,
    compareFestivals: meta.compare_festivals,
    aligned: meta.aligned ?? true,
    compareFrom: from,
    compareTo: to,
  };
}

/** "Pesach" · "Rosh Hashanah and Yom Kippur" · "Sukkot, Shemini Atzeres and Simchas Torah". */
export function festivalList(names: string[]): string {
  if (names.length <= 1) return names[0] ?? "";
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export interface CalendarNoteView {
  tone: "info" | "warn";
  text: string;
  /** Offer "Compare by Hebrew calendar" — only when it would change the answer. */
  suggestHebrew: boolean;
}

export function calendarNoteView(note: CalendarNote | null): CalendarNoteView | null {
  if (!note) return null;
  if (!note.festivals.length && !note.compareFestivals.length) return null;
  const compared = formatRangeLabel(note.compareFrom, note.compareTo);
  const here = note.festivals.length ? `This range includes ${festivalList(note.festivals)}` : "This range holds no festival";
  if (note.aligned) {
    return {
      tone: "info",
      text: `${here} — compared with ${compared}, which also held ${festivalList(note.compareFestivals)}.`,
      suggestHebrew: false,
    };
  }
  const there = note.compareFestivals.length ? `held ${festivalList(note.compareFestivals)}` : "held no festival";
  return {
    tone: "warn",
    text: `${here}, but ${compared} ${there} — the comparison isn't like for like.`,
    suggestHebrew: note.mode !== "hebrew_year",
  };
}

/** The Dashboard URL with a different comparison, every other parameter kept. */
export function compareHref(pathname: string, params: URLSearchParams, mode: CompareMode): string {
  const next = new URLSearchParams(params.toString());
  if (mode === "previous_period") next.delete("compare");
  else next.set("compare", mode);
  const query = next.toString();
  return query ? `${pathname}?${query}` : pathname;
}
