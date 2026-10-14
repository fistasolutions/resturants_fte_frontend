/**
 * The organization's brand colour (SPEC-322 over backend SPEC-323) — pure. One colour in, every
 * brand variable for both themes out, each pair readable:
 *
 * - the **fill** (buttons, the active nav bar, focus rings, the login band) must stand out from
 *   the surfaces it sits on by at least 3 : 1 (WCAG 1.4.11, non-text contrast);
 * - the **text on the fill** is white or the ink, whichever reads better, and must reach
 *   4.5 : 1 (WCAG 1.4.3).
 *
 * When the colour as chosen fails either, it is darkened (light theme) or lightened (dark theme)
 * in small OKLCH-lightness steps — hue and chroma kept, chroma reduced only as far as the sRGB
 * gamut forces — until both pass. Status colours are never touched: the variable list below is
 * the whole of what an organization's colour can change.
 *
 * The hex values in this file mirror `app/globals.css` (the surfaces, the ink, white and the
 * error red). They are the maths' inputs, never styling.
 */

/** The variables a brand colour sets — and the only ones it may ever set. */
export const BRAND_VARS = [
  "--primary",
  "--primary-foreground",
  "--brand",
  "--brand-foreground",
  "--ring",
  "--sidebar-primary",
  "--sidebar-primary-foreground",
  "--sidebar-ring",
  "--showcase-band",
  "--showcase-band-foreground",
] as const;

export type BrandVar = (typeof BRAND_VARS)[number];
export type BrandVars = Record<BrandVar, string>;
export type ThemeName = "light" | "dark";

export interface BrandTheme {
  /** The colour as chosen, normalised. */
  hex: string;
  light: BrandVars;
  dark: BrandVars;
  /** Whether the fill had to move to stay readable in that theme. */
  adjusted: Record<ThemeName, boolean>;
  /** Close to the error red (hue within 20°, saturated) — a warning, never a refusal. */
  nearDestructive: boolean;
}

export const INK = "#1a1b18";
export const WHITE = "#ffffff";
/** `--destructive` in the light theme; the dark one (#ef4444) shares its hue. */
export const ERROR_RED = "#dc2626";

/**
 * The surfaces a brand fill sits on in each theme (`globals.css`): the page, the cards and the
 * sidebar. The page is the one the spec names; cards and the sidebar are checked too because
 * that is where buttons and the active nav item actually sit.
 */
export const SURFACES: Record<ThemeName, { page: string; others: readonly string[] }> = {
  light: { page: "#f4f5f7", others: ["#ffffff"] },
  dark: { page: "#121310", others: ["#1b1c19", "#191a17"] },
};

export const MIN_FILL_CONTRAST = 3;
export const MIN_TEXT_CONTRAST = 4.5;
/** The OKLCH-lightness step the fill moves by. */
const L_STEP = 0.01;

// ── Hex ──────────────────────────────────────────────────────────────────────────────────────

/** `#rrggbb` (lower case) from `#rgb` / `#rrggbb` in any case, with or without the `#`; null
 * for anything else. Every colour that reaches a stylesheet goes through this. */
export function normaliseHex(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const raw = value.trim().replace(/^#/, "").toLowerCase();
  if (/^[0-9a-f]{3}$/.test(raw)) {
    return `#${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`;
  }
  return /^[0-9a-f]{6}$/.test(raw) ? `#${raw}` : null;
}

type Rgb = readonly [number, number, number];

/** 0–1 sRGB channels of a valid `#rrggbb`. */
function toRgb(hex: string): Rgb {
  const n = Number.parseInt(hex.slice(1), 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function mapRgb(rgb: Rgb, fn: (channel: number) => number): Rgb {
  return [fn(rgb[0]), fn(rgb[1]), fn(rgb[2])];
}

function toHex(rgb: Rgb): string {
  return `#${rgb
    .map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0"))
    .join("")}`;
}

function mustHex(value: string): string {
  const hex = normaliseHex(value);
  if (!hex) throw new Error(`Not a colour: ${value}`);
  return hex;
}

// ── WCAG 2.x ─────────────────────────────────────────────────────────────────────────────────

function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function fromLinear(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
}

/** WCAG 2.x relative luminance, 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = mapRgb(toRgb(mustHex(hex)), toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, 1 to 21, order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// ── OKLab / OKLCH (Björn Ottosson's matrices) ────────────────────────────────────────────────

interface Oklch {
  l: number;
  c: number;
  h: number;
}

function linearToOklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear([L, a, b]: Rgb): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

function hexToOklch(hex: string): Oklch {
  const [l, a, b] = linearToOklab(mapRgb(toRgb(hex), toLinear));
  const h = (Math.atan2(b, a) * 180) / Math.PI;
  return { l, c: Math.hypot(a, b), h: h < 0 ? h + 360 : h };
}

function oklchToLinear({ l, c, h }: Oklch): Rgb {
  const rad = (h * Math.PI) / 180;
  return oklabToLinear([l, c * Math.cos(rad), c * Math.sin(rad)]);
}

const GAMUT_EPSILON = 1e-6;

function inGamut(rgb: Rgb): boolean {
  return rgb.every((c) => c >= -GAMUT_EPSILON && c <= 1 + GAMUT_EPSILON);
}

/** The colour at this lightness, hue kept, chroma reduced (binary search) only as far as the
 * sRGB gamut requires. */
function oklchToHex(color: Oklch): string {
  const l = Math.min(1, Math.max(0, color.l));
  let linear = oklchToLinear({ ...color, l });
  if (!inGamut(linear)) {
    let low = 0;
    let high = color.c;
    for (let i = 0; i < 24; i += 1) {
      const mid = (low + high) / 2;
      if (inGamut(oklchToLinear({ l, c: mid, h: color.h }))) low = mid;
      else high = mid;
    }
    linear = oklchToLinear({ l, c: low, h: color.h });
  }
  return toHex(mapRgb(linear, (c) => fromLinear(Math.min(1, Math.max(0, c)))));
}

// ── The theme ────────────────────────────────────────────────────────────────────────────────

/** White or the ink — whichever contrasts more with the fill. */
export function textOn(fill: string): string {
  return contrastRatio(fill, WHITE) >= contrastRatio(fill, INK) ? WHITE : INK;
}

function fillContrast(fill: string, theme: ThemeName): number {
  const { page, others } = SURFACES[theme];
  return Math.min(contrastRatio(fill, page), ...others.map((s) => contrastRatio(fill, s)));
}

function passes(fill: string, theme: ThemeName): boolean {
  return (
    fillContrast(fill, theme) >= MIN_FILL_CONTRAST &&
    contrastRatio(fill, textOn(fill)) >= MIN_TEXT_CONTRAST
  );
}

/** The fill for one theme: the colour itself when it passes, else stepped darker (light) or
 * lighter (dark) until it does. It always ends: pure black and pure white pass both themes. */
function fillFor(hex: string, theme: ThemeName): string {
  if (passes(hex, theme)) return hex;
  const start = hexToOklch(hex);
  const direction = theme === "light" ? -1 : 1;
  for (let step = 1; step <= Math.ceil(1 / L_STEP); step += 1) {
    const candidate = oklchToHex({ ...start, l: start.l + direction * step * L_STEP });
    if (passes(candidate, theme)) return candidate;
  }
  return theme === "light" ? "#000000" : WHITE;
}

function varsFor(fill: string): BrandVars {
  const text = textOn(fill);
  return {
    "--primary": fill,
    "--primary-foreground": text,
    "--brand": fill,
    "--brand-foreground": text,
    "--ring": fill,
    "--sidebar-primary": fill,
    "--sidebar-primary-foreground": text,
    "--sidebar-ring": fill,
    "--showcase-band": fill,
    "--showcase-band-foreground": text,
  };
}

/** HSL hue (degrees), saturation and lightness (0–1) — the everyday sense of "a red". */
function hsl(hex: string): { h: number; s: number; l: number } {
  const [r, g, b] = toRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return { h: h < 0 ? h + 360 : h, s, l };
}

const NEAR_HUE_DEGREES = 20;
const NEAR_MIN_SATURATION = 0.5;

/** A saturated colour whose hue is within 20° of the error red's — a button in it would read
 * as "delete". Very dark and very light tints are not flagged. */
export function isNearDestructive(value: string): boolean {
  const hex = normaliseHex(value);
  if (!hex) return false;
  const colour = hsl(hex);
  const red = hsl(ERROR_RED);
  const distance = Math.abs(colour.h - red.h) % 360;
  const hueGap = Math.min(distance, 360 - distance);
  return (
    hueGap <= NEAR_HUE_DEGREES &&
    colour.s >= NEAR_MIN_SATURATION &&
    colour.l >= 0.25 &&
    colour.l <= 0.75
  );
}

/** Every brand variable for both themes from one colour; null for anything that is not a
 * colour. */
export function brandTheme(value: string | null | undefined): BrandTheme | null {
  const hex = normaliseHex(value);
  if (!hex) return null;
  const light = fillFor(hex, "light");
  const dark = fillFor(hex, "dark");
  return {
    hex,
    light: varsFor(light),
    dark: varsFor(dark),
    adjusted: { light: light !== hex, dark: dark !== hex },
    nearDestructive: isNearDestructive(hex),
  };
}

function declarations(vars: BrandVars): string {
  return BRAND_VARS.map((name) => `${name}:${vars[name]};`).join("");
}

/**
 * The stylesheet the app and the login screen render (SPEC-322 §2): `html:root` for the light
 * theme and `html.dark` for the dark one — one step more specific than `globals.css`'s `:root`
 * and `.dark`, so it wins without `!important`. Built only from normalised hex values and the
 * fixed variable list: nothing typed by a person reaches the CSS raw. Null when there is no
 * valid colour (the platform colours stay).
 */
export function brandCss(value: string | null | undefined): string | null {
  const theme = brandTheme(value);
  if (!theme) return null;
  return `html:root{${declarations(theme.light)}}html.dark{${declarations(theme.dark)}}`;
}

// ── The API's shapes ─────────────────────────────────────────────────────────────────────────

export type BrandColorSource = "logo" | "custom";

export interface BrandColor {
  hex: string;
  source: BrandColorSource;
}

export interface ApiBrandColor {
  hex?: string | null;
  source?: string | null;
}

/** The stored colour from the backend's branding view; absent, null or malformed is no colour
 * (an older backend has no `color` at all). */
export function toBrandColor(api: ApiBrandColor | null | undefined): BrandColor | null {
  const hex = normaliseHex(api?.hex);
  if (!hex) return null;
  return { hex, source: api?.source === "logo" ? "logo" : "custom" };
}

export interface ApiBrandPalette {
  colors?: unknown;
  from?: string | null;
}

export interface BrandPalette {
  colors: string[];
  /** Which logo the colours were read from; null when there is no logo. */
  from: "light" | "dark" | null;
}

/** The logo's suggested colours — normalised, de-duplicated, at most five. */
export function toBrandPalette(api: ApiBrandPalette | null | undefined): BrandPalette {
  const raw = Array.isArray(api?.colors) ? api.colors : [];
  const colors: string[] = [];
  for (const value of raw) {
    const hex = typeof value === "string" ? normaliseHex(value) : null;
    if (hex && !colors.includes(hex)) colors.push(hex);
    if (colors.length === 5) break;
  }
  const from = api?.from === "light" || api?.from === "dark" ? api.from : null;
  return { colors, from };
}

// ── The Settings card's small decisions ──────────────────────────────────────────────────────

/** The platform's own brand red (`--brand` in `globals.css`) — the colour picker's starting
 * point when nothing is chosen. */
export const PLATFORM_RED = "#e42828";

/** Whether Save has something to save: a valid choice whose colour differs from the stored one
 * (choosing the same colour by another route is not a change). */
export function colorChanged(saved: BrandColor | null, choice: BrandColor | null): boolean {
  if (!choice) return false;
  return choice.hex !== saved?.hex;
}

/** What the hex field says about what was typed: null when it is a colour (or still empty). */
export function hexFieldError(text: string): string | null {
  if (text.trim() === "" || normaliseHex(text)) return null;
  return "Enter a colour as #rrggbb, for example #1e3a8a.";
}

/** The note under the preview when a theme's fill had to move; null when neither did. */
export function adjustedNote(adjusted: Record<ThemeName, boolean>): string | null {
  if (adjusted.light && adjusted.dark) return "Adjusted slightly in both themes so buttons stay readable.";
  if (adjusted.light) return "Adjusted slightly in the light theme so buttons stay readable.";
  if (adjusted.dark) return "Adjusted slightly in the dark theme so buttons stay readable.";
  return null;
}

export const NEAR_DESTRUCTIVE_NOTE = "Close to the red used for errors and delete buttons.";
