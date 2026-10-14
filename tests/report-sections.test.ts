import { describe, expect, it } from "vitest";

import { parseReportSections } from "@/lib/report-sections";

const REPORT = `# Daily Executive Report — 2026-07-15

## Summary
July 15 was a sharply weaker day than July 14.

## Sales
- Gross revenue: $31,773.43

## Risks
- Refunds reached 11.8% of revenue.
- 38,549 variants are out of stock.

## Opportunities
- AOV rose 4.8% — buyers spend more per order.

## Recommended Actions
- Reorder the Vintage Vibes tee — 0.2 days of cover left.
`;

describe("parseReportSections (SPEC-025)", () => {
  it("extracts the judgment sections and marks the report structured", () => {
    const sections = parseReportSections(REPORT);

    expect(sections.structured).toBe(true);
    expect(sections.summary).toContain("sharply weaker day");
    expect(sections.risks).toContain("11.8% of revenue");
    expect(sections.opportunities).toContain("AOV rose 4.8%");
    expect(sections.actions).toContain("Vintage Vibes");
  });

  it("accepts the client's alias headings (Business Risks / Recommendations)", () => {
    const sections = parseReportSections(
      "## Summary\nFine day.\n\n## Business Risks\n- A risk.\n\n## Recommendations\n- Do it.",
    );

    expect(sections.risks).toBe("- A risk.");
    expect(sections.actions).toBe("- Do it.");
  });

  it("falls back gracefully when the narrative has no structure", () => {
    const sections = parseReportSections("Plain fallback text without headings.");

    expect(sections.structured).toBe(false);
    expect(sections.summary).toBeNull();
    expect(sections.risks).toBeNull();
  });
});
