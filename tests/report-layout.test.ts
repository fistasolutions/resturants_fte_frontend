/** SPEC-286 — the reading order of a composed report. */
import { describe, expect, it } from "vitest";

import { arrangeReport, blockCaption, skeletonRows } from "@/lib/report-layout";
import type { ReportSection } from "@/types/report-fte";

const section = (id: string, kind: ReportSection["kind"], extra: Partial<ReportSection> = {}): ReportSection => ({
  id,
  title: id,
  tool: "t",
  grounded: true,
  kind,
  ...extra,
});

describe("arrangeReport", () => {
  const sections = [
    section("s1", "kpis"),
    section("s1-b2", "bars"),
    section("s2", "table"),
    section("s3", "table"),
    section("s4", "kpis"),
    section("s5", "narrative", { narrative: ["**MIRAGE is the problem.** Hold the reorder.", "Second paragraph."] }),
  ];

  it("groups tiles, charts, tables and the narrative in reading order", () => {
    const arranged = arrangeReport(sections, new Set(sections.map((s) => s.id)));
    expect(arranged.groups.map((g) => g.key)).toEqual(["kpis", "bars", "table", "narrative"]);
    expect(arranged.groups[0].sections.map((s) => s.id)).toEqual(["s1", "s4"]);
    expect(arranged.groups[2].sections.map((s) => s.id)).toEqual(["s2", "s3"]);
    expect(arranged.groups[3].heading).toBe("What to do");
    expect(arranged.brief).toBe("MIRAGE is the problem.");
    expect(arranged.landed).toBe(6);
    expect(arranged.total).toBe(6);
  });

  it("keeps pending sections in their group and withholds the brief until the narrative lands", () => {
    const arranged = arrangeReport(sections, new Set(["s1", "s2"]));
    expect(arranged.landed).toBe(2);
    expect(arranged.brief).toBeNull();
    expect(arranged.groups.find((g) => g.key === "narrative")?.sections).toHaveLength(1);
  });

  it("omits empty groups and a failed narrative's brief", () => {
    const failed = [section("s1", "kpis"), section("s5", "narrative", { grounded: false, narrative: ["**Could not write.**"] })];
    const arranged = arrangeReport(failed, new Set(["s1", "s5"]));
    expect(arranged.groups.map((g) => g.key)).toEqual(["kpis", "narrative"]);
    expect(arranged.brief).toBeNull();
  });

  it("captions and skeleton sizes", () => {
    expect(blockCaption(section("x", "bars", { title: "Headline numbers · breakdown" }))).toBe("Headline numbers");
    expect(blockCaption(section("x", "table", { title: "Sales by brand" }))).toBe("Sales by brand");
    expect(skeletonRows("kpis")).toBe(4);
    expect(skeletonRows("narrative")).toBe(3);
  });
});
