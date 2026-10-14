/**
 * The reading order of a composed report (SPEC-286). Pure.
 *
 * A template's sections arrive in the order its author bound the tools; a reader wants
 * a report: what it says in brief, the headline figures together, the charts, the
 * detail tables, then what to do. `arrangeReport` builds that from the sections the
 * backend composed — pending ones included, so a skeleton stands where its section
 * will land. It never changes a figure: it groups, captions and orders.
 */
import { splitLead } from "@/lib/report-fte";
import type { ReportSection } from "@/types/report-fte";

export type ReportBlockKind = ReportSection["kind"];

export interface ArrangedGroup {
  key: "kpis" | "bars" | "table" | "narrative";
  /** The heading the document shows over the group. */
  heading: string;
  sections: ReportSection[];
}

export interface ArrangedReport {
  /** The narrative's bold lead, when a grounded narrative exists — the report in one line. */
  brief: string | null;
  groups: ArrangedGroup[];
  /** How many sections have landed (grounded or failed) vs how many are expected. */
  landed: number;
  total: number;
}

const HEADINGS: Record<ArrangedGroup["key"], string> = {
  kpis: "Headline figures",
  bars: "Charts",
  table: "Tables",
  narrative: "What to do",
};

const ORDER: ArrangedGroup["key"][] = ["kpis", "bars", "table", "narrative"];

/** A section that has been composed — grounded, or failed and saying so. */
export function isLanded(section: ReportSection, completed: ReadonlySet<string>): boolean {
  return completed.has(section.id);
}

export function arrangeReport(sections: ReportSection[], completed: ReadonlySet<string>): ArrangedReport {
  const buckets: Record<ArrangedGroup["key"], ReportSection[]> = { kpis: [], bars: [], table: [], narrative: [] };
  for (const section of sections) {
    buckets[section.kind].push(section);
  }
  const groups = ORDER.filter((key) => buckets[key].length > 0).map((key) => ({
    key,
    heading: HEADINGS[key],
    sections: buckets[key],
  }));
  const narrative = buckets.narrative.find(
    (s) => completed.has(s.id) && s.grounded && s.narrative && s.narrative.length > 0,
  );
  const brief = narrative?.narrative ? splitLead(narrative.narrative[0]).lead : null;
  return {
    brief,
    groups,
    landed: sections.filter((s) => completed.has(s.id)).length,
    total: sections.length,
  };
}

/** The caption a block shows in a group: its section title, minus a repeated group word. */
export function blockCaption(section: ReportSection): string {
  return section.title.replace(/\s·\s(breakdown|detail|totals)$/i, "").trim();
}

/** How tall a skeleton should be for a pending section of this kind, in rows. */
export function skeletonRows(kind: ReportBlockKind): number {
  switch (kind) {
    case "kpis":
      return 4;
    case "bars":
      return 6;
    case "table":
      return 6;
    default:
      return 3;
  }
}
