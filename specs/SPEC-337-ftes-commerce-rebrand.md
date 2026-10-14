# SPEC-337 — The platform is ftes for Commerce

**Status:** implemented 2026-10-05 · **Repo:** frontend · **Backend:** none

## Why

The platform's own name moves from "Ecommerce FTE" to the ftes.ai brand. The name had no single
source: it was typed out by hand in 24 files. This spec gives it one (`lib/product.ts`), routes
every customer-visible use through it, and adds a test that fails the build if the old name comes
back. A future rename is then one edit.

The app is white-label per organization (SPEC-317/318/322). The organization's own name, logo
and colour still win everywhere; only the **platform fallback** changes.

## Decisions (owner, 2026-10-05)

| Key | Value |
| --- | --- |
| Company | `ftes.ai` |
| Product name (titles, copy) | `ftes for Commerce` |
| Short name (tight spaces, fallbacks, "Open in …") | `ftes` |
| Tagline | `Your whole store, on one screen` |
| Descriptor (replaces "AI Business Analyst" beside the name) | `Digital employees for commerce` |
| Marketing URL default | `https://ftes.ai/commerce` |
| Rename employees | no |

`ftes` is always lower case, at the start of a sentence and in titles too.

## What changes

1. **`lib/product.ts`** (pure, no `"use client"`): `PRODUCT` (company, name, short, tagline,
   descriptor, marketingUrl) and `displayBrandName(orgName)`: the trimmed org name when it is
   non-empty, otherwise `PRODUCT.short`.
2. **Metadata** (`app/layout.tsx`): default title `ftes for Commerce · Digital employees for
   commerce`, template `%s · ftes`, `openGraph.siteName` = `PRODUCT.name`, OG/Twitter titles
   `ftes for Commerce · Your whole store, on one screen`.
3. **Share card** (`app/opengraph-image.tsx`): the `alt` text and the eyebrow line are built from
   `PRODUCT`. The drawn logo mark is unchanged (see Out of scope).
4. **Fallbacks**: the mobile header (`app/(app)/layout.tsx`) and the sidebar
   (`components/layout/app-sidebar.tsx`) use `displayBrandName(brand.name)`.
5. **Pricing**: `process.env.MARKETING_URL ?? PRODUCT.marketingUrl`, trailing slash trimmed.
6. **Copy**: Settings (logo card, login media card, brand colour card, store panel), the
   unmapped-agents banner, the Report FTE delivered view ("Open in ftes"), the docs shell, the CI
   reader's "Prepared for", all read `PRODUCT`.
7. **Store placeholders, not the product.** Three places used the old name as a stand-in for *a
   store's* identity: the native post preview (`features/social/post-detail.tsx`), the ad preview
   domain (`features/ads/ad-creative-preview.tsx`), and two tests (`tests/format-message.test.ts`
   is a store's email footer; `tests/meta-connection.test.ts` is a store's Facebook Page). Per the
   root rule for store identities, these become `Example Store` / `examplestore` /
   `examplestore.com`, not the platform name.
8. **Mock fixtures** (`lib/mock/{ads,spotlight,store,social}.ts`): the store in the sample data
   becomes `Example Store`.
9. **In-app docs** (root Rule 11): `lib/docs/overview.ts` and `lib/docs/content/settings.ts` name
   the product (`updated` bumped where the doc carries one).
10. **Comments** describing the product (`app/globals.css`, `lib/mock/*` headers) updated.
11. **`localStorage` keys** keep their `ecommerce-fte.` prefix (renaming them would reset every
    user's saved choices); each gets a one-line comment saying so.
12. **Guard**: `tests/brand-name.test.ts` walks `app/`, `features/`, `components/`, `lib/`,
    `hooks/` and fails on `/ecommerce[ -]?fte/i` outside an allowlist (file + reason).
13. `.env.example`: `MARKETING_URL=https://ftes.ai/commerce`.

## Classified matches (grep 2026-10-05, excluding `node_modules`, `.next`, `specs`)

| File | Match | Bucket |
| --- | --- | --- |
| `app/layout.tsx` ×5 | title, template, siteName, OG/Twitter titles | (b) metadata |
| `app/opengraph-image.tsx` | `alt` | (b) metadata |
| `app/(app)/layout.tsx:96` | `?? "Ecommerce FTE"` | (c) fallback |
| `components/layout/app-sidebar.tsx:187` | `?? "Ecommerce FTE"` | (c) fallback |
| `app/pricing/page.tsx` | `ecommercefte.com` default | (b) metadata / link |
| `features/settings/brand-color-card.tsx` ×3 | reset copy | (a) visible text |
| `features/settings/logo-card.tsx` ×2 | logo fallback copy | (a) |
| `features/settings/login-media-card.tsx` ×2 | login fallback copy | (a) |
| `features/settings/store-panels.tsx` | read-only promise | (a) |
| `features/team-performance/unmapped-agents-banner.tsx` | "an Ecommerce FTE employee" | (a) |
| `features/report-fte/delivered-view.tsx` | "Open in Ecommerce FTE" | (a) |
| `features/docs/docs-shell.tsx` | docs description | (a) |
| `features/ci/ci-reader.tsx` | "Prepared for" | (a) |
| `features/social/post-detail.tsx` ×3 | native-preview store identity | (e) store placeholder |
| `features/ads/ad-creative-preview.tsx` | sample domain | (e) store placeholder |
| `lib/docs/overview.ts` ×2, `lib/docs/content/settings.ts` | doc prose | (a) docs |
| `lib/mock/ads.ts` ×6, `spotlight.ts` ×3, `store.ts`, `social.ts` | fixture store | (e) mock |
| `tests/format-message.test.ts` | a store's email footer | (d) → store placeholder |
| `tests/meta-connection.test.ts` ×3 | a store's Facebook Page | (d) → store placeholder |
| `.env.example` | `ecommercefte.com` | (b) |
| `app/globals.css:93` | comment | (f) comment |
| `components/shared/brand-logo.tsx:4` | path `ecommerce-fte/components/ui.tsx` (marketing repo) | (g) repo name |
| `lib/nudge.ts`, `lib/voice.ts`, `lib/answer-visual.ts` | `localStorage` keys | (g) protected |
| `lib/ci/content.ts` ×9 | generated historical reports | (g) protected |
| `package.json`, `package-lock.json`, `.git`, `CLAUDE.md` | repo / package name | (g) protected |

## Out of scope (deliberate)

- `lib/ci/content.ts`: generated by root `tools/build_ci_content.py`; historical.
- Existing specs; `package.json` name; folder, repo and import paths.
- `localStorage` keys (see 11).
- **The logo.** `public/brand/logo-*.png`, `favicon.png`, `app/icon.png`, and the two drawn
  marks: `components/shared/brand-logo.tsx` and the share card's `Logo`, which are an "E" tile
  followed by the word "commerce", read together as "Ecommerce". Changing the word alone would
  read "E ftes"; this needs new artwork from the owner.
- The `ecommerce.ftes.ai` app address drawn on the share card and used as `metadataBase`: it is
  the live host, not the old name.
- Employee display names; colours, layout, motion.
- Backend (emails, PDFs, prompts), the marketing site, the admin panel.

## Acceptance criteria

1. `lib/product.ts` exists and every customer-visible use of the product name reads from it.
2. An organization's own brand name still wins wherever it did before.
3. The grep returns only allowlisted lines.
4. `tests/product.test.ts` and `tests/brand-name.test.ts` exist and pass.
5. `npx tsc --noEmit`, `npm run lint`, `npm test`, `npm run build` green.
6. Metadata, the share card and pricing links use the new name and URL.
7. In-app docs updated, `updated` bumped, docs coverage test passes.
8. Nothing out of scope changed, apart from comments above the `localStorage` keys.
9. No visual change other than text.

## Manual verification checklist

- `/dashboard` tab title reads "Dashboard · ftes" (light and dark).
- Sidebar and mobile header: an org with a brand name shows it; one without shows `ftes`.
- Settings → Branding: "Reset to the ftes red", "Using the ftes logo", "Using the ftes login
  screen".
- `/pricing` footer links go to `https://ftes.ai/commerce/…` (unless `MARKETING_URL` is set).
- `/docs` overview heading "What ftes for Commerce is".
- `/opengraph-image` renders; alt text names ftes for Commerce.

## Verification (2026-10-05)

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| 1 | `lib/product.ts`; every visible use reads it | done | 13 files import `PRODUCT` / `displayBrandName`; the guard test finds no literal |
| 2 | An org's own name still wins | done | `displayBrandName` returns the trimmed org name; `tests/product.test.ts` |
| 3 | Grep returns only allowlisted lines | done | remaining: `lib/ci/content.ts`, three storage keys, `brand-logo.tsx` repo path, package/repo names, `CLAUDE.md` |
| 4 | `product` + `brand-name` tests pass | done | a probe file with the old name made `brand-name.test.ts` fail, then was removed |
| 5 | tsc / lint / test / build | done | `tsc` clean; ESLint 0 errors (3 earlier warnings, untouched lines); 204 files, **2,281 passed**; build compiles all 73 pages |
| 6 | Metadata, share card, pricing | done | served build: `<title>Log in · ftes</title>`, `og:site_name` "ftes for Commerce", pricing links `https://ftes.ai/commerce/{privacy,security,terms}`, `/opengraph-image` 200 PNG |
| 7 | In-app docs | done | `overview.ts` (no `updated` field), `content/settings.ts` → 2026-10-05; `docs.test.ts` green |
| 8 | Out-of-scope untouched | done | only comments added above the three storage keys |
| 9 | Text only | done | no class, token or layout edits in the diff |

Signed-in screens (sidebar, Settings → Branding, `/docs`) were not checked by eye: there was no
session against a local backend. They are in the manual checklist above for the owner.

## Patches

- 2026-10-05 (with SPEC-338): the sidebar's line under the logo still read "AI Business Analyst"
  — missed because it never contained the old name. It now reads `PRODUCT.descriptor`.
