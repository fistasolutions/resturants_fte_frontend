/**
 * The platform's own identity (SPEC-337) — the one place the product is named, so a rename is
 * one edit. An organization's brand, when set, always wins over these (SPEC-317/318/322).
 * `ftes` is always lower case, at the start of a sentence too.
 */
export const PRODUCT = {
  company: "ftes.ai",
  name: "ftes for Commerce",
  short: "ftes",
  tagline: "Your whole store, on one screen",
  descriptor: "Digital employees for commerce",
  marketingUrl: "https://ftes.ai/commerce",
} as const;

/** The name shown when an organization has no brand name of its own. */
export function displayBrandName(orgName: string | null | undefined): string {
  const trimmed = orgName?.trim();
  return trimmed ? trimmed : PRODUCT.short;
}
