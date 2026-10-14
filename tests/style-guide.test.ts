/**
 * SPEC-295 — the Style Guide's pure half: the sections, the grouping and the labels.
 * The view is presentational, so this is what guards the tab's behaviour.
 */

import { describe, expect, it } from "vitest";

import {
  emptySectionNote,
  groupStyleRules,
  isStyleRule,
  kindForSection,
  STYLE_SECTIONS,
  styleSectionSummary,
} from "@/lib/style-guide";
import { BRAND_BRAIN_SECTIONS, brandBrainSectionLabel } from "@/lib/brand-brain";
import {
  isDirty,
  MAX_TESTS,
  missingSafetyLine,
  promptSourceLabel,
  promptStats,
  sectionLine,
  SURFACES,
  surfaceLabel,
  testCaption,
  withNewTest,
} from "@/lib/style-bench";
import type { BrandRule, RuleKind, StylePrompt, StyleSection, StyleTest } from "@/types/brand-brain";

function rule(
  id: number,
  kind: RuleKind,
  section: StyleSection | null,
  label: string,
  enabled = true,
): BrandRule {
  return {
    id,
    kind,
    section,
    label,
    detail: "detail",
    enabled,
    startsOn: null,
    endsOn: null,
    provenance: "owner",
    sourceId: null,
  };
}

describe("the tab", () => {
  it("comes right after Guardrails (nine sections since SPEC-341 added Review)", () => {
    expect(BRAND_BRAIN_SECTIONS).toHaveLength(9);
    const i = BRAND_BRAIN_SECTIONS.indexOf("style-guide");
    expect(i).toBe(BRAND_BRAIN_SECTIONS.indexOf("guardrails") + 1);
    expect(brandBrainSectionLabel("style-guide")).toBe("Style Guide");
  });

  it("names the backend's sections, in the backend's reading order", () => {
    expect(STYLE_SECTIONS.map((s) => s.key)).toEqual([
      "palette",
      "light",
      "composition",
      "styling",
      "typography",
      "layout",
      "safety",
    ]);
    for (const section of STYLE_SECTIONS) expect(section.blurb.length).toBeGreaterThan(20);
  });
});

describe("grouping", () => {
  it("keeps direction and prohibitions, drops the word rules", () => {
    const rules = [
      rule(1, "style", "palette", "Warm neutrals"),
      rule(2, "image", "safety", "No logos"),
      rule(3, "word_banned", null, "bargain"),
      rule(4, "calendar", null, "Pesach"),
    ];
    expect(rules.filter(isStyleRule)).toHaveLength(2);
    const grouped = groupStyleRules(rules);
    expect(grouped.map((g) => g.section.key)).toEqual(STYLE_SECTIONS.map((s) => s.key));
    expect(grouped.find((g) => g.section.key === "palette")!.rules).toHaveLength(1);
    expect(grouped.find((g) => g.section.key === "safety")!.rules).toHaveLength(1);
    expect(grouped.flatMap((g) => g.rules).map((r) => r.id)).not.toContain(3);
  });

  it("never drops a row whose section is missing", () => {
    const grouped = groupStyleRules([
      rule(1, "image", null, "An old prohibition"),
      rule(2, "style", null, "Direction with no home"),
    ]);
    expect(grouped.find((g) => g.section.key === "safety")!.rules.map((r) => r.id)).toEqual([1]);
    expect(grouped.find((g) => g.section.key === "composition")!.rules.map((r) => r.id)).toEqual([2]);
  });
});

describe("labels", () => {
  it("counts what is on and off", () => {
    expect(styleSectionSummary([])).toBe("No rules yet");
    expect(styleSectionSummary([rule(1, "style", "light", "a")])).toBe("1 on");
    expect(
      styleSectionSummary([rule(1, "style", "light", "a"), rule(2, "style", "light", "b", false)]),
    ).toBe("1 on · 1 off");
  });

  it("says which built-in applies when a section is empty", () => {
    const note = emptySectionNote(STYLE_SECTIONS[0]);
    expect(note).toContain("palette");
    expect(note).toContain("never generated unguarded");
  });

  it("files a new safety row as a prohibition and everything else as direction", () => {
    expect(kindForSection("safety")).toBe("image");
    for (const section of STYLE_SECTIONS.filter((s) => s.key !== "safety")) {
      expect(kindForSection(section.key)).toBe("style");
    }
  });
});

describe("the bench", () => {
  it("names the two surfaces the backend renders for", () => {
    expect(SURFACES.map((s) => s.key)).toEqual(["social", "hero"]);
    expect(surfaceLabel("hero")).toBe("Blog hero");
    expect(surfaceLabel("social")).toBe("Social");
  });

  it("says what the prompt is made of", () => {
    const preview = {
      surface: "social" as const,
      prompt: "x",
      chars: 3998,
      rules: 21,
      sections: [
        { section: "safety", count: 6 },
        { section: "palette", count: 3 },
      ],
      source: "rules" as const,
      updated_at: null,
      updated_by: null,
      missing_safety: [],
    };
    expect(promptStats(preview)).toBe(
      "21 rules · 3,998 characters · appended to every image prompt, safety last",
    );
    // The sections read in the backend's order, not the order they arrived in.
    expect(sectionLine(preview)).toBe("palette 3 · safety 6");
    expect(promptStats(undefined)).toBe("");
    expect(sectionLine(undefined)).toBe("");
  });

  it("captions a tile by its brief, then its product", () => {
    expect(testCaption(test(1, "on a stone ledge"))).toBe("on a stone ledge");
    expect(testCaption({ ...test(2, null), productTitle: "Chantal dress" })).toBe("Chantal dress");
    expect(testCaption({ ...test(3, "   "), productTitle: null })).toBe("No brief — the rules alone");
  });

  it("keeps the newest five, without duplicating one", () => {
    let list = [5, 4, 3, 2, 1].map((n) => test(n, `take ${n}`));
    list = withNewTest(list, test(6, "take 6"));
    expect(list).toHaveLength(MAX_TESTS);
    expect(list.map((t) => t.id)).toEqual([6, 5, 4, 3, 2]);
    expect(withNewTest(list, test(6, "again")).filter((t) => t.id === 6)).toHaveLength(1);
  });
});

function test(id: number, brief: string | null): StyleTest {
  return {
    id,
    prompt: "prompt",
    brief,
    surface: "social",
    productId: null,
    productTitle: null,
    rulesCount: 21,
    createdAt: null,
  };
}

describe("editing the prompt (SPEC-298)", () => {
  const compiled: StylePrompt = {
    surface: "social",
    prompt: "BRAND STYLE …\n\nBRAND SAFETY …",
    chars: 30,
    rules: 21,
    sections: [{ section: "palette", count: 3 }],
    source: "rules",
    updated_at: null,
    updated_by: null,
    missing_safety: [],
  };
  const custom: StylePrompt = {
    ...compiled,
    prompt: "SHOOT IT MY WAY.",
    chars: 16,
    source: "custom",
    updated_at: "2026-09-23T10:00:00Z",
    updated_by: "mr@examplestore.com",
    missing_safety: ["No third-party brands", "No text in the picture"],
  };

  it("knows when what is typed differs from what is in force", () => {
    expect(isDirty("BRAND STYLE …\n\nBRAND SAFETY …", compiled)).toBe(false);
    expect(isDirty("  BRAND STYLE …\n\nBRAND SAFETY …  ", compiled)).toBe(false);
    expect(isDirty("something else", compiled)).toBe(true);
    expect(isDirty("anything", undefined)).toBe(false);
  });

  it("counts what is on screen while typing, and says it is unsaved", () => {
    expect(promptStats(compiled)).toBe(
      "21 rules · 30 characters · appended to every image prompt, safety last",
    );
    expect(promptStats(custom)).toBe(
      "21 rules · 16 characters · your own prompt — the rules below are not composing it",
    );
    expect(promptStats(compiled, "a shorter draft")).toBe("15 characters · unsaved");
    // Typing the same text back is not dirty, so the stats return to normal.
    expect(promptStats(compiled, compiled.prompt)).toBe(
      "21 rules · 30 characters · appended to every image prompt, safety last",
    );
  });

  it("says where the prompt came from, and who changed it", () => {
    expect(promptSourceLabel(compiled)).toBe("From the rules");
    const now = new Date("2026-09-23T12:00:00Z");
    expect(promptSourceLabel(custom, now)).toBe("Custom by mr@examplestore.com · 2h ago");
    expect(promptSourceLabel(undefined)).toBe("");
  });

  it("names the safety rules an edited prompt dropped", () => {
    expect(missingSafetyLine([])).toBe("");
    expect(missingSafetyLine(["No text in the picture"])).toBe(
      "This prompt does not mention No text in the picture — pictures will be generated without that rule.",
    );
    expect(missingSafetyLine(custom.missing_safety)).toContain("those rules");
    expect(missingSafetyLine(["a", "b", "c", "d", "e"])).toContain("and 2 more");
  });
});
