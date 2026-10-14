/**
 * Report narrative parser (SPEC-025): splits the AI-written daily report
 * Markdown into named `##` sections so the page can place judgment (summary,
 * risks, opportunities, actions) around the metric cards. Pure logic —
 * unit-tested in tests/report-sections.test.ts.
 */

export interface ReportSections {
  summary: string | null;
  risks: string | null;
  opportunities: string | null;
  actions: string | null;
  /** True when enough structure was found to render the structured layout. */
  structured: boolean;
}

const SECTION_ALIASES: Record<keyof Omit<ReportSections, "structured">, string[]> = {
  summary: ["summary"],
  risks: ["risks", "business risks"],
  opportunities: ["opportunities", "business opportunities"],
  actions: ["recommended actions", "actions", "recommendations"],
};

export function parseReportSections(markdown: string): ReportSections {
  const sections = new Map<string, string>();
  // Split on H2 headings; the chunk before the first heading is ignored
  // (title line). Each chunk starts with its heading text.
  const parts = markdown.split(/^##\s+/m).slice(1);
  for (const part of parts) {
    const newlineIndex = part.indexOf("\n");
    const heading = (newlineIndex === -1 ? part : part.slice(0, newlineIndex))
      .trim()
      .toLowerCase();
    const body = (newlineIndex === -1 ? "" : part.slice(newlineIndex + 1)).trim();
    if (heading && body) sections.set(heading, body);
  }

  const pick = (aliases: string[]): string | null => {
    for (const alias of aliases) {
      const found = sections.get(alias);
      if (found) return found;
    }
    return null;
  };

  const result = {
    summary: pick(SECTION_ALIASES.summary),
    risks: pick(SECTION_ALIASES.risks),
    opportunities: pick(SECTION_ALIASES.opportunities),
    actions: pick(SECTION_ALIASES.actions),
  };
  return { ...result, structured: result.summary !== null };
}
