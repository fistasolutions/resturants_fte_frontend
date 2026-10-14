# SPEC-308 — Spotlight › Money pages

**Repo:** frontend · **Status:** implemented · **Date:** 2026-09-25
**Backend:** SPEC-304 (`GET /money-pages`, `POST /money-pages/{kind}/{id}/draft`, …)

## Why

Spotlight's whole search surface is about the blog. But the shop does not make money from
articles — it makes money from product and collection pages, and nobody has ever rewritten
one. Backend SPEC-304 ranks them by what a properly written page would actually be worth.
This is the screen.

## Where it lives

A ninth Spotlight tab, **Money pages**, after Published. Not a view under Published, as
the refresh loop is: these are not blog posts, they are the catalog, and the work on them
(read the draft, copy three fields, paste into Shopify) is a session of its own.

## What it shows

A summary strip — how many pages, what they are worth a month together, how many have
never been given search copy — then one row per page, richest first:

- the page title, linking to the live page on the shop;
- what it earns a month if written properly (**or "worth unknown"** for a collection —
  the backend cannot attribute revenue to one, and the screen says so rather than showing
  a zero);
- where it sits now, how often Google shows it, and the searches it is shown for;
- **Write it** — drafts the new copy; then **Open** to read it.

The draft opens as a before/after: the live title, meta description and description beside
the new ones, each with its own **Copy** button and its character count against Google's
limit. At the bottom, **I've pasted this in** records that it is done.

**Nothing here writes to Shopify** (backend SPEC-304 §The boundary, owner decision
2026-09-25). The screen says so once, plainly, where the copy buttons are — so nobody
waits for a change that is theirs to make.

## Finding one page among four hundred (owner, 2026-09-25)

The first cut rendered every qualifying page as a card, newest-richest first, and stopped.
On the live store that is **413 cards in one scroll** — the list is the feature, and an
unfiltered list of 413 is not a list, it is a wall. So the tab gains the three controls
that make it usable, all **client-side over data already loaded**: the whole ranked list
arrives in one snapshot read (backend SPEC-304 caches it for the day), so filtering,
sorting and paging must never cost a request. Same rule the Inbound Engine's Added window
follows.

- **Filter** — All · Products · Collections · No search copy · Drafted · Not drafted, each
  with its own count, so the owner can see the size of a slice before choosing it. A count
  of zero is shown, not hidden: "no pages are drafted yet" is the answer to a question.
- **Search** — one box over the page title, its handle and the searches it is shown for.
  Searching a phrase the shop ranks for is how an owner actually looks for a page.
- **Sort** — Worth · Visits gained · Impressions · Position (worst first). Worth is the
  default and the point of the tab; the others exist because a page whose worth is unknown
  still deserves an order.
- **Pages of 20**, with a pager that says `Page 2 of 21 · 413 pages`. The page resets to 1
  whenever the filter, the search or the sort changes — a filter that leaves you on page 14
  of a 2-page result reads as an empty tab.

## Files

| File | What |
| --- | --- |
| `lib/money-pages.ts` | pure: adapters, wording, and the filter/search/sort/page logic |
| `lib/queries/money-pages.ts` | `moneyPageQueries.list()` / `.draft(id)` |
| `services/money-pages.ts` · `services/money-pages-actions.ts` | the server read · the writes |
| `features/money-pages/money-pages-view.tsx` | the list |
| `features/money-pages/money-page-row.tsx` | one page + Write it |
| `features/money-pages/money-page-draft.tsx` | the before/after with Copy |
| `features/money-pages/copy-field.tsx` | one field, its counter and its Copy button |
| `lib/spotlight.ts` · `features/spotlight/spotlight-tabs.tsx` | the ninth tab |
| `features/spotlight/spotlight-tab-content.tsx` · `app/(app)/spotlight/page.tsx` | read + prefetch |

## Acceptance Criteria

1. A ninth Spotlight tab, **Money pages**, reachable at `/spotlight?tab=money-pages`.
2. Pages are listed richest first with their worth, position, impressions and searches;
   a page whose worth is unknown says "worth unknown", never "£0".
3. **Write it** drafts the copy and the row shows that a draft exists; **Open** reads it.
4. The draft is a before/after with a Copy button and a character count per field, and
   states plainly that pasting into Shopify is the owner's step.
5. **I've pasted this in** records it and the row reflects it.
6. Empty and not-connected states both explain themselves.
7. `lib/money-pages.ts` unit-tested; `npm test`, `npm run build`, `tsc` and lint green;
   the Rule 11 doc carries the tab.
8. **Filter, search, sort and pagination, all client-side** — no request on any of them —
   with per-filter counts, a page size of 20, a pager that states where you are, and a
   reset to page 1 on every narrowing change.

## Verification

**Tests, 2026-09-25.** `tests/money-pages.test.ts` — 19 tests over the adapters (including
an entirely empty payload), every piece of wording, and the whole filter/search/sort/page
path. Full suite **2013 passed / 177
files**; `npm run build` green; `npx tsc --noEmit` clean; `npm run lint` clean (3
pre-existing `<img>` warnings elsewhere). `tests/docs.test.ts` (42) green with the new
**Money pages** section in the Spotlight doc (Rule 11).

**The two-tier rate reaches the screen.** Backend SPEC-304 prices most pages from the
shop's average rather than their own (no page on this shop has 20 search visits of its
own in 28 days), so every row says which rate produced its figure — "at the shop's average
rate" or "at this page's own rate" — and the strip above the list says what that average
is and what it was measured over. A projection that does not say it is one is a promise,
and this one is not a promise.

### Acceptance Criteria

1. A ninth Spotlight tab, **Money pages**, at `/spotlight?tab=money-pages` — **done**
   (`SPOTLIGHT_TAB_IDS`, label, prefetch, read).
2. Richest first with worth, position, impressions and searches; never "$0" for a page
   whose worth is unknown — **done** (`valueLabel` → "Worth unknown"; `basisLabel` says
   where a figure came from).
3. **Write it** drafts and the row shows it; **Open the draft** reads it — **done**
   (lazy fetch on expand, inline so the list is not lost).
4. Before/after with a Copy button and a character count per field, and the copy step
   named as the owner's — **done** (`CopyField`, and the boundary stated once where the
   buttons are).
5. **I've pasted this in** records it and can be undone — **done**.
6. Empty and not-connected states both explain themselves — **done**; the empty state
   names the actual thresholds rather than shrugging.
7. Unit tests, suite, build, lint and the Rule 11 doc — **done**.

**The controls, on the live list.** 413 pages → **Products 375 · Collections 38 · No
search copy 413 · Drafted 0 · Not drafted 413**, over **21 pages of 20**. All of it runs
on data already in hand — the snapshot is one read a day, so no filter, search, sort or
page change costs a request. The tests pin the three things that would silently break it:
a page whose worth is unknown sorts after every page that has one (so "Worth" is the order
the server already sent, not a reshuffle), search matches a page's **queries** as well as
its title and handle (a word like "midi" is in neither), and a page number pointing past
the end is clamped rather than rendering an empty tab.

> The page copy is rendered as **plain text, never as HTML**: it is markup the shop stored
> and a model wrote, and neither is a reason to run markup in the owner's browser.
