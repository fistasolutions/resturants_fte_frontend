import type { DocSection, FeatureDoc } from "@/types/docs";

import type { DocScreenKey } from "@/lib/docs/screens";

/** A section whose `screen` must be a key the registry actually has. */
export type DocSectionInput = Omit<DocSection, "screen"> & { screen?: DocScreenKey };

/** `FeatureDoc` with screen references narrowed to registry keys — a doc that
 * names a capture that does not exist fails `tsc`, not a reader. */
export type FeatureDocInput = Omit<FeatureDoc, "hero" | "sections"> & {
  hero: DocScreenKey;
  sections: DocSectionInput[];
};

/** Identity with a narrower input type: content files call this so every screen
 * key is checked at compile time (SPEC-229). */
export function defineDoc(doc: FeatureDocInput): FeatureDoc {
  return doc;
}
