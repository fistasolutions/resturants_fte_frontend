# SPEC-122 — Spotlight rich blog: rich reading experience (frontend)

**Status:** frontend slice of backend SPEC-124 (Spotlight rich blog). Consumes the
backend's derive-on-read `faq` / `toc` / `json_ld` on the draft detail read.

## Why
The blog detail body is currently plain long-form Markdown. Backend SPEC-124 now
derives, on read, an **FAQ** (AEO), a **table of contents**, and **schema.org JSON-LD**
(Article + FAQPage). This spec turns the draft detail body into a best-in-class,
premium-magazine reading experience that also renders that structured data — the
in-app page becomes machine-readable too. The hero banner and the right-hand aside
(quality scorecard, grounding, publish decision, sources) are unchanged.

## Contract (backend SPEC-124, detail read `GET /spotlight/drafts/{id}`)
Additive fields on the draft payload (absent on list rows):
- `faq: [{ q, a }]` — 0–5 Q&A pairs parsed from the `## Frequently Asked Questions`
  section. Empty when the body has no FAQ.
- `toc: [{ id, text }]` — one entry per `## H2`, `id` slugified (repeats get `-1`/`-2`).
- `json_ld: object[]` — `[Article]`, or `[Article, FAQPage]` when an FAQ exists. Valid
  schema.org objects (`@context: "https://schema.org"`).

## Frontend changes
### Types + adapter (`types/spotlight.ts`, `lib/adapters.ts`) — pure, unit-tested
- Add `FaqItem { q, a }`, `TocItem { id, text }`, `JsonLdObject` (loose record) and to
  `BlogDraft`: `faq: FaqItem[]`, `toc: TocItem[]`, `jsonLd: JsonLdObject[]`.
- `ApiBlogDraft`: `faq?`, `toc?`, `json_ld?`. `adaptBlogDraft` maps snake→camel;
  absent → `[]` (never fabricated; root Rule 8).

### Reading UI (`features/spotlight/blog-detail.tsx`, `blog-markdown.tsx`, new pieces)
Keep the hero banner + right-aside intact. Redesign the BODY:
- **Drop-cap** on the first body paragraph; premium magazine reading rhythm/spacing.
- **H2 anchor ids** matching the backend `toc` ids (same slug + de-dup), with
  `scroll-mt` so a jump clears the sticky header.
- **Sticky Table of Contents** from `toc` on wide screens (`xl`), smooth-scroll jump;
  a collapsible `<details>` on smaller screens. Hidden entirely when `toc.length < 2`.
- **Pull quotes** — Markdown blockquotes render as large, accented editorial pull
  quotes (`font-heading`, accent border). (The POV pillar is stripped server-side, so
  body blockquotes are genuine pull quotes.)
- **"Shop the look"** — a styled product-card row from the draft's grounding products
  (image + title + link to the product `url` / `/products/{handle}`, `target=_blank`).
  The in-article conversion surface. Hidden when there are no products. (No price in
  the payload → omitted, never faked.)
- **FAQ accordion** from `faq` — native `<details>`/`<summary>` (no accordion
  primitive in the repo), `aria`-correct, doubles as the visible AEO block. Hidden when
  `faq` is empty.
- **JSON-LD** injected as a `<script type="application/ld+json">` in the server
  component page (`app/(app)/spotlight/draft/[id]/page.tsx`) per the Next 16 JSON-LD
  guide — `JSON.stringify(...).replace(/</g, "\\u003c")` to scrub XSS. Rendered only
  when `jsonLd` is non-empty.

Tokens only (`font-heading` for the editorial serif accents; body prose stays Inter for
readability), no framer-motion, both themes, responsive, keyboard-accessible.

## Tests (`tests/spotlight-adapter.test.ts`, `tests/spotlight-rich-blog.test.ts`)
- Adapter: `faq`/`toc`/`jsonLd` map through; absent → `[]`.
- Pure util: `slugifyHeading` matches the backend slug + de-dup; `jsonLdScriptContent`
  stringifies and escapes `<`.
- `npm run build` → `npx tsc --noEmit` → `npm run lint` → `npm test` all green.

## Acceptance criteria
- [ ] Detail body renders drop-cap + sticky TOC + pull quotes + shop-the-look + FAQ
  accordion; JSON-LD script on the page; premium HCI, both themes, responsive.
- [ ] Adapter + utils unit-tested; anchor ids match backend toc ids.
- [ ] Hero banner + right-aside unchanged; isolated to the Spotlight blog domain.

## Manual verification checklist
- [ ] A draft with an FAQ shows the accordion; one without hides it.
- [ ] TOC links jump to the matching H2; TOC hidden with <2 sections.
- [ ] Drop-cap on the first paragraph only; pull quotes styled; shop-the-look links open
  the storefront in a new tab.
- [ ] JSON-LD present in page source and valid (Rich Results Test), both light + dark.
