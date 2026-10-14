import { brandCss } from "@/lib/brand-color";

/**
 * The organization's brand colour, applied to the whole page (SPEC-322 §2). Rendered by a server
 * layout, so the colour is in the first HTML — no flash of the platform's own. A plain `<style>`
 * (not a hoisted one) so a refresh after Save or Reset replaces or removes it.
 *
 * The CSS text comes from `brandCss`, which builds it only from a normalised `#rrggbb` and a
 * fixed variable list; anything else renders nothing and the platform colours stay.
 */
export function BrandTheme({ hex }: { hex: string | null | undefined }) {
  const css = brandCss(hex);
  if (!css) return null;
  return <style data-brand-theme="">{css}</style>;
}
