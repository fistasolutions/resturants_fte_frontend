# SPEC-007 — Ecommerce FTE Store Branding

**Status:** Implemented
**Phase:** 1 — Frontend Foundation
**Governing docs:** ../docs/Design.md (updated §5.1 "Store Branding" in the same
change, deliberately, per root Rule 2), root CLAUDE.md Rule 9

## Goal

Brand the platform for its store, **Ecommerce FTE** (examplestore.com), without
compromising the dashboard's dark BI design system or color semantics.

## Brand decisions (rationale on record)

- **Theme stays dark** (Design.md §3). the store's identity enters through logo, favicon,
  and one reserved accent token — not a theme flip.
- **the store red `#E42828` = `--brand` token, identity-only.** Never used for status,
  destructive actions, errors, or primary CTAs — it would collide with
  `--destructive` (#EF4444) and break status semantics. Buttons/links/focus stay
  `--primary` blue.
- **Inter stays** for all UI text (data density, tabular clarity). Tenor Sans /
  "newyork" are the store's retail identity and are carried by the logo asset itself.

## Scope

1. **Assets** (already fetched to `public/brand/`): `logo-white.png`,
   `logo-black.png`, `favicon.png` (source: examplestore.com CDN).
2. **Favicon** — `app/icon.png` (Next 16 metadata file convention) replaces the
   scaffold `app/favicon.ico`.
3. **Tokens** — `--brand` / `--brand-foreground` added to both palettes in
   `globals.css`, exposed as `bg-brand`/`text-brand`… utilities.
4. **Sidebar** — brand header becomes the white the store logo (next/image, proper alt)
   over an "AI Business Analyst" caption; active nav item gets a small `--brand` red
   left indicator pill (echo of the logo underline; position-based, works with the
   existing active background so it's not color-only).
5. **Auth layout** — same the store logo + caption replaces the generic bot mark.
6. **Identity data** — `lib/mock/store.ts` store domain → `examplestore.com`.
7. **Metadata** — root title default "Ecommerce FTE · AI Business Analyst",
   template "%s · Ecommerce FTE", description updated.

## Out of scope

Light theme, Tenor Sans in UI, any layout changes, marketing-style visuals.

## Acceptance Criteria

1. Sidebar and auth pages show the the store logo; browser tab shows the the store favicon.
2. Active nav item shows the red brand indicator; all status colors unchanged.
3. Store block reads examplestore.com · Active.
4. `--brand` exists in both palettes; no raw `#E42828` outside `globals.css`.
5. `npm run lint`, `npx tsc --noEmit`, `npm test`, `npm run build` green.

## Manual verification checklist

- [ ] Tab favicon = the store mark; title "Ecommerce FTE · AI Business Analyst".
- [ ] Sidebar logo crisp at 1x/2x; alt text present.
- [ ] Dashboard nav shows red active pill; nothing else turned red.
- [ ] Login page shows the store logo on dark background.
