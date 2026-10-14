# SPEC-323 — The first client's reports and wording stay theirs

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-29
**Programme:** backend `SPEC-308-saas-platform-master.md` — white-label review follow-up (owner-approved
2026-09-29). Pairs with backend `SPEC-330-client-neutral-examples.md`.

## Why

An external review of the white-label state found two things in the app a second customer would see:

1. **Continuous Innovation.** The reports are the first client's own build history, including their
   calendar, their rules and their figures. They live in `lib/ci/content.ts`. The review said they were
   compiled into the public JavaScript.
   - That is not the case: a production build puts them only in a server chunk, and no file under
     `.next/static` contains them.
   - The real hole: the `/ci` pages never checked the organization's `ci` feature. The navigation hides
     the entry, but any signed-in member of any organization could open `/ci` or `/ci/<id>` by URL and
     read the reports.
2. **Example text.** Placeholders and examples written for the first client's catalogue appeared on
   screens every organization sees:
   - "Katie Dress" (Watching, the watch dialog, the `/watch` shortcut, the docs);
   - "The Modern Modest Woman" (ads campaign persona);
   - "modest {category} for work" (search intent editor);
   - "premium modest fashion … discerning woman" (voice checker sample);
   - "Lakewood" (competitor note, fact search);
   - "Shabbos" (Brand Brain docs).

## Behaviour

- **The `/ci` layout checks the feature on the server.**
  - `app/(app)/ci/layout.tsx` reads the workspace (`getWorkspace`, already read and cached for the
    request by the app layout, so no extra call).
  - Unless `features` includes `ci`, it calls `notFound()` before the shell or any page renders.
  - If the workspace cannot be read, it is empty, so the page stays closed.
- **The reports are server-only.**
  - Pages read them from `lib/ci/reports.ts` (`import "server-only"`, which re-exports the generated
    `content.ts`; the generated file is never hand-edited).
  - `/ci/[id]` no longer pre-renders every report at build (`generateStaticParams` removed): a report
    renders only for a request that passed the gate.
  - The Plans tab reads the backend, which already enforces the feature.
- **Neutral examples.**
  - Product examples read "Linen Shirt" or "Linen Shirt – Natural".
  - The ads persona placeholder is "The First-Time Visitor", a Brand Brain starter persona.
  - The search intent example is "{category} for work".
  - The voice checker sample is generic hype copy with no niche.
  - The competitor note says "Same shoppers in our city".
  - Fact search suggests "returns", "shipping", "size".
  - The Brand Brain docs' word-rule example is "e-mail, not email".
  - `lib/spotlight.ts`'s "demand here is modest" reads "demand here is low".
- **Left as they are, on purpose:** the Hebrew-calendar code and its docs (`lib/calendar-note.ts`,
  `lib/season.ts`, `lib/foresight-tabs.ts`, the Dashboard's Hebrew-calendar compare). That is the opt-in
  calendar feature (backend SPEC-319), shown only to organizations that chose it.
- **Also left as it is, on purpose: `DEFAULT_STORE_LOCALE`'s `America/New_York`.**
  - It is not a store setting. Every store formats in its own Shopify timezone once the workspace
    loads.
  - It is the baseline the server renders with before the browser knows the store. A store whose
    locale differs from it keeps its data out of the hydration render (`useApiQuery`), so the two can
    never disagree.
  - Moving it to UTC would push the first client (a New York store) onto that slower path and gain
    nothing for other stores, which differ from either baseline.

## Tests

`tests/client-neutral.test.ts`. The build fails if:

- a client-specific word (Katie Dress, Lakewood, modest, womenswear, Orthodox, kosher, tznius) appears in
  `app/`, `features/`, `components/`, `lib/` (except the generated `lib/ci/content.ts`), `services/` or
  `hooks/`;
- any file other than `lib/ci/reports.ts` imports `lib/ci/content`;
- `lib/ci/reports.ts` stops being `server-only`;
- the `/ci` layout stops checking the `ci` feature.

Full `npm test`, `tsc --noEmit` and `npm run build`.

## Manual verification

- As an organization without `ci`: `/ci` and `/ci/<id>` show the not-found page.
- As FOC: the feed and a report render.

## Acceptance criteria

- [x] Only an organization with the `ci` feature can open the reports, by any URL.
- [x] The reports can never be imported into a client bundle.
- [x] No screen shows the first client's catalogue, town or niche as an example.
- [x] A build fails if either comes back.
