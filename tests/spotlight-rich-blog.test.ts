import { describe, expect, it } from "vitest";

import {
  jsonLdScriptContent,
  slugifyHeading,
  splitBodyFaq,
  uniqueHeadingId,
} from "@/lib/spotlight";

// Pure, node-safe: the rich-blog reading helpers (frontend SPEC-121 / backend
// SPEC-124) mirror the backend derive transforms so in-app anchor ids line up
// with the served `toc` ids.

describe("slugifyHeading", () => {
  it("lowercases, hyphenates, and trims like the backend slug", () => {
    expect(slugifyHeading("Why one wardrobe")).toBe("why-one-wardrobe");
    expect(slugifyHeading("Frequently Asked Questions")).toBe(
      "frequently-asked-questions",
    );
    expect(slugifyHeading("From day — to evening!")).toBe("from-day-to-evening");
  });

  it("never returns an empty id", () => {
    expect(slugifyHeading("   ")).toBe("section");
    expect(slugifyHeading("!!!")).toBe("section");
  });
});

describe("uniqueHeadingId", () => {
  it("suffixes repeated headings -1/-2 (matches backend toc de-dup)", () => {
    const counts = new Map<string, number>();
    expect(uniqueHeadingId("Fit", counts)).toBe("fit");
    expect(uniqueHeadingId("Fit", counts)).toBe("fit-1");
    expect(uniqueHeadingId("Fit", counts)).toBe("fit-2");
    expect(uniqueHeadingId("Care", counts)).toBe("care");
  });
});

describe("jsonLdScriptContent", () => {
  it("stringifies the JSON-LD list and escapes < to prevent breakout", () => {
    const out = jsonLdScriptContent([
      { "@type": "Article", headline: "a <b> c" },
    ]);
    expect(out).toContain('"@type":"Article"');
    expect(out).not.toContain("<b>");
    expect(out).toContain("\\u003c");
  });

  it("returns an empty string for an empty payload", () => {
    expect(jsonLdScriptContent([])).toBe("");
  });
});

describe("splitBodyFaq", () => {
  const BODY = [
    "Intro paragraph.",
    "",
    "## Why one wardrobe",
    "",
    "Great everywhere.",
    "",
    "## Frequently Asked Questions",
    "",
    "### Is it warm?",
    "",
    "Yes.",
  ].join("\n");

  it("lifts the FAQ section out of the body and returns its heading id", () => {
    const { body, faqHeadingId } = splitBodyFaq(BODY);
    expect(body).toContain("## Why one wardrobe");
    expect(body).not.toContain("Frequently Asked Questions");
    expect(body).not.toContain("### Is it warm?");
    expect(faqHeadingId).toBe("frequently-asked-questions");
  });

  it("leaves the body untouched when there is no FAQ section", () => {
    const noFaq = "Intro.\n\n## Why one wardrobe\n\nGreat.";
    expect(splitBodyFaq(noFaq)).toEqual({ body: noFaq, faqHeadingId: null });
  });

  it("keeps sections that follow the FAQ (stops at the next H2)", () => {
    const withTrailing = `${BODY}\n\n## Closing thoughts\n\nWrap up.`;
    const { body } = splitBodyFaq(withTrailing);
    expect(body).toContain("## Why one wardrobe");
    expect(body).toContain("## Closing thoughts");
    expect(body).not.toContain("Frequently Asked Questions");
  });
});
