/** Brand Standards' pure half (frontend SPEC-392 / backend SPEC-411). */
import type { AuditPoint, AuditResult } from "@/types/restaurant-os";

export const RESULT_LABELS: Record<AuditResult, string> = { pass: "Pass", fail: "Fail", not_seen: "Not seen" };

export type Draft = Record<string, { result: AuditResult | null; note: string }>;

export function emptyDraft(checklist: AuditPoint[]): Draft {
  return Object.fromEntries(checklist.map((p) => [p.key, { result: null, note: "" }]));
}

export function unanswered(draft: Draft): number {
  return Object.values(draft).filter((a) => a.result === null).length;
}

/** The answers the backend takes; only once every point has a result. */
export function answersOf(draft: Draft): Record<string, { result: AuditResult; note: string | null }> | null {
  if (unanswered(draft) > 0) return null;
  return Object.fromEntries(
    Object.entries(draft).map(([key, a]) => [key, { result: a.result as AuditResult, note: a.note.trim() || null }]),
  );
}

export function sections(checklist: AuditPoint[]): { label: string; points: AuditPoint[] }[] {
  const out: { label: string; points: AuditPoint[] }[] = [];
  for (const point of checklist) {
    const last = out[out.length - 1];
    if (last && last.label === point.sectionLabel) last.points.push(point);
    else out.push({ label: point.sectionLabel, points: [point] });
  }
  return out;
}
