# SPEC-322 — Branding: the organization's brand colour, across the whole app

**Repo:** frontend · **Status:** implemented (manual verification pending backend SPEC-323) · **Date:** 2026-09-28
**Backend contract:** `ecommerce-fte-backend/specs/SPEC-323-brand-color.md` (the `color` field,
`PUT`/`DELETE …/branding/color`, `GET …/branding/palette`).
**Extends:** `SPEC-317` (Settings → Branding) and the login screen's branding.
**Owner decision (2026-09-28):** an organization picks one brand colour — suggested from its logo
or custom — and the **whole app** takes it: primary buttons, the brand accents, focus rings,
the active navigation, the login screen. Status colours never change. (Rule 9's "brand red is
identity-only" now reads: `--brand` is the *organization's* identity colour; the platform red
is its default.)

## 1. One pure module decides every colour — `lib/brand-color.ts`

`brandTheme(hex) → { light: Vars, dark: Vars, adjusted: {light: boolean, dark: boolean}, nearDestructive: boolean }`

For each theme (light page `#f4f5f7`, dark page = the dark `--background`):
- **fill** starts as the brand hex. If its contrast against the page background is under
  **3 : 1** (WCAG 1.4.11 — a button must be visible as a shape), it is darkened (light theme) or
  lightened (dark theme) in small OKLCH-lightness steps until it passes; `adjusted` records it.
- **text on the fill** is white or the ink (`#1a1b18`), whichever contrasts more; if neither
  reaches **4.5 : 1**, the fill moves further (same direction) until one does.
- The variables set: `--primary`, `--primary-foreground`, `--brand`, `--brand-foreground`,
  `--ring`, `--sidebar-primary`, `--sidebar-primary-foreground`, `--sidebar-ring`,
  `--showcase-band`, `--showcase-band-foreground`.
- **Never set:** `--destructive`, `--success`, `--warning`, `--info`, `--ai`, charts, labels,
  backgrounds, borders, text colours.
- `nearDestructive`: the colour's hue is within 20° of the error red's and it is saturated —
  shown as a warning ("Close to the red used for errors and delete buttons"), never blocked.

`normaliseHex`, `contrastRatio`, `relativeLuminance` (WCAG 2.x) are exported and tested.

## 2. Applying it — server-rendered, no flash

`components/shared/brand-theme.tsx` renders `<style>` with `html:root{…}` (light) and
`html.dark{…}` (dark) — specificity above `globals.css`'s `:root` / `.dark`, so it wins without
`!important`. It renders nothing when there is no colour (the platform colours stay).
- `app/(app)/layout.tsx`: from the workspace read it already awaits (no new request).
- `app/(auth)/layout.tsx`: from the public branding by slug it already reads.
Saving or resetting the colour refreshes the route (`router.refresh()` + the workspace/branding
queries invalidated) so the whole app recolours at once.

## 3. Settings → Branding → **Brand colour** card

- **From your logo:** swatches from `GET …/branding/palette` (shown only when a logo exists;
  otherwise a line: "Upload a logo to get colour suggestions").
- **Custom:** a native colour input beside a hex field (`#rrggbb`, validated as typed).
- **Live preview**, before saving, in both themes side by side: a primary button, a nav item in
  its active state, a link, a focus ring and a small tag — styled by applying `brandTheme()`'s
  variables to the preview box only (scoped `style`), never the page.
- Notes under the preview: "Adjusted slightly so buttons stay readable" when `adjusted`; the
  near-destructive warning when `nearDestructive`.
- **Save** (disabled until the choice differs from the saved one) and **Reset to Ecommerce FTE
  red** (only when a colour is set). Needs `settings.manage`; a viewer sees it read-only.
- The state of the card: loading skeleton, error with retry, empty palette line.

## 4. In-app docs (Rule 11)

`lib/docs/content/settings.ts` — the Branding section describes the brand colour (suggested
from the logo or custom, what changes and what never does), `updated` bumped.

## Tests (Vitest, `tests/brand-color.test.ts` + the adapter)

WCAG maths against known pairs; `normaliseHex`; `brandTheme` — a dark blue keeps its fill with
white text in light mode and is lightened in dark mode; yellow gets ink text and is darkened
for the light page; every resulting fill/text pair ≥ 4.5 : 1 and every fill ≥ 3 : 1 against its
page, over a sweep of hues and lightnesses; `nearDestructive` for `#e42828`/`#d7263d` but not
blue; the variable list never contains a status token; the branding adapter reads `color`.

## Manual verification

- [ ] Pick a swatch → preview updates; Save → sidebar active item, primary buttons, focus ring,
      login screen band all change, in light and dark; Reset → back to platform colours.
- [ ] Error toast, destructive button and success badge keep their colours.
- [ ] A viewer sees the card read-only.

## Acceptance criteria

- [x] One pure module derives every brand variable, readable in both themes (tested).
- [x] The app and login screen render the organization's colour server-side, no flash.
      *(code done and SSR output checked; not seen in a browser — needs backend SPEC-323's
      `color` field, see Manual verification)*
- [x] Settings: suggestions from the logo, custom picker, live preview, save, reset.
      *(built; the round trip against a real backend is not yet verified)*
- [x] Status colours untouched. Docs updated. `npm test`, `tsc`, `lint`, `build` green.

## Added during implementation (2026-09-28)

**Files**
- New: `lib/brand-color.ts` (the pure module: WCAG maths, `normaliseHex`, sRGB ⇄ OKLab/OKLCH
  with gamut clamping by chroma binary search, `brandTheme`, `brandCss`, `isNearDestructive`,
  the adapters `toBrandColor` / `toBrandPalette`, and the card's small decisions
  `colorChanged` / `hexFieldError` / `adjustedNote`), `components/shared/brand-theme.tsx`,
  `features/settings/brand-color-card.tsx`, `features/settings/brand-color-preview.tsx`,
  `tests/brand-color.test.ts`.
- Changed: `lib/login-media.ts` (`PublicBranding.color?`, `LoginMedia.color`),
  `lib/branding.ts` (`Branding.color`), `lib/workspace.ts` (`WorkspaceBrand.color`),
  `lib/queries/branding.ts` (`brandingQueries.palette()`, key `["branding","palette"]`),
  `services/branding.ts` (`setBrandColor` PUT JSON, `clearBrandColor` DELETE),
  `features/settings/branding-view.tsx`, `app/(app)/settings/branding/page.tsx` (palette
  prefetched beside the other two reads), `app/(app)/layout.tsx`, `app/(auth)/layout.tsx`,
  `app/globals.css` (`:root` → `:root, .light`), `lib/docs/content/settings.ts`, and the tests
  `branding.test.ts`, `login-media.test.ts`, `query-registries.test.ts`.

**Decisions**
- **Fill contrast is checked against every surface the fill sits on, not only the page:**
  light = page `#f4f5f7` + card/sidebar `#ffffff`; dark = page `#121310` + card `#1b1c19` +
  sidebar `#191a17`. Buttons live on cards, so the page alone would let a light-theme fill pass
  on the page and fail on a card. Stricter than §1; the page ≥ 3 : 1 rule still holds (tested).
- **Step size 0.01 in OKLCH L**, hue kept, chroma reduced only when out of sRGB gamut. The loop
  always ends (black passes the light theme, white the dark).
- **`nearDestructive`** uses HSL hue against `--destructive` (`#dc2626`, hue 0°): within 20°,
  saturation ≥ 0.5 and lightness 0.25–0.75 (very dark maroons and pale pinks do not read as the
  error red). `#e42828` and `#d7263d` flag; blue, green, `#fde2e2`, `#3b0a0a` do not.
- **Preview scoping needs a light box inside a dark page**, so `globals.css`'s light block now
  also answers to `.light`. Nothing sets that class on `<html>` (the theme script only toggles
  `dark`), so the page is unaffected. Each preview box carries `light`/`dark` plus the chosen
  colour's variables as an inline style on that box only, and is `inert`.
- **`<style>` is a plain element, not a React 19 hoisted one** (`href`/`precedence`): hoisted
  styles are deduplicated by `href` and never removed, so Reset would leave the old colour until
  a reload. The plain element is replaced or removed by `router.refresh()`.
- **"Invalidate the workspace query"**: there is no client workspace query — the workspace is the
  `(app)` layout's server read (`getWorkspace`, `no-store`), so `router.refresh()` is what
  re-reads it. The branding cache is updated with the PUT/DELETE answer (`setQueryData`, the
  existing pattern) rather than invalidated, and a logo upload/removal now also invalidates the
  palette (its suggestions come from the logo).
- **Save stays disabled while the hex field holds an invalid value**, even if an earlier valid
  choice exists, so what is saved is always what the field shows.
- The swatches are drawn with an inline `backgroundColor` from the (normalised) palette data —
  the one place a data colour, not a token, is painted.
- The login screen's colour comes from `rememberedLoginMedia()`, which revalidates every 300 s
  (existing behaviour for the logo and media too), so the login screen can lag a change by up
  to five minutes; the app itself changes at once.

**Known limitation (flagged for the owner)** — §1 asks the fill for 3 : 1 against the page, which
is right for a button *shape*. But `--primary` is also the colour of text links
(`text-primary`, ~66 uses) and of `variant="link"` buttons, where WCAG asks 4.5 : 1. A mid-tone
brand colour (e.g. sky `#0ea5e9`, which ends near 3 : 1 on the light page with ink button text)
therefore yields links between 3 : 1 and 4.5 : 1. Fixing it means either a 4.5 : 1 fill target
(darker buttons for many colours) or a separate link token — an owner decision, not made here.
