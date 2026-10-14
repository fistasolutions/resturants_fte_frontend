# SPEC-215 — Open Graph share image

Status: implemented
Depends on: SPEC-007 (Ecommerce FTE branding), SPEC-006 Patches (no-index)

## Problem

Sharing an app link in Slack renders title and description with **no image** — a flat grey
row instead of a card. The link is pasted into client threads, so it is the first thing
someone sees of the product.

## Design

`app/opengraph-image.tsx` at the route-group root, so **every** route inherits one image
rather than each page needing its own. Next 16 generates the `og:image` meta tags from the
file convention; no manual `<head>` work.

1200×630 — the size Slack, WhatsApp, LinkedIn and X all crop from cleanly.

**Built from the store's own assets, not an approximation of them.** The wordmark is the
real logo pulled from examplestore.com — thin geometric sans, black, with the red
bar under the "a" — used unmodified. The right third is three genuine product photographs,
selected by querying our own database for the top sellers by revenue over the last 90 days.

**Light ground, not dark.** A first version was dark and used a typographic stand-in for
the logo. Once the real assets were in hand that became untenable: the logo is black and
the photography is shot on near-white, so a dark card would have meant either inverting the
client's wordmark or cutting the models out of their own backdrop. The store's aesthetic is
light; the card follows it.

**Not every best seller could be used.** Several — including the #2 and #6 by revenue — are
photographed on a stockroom rail with price tags and shelving visible. That is a real
finding for the Content Gaps tab (SPEC-213), and it is also why the three on the card were
chosen for how they are shot as well as what they earned.

**The headline is a claim, not a job title.** "AI Business Analyst" described the software;
"Know what's actually **making money**" describes what the reader gets, with the second line
in brand red. The chips name real features — True Profit, Buy Plan, Launch Watch — rather
than generic nouns like "Dashboard".

**No store figures on the card, deliberately.** The numbers this platform found are the most
compelling thing about it — 545 loss-making products, $439k of cannibalised discount — and
none of them belong here. The link gets pasted into channels the client does not control,
and a preview carrying revenue or discount totals would leak store performance to anyone who
sees it. The card sells the capability; the app shows the numbers.

The photographs live in `assets/og/` and are read from disk at render time rather than
fetched from Shopify's CDN, so generating the card never depends on the network.

**Hardcoded hex, deliberately, and the only place in the app where that is allowed.**
`ImageResponse` renders through Satori, which does not resolve CSS custom properties — a
`var(--brand)` here produces a transparent element, not a red one. The values are copied
from `globals.css` with a comment pointing back, so a palette change has one obvious place
to follow. Rule 9's "tokens only" holds everywhere a stylesheet is actually parsed.

Satori also requires explicit `display: flex` on any element with more than one child; a
missing one renders as an invisible overlap rather than an error. It **ignores `<br />`**
entirely, and an unconstrained `<span>` overflows its flex parent instead of wrapping — the
subline ran underneath the photographs and was clipped until it was given an explicit
`maxWidth`. Both were caught by looking at the rendered PNG, not by the build.

**The route had to be let through the auth gate.** `proxy.ts` matches everything that is
not a Next internal or a static file extension, so `/opengraph-image` — a generated route,
not a `.png` on disk — was returning **307 to `/login`**. Slack fetches `og:image` as an
anonymous crawler, so it would have received a redirect and rendered the exact flat row
this exists to replace. Caught by fetching the URL, not by the build, which reported the
route as prerendered and fine. `PUBLIC_ASSETS` now exempts it alongside the icon routes;
the card carries no store data, only the wordmark and the product line.

**`robots` stays `index: false`.** This is an internal tool — the image is for humans
pasting links in Slack, not for search engines.

## Acceptance Criteria

- [x] `/opengraph-image` returns a 1200×630 PNG.
- [x] Every route inherits it — no per-page files.
- [x] The real wordmark, unmodified, legible at Slack's rendered width.
- [x] Product photography is genuine, top-selling, and cleanly shot.
- [x] Assets read from disk — no network dependency at render time.
- [x] Copy wraps inside the left panel and is never clipped by the photographs.
- [x] Headline states a benefit, not a product category; chips name real features.
- [x] No store financials anywhere on the card — the link travels further than the app.
- [x] Alt text set, so the card is not silent to a screen reader.
- [x] No CSS variables (Satori cannot resolve them); hex values reference `globals.css`.
- [x] Reachable without a session — an anonymous crawler gets the PNG, not a 307.
- [x] `robots: index false` unchanged.
- [x] `npm run build` passes and prerenders the route.

## Manual verification checklist

(No component test runner exists — root Rule 4.)

- [ ] `http://localhost:3000/opengraph-image` renders the card.
- [ ] Paste a deployed link into Slack — the card shows the image, not a flat row.

## Patches

### 2026-09-28 — the share card in the new identity (owner request)

Redesigned in the look the owner chose for the login screen ("R5 · Red Band"): the marketing
site's paper above a brand-red band, the E logo, "[ AI business analyst for Shopify ]", "Every app
your store runs on, side by side — and answers you can trust.", "Your whole store, on one screen."
in the display serif, the app drawn as a marketing-style window (bars, never numbers), and
`ecommerce.ftes.ai`. Fonts: the marketing site's share-card fonts copied to `assets/og/`
(Instrument Serif, Geist 600, Geist Mono 500); `assets/og/logo.png` is no longer read. The root
layout adds `metadataBase` (`APP_URL`, default `https://ecommerce.ftes.ai`), `openGraph` title and
description, and `twitter.card = summary_large_image`, so every shared link is a large card.
