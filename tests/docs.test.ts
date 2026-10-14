import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import {
  DOC_ANCHORS,
  DOC_AREAS,
  DOCS_ROOT,
  FEATURE_DOCS,
  activeDocArea,
  activeDocSlug,
  docHref,
  docNeighbors,
  docsForArea,
  formatUpdated,
  getDoc,
  getDocArea,
  relatedDocs,
  sectionAnchor,
} from "@/lib/docs";
import { OVERVIEW_SCREENS } from "@/lib/docs/overview";
import { DOC_SCREENS } from "@/lib/docs/screens";
import { navItems } from "@/lib/navigation";

const PUBLIC_DOCS = fileURLToPath(new URL("../public/docs/", import.meta.url));

/** Every screen key any doc (or the overview) references. */
function referencedScreens(): Set<string> {
  const keys = new Set<string>();
  for (const doc of FEATURE_DOCS) {
    keys.add(doc.hero);
    for (const section of doc.sections) if (section.screen) keys.add(section.screen);
  }
  for (const item of OVERVIEW_SCREENS) keys.add(item.screen);
  return keys;
}

describe("docs registry — coverage (root Rule 11)", () => {
  it("every enabled sidebar destination except /docs has exactly one doc", () => {
    const routes = navItems.filter((item) => item.enabled && item.href !== DOCS_ROOT).map((item) => item.href);
    for (const route of routes) {
      const matches = FEATURE_DOCS.filter((doc) => doc.route === route);
      expect(matches, `no doc for sidebar route ${route} — add lib/docs/content/<slug>.ts`).toHaveLength(1);
    }
  });

  it("every doc documents a sidebar destination, with the sidebar's title", () => {
    for (const doc of FEATURE_DOCS) {
      const item = navItems.find((nav) => nav.href === doc.route);
      expect(item, `${doc.slug} documents ${doc.route}, which is not in the sidebar`).toBeDefined();
      expect(doc.title).toBe(item?.title);
    }
  });

  it("slugs are unique and match their route's first segment", () => {
    const slugs = FEATURE_DOCS.map((doc) => doc.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const doc of FEATURE_DOCS) {
      expect(doc.route).toBe(`/${doc.slug}`);
    }
  });

  it("every doc belongs to a declared area, and every non-start area has docs", () => {
    const areaKeys = new Set(DOC_AREAS.map((area) => area.key));
    for (const doc of FEATURE_DOCS) expect(areaKeys.has(doc.area)).toBe(true);
    for (const area of DOC_AREAS) {
      if (area.key === "start") expect(docsForArea(area.key)).toHaveLength(0);
      else expect(docsForArea(area.key).length, `area ${area.key} is empty`).toBeGreaterThan(0);
    }
  });
});

describe("docs registry — every section populated (SPEC-229)", () => {
  it.each(FEATURE_DOCS.map((doc) => [doc.slug, doc] as const))("%s has every section", (_slug, doc) => {
    expect(doc.tagline.length).toBeGreaterThan(20);
    expect(doc.sources.length).toBeGreaterThan(0);
    expect(doc.refresh.length).toBeGreaterThan(0);
    expect(doc.updated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(doc.heroCaption.length).toBeGreaterThan(20);
    expect(doc.whatItIs.length).toBeGreaterThanOrEqual(1);
    expect(doc.whyItMatters.length).toBeGreaterThanOrEqual(2);
    expect(doc.whyItMatters.length).toBeLessThanOrEqual(4);
    expect(doc.howItWorks.length).toBeGreaterThanOrEqual(3);
    expect(doc.sections.length).toBeGreaterThanOrEqual(1);
    expect(doc.howToUse.length).toBeGreaterThanOrEqual(3);
    expect(doc.benefits.length).toBeGreaterThanOrEqual(2);
    expect(doc.goodToKnow.length).toBeGreaterThanOrEqual(1);
    expect(doc.related.length).toBeGreaterThanOrEqual(1);
    for (const section of doc.sections) {
      expect(section.title.length).toBeGreaterThan(0);
      expect(section.summary.length).toBeGreaterThan(20);
    }
  });

  it("section titles are unique within a doc (they become anchors)", () => {
    for (const doc of FEATURE_DOCS) {
      const anchors = doc.sections.map((section) => sectionAnchor(section.title));
      expect(new Set(anchors).size, `${doc.slug} has duplicate section anchors`).toBe(anchors.length);
    }
  });

  it("related slugs resolve, never point at the doc itself, and never dangle", () => {
    for (const doc of FEATURE_DOCS) {
      expect(doc.related).not.toContain(doc.slug);
      expect(relatedDocs(doc)).toHaveLength(doc.related.length);
    }
  });
});

describe("docs screens — registry and files agree", () => {
  it("every referenced screen key exists in the registry", () => {
    for (const key of referencedScreens()) {
      expect(key in DOC_SCREENS, `screen "${key}" is referenced but not in the registry`).toBe(true);
    }
  });

  it("every registry entry has its file under public/docs, with sane dimensions", () => {
    for (const [key, screen] of Object.entries(DOC_SCREENS)) {
      expect(screen.src).toBe(`/docs/${key}.webp`);
      expect(existsSync(`${PUBLIC_DOCS}${key}.webp`), `missing public/docs/${key}.webp`).toBe(true);
      expect(screen.width).toBeGreaterThan(0);
      expect(screen.height).toBeGreaterThan(0);
    }
  });

  it("no orphan files and no orphan registry keys", () => {
    const files = new Set(readdirSync(PUBLIC_DOCS).filter((name) => name.endsWith(".webp")));
    const keys = new Set(Object.keys(DOC_SCREENS).map((key) => `${key}.webp`));
    expect([...files].filter((file) => !keys.has(file)), "files with no registry entry").toEqual([]);
    expect([...keys].filter((key) => !files.has(key)), "registry entries with no file").toEqual([]);
    const referenced = new Set([...referencedScreens()].map((key) => `${key}.webp`));
    expect([...keys].filter((key) => !referenced.has(key)), "registry entries no doc references").toEqual([]);
  });
});

describe("docs helpers", () => {
  it("getDoc / getDocArea / docHref", () => {
    expect(getDoc("brief")?.title).toBe("Morning Brief");
    expect(getDoc("nope")).toBeNull();
    expect(getDocArea("growth").label).toBe("Growth");
    expect(docHref("brief")).toBe("/docs/brief");
  });

  it("activeDocSlug resolves the slug from a docs pathname", () => {
    expect(activeDocSlug("/docs")).toBeNull();
    expect(activeDocSlug("/docs/")).toBeNull();
    expect(activeDocSlug("/docs/brief")).toBe("brief");
    expect(activeDocSlug("/docs/brief/")).toBe("brief");
    expect(activeDocSlug("/docs/unknown")).toBeNull();
    expect(activeDocSlug("/brief")).toBeNull();
  });

  it("activeDocArea: /docs → start, a doc → its area, unknown → null", () => {
    expect(activeDocArea("/docs")).toBe("start");
    expect(activeDocArea("/docs/")).toBe("start");
    expect(activeDocArea("/docs/spotlight")).toBe("growth");
    expect(activeDocArea("/docs/settings")).toBe("platform");
    expect(activeDocArea("/docs/unknown")).toBeNull();
    expect(activeDocArea("/dashboard")).toBeNull();
  });

  it("docNeighbors walks the reading order and stops at the ends", () => {
    const first = FEATURE_DOCS[0];
    const last = FEATURE_DOCS[FEATURE_DOCS.length - 1];
    expect(docNeighbors(first.slug).previous).toBeNull();
    expect(docNeighbors(first.slug).next?.slug).toBe(FEATURE_DOCS[1].slug);
    expect(docNeighbors(last.slug).next).toBeNull();
    expect(docNeighbors(last.slug).previous?.slug).toBe(FEATURE_DOCS[FEATURE_DOCS.length - 2].slug);
    expect(docNeighbors("unknown")).toEqual({ previous: null, next: null });
  });

  it("sectionAnchor slugifies deterministically", () => {
    expect(sectionAnchor("Review & Send — overdue orders")).toBe("screen-review-send-overdue-orders");
    expect(sectionAnchor("Warehouse → Store")).toBe("screen-warehouse-store");
    expect(sectionAnchor("  Overview  ")).toBe("screen-overview");
  });

  it("formatUpdated renders a human date and passes through junk", () => {
    expect(formatUpdated("2026-09-11")).toBe("11 Sep 2026");
    expect(formatUpdated("2026-01-05")).toBe("5 Jan 2026");
    expect(formatUpdated("not-a-date")).toBe("not-a-date");
  });

  it("DOC_ANCHORS ids are unique", () => {
    const ids = DOC_ANCHORS.map((anchor) => anchor.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
