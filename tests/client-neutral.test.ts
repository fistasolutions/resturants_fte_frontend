import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

import { describe, expect, it } from "vitest";

/** SPEC-323 — the first client's reports and wording stay theirs. */

const ROOT = join(__dirname, "..");
const SOURCE_DIRS = ["app", "features", "components", "lib", "services", "hooks"];
const GENERATED = new Set(["lib/ci/content.ts"]);

/** A client's catalogue, town or niche — never an example on a screen every organization sees. */
const CLIENT_SPECIFIC = /katie dress|lakewood|modest|womenswear|orthodox|kosher|tznius/i;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(ts|tsx)$/.test(name)) out.push(path);
  }
  return out;
}

const FILES = SOURCE_DIRS.flatMap((dir) => sourceFiles(join(ROOT, dir))).map((path) => ({
  path: relative(ROOT, path).split("\\").join("/"),
  text: readFileSync(path, "utf8"),
}));

describe("client-neutral copy", () => {
  it("no screen, doc or helper names the first client's catalogue, town or niche", () => {
    const hits = FILES.filter((f) => !GENERATED.has(f.path)).flatMap((f) =>
      f.text
        .split("\n")
        .map((line, i) => ({ line, n: i + 1 }))
        .filter(({ line }) => CLIENT_SPECIFIC.test(line))
        .map(({ line, n }) => `${f.path}:${n}: ${line.trim().slice(0, 120)}`),
    );
    expect(hits).toEqual([]);
  });

  it("the guard catches a planted example", () => {
    expect(CLIENT_SPECIFIC.test('placeholder="Same shoppers in Lakewood"')).toBe(true);
  });
});

describe("Continuous Innovation stays with its organization", () => {
  it("only the server-only module imports the generated reports", () => {
    const importers = FILES.filter((f) => /from ["']@\/lib\/ci\/content["']/.test(f.text)).map(
      (f) => f.path,
    );
    expect(importers).toEqual(["lib/ci/reports.ts"]);
  });

  it("the reports module is server-only", () => {
    const reports = FILES.find((f) => f.path === "lib/ci/reports.ts");
    expect(reports?.text.startsWith('import "server-only";')).toBe(true);
  });

  it("the /ci layout checks the organization's ci feature before rendering", () => {
    const layout = FILES.find((f) => f.path === "app/(app)/ci/layout.tsx");
    expect(layout?.text).toMatch(/getWorkspace\(\)/);
    expect(layout?.text).toMatch(/features\.includes\("ci"\)\)\s*notFound\(\)/);
  });

  it("no report page is pre-rendered at build", () => {
    const pages = FILES.filter((f) => f.path.startsWith("app/(app)/ci/"));
    expect(pages.some((f) => f.text.includes("generateStaticParams"))).toBe(false);
  });
});
