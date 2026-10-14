/**
 * The Style Guide (frontend SPEC-295 / backend SPEC-290) — the brand's look, as rows.
 *
 * Pure half: the sections in the backend's reading order, the grouping, and the small
 * labels the cards show. The view stays presentational so this is what Vitest covers.
 */

import type { BrandRule, StyleSection } from "@/types/brand-brain";

export interface StyleSectionSpec {
  key: StyleSection;
  label: string;
  /** One line telling the owner what editing this section changes. */
  blurb: string;
}

/** In the backend's reading order — `image_rules.SECTION_TITLES` plus layout, safety. */
export const STYLE_SECTIONS: readonly StyleSectionSpec[] = [
  {
    key: "palette",
    label: "Palette",
    blurb: "The colours a picture may live in, and the defaults it must not drift to.",
  },
  {
    key: "light",
    label: "Light",
    blurb: "Direction, quality and falloff — how the product is lit.",
  },
  {
    key: "composition",
    label: "Composition",
    blurb: "Framing, negative space and how the product sits in the scene.",
  },
  {
    key: "styling",
    label: "Styling",
    blurb: "Props, materials and who may appear in the frame.",
  },
  {
    key: "typography",
    label: "Type & logo",
    blurb: "Type and logo treatment — and the rule that generated pictures carry none.",
  },
  {
    key: "layout",
    label: "Layout",
    blurb: "Per-surface geometry: the blog hero's banner crop, the social safe area.",
  },
  {
    key: "safety",
    label: "Brand safety",
    blurb: "The lines a picture may never cross. Appended last, so they win.",
  },
] as const;

/** A rule that belongs to the Style Guide: direction (`style`) or a prohibition (`image`). */
export function isStyleRule(rule: BrandRule): boolean {
  return rule.kind === "style" || rule.kind === "image";
}

/**
 * The guide's rules by section, in reading order. A row whose section is missing is
 * never dropped: a prohibition falls back to `safety`, direction to `composition`, so a
 * rule the owner wrote is always somewhere she can see and switch off.
 */
export function groupStyleRules(rules: BrandRule[]): { section: StyleSectionSpec; rules: BrandRule[] }[] {
  const placed = new Map<StyleSection, BrandRule[]>();
  for (const spec of STYLE_SECTIONS) placed.set(spec.key, []);
  for (const rule of rules) {
    if (!isStyleRule(rule)) continue;
    const key = rule.section ?? (rule.kind === "image" ? "safety" : "composition");
    (placed.get(key) ?? placed.get("composition"))!.push(rule);
  }
  return STYLE_SECTIONS.map((section) => ({ section, rules: placed.get(section.key) ?? [] }));
}

/** "4 on · 1 off" — the card subtitle; "No rules yet" when the section is empty. */
export function styleSectionSummary(rules: BrandRule[]): string {
  if (rules.length === 0) return "No rules yet";
  const on = rules.filter((r) => r.enabled).length;
  const off = rules.length - on;
  return off === 0 ? `${on} on` : `${on} on · ${off} off`;
}

/** What a section with nothing enabled falls back to, said in the owner's terms. */
export function emptySectionNote(section: StyleSectionSpec): string {
  return `Nothing enabled here, so the built-in ${section.label.toLowerCase()} direction applies — a picture is never generated unguarded.`;
}

/** The kind a new row in this section gets: `safety` is a prohibition, the rest direction. */
export function kindForSection(section: StyleSection): "style" | "image" {
  return section === "safety" ? "image" : "style";
}
