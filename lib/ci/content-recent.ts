// Continuous Innovation reports since Sep 25, 2026 (frontend SPEC-369). Sep 25's daily and weekly
// come from the source project's generated reports; the rest were written from the record
// (docs/MEMORY.md, each day's commits, the specs they cite), with screens captured from the live app
// and time estimated per area. Same shape as the generated `content.ts`; a generated report with
// the same id wins (`lib/ci.ts` `mergeReports`).

import type { CiReport } from "@/lib/ci/types";

export const CI_RECENT_REPORTS: CiReport[] = [
  {
    "id": "d1009",
    "kind": "daily",
    "period": "Friday, Oct 9, 2026",
    "sortDate": "2026-10-09",
    "hook": "Every store now reads as itself through its own Brand Brain, a new company’s first sync and brand research run faster and live in Setup, and support can view any company without anything reaching real people",
    "memo": "Today — and the day is still going — <b>Ecommerce FTE stopped reading every store as yours</b>: each agent now has one prompt written for any store, and what a store sells, who buys from it and how it wants people shown arrive from its own Brand Brain, with your store’s specifics kept as its own Brand Brain rows. A new company’s first hour became <b>lean and visible</b>: the first sync runs only what Shopify alone can fill, and Setup shows each step as it runs, then the <b>brand research live</b> — nine steps now run together, with three new researchers reading who buys, the store’s reviews and its photos, in <b>50 seconds against 112</b>. The <b>competitor search</b> that sat on one line for over four minutes now runs five searches at a time and says where it is. Support gained <b>View as company</b>: open any company’s app as its owner, for a set time and with a reason, without the customer being told — and nothing can be sent to real people. Email Marketing and Customer Support closed their SaaS gaps, the guided view’s last rough edges were filed down, and Setup now follows every connection to its first sync and brings you back. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "28h",
    "views": "9 screens",
    "areas": 8,
    "days": [
      {
        "title": "Every store reads as itself",
        "body": "One prompt per agent, written for any store; the store’s trade, buyers and look come from its own Brand Brain — no more one trade’s examples in another store’s prompts.",
        "technical": false
      },
      {
        "title": "A new company’s first hour, shown live",
        "body": "A lean first sync, then nine research steps run together in 50 seconds instead of 112, each one’s progress shown in Setup, ending in a Review button.",
        "technical": false
      },
      {
        "title": "View as company, for support",
        "body": "From the admin console, open any company as its owner for 15, 30 or 60 minutes — invisible to the customer, recorded for operators, and unable to send anything to real people.",
        "technical": false
      },
      {
        "title": "The SaaS finish",
        "body": "Email Marketing and Customer Support follow each store’s own setup, and the guided view no longer talks to a month-old store as if it had a year of orders.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "One prompt per agent; the Brand Brain says what the store is",
        "sub": "Backend SPEC-375 · frontend SPEC-366 — 27 prompts rewritten, 38 copies deleted; no data changed.",
        "subTechnical": true,
        "ask": "Make the product generic for every kind of store, through the Brand Brain. On a first cut with fixed prompt copies per kind of store: “why not get the setting through the Brand Brain?” — and on your store’s prompts becoming equivalent rather than identical: “please fix this well”.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>The first answer was rejected, rightly:</b> a copy of every prompt per kind of store still describes a store that is not this one and triples every edit. Now every agent has <b>one</b> prompt written for any store — no gender, no one trade’s examples — and clothing craft is a single “when the store sells clothing…” line.",
            "full": "<b>The first answer was rejected, rightly:</b> a copy of every prompt per kind of store still describes a store that is not this one and triples every edit. Now every agent has <b>one</b> prompt written for any store: 27 rewritten, all 38 copies deleted (11 <code>.general.md</code> from SPEC-348, 27 from the first cut), and <code>load_prompt</code> reads one file.",
            "technical": false
          },
          {
            "text": "<b>The store’s own profile reaches the analysts too:</b> its approved identity and up to four customer types now go to the stock-risk, return-verdict, returns-plan, catalogue-verdict and dead-stock agents — or “assume no trade” when there are none.",
            "full": "<b>The store’s own profile reaches the analysts too</b> (<code>services/brand_brain/store_profile.py</code>, through <code>profile_instructions</code>): its approved identity and up to four personas now go to the stock-risk, return-verdict, returns-plan, catalogue-verdict and dead-stock agents — or “assume no trade” when there are none.",
            "technical": false
          },
          {
            "text": "<b>Pictures and occasions, one text each:</b> the blog header and its crop, the carousel rule (“never reveal more of a person than the frame shows”), the video presenter, the fallback scenes, the default image rule (“never invent or erase a face”) and every occasion angle.",
            "full": "<b>Pictures and occasions, one text each:</b> the blog header and its crop, the carousel rule (“never reveal more of a person than the frame shows”), the video presenter, the fallback scenes, the default image rule (“never invent or erase a face”) and every occasion angle.",
            "technical": false
          },
          {
            "text": "<b>Smaller fixes:</b> a single fashion word no longer decides which calendar a store follows, and the competitor filter now knows the mass retailers and review sites of other trades.",
            "full": "<b>Smaller fixes:</b> a single fashion word no longer decides which calendar a store follows, and the competitor filter now knows the mass retailers and review sites of other trades.",
            "technical": false
          },
          {
            "text": "<b>Your store, at your instruction:</b> its specifics — its identity, its customer types, and its image rules — now reach its agents as its own Brand Brain rows. Its prompts are equivalent rather than identical; no data was changed.",
            "full": "<b>Your store, at your instruction:</b> its specifics — identity, personas, and its image rules — now reach its agents as its own Brand Brain rows. Its prompts are equivalent rather than byte-identical; no data was changed. <code>stores.vertical</code> stays <code>apparel</code>/<code>general</code> for clothing behaviour only (fit, sizes, segments). Backend 4,017 passed; frontend 2,577 tests, build 82/82.",
            "technical": false
          }
        ],
        "built": "Single store-neutral prompts for every agent, a store profile block for five analysis agents, and the image and occasion texts made neutral.",
        "why": "A shoe shop or an electronics store must read as itself everywhere; a prompt written for one trade tells its agents the wrong story.",
        "value": "Every new store’s agents write and judge from that store’s own brain, with nothing of your store’s business leaking into theirs.",
        "shots": [
          {
            "route": "/spotlight/brand-brain/facts",
            "caption": "What the store is, from its own Brand Brain: identity, voice, positioning and personas, each with its source. Every agent now reads this instead of a prompt written for one trade.",
            "src": "/ci/d1009/l-brand-brain-facts.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "A lean first sync, shown live with the brand research",
        "sub": "Backend SPEC-370 (migration 0159) · frontend SPEC-362 — Phase 5 of the guided view.",
        "subTechnical": true,
        "ask": "When a new company connects, run only what Shopify alone can fill; show each step in Setup as it runs, then the Brand Brain research live, ending in a Review button, all in one place.",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>Five steps:</b> store, inventory, enrichment, analysis and the report. The integrations step is gone — nothing can be connected at that moment — and six jobs that need an app nobody has connected yet are dropped. Each app runs its own first sync when it is connected.",
            "full": "<b>Five steps:</b> shopify, inventory, enrich, analysis and report. The <code>integrations</code> step is gone, and analysis drops six app-dependent jobs (Clarity, QuickBooks, ads ×2, social insights, the Search Console refresh scan).",
            "technical": false
          },
          {
            "text": "<b>Setup has three sections under one bar.</b> <i>Your store</i> shows the running step in words — “Loading orders · Customers 1,240 ✓” — with Try again on failure; <i>Your brand</i> waits, then shows the research live, then “Your brand is ready to review” with a Review button; <i>Your apps</i> follows.",
            "full": "<b>Setup has three sections under one bar.</b> <i>Your store</i> shows the running step from <code>stores.bootstrap_detail</code> — “Loading orders · Customers 1,240 ✓” — with Try again on failure; <i>Your brand</i> waits, then shows the research live, then “Your brand is ready to review”; <i>Your apps</i> follows. The live stream emits on every move.",
            "technical": false
          },
          {
            "text": "<b>One place, not three:</b> a guided company no longer gets the separate first-sync and research toasts. Your store keeps both, as before.",
            "full": "<b>One place, not three:</b> a guided company no longer gets the separate first-sync and research toasts. Your store keeps both, as before.",
            "technical": false
          },
          {
            "text": "<b>Light:</b> Setup’s own code is 6.1 KB compressed.",
            "full": "<b>Light:</b> Setup’s own code is 6.1 KB gzip. Backend 3,910 passed (0159 checked up and down on a throwaway Postgres); frontend 2,556 tests, tsc and build pass on a clean copy.",
            "technical": false
          }
        ],
        "built": "A five-step bootstrap that reports what it is loading, and a three-part Setup that carries it into the brand research.",
        "why": "A first sync that runs jobs with nothing to read, and says nothing while it runs, makes a new company’s first hour feel broken.",
        "value": "A new company watches its store load and its brand come together in one place, then reviews it.",
        "shots": []
      },
      {
        "n": "03",
        "title": "Brand research in waves, with three new researchers",
        "sub": "Backend SPEC-376 · frontend SPEC-367 — Customer Profiler, Review Reader, Visual Style Analyst.",
        "subTechnical": true,
        "ask": "The first Brand Brain a new company gets must be the best it can be, take less time, and show exactly what it is doing.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>Nine steps run together:</b> store, catalogue, who buys, profile, voice, customers, reviews, look and competitors — the AI calls three at a time, and the competitor search starts first so it never holds the end.",
            "full": "<b>Nine steps run together:</b> store, catalogue, who buys, profile, voice, customers, reviews, look and competitors — the AI calls three at a time, and the competitor search starts first so it never holds the end.",
            "technical": false
          },
          {
            "text": "<b>Three new researchers.</b> The <i>Customer Profiler</i> describes customer types from figures the backend counts, and drops any type that cites a number it was not given. The <i>Review Reader</i> reads the best-sellers’ reviews without names, with the rating computed by the backend. The <i>Visual Style Analyst</i> reads the store’s own photos for its look and how people are shown.",
            "full": "<b>Three new researchers.</b> The <i>Customer Profiler</i> describes customer types from figures the backend counts, and drops any type that cites a number it was not given. The <i>Review Reader</i> reads the best-sellers’ reviews without names, with the rating computed by the backend. The <i>Visual Style Analyst</i> reads the store’s own photos for its look and how people are shown.",
            "technical": false
          },
          {
            "text": "<b>More reading:</b> the store’s policies, blog posts, social links and search titles.",
            "full": "<b>More reading:</b> the store’s policies, blog posts, social links and search titles.",
            "technical": false
          },
          {
            "text": "<b>Measured:</b> 50 seconds against 112 one after another, and competitors now add at most 60 seconds where they used to add up to 8 minutes. Setup and the toast show each step’s live line, then its result and its time.",
            "full": "<b>Measured:</b> 50 s against 112 s one after another, and competitors now add at most 60 s where they used to add up to 8 min. Setup and the toast show each step’s live line, then its result and its time. Backend 4,032 passed; frontend 2,582 tests, build 82/82.",
            "technical": false
          },
          {
            "text": "<b>Your store is unchanged:</b> its brain is full, so the research never starts by itself.",
            "full": "<b>Your store is unchanged:</b> its brain is full, so the research never starts by itself.",
            "technical": false
          }
        ],
        "built": "A wave-based research run, three new research agents with backend-counted figures, wider reading, and a live per-step account.",
        "why": "The first Brand Brain sets the voice of every writer a new company meets; it should know who buys and what the store looks like, not just its text.",
        "value": "A richer first brand in under a minute, built from the store’s buyers, reviews and photos.",
        "shots": [
          {
            "route": "/spotlight/brand-brain/review",
            "caption": "What the brand research found: competitors and facts read from the store, its products and the stores it is compared with, each waiting for approval.",
            "src": "/ci/d1009/l-brand-brain-review.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "The competitor search, five at a time",
        "sub": "Backend SPEC-377.",
        "subTechnical": true,
        "ask": "“Why does Finding competitors take so long?” — watching it sit on one line for over four minutes.",
        "status": "Delivered · live timing still to measure",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>The cause:</b> 25 web searches ran one after another — about 4–5 minutes with nothing moving on screen, and a rate-limited search was simply lost.",
            "full": "<b>The cause:</b> 25 web searches ran one after another — about 4–5 minutes with nothing moving on screen, and a rate-limited search was simply lost.",
            "technical": false
          },
          {
            "text": "<b>Now five at a time,</b> in the same priority order, so the most valuable searches still go first — same queries, same cost.",
            "full": "<b>Now five at a time,</b> in the same priority order, so the most valuable searches still go first — same queries, same cost.",
            "technical": false
          },
          {
            "text": "<b>Done when the answer settles:</b> it stops once the leading candidates are unchanged from one wave to the next, never before ten searches, and retries a rate-limited search.",
            "full": "<b>Done when the answer settles:</b> it stops once the leading candidates are unchanged from one wave to the next, never before ten searches, and retries a rate-limited search.",
            "technical": false
          },
          {
            "text": "<b>It says where it is:</b> “10 of 25 searches done, 31 stores seen”, rewritten in place. The step should now take about a minute — expected, not yet measured live.",
            "full": "<b>It says where it is:</b> “10 of 25 searches done, 31 stores seen”, rewritten in place. The step should now take about a minute — expected, not yet measured live. Full suite: 4,037 passed, 26 skipped, ruff clean.",
            "technical": false
          }
        ],
        "built": "A wave-based competitor sweep with an early stop, retries and a live count.",
        "why": "Four minutes on one unmoving line looks like a hang, and a lost search is a competitor missed.",
        "value": "Competitors found in a fraction of the time, with the progress visible as it happens.",
        "shots": [
          {
            "route": "/spotlight/brand-brain/competitors",
            "caption": "Competitors: tracked, waiting for review, and the topics they cover that the store doesn't, with each one's price band, shipping and returns.",
            "src": "/ci/d1009/l-brand-brain-competitors.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "View as company — support’s key into any organization",
        "sub": "Backend SPEC-371 (migration 0160) · frontend SPEC-363 · admin backend SPEC-007 · admin frontend SPEC-005.",
        "subTechnical": true,
        "ask": "“Like enterprises do: a secret master key for every connected organization. Click the button and see that company’s everything.”",
        "status": "Delivered",
        "effort": "5h 30m",
        "inside": [
          {
            "text": "<b>Entering:</b> from the admin console, open any company’s app as its owner in a new tab — a reason is required, for 15, 30 or 60 minutes. The session is checked live on every request and ends on Exit, on End now, or on its own.",
            "full": "<b>Entering:</b> from the admin console, open any company’s app as its owner in a new tab — a reason is required, for 15, 30 or 60 minutes. A single-use 60-second code is exchanged server-side for an access-only token with an RFC 8693 <code>act</code> claim naming the operator and no refresh; checked live on every request (cached 15 seconds).",
            "technical": false
          },
          {
            "text": "<b>Nothing reaches real people:</b> sending messages or email, publishing, approving ads and billing are refused before anything runs, with a “Nothing was sent” warning — and the email, helpdesk, Klaviyo, Meta and Stripe senders refuse too, as a backstop. The owner’s password, profile, devices, ownership, invitations, keys and secrets are off limits.",
            "full": "<b>Nothing reaches real people:</b> routes needing <code>messages.send</code>, <code>email_marketing.send</code>, <code>social.publish</code>, <code>spotlight.publish</code>, <code>ads.approve</code> or <code>billing.manage</code> are refused (423) before anything runs, as are the owner’s password, profile, devices, organization switch, ownership, deletion, invitations, API keys and secret read-back. The email, Gorgias, Klaviyo, Meta and Stripe senders refuse too, as a backstop.",
            "technical": false
          },
          {
            "text": "<b>Invisible to the customer, recorded for operators:</b> no device-list entry, no line in their audit log, chats tagged and hidden from them. Every write or refusal is kept, and the console shows each session’s history, detail, chats and an End now button. Inside the app, a banner shows the company, the operator, a countdown and Exit.",
            "full": "<b>Invisible to the customer, recorded for operators:</b> no device-list entry, no line in their audit log, chats tagged and hidden from them. Every write or refusal is kept, and the console shows each session’s history, detail, chats and an End now button. Inside the app, a banner shows the company, the operator, a countdown and Exit.",
            "technical": false
          },
          {
            "text": "<b>The console’s dialogs keep focus while you type:</b> they were sending focus back to the first field on every keystroke, breaking the extra-grant reason box and the package selection.",
            "full": "<b>The console’s dialogs keep focus while you type:</b> they were sending focus back to the first field on every keystroke, breaking the extra-grant reason box and the package selection.",
            "technical": false
          },
          {
            "text": "<b>Your live database reached its latest step</b> at your instruction, after chat history failed locally on the missing support-session column — both migrations tested on a throwaway database first. Chat history reads again.",
            "full": "<b>Your live database reached 0161</b> at your instruction, after chat history answered 500 locally (“column conversations.support_session_id does not exist”: live was at 0159). 0160 and 0161 were tested up/down/up on a throwaway Postgres first; the chat query reads its 156 conversations.",
            "technical": false
          }
        ],
        "built": "Support sessions end to end: the operator API and console screens, the session token and its checks, the refusals, the hidden chats and the in-app banner.",
        "why": "Support that cannot see what a customer sees answers from guesswork; support that can send as the customer is a risk.",
        "value": "Your team can see any company exactly as its owner does, for a set time, with every action recorded and nothing able to leave.",
        "shots": []
      },
      {
        "n": "06",
        "title": "Email Marketing and Customer Support, the SaaS finish",
        "sub": "Backend SPEC-372 · SPEC-373 (migration 0161, schema only) · frontend SPEC-364.",
        "subTechnical": true,
        "ask": "An audit rated Email Marketing about 90% SaaS and Customer Support about 70%: close every gap that does not need a new helpdesk, with your store unchanged.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>Customer Support follows the store:</b> handling time is a store setting (Settings → Hours, 1–30 days); size and fit apply only to clothing stores; without Loop, returns come from Shopify refunds and “Start return” says Shopify; tone defers to the brand’s voice rules; past tickets keep their topic; and the agent no longer runs when it is switched off.",
            "full": "<b>Customer Support follows the store:</b> handling time is a store setting (Settings → Hours, 1–30 days); size and fit apply only to clothing stores; without Loop, returns come from Shopify refunds and “Start return” says Shopify; tone defers to the brand’s voice rules; past tickets keep their topic; and the agent no longer runs when it is switched off.",
            "technical": false
          },
          {
            "text": "<b>New stores start at Suggest;</b> existing settings keep the autonomy they have, so your store’s support agent is unchanged (pinned by a test).",
            "full": "<b>New stores start at Suggest;</b> existing settings keep the autonomy they have, so your store’s support agent is unchanged (pinned by a test).",
            "technical": false
          },
          {
            "text": "<b>Email Marketing:</b> an unknown trade means general; segment names follow a change of trade at once; money is shown in the store’s own currency; no clothing examples in prompts; and AI Value lists Email marketing.",
            "full": "<b>Email Marketing:</b> an unknown trade means general; segment names follow a change of trade at once; money is shown in the store’s own currency; no clothing examples in prompts; and AI Value lists Email marketing.",
            "technical": false
          },
          {
            "text": "<b>Three Klaviyo fixes:</b> a key from a different account no longer points at the old account’s lists — they are dropped and made again on demand; a key without permission to subscribe is no longer called full; and “benefit”, “profit” and “outfit” flows are no longer taken for a fit check.",
            "full": "<b>Three Klaviyo fixes:</b> a key from a different account is detected on connect, on the nightly re-check and on the first write after a key change — the old seed list, segments, audience syncs, mirrored lists and metric id are dropped and made again on demand; a key without the subscribe permission is no longer called full (the test send refuses first); lifecycle matching is whole-word, so “benefit”, “profit” and “outfit” are no longer “Fit check”.",
            "technical": false
          },
          {
            "text": "<b>Role polish:</b> Retry and Mark done say why they are unavailable, and Connect Gorgias and New campaign follow the member’s role.",
            "full": "<b>Role polish (Rule 13):</b> Retry and Mark done say why; Connect Gorgias and New campaign follow the role. Docs corrected to match the code. Backend 3,971 passed; frontend 2,570 passed, build green.",
            "technical": false
          }
        ],
        "built": "Store-level handling time, trade-aware support and email, Shopify-refund returns without Loop, and three Klaviyo account fixes.",
        "why": "Both employees were built around one store’s setup; a store with a different trade, returns app or handling time would have been told the wrong thing.",
        "value": "Every company’s support and email employees work from that company’s own setup, from the first day.",
        "shots": [
          {
            "route": "/email-marketing · Settings",
            "caption": "Email Marketing's connection: the email platform, a Klaviyo key already saved on Integrations offered with one click, the exact scopes and Klaviyo's limits.",
            "src": "/ci/d1009/l-email-settings.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/customer-support · Settings",
            "caption": "Customer Support's connection: the helpdesk, the account and what the agent can do through it.",
            "src": "/ci/d1009/l-support-settings.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/customer-support · Overview",
            "caption": "The Customer Support Agent on the store's own tickets: what needs you and why customers are writing.",
            "src": "/ci/d1009/l-support-overview.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "07",
        "title": "Setup follows every connection to the end",
        "sub": "Frontend SPEC-361 · backend SPEC-369.",
        "subTechnical": true,
        "ask": "Setup should open by itself when something is switched on; connecting any integration should run its first sync with a progress bar and bring you back; and each tab should ask for the exact app it reads.",
        "status": "Delivered",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>Each step reads to do, syncing, done or failed,</b> and Setup checks only while a first sync or a connection is under way.",
            "full": "<b>Each step reads to do, syncing, done or failed,</b> and Setup checks only while a first sync or a connection is under way.",
            "technical": false
          },
          {
            "text": "<b>It opens by itself</b> on a new or changed line and highlights it — but not for old news.",
            "full": "<b>It opens by itself</b> on a new or changed line and highlights it — but not for old news.",
            "technical": false
          },
          {
            "text": "<b>It brings you back:</b> connect from Setup, or from a page’s connect screen, and once that app has synced you are returned to the page you came from; a failed first sync keeps you where the reason is.",
            "full": "<b>It brings you back:</b> connect from Setup, or from a page’s connect screen, and once that app has synced you are returned to the page you came from; a failed first sync keeps you where the reason is.",
            "technical": false
          },
          {
            "text": "<b>Each tab asks for its own app:</b> Store Traffic asks for V-Count on its five store tabs and Microsoft Clarity on Website, its tabs no longer read “off” under a page that is on, and rows say “Needs iPacky” rather than “Needs an integration”. The connect screen offers a button for each app.",
            "full": "<b>Each tab asks for its own app</b> (pages carry <code>needs.apps</code>): Store Traffic asks for V-Count on its five store tabs and Microsoft Clarity on Website, its tabs no longer read “off” under a page that is on, and rows say “Needs iPacky” or “Needs V-Count and Microsoft Clarity”. Setup’s own code is 3.9 KB gzip; backend 3,906 passed, frontend 2,546 tests.",
            "technical": false
          }
        ],
        "built": "Live step states in Setup, automatic opening, a remembered way back, and per-tab app requirements.",
        "why": "Switching a page on and then hunting for where its data comes from loses the moment the company decided to use it.",
        "value": "Turn something on, connect its app, watch it sync, and land back on the page — in one flow.",
        "shots": [
          {
            "route": "/integrations · Connected",
            "caption": "Integrations, where every connection Setup follows begins: each app's health, last sync and the pages it powers.",
            "src": "/ci/d1009/l-integrations.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "08",
        "title": "The guided view, Phase 6: the last rough edges",
        "sub": "Backend SPEC-374 · frontend SPEC-365.",
        "subTechnical": true,
        "ask": "Close the gaps the Phase 6 audit found.",
        "status": "Delivered",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>Health spoke as if every store had a year of orders:</b> a month-old store read “in 12 months” and “a year at stake”. The words now follow the store’s own history — “since 9 Sep” — and the figures are unchanged; the Returns and Tickets columns appear only with their apps.",
            "full": "<b>Health spoke as if every store had a year of orders:</b> a month-old store read “in 12 months” and “a year at stake”. The words now follow the store’s own history — “since 9 Sep” — and the figures are unchanged; the Returns and Tickets columns appear only with their apps.",
            "technical": false
          },
          {
            "text": "<b>Report Builder offered every template whatever was connected;</b> a guided company is now offered only templates with a section that can run.",
            "full": "<b>Report Builder offered every template whatever was connected;</b> a guided company is now offered only templates with a section that can run.",
            "technical": false
          },
          {
            "text": "<b>Two Returns sub-pages skipped the connect screen;</b> they now go through their tab’s gate like the rest.",
            "full": "<b>Two Returns sub-pages skipped the connect screen;</b> they now go through their tab’s gate like the rest.",
            "technical": false
          },
          {
            "text": "<b>Left alone on purpose:</b> three other audit items were already covered, and hiding Ads → Creative for everyone was not done, because it would change what your store sees.",
            "full": "<b>Left alone on purpose:</b> three other audit items were already covered, and hiding Ads → Creative for everyone was not done, because it would change what your store sees.",
            "technical": false
          }
        ],
        "built": "History-aware wording on Health, app-aware report templates, and the missing Returns gates.",
        "why": "A new store told it has “a year at stake” on a month of orders stops trusting the rest of the page.",
        "value": "A new company’s screens describe the data it actually has.",
        "shots": [
          {
            "route": "/employees",
            "caption": "Digital Employees: each one shows what it needs or how to set it up, from the store's own data.",
            "src": "/ci/d1009/l-employees.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/sidebar · Account",
            "caption": "The guided view's switches: pages and employees on or off, each employee's tabs counted.",
            "src": "/ci/d1009/l-settings-sidebar.webp",
            "width": 1400,
            "height": 972
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "Brand research",
        "change": "112 s, one step after another → 50 s, nine steps together",
        "why": "Competitors add at most 60 s, where they used to add up to 8 minutes."
      },
      {
        "name": "The competitor search",
        "change": "25 searches one after another, 4–5 minutes, nothing moving → five at a time with a live count",
        "why": "About a minute expected; not yet measured live."
      },
      {
        "name": "Agent prompts",
        "change": "one prompt plus a copy per kind of store → one prompt per agent, specifics from the Brand Brain",
        "why": "38 copies deleted."
      },
      {
        "name": "Health on a new store",
        "change": "“a year at stake” over 30 days of orders → words that follow the store’s own history",
        "why": "The figures were already right."
      }
    ],
    "next": [
      {
        "title": "Time the competitor search on a live store",
        "body": "Five at a time should bring it to about a minute; that is the expectation, not yet a measurement.",
        "technical": false
      },
      {
        "title": "A second helpdesk",
        "body": "Customer Support works through Gorgias; supporting any other helpdesk is the next project, outside today’s finish.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "The day is still going",
        "body": "This report covers what the development log records for Friday so far. The work is verified with tests and builds but not yet committed; anything finished later today is not in it.",
        "technical": false
      },
      {
        "title": "Your store changed in one way, at your instruction",
        "body": "Its agents now read single, store-neutral prompts, with its own specifics arriving as its own Brand Brain rows — equivalent, not identical. No data was changed, and everything else it sees is as before.",
        "technical": false
      },
      {
        "title": "One edge left alone on purpose",
        "body": "Hiding Ads → Creative for every company would also change your store’s screens, so it was not done.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Today's work is not on the live app yet, so these screens were captured from today's build, signed in as your owner account on your real data, in the light theme, with personal contact details blurred. Setup and the support-session banner appear only for a company still onboarding and inside a support session, so they are described rather than shown. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "w1009",
    "kind": "weekly",
    "period": "Oct 5 – Oct 9, 2026",
    "sortDate": "2026-10-09",
    "hook": "The week the doors opened — install from Shopify, a brand that researches itself, two new employees, and a first look that shows only what works",
    "memo": "The week Ecommerce FTE opened to companies beyond your own. Monday closed the gaps a multi-tenant review found — every integration connect bound to whoever started it, the database’s own isolation <b>ready to switch on</b>, a Dashboard that survives a failed alert — and the app began presenting itself as <b>ftes for Commerce</b>. On Tuesday a <b>public Shopify app</b> let any merchant install straight from Shopify, a new store’s <b>Brand Brain began researching itself</b> for your review, and the employees were renamed for the job they do. Wednesday put <b>two new employees live</b> — a Customer Support Agent and an Email Marketing Manager — with every customer send made once and only on purpose, and wrote down the standing rule that <i>your store stays exactly as it is</i>. Thursday began the <b>guided view</b>, so a new company sees only what has data, made every button follow the member’s role, and gave every chat one enterprise answer format. Friday, still in progress, made every store read as itself through its own Brand Brain, ran a new company’s brand research in <b>50 seconds against 112</b>, and gave support a way to view any company without anything reaching real people. Each day below carries what you asked for, what was built, why it matters and the value it delivers; the daily reports carry the detail.",
    "effort": "116h 30m",
    "views": "10 screens",
    "areas": 5,
    "days": [
      {
        "title": "Mon Oct 5",
        "body": "Every integration connect <b>bound to whoever started it</b>; the database’s own isolation <b>ready to switch on</b>; a Dashboard that survives a failed alert; the app renamed <b>ftes for Commerce</b>, and a sidebar each person chooses.",
        "technical": false
      },
      {
        "title": "Tue Oct 6",
        "body": "<b>Any company can install from Shopify</b> through a second, public app; a new store’s <b>Brand Brain researches itself</b> for your review; the employees renamed for their job — Search Visibility, Social Media Manager, Paid Ads Manager, Accounts Payable, Report Builder.",
        "technical": false
      },
      {
        "title": "Wed Oct 7",
        "body": "<b>Two new employees live</b> — a Customer Support Agent and an Email Marketing Manager; <b>every customer send once, and only on purpose</b>; eight Klaviyo mistakes found and fixed; a new company connects and pays without getting stuck.",
        "technical": false
      },
      {
        "title": "Thu Oct 8",
        "body": "The <b>guided view</b>, four of six phases in — a new company sees only what has data and turns the rest on; <b>every button follows the member’s role</b>; every chat answers in tables, buttons and charts; one honest Klaviyo connection.",
        "technical": false
      },
      {
        "title": "Fri Oct 9",
        "body": "<b>Every store reads as itself</b> through one prompt per agent and its own Brand Brain; brand research in <b>50 seconds against 112</b>, shown live in Setup; <b>View as company</b> for support; the guided view finished. The day is still going.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Mon Oct 5 — the multi-tenant gaps closed, and a new name",
        "sub": "Monday, Oct 5, 2026 — 6 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today closed the gaps a multi-tenant review found. <b>Every integration connect now belongs to whoever started it</b> — Meta, Google and QuickBooks check the person, the company and the store before anything is attached, within 10 minutes, and a QuickBooks company belongs to one organization. The <b>database’s own isolation between companies is ready to switch on</b>: the two places it would have broken are fixed, a restricted account is one command away, and the backend will refuse to start if isolation is not really on — production stays as it is until you make the switch. The Dashboard no longer goes down when one alert fails, after your live store’s database ran short of memory on the dead-stock alert. And the app now presents itself as <b>ftes for Commerce</b>: the login page no longer greets the next visitor with the last organization’s name, the product name lives in one place, and each person can choose what their sidebar shows.",
        "status": "Delivered · awaiting your switch-over on Railway",
        "effort": "18h",
        "inside": [
          {
            "text": "<b>Every integration connect belongs to whoever started it</b>.",
            "full": "<b>Every integration connect belongs to whoever started it</b>. Backend SPEC-344 · frontend SPEC-336 — one signed connect state for Meta Social, Meta Ads, Google Search Console and QuickBooks.",
            "technical": false
          },
          {
            "text": "<b>The database’s own tenant isolation, ready to switch on</b>.",
            "full": "<b>The database’s own tenant isolation, ready to switch on</b>. Backend SPEC-345 — <code>platform_scope()</code>, the <code>provision_app_role</code> script and the <code>REQUIRE_TENANT_ISOLATION</code> boot guard; verified on a throwaway PostgreSQL 18.",
            "technical": false
          },
          {
            "text": "<b>One failed alert no longer takes the Dashboard down</b>.",
            "full": "<b>One failed alert no longer takes the Dashboard down</b>. Backend SPEC-039 patch — each alert signal guarded on its own inside the Dashboard’s single gather.",
            "technical": false
          },
          {
            "text": "<b>The login screen stops remembering the last organization</b>.",
            "full": "<b>The login screen stops remembering the last organization</b>. Frontend SPEC-339 — the year-long <code>fte_org</code> cookie retired; one sign-in round trip fewer.",
            "technical": false
          },
          {
            "text": "<b>The app is now ftes for Commerce</b>.",
            "full": "<b>The app is now ftes for Commerce</b>. Frontend SPEC-337 — one source for the name (<code>lib/product.ts</code>), guarded by <code>tests/brand-name.test.ts</code>.",
            "technical": false
          },
          {
            "text": "<b>Choose what your sidebar shows</b>.",
            "full": "<b>Choose what your sidebar shows</b>. Frontend SPEC-338 — Settings → Account → Sidebar; stored per account in a cookie the app reads on the server; no backend change.",
            "technical": false
          }
        ],
        "built": "One signed connect state for Meta, Google and QuickBooks, the provisioning command and boot guard for database isolation, a guarded Dashboard alert, a login page that forgets, the single product-name source, and per-person sidebar settings.",
        "why": "In a platform many companies share, a connection that lands in the wrong company or a login page that shows the last one’s name is the kind of mistake that ends trust in one go.",
        "value": "Every connection lands only in the company that asked for it, a second lock on each company’s data is one switch away, and your Dashboard stays up when the database has a bad moment.",
        "shots": [
          {
            "route": "/settings/sidebar · Account",
            "caption": "Sidebar navigation: switch off the pages and tabs you don't use. Only your own sidebar changes.",
            "src": "/ci/w1009/settings-sidebar.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/dashboard",
            "caption": "The Dashboard, whole: money at stake, the day's figures, revenue by hour and net sales, each card loading on its own.",
            "src": "/ci/w1009/dashboard.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "Tue Oct 6 — any company can install from Shopify, and a new brand researches itself",
        "sub": "Tuesday, Oct 6, 2026 — 8 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today opened the platform to companies beyond your own. <b>A second, public Shopify app</b> now sits beside the custom one your store keeps, and a merchant who clicks Install in Shopify goes straight to Shopify’s approval and lands in onboarding with the store already approved — the last piece before Shopify’s review. A new store no longer starts with an empty brand: its <b>Brand Brain researches itself</b> — the store, what it sells, its voice, its colours, its competitors — while a toast follows the work, and everything waits on one Review page until approved. The writers stop assuming every store sells clothing: new stores read neutral instructions, while yours reads exactly what it read before. The five employees are now named for their job, emails carry the new name and icon, a company without a store is taken back to onboarding instead of an error, and the operator console’s Customers and Overview are repaired.",
        "status": "Delivered · awaiting the next backend deploy and the app’s release on Shopify",
        "effort": "23h",
        "inside": [
          {
            "text": "<b>Any company can now install from Shopify</b>.",
            "full": "<b>Any company can now install from Shopify</b>. Backend SPEC-349 · SPEC-352 · frontend SPEC-344 — migrations 0149 (<code>stores.shopify_app</code>) and 0150 (<code>shopify_installs</code>).",
            "technical": false
          },
          {
            "text": "<b>A new store’s Brand Brain researches itself, for your review</b>.",
            "full": "<b>A new store’s Brand Brain researches itself, for your review</b>. Backend SPEC-347 · frontend SPEC-341 — migration 0146 (<code>brand_research_runs</code>, row-level security).",
            "technical": false
          },
          {
            "text": "<b>The writers speak each store’s own trade</b>.",
            "full": "<b>The writers speak each store’s own trade</b>. Backend SPEC-348 — <code>stores.vertical</code> (migration 0147); neutral versions of 11 prompts and of the blog and hero-image strings.",
            "technical": false
          },
          {
            "text": "<b>The employees are named for the job they do</b>.",
            "full": "<b>The employees are named for the job they do</b>. Backend SPEC-351 · frontend SPEC-343 — display names only; routes, keys and agent names for trace history unchanged.",
            "technical": false
          },
          {
            "text": "<b>Every email carries the new name and the app icon</b>.",
            "full": "<b>Every email carries the new name and the app icon</b>. Backend SPEC-346 · SPEC-313 patch — the icon embedded inline, one product-name source in the backend.",
            "technical": false
          },
          {
            "text": "<b>Sign-in: Google back, Shopify hidden</b>.",
            "full": "<b>Sign-in: Google back, Shopify hidden</b>. Frontend SPEC-340 and its patch — one switch per provider; nothing deleted.",
            "technical": false
          },
          {
            "text": "<b>A company without a store resumes onboarding, never an error page</b>.",
            "full": "<b>A company without a store resumes onboarding, never an error page</b>. Frontend SPEC-342 — redirect from the workspace read the app layout already makes; a calm “Connect your store first” for a stray refusal.",
            "technical": false
          },
          {
            "text": "<b>The operator console’s Customers and Overview work again</b>.",
            "full": "<b>The operator console’s Customers and Overview work again</b>. Backend SPEC-350 — migration 0148 restores <code>video_generations</code> where absent; the two-apps column moved to 0149. Production migrated to 0147 at your instruction.",
            "technical": false
          }
        ],
        "built": "A public Shopify app with its install-first flow, a self-running Brand Brain research with its Review page, a store type behind eleven neutral prompts, renamed employees, new email headers, and the no-store and console repairs.",
        "why": "A Shopify app only one group of stores can install is not a product other companies can buy, and a new customer whose writers start from a blank brand feels the account is empty.",
        "value": "Any merchant can click Install in Shopify and arrive in onboarding, with a researched brand waiting for review after the first sync — while your store carries on untouched.",
        "shots": [
          {
            "route": "/spotlight/brand-brain/review",
            "caption": "What the research found about the brand: competitors and facts read from the store, each waiting for approval before anything uses it.",
            "src": "/ci/w1009/brand-brain-review.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/employees",
            "caption": "The employees, named for the job they do: Search Visibility, Social Media Manager, Paid Ads Manager and the rest.",
            "src": "/ci/w1009/employees-full.webp",
            "width": 1400,
            "height": 1397
          }
        ]
      },
      {
        "n": "03",
        "title": "Wed Oct 7 — two new employees, and every customer send made on purpose",
        "sub": "Wednesday, Oct 7, 2026 — 7 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today <b>two new digital employees went live</b>. The <b>Customer Support Agent</b> works your helpdesk’s conversations using what the helpdesk’s own AI cannot see — the real return, fit verdict, stock, warehouse lateness, customer value and order margin — and drafts replies for a person to approve. The <b>Email Marketing Manager</b> plans, builds and sends email through Klaviyo, judges each campaign by the profit it made against a holdout from your own orders, and follows each store’s own trade. Before any of it could reach a customer, the work was reviewed: <b>every customer send now happens once, and only on purpose</b>, the sensitive subjects are never answered automatically, and the support agent starts in Suggest until you switch it on. A field-by-field check against Klaviyo’s real API found eight mistakes a test stand-in could not; new companies can connect through the public Shopify app again, and a paid checkout can no longer be lost or charged twice. And a standing rule landed: your store stays exactly as it is; every other company gets the SaaS.",
        "status": "Delivered · the support agent starts in Suggest",
        "effort": "25h",
        "inside": [
          {
            "text": "<b>The Customer Support Agent — the seventh digital employee</b>.",
            "full": "<b>The Customer Support Agent — the seventh digital employee</b>. Backend SPEC-353 · frontend SPEC-346 — migration 0151, seven new tables with row-level security; a new step after every Gorgias sync.",
            "technical": false
          },
          {
            "text": "<b>The Email Marketing Manager — from preview to live in one day</b>.",
            "full": "<b>The Email Marketing Manager — from preview to live in one day</b>. Frontend SPEC-345 (preview) · backend SPEC-354 · backend SPEC-360 / frontend SPEC-350 (fully SaaS) — migration 0152, fourteen tables with row-level security.",
            "technical": false
          },
          {
            "text": "<b>Klaviyo’s real API, checked field by field</b>.",
            "full": "<b>Klaviyo’s real API, checked field by field</b>. Backend SPEC-354 Patches · frontend SPEC-345 Patches — against Klaviyo’s OpenAPI revision 2026-07-15.",
            "technical": false
          },
          {
            "text": "<b>Every customer send happens once, and only on purpose</b>.",
            "full": "<b>Every customer send happens once, and only on purpose</b>. Backend SPEC-356 · frontend SPEC-347 — review of backend 54498f5 and frontend 81cacef / 149a9e2.",
            "technical": false
          },
          {
            "text": "<b>Support messages that read like an email client, and Approvals that page</b>.",
            "full": "<b>Support messages that read like an email client, and Approvals that page</b>. Frontend SPEC-348 / backend SPEC-357 (migration 0154) · frontend SPEC-349 / backend SPEC-358.",
            "technical": false
          },
          {
            "text": "<b>A new company connects and pays without getting stuck</b>.",
            "full": "<b>A new company connects and pays without getting stuck</b>. Backend SPEC-355 (migration 0153) · SPEC-359 (migration 0155) · SPEC-314 Patches (migration 0156) · frontend SPEC-351.",
            "technical": false
          },
          {
            "text": "<b>A standing rule for your store, and a clean build</b>.",
            "full": "<b>A standing rule for your store, and a clean build</b>. Root CLAUDE.md Rule 12 · backend SPEC-234 Patches · lint across ten files.",
            "technical": false
          }
        ],
        "built": "The Customer Support Agent and the Email Marketing Manager end to end, server-side claims on every customer send, eight Klaviyo corrections, a steadier support Inbox and Approvals queue, checkout recovery, and the standing rule for your store.",
        "why": "These employees speak to your customers: a helpdesk’s own AI does not see the order behind the message, and a duplicate or unintended send is a mistake the customer sees.",
        "value": "Replies that know the order behind the message and emails judged by the profit they made — each reaching a customer once, because a person meant it to.",
        "shots": [
          {
            "route": "/customer-support · Overview",
            "caption": "The Customer Support Agent: tickets, resolution, first response and revenue at risk, then what needs you and why customers are writing.",
            "src": "/ci/w1009/support-overview.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/email-marketing · Overview",
            "caption": "The Email Marketing Manager, with its autonomy and kill switch at the top and eleven tabs.",
            "src": "/ci/w1009/email-overview.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "Thu Oct 8 — the guided view, and every button follows the role",
        "sub": "Thursday, Oct 8, 2026 — 7 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today began the <b>guided view</b>, your answer to “anyone new says it’s too lengthy”: a new company now sees only the pages and tabs with data behind them, switches pages and employees on itself, and follows a Setup list at the top right of every page — four of six phases done, with your store left on the full view. <b>Every button now follows the member’s role</b>: what a role cannot do is greyed out with the reason, or hidden, and the build fails if a new action ships without its check. <b>Every chat answers like an enterprise assistant</b>, from one renderer — tables, buttons and charts — streaming at a steady pace in a wider thread, with an edited question replacing the old one. Klaviyo became one honest connection that finds out whether a key may write and creates nothing until it is needed, and the win-back no longer records customers as synced when Klaviyo received nothing. Accounts Payable also stopped answering in the stylist’s voice.",
        "status": "Delivered",
        "effort": "22h 30m",
        "inside": [
          {
            "text": "<b>The guided view, Phases 1–2: a new company sees only what has data</b>.",
            "full": "<b>The guided view, Phases 1–2: a new company sees only what has data</b>. Backend SPEC-366 (migration 0157) · frontend SPEC-357.",
            "technical": false
          },
          {
            "text": "<b>The guided view, Phases 3–4: switch pages and employees on, and Setup follows</b>.",
            "full": "<b>The guided view, Phases 3–4: switch pages and employees on, and Setup follows</b>. Backend SPEC-367 · SPEC-368 (migration 0158) · frontend SPEC-359 · SPEC-360.",
            "technical": false
          },
          {
            "text": "<b>Every action follows the member’s role</b>.",
            "full": "<b>Every action follows the member’s role</b>. Frontend SPEC-358 · root CLAUDE.md Rule 13 — 249 write functions and 20 screens mapped; 60 permissions.",
            "technical": false
          },
          {
            "text": "<b>One answer renderer and one answer format for every chat</b>.",
            "full": "<b>One answer renderer and one answer format for every chat</b>. Frontend SPEC-352 · backend SPEC-361 — one answer-format prompt applied to Glisp and every employee.",
            "technical": false
          },
          {
            "text": "<b>Streaming, a wider thread, edit and resend, and no more flashes</b>.",
            "full": "<b>Streaming, a wider thread, edit and resend, and no more flashes</b>. Frontend SPEC-354 · SPEC-355 · backend SPEC-363.",
            "technical": false
          },
          {
            "text": "<b>One honest Klaviyo connection for both writers</b>.",
            "full": "<b>One honest Klaviyo connection for both writers</b>. Backend SPEC-362 · SPEC-364 · SPEC-365 · frontend SPEC-353 · SPEC-356 — no migration.",
            "technical": false
          },
          {
            "text": "<b>Every employee reads its own store’s brain; Accounts Payable speaks plainly</b>.",
            "full": "<b>Every employee reads its own store’s brain; Accounts Payable speaks plainly</b>. Backend SPEC-295 Patches — audit of every employee’s Brand Brain read.",
            "technical": false
          }
        ],
        "built": "The visibility rulebook with per-company switches and Setup, role-gated actions across about 120 screens with a build check, one answer renderer and format for every chat, Klaviyo access detection, and a plainer Accounts Payable voice.",
        "why": "A new company opening thirty pages it has no data for reads the product as long and empty, and a member should learn that work needs someone else before the click, not after it.",
        "value": "A first look that shows only what is already working, buttons that say who to ask, and every employee answering in the same clear shape.",
        "shots": [
          {
            "route": "/employees/finance · Chat",
            "caption": "One answer format: a direct answer, a table, the next step as a link and a button, sources and freshness underneath.",
            "src": "/ci/w1009/finance-chat.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/employees",
            "caption": "Digital Employees: each one shows set-up or what it needs, from the store's own data.",
            "src": "/ci/w1009/employees.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "Fri Oct 9 — every store reads as itself, and a new company’s first hour shown live",
        "sub": "Friday, Oct 9, 2026 — 8 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today — and the day is still going — <b>Ecommerce FTE stopped reading every store as yours</b>: each agent now has one prompt written for any store, and what a store sells, who buys from it and how it wants people shown arrive from its own Brand Brain, with your store’s specifics kept as its own Brand Brain rows. A new company’s first hour became <b>lean and visible</b>: the first sync runs only what Shopify alone can fill, and Setup shows each step, then the brand research live — nine steps now run together, with three new researchers reading who buys, the store’s reviews and its photos, in 50 seconds against 112. The competitor search that sat on one line for over four minutes now runs five searches at a time and says where it is. Support gained <b>View as company</b>: open any company’s app as its owner, for a set time and with a reason, with nothing able to reach real people. Email Marketing and Customer Support closed their SaaS gaps, and the guided view’s last rough edges were filed down.",
        "status": "Delivered so far · the day is still going",
        "effort": "28h",
        "inside": [
          {
            "text": "<b>One prompt per agent; the Brand Brain says what the store is</b>.",
            "full": "<b>One prompt per agent; the Brand Brain says what the store is</b>. Backend SPEC-375 · frontend SPEC-366 — 27 prompts rewritten, 38 copies deleted; no data changed.",
            "technical": false
          },
          {
            "text": "<b>A lean first sync, shown live with the brand research</b>.",
            "full": "<b>A lean first sync, shown live with the brand research</b>. Backend SPEC-370 (migration 0159) · frontend SPEC-362 — Phase 5 of the guided view.",
            "technical": false
          },
          {
            "text": "<b>Brand research in waves, with three new researchers</b>.",
            "full": "<b>Brand research in waves, with three new researchers</b>. Backend SPEC-376 · frontend SPEC-367 — Customer Profiler, Review Reader, Visual Style Analyst.",
            "technical": false
          },
          {
            "text": "<b>The competitor search, five at a time</b>.",
            "full": "<b>The competitor search, five at a time</b>. Backend SPEC-377.",
            "technical": false
          },
          {
            "text": "<b>View as company — support’s key into any organization</b>.",
            "full": "<b>View as company — support’s key into any organization</b>. Backend SPEC-371 (migration 0160) · frontend SPEC-363 · admin backend SPEC-007 · admin frontend SPEC-005.",
            "technical": false
          },
          {
            "text": "<b>Email Marketing and Customer Support, the SaaS finish</b>.",
            "full": "<b>Email Marketing and Customer Support, the SaaS finish</b>. Backend SPEC-372 · SPEC-373 (migration 0161, schema only) · frontend SPEC-364.",
            "technical": false
          },
          {
            "text": "<b>Setup follows every connection to the end</b>.",
            "full": "<b>Setup follows every connection to the end</b>. Frontend SPEC-361 · backend SPEC-369.",
            "technical": false
          },
          {
            "text": "<b>The guided view, Phase 6: the last rough edges</b>.",
            "full": "<b>The guided view, Phase 6: the last rough edges</b>. Backend SPEC-374 · frontend SPEC-365.",
            "technical": false
          }
        ],
        "built": "Single store-neutral prompts for every agent, a lean first sync carried into Setup, wave-based brand research with three new researchers, a faster competitor search, support sessions end to end, and the SaaS finish for two employees.",
        "why": "A shoe shop or an electronics store must read as itself everywhere, and a first hour that runs jobs with nothing to read, and says nothing while it runs, feels broken.",
        "value": "Every new store’s agents work from that store’s own brain, a new company watches its store and brand come together in one place, and your team can see any company exactly as its owner does.",
        "shots": [
          {
            "route": "/email-marketing · Settings",
            "caption": "Email Marketing's connection: the email platform, a Klaviyo key already saved on Integrations offered with one click, the exact scopes and Klaviyo's limits.",
            "src": "/ci/w1009/l-email-settings.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/spotlight/brand-brain/review",
            "caption": "What the brand research found: competitors and facts read from the store, its products and the stores it is compared with, each waiting for approval.",
            "src": "/ci/w1009/l-brand-brain-review.webp",
            "width": 1400,
            "height": 972
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "An integration connect",
        "change": "any returning code could attach a Page, Search Console or books → only the person, company and store that started it, within 10 minutes",
        "why": "Checked before Meta, Google or Intuit is ever called."
      },
      {
        "name": "A merchant clicking Install in Shopify",
        "change": "met a login screen, and only your group of stores could install → straight to Shopify’s approval, then sign-up with the store already approved",
        "why": "Your store stays on its custom app for every reconnect."
      },
      {
        "name": "A customer send",
        "change": "could go twice on a double click or a second approver → claimed first, sent once",
        "why": "Enforced on the server, not only on the screen."
      },
      {
        "name": "A new company’s first look",
        "change": "every page, most of them empty → only what has data, plus what it turns on",
        "why": "Your store stays on the full view."
      },
      {
        "name": "Brand research",
        "change": "112 s, one step after another → 50 s, nine steps together",
        "why": "Competitors add at most 60 s, where they used to add up to 8 minutes."
      }
    ],
    "next": [
      {
        "title": "Switch on database isolation on Railway",
        "body": "Snapshot the database, run the provisioning command, point the backend at the restricted account and turn the safety switch on; the rollback is one setting. The database’s shared-memory limit, which took the Dashboard alert down, is an infrastructure setting on your side too.",
        "technical": false
      },
      {
        "title": "Release the public app on Shopify, and register Google’s address",
        "body": "The public app’s configuration, with its privacy webhooks and install address, is ready to release with Shopify’s own tool — the step before review. Continue with Google completes only once its redirect address is registered in Google Cloud.",
        "technical": false
      },
      {
        "title": "Switch the support agent on when you are ready",
        "body": "It starts at Suggest: no drafts and nothing written to the helpdesk until you switch it on in its Settings.",
        "technical": false
      },
      {
        "title": "New logo artwork for ftes",
        "body": "The drawn “E + commerce” mark and the logo images still read as the old name; changing the word alone would read “E ftes”, so it needs new artwork.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "The day is still going",
        "body": "Friday is covered as far as the development log records it; the work is verified with tests and builds but not yet committed, and anything finished later today is not in this report. The faster competitor search is expected to take about a minute — not yet measured live.",
        "technical": false
      },
      {
        "title": "Your store stays as it is",
        "body": "It keeps its custom Shopify app, the full view and every button. The one change it saw, at your instruction, is that its agents read store-neutral prompts with its own specifics as Brand Brain rows — equivalent, not identical, with no data changed.",
        "technical": false
      },
      {
        "title": "Two outside systems now receive writes — by your decision",
        "body": "The helpdesk gets replies, notes and ticket updates, and Klaviyo gets campaigns and flows, each approve-first. Shopify and Loop stay read-only, and production isolation between companies is unchanged until your switch-over.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d1008",
    "kind": "daily",
    "period": "Thursday, Oct 8, 2026",
    "sortDate": "2026-10-08",
    "hook": "The guided view arrives — a new company sees only what has data and turns the rest on — every button now follows the member’s role, and every chat answers like an enterprise assistant",
    "memo": "Today began the <b>guided view</b>, your answer to “anyone new says it’s too lengthy”: a new company now sees only the pages and tabs with data behind them, switches pages and employees on itself, and follows a <b>Setup</b> list at the top right of every page — four of six phases done, with your store left on the full view exactly as it is. <b>Every button now follows the member’s role</b>: what a role cannot do is greyed out with the reason, or hidden, and the build fails if a new action ships without its check. <b>Every chat answers like an enterprise assistant</b>, from one renderer: tables instead of pipe-joined bullets, buttons for links, charts where the figures suit one — streaming at a steady pace in a wider thread, with an edited question replacing the old one and skeletons instead of flashes while it loads. <b>Klaviyo became one honest connection</b>: the app finds out whether a key may write, shows only what it can do, creates nothing in the account until it is needed — and the win-back no longer records customers as synced when Klaviyo received nothing. Accounts Payable also stopped answering in the stylist’s voice. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "22h 30m",
    "views": "7 screens",
    "areas": 7,
    "days": [
      {
        "title": "The guided view, four phases in",
        "body": "A new company sees what has data, turns pages, tabs and employees on itself, and follows a Setup list with a progress bar. Your store stays on the full view.",
        "technical": false
      },
      {
        "title": "Every button follows the role",
        "body": "Main actions a role cannot take are shown disabled with the reason; small ones are hidden — about 120 screens, checked by the build.",
        "technical": false
      },
      {
        "title": "Chats that answer like an enterprise assistant",
        "body": "Tables, buttons and charts from one renderer for Glisp and every employee, streaming steadily in a wider thread, with edit and resend.",
        "technical": false
      },
      {
        "title": "One honest Klaviyo connection",
        "body": "Read-only or full, the app finds out by itself and adapts — and nothing of ours appears in a store’s Klaviyo until it is needed.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "The guided view, Phases 1–2: a new company sees only what has data",
        "sub": "Backend SPEC-366 (migration 0157) · frontend SPEC-357.",
        "subTechnical": true,
        "ask": "“Anyone new says it’s too lengthy — show what actually matters.” Asked whether every company but yours should move to it: “YES”.",
        "status": "Delivered",
        "effort": "4h 30m",
        "inside": [
          {
            "text": "<b>A rulebook decides every page, tab and employee</b> from what the company actually has: a connected app, two or more locations, in-store sales, enough history, a first action taken. It runs inside the existing workspace read — about 20 ms of query on your store’s six years of data.",
            "full": "<b>A rulebook decides every page, tab and employee</b> (<code>services/workspace/capabilities.py</code>, returned as <code>visibility</code> on <code>GET /workspace</code>) from what the company actually has: a connected app, two or more locations, in-store sales, enough history, a first action taken. One facts query in the existing workspace gather — about 20 ms on your store’s six years of data.",
            "technical": false
          },
          {
            "text": "<b>Every company except yours moves to it;</b> your store stays on the full view. The split was checked read-only before it was applied, and the live database moved one step, checked up and down on a throwaway copy first.",
            "full": "<b>Every company except yours moves to it</b> (<code>organizations.disclosure</code>: your store alone is <code>full</code>); checked read-only before applying. Production migrated 0156 → 0157 after up/down on a throwaway Postgres.",
            "technical": false
          },
          {
            "text": "<b>The screens follow:</b> the sidebar, Settings → Sidebar and the access gate read it with no new wiring; every tab bar drops tabs with no data; a page whose first tab is locked opens on its first tab with data — Returns Analytics on Bracketing, for example.",
            "full": "<b>The screens follow:</b> the sidebar, Settings → Sidebar and the access gate read it with no new wiring; every tab bar drops tabs with no data; a page whose first tab is locked opens on its first tab with data — Returns Analytics on Bracketing, for example.",
            "technical": false
          },
          {
            "text": "<b>A locked page opened by link says what unlocks it,</b> with one button: “Connect Loop Returns”, “Open the Morning Brief” or “Open Digital Employees”. No new request, and +0.7 KB on the shared code (a first cut cost +13 KB).",
            "full": "<b>A locked page opened by link says what unlocks it,</b> with one button: “Connect Loop Returns”, “Open the Morning Brief” or “Open Digital Employees”. No new request, and +0.7 KB on the shared code (a first cut cost +13 KB).",
            "technical": false
          }
        ],
        "built": "The visibility rulebook and its facts query, and a sidebar, tab bars and access gate that follow it.",
        "why": "A new company opening thirty pages it has no data for reads the product as long and empty.",
        "value": "A first look that shows a new company only what is already working for it.",
        "shots": [
          {
            "route": "/employees",
            "caption": "Digital Employees: each one shows set-up or what it needs, from the store's own data.",
            "src": "/ci/d1008/employees.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "The guided view, Phases 3–4: switch pages and employees on, and Setup follows",
        "sub": "Backend SPEC-367 · SPEC-368 (migration 0158) · frontend SPEC-359 · SPEC-360.",
        "subTechnical": true,
        "ask": "Let a company switch employees on from their cards and turn pages on itself, with Setup following.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>An employee switches on from its card,</b> for the owner and admins. Off, the card is dimmed and not a link; on without its app, it shows a Connect row — and the sidebar follows at once.",
            "full": "<b>An employee switches on from its card,</b> for the owner and admins. Off, the card is dimmed and not a link; on without its app, it shows a Connect row — and the sidebar follows at once.",
            "technical": false
          },
          {
            "text": "<b>Pages and tabs too:</b> an owner or admin turns one on for everyone in Settings → Sidebar; turning one off asks “hide it for me only” or “turn it off for everyone”, with an optional disconnect that names what else reads that app. Members keep their personal switches.",
            "full": "<b>Pages and tabs too:</b> an owner or admin turns one on for everyone in Settings → Sidebar; turning one off asks “hide it for me only” or “turn it off for everyone”, with an optional disconnect that names what else reads that app. Members keep their personal switches.",
            "technical": false
          },
          {
            "text": "<b>On but not yet connected,</b> a page opens on its connect screen rather than staying hidden — an active Accounts Payable without QuickBooks now shows. What a switch cannot create, such as Results before a first action, is refused with a reason.",
            "full": "<b>On but not yet connected,</b> a page or tab is <code>awaiting_connection</code> and opens on its connect screen — an active Accounts Payable without QuickBooks now shows. <code>PUT /workspace/pages/{unit}</code> refuses with a 409 what a switch cannot create (Results before an action, Season Radar) and with a 422 the locked pages.",
            "technical": false
          },
          {
            "text": "<b>Setup sits at the top right of every page,</b> with a progress bar — one step per integration, Shopify first — and refreshes itself when a connection lands.",
            "full": "<b>Setup sits at the top right of every page,</b> with a progress bar — <code>visibility.setup</code>, one step per integration, Shopify first — and refreshes itself when a connection lands; +1.8 KB gzip. Migration 0158 checked up/down on a throwaway Postgres, then applied to the live database at your request. Backend 3,901 passed (the one failure, <code>test_scheduler_many_stores</code>, passes 3/3 alone); frontend 2,538 passed.",
            "technical": false
          }
        ],
        "built": "Per-company page and employee switches, their two-layer settings screen, connect-first pages, and Setup on every page.",
        "why": "Progressive disclosure only works if the company can open the next door itself.",
        "value": "A new company grows its own workspace one connection at a time, with Setup showing what is left.",
        "shots": [
          {
            "route": "/settings/sidebar · Account",
            "caption": "Pages and employees switched on and off, with each employee's tabs counted.",
            "src": "/ci/d1008/settings-sidebar.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "03",
        "title": "Every action follows the member’s role",
        "sub": "Frontend SPEC-358 · root CLAUDE.md Rule 13 — 249 write functions and 20 screens mapped; 60 permissions.",
        "subTechnical": true,
        "ask": "Hide or grey out what a role can’t do, add it as a standing rule, and add an automatic check.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>Main actions</b> — send, publish, approve, export, delete — are shown disabled with the reason: the role, the action it lacks, and who to ask. <b>Small ones</b> — a menu item, an edit icon — are hidden.",
            "full": "<b>Main actions</b> — send, publish, approve, export, delete — are shown disabled with the reason: the role, the action it lacks, and who to ask. <b>Small ones</b> — a menu item, an edit icon — are hidden.",
            "technical": false
          },
          {
            "text": "<b>Every write the app can make</b> carries exactly the permission the server enforces for it: 249 functions and 20 screens, about 120 screens gated.",
            "full": "<b>Every write the app can make</b> carries exactly the permission the server enforces for it: 249 functions and 20 screens, about 120 screens gated.",
            "technical": false
          },
          {
            "text": "<b>The build checks it:</b> a new write without its permission, a stale entry, an unknown permission or an ungated screen fails the build.",
            "full": "<b>The build checks it:</b> <code>tests/role-gate-coverage.test.ts</code> fails on an unregistered write, a stale entry, an unknown permission or an ungated screen.",
            "technical": false
          },
          {
            "text": "<b>The server is unchanged and stays the guard;</b> as owner of your store you hold every permission, so you see every button as before.",
            "full": "<b>The server is unchanged and stays the guard;</b> as owner of your store you hold every permission, so you see every button as before.",
            "technical": false
          }
        ],
        "built": "A role helper and two components over the member’s permissions, a registry of every write, and a build check.",
        "why": "A member should learn that work needs someone else before the click, not from a “permission denied” after it.",
        "value": "Each member sees the product their role allows, and knows who to ask for the rest.",
        "shots": [
          {
            "route": "/settings/roles · Roles",
            "caption": "The permissions each role holds — the same list every button checks before it is drawn.",
            "src": "/ci/d1008/settings-roles.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "One answer renderer and one answer format for every chat",
        "sub": "Frontend SPEC-352 · backend SPEC-361 — one answer-format prompt applied to Glisp and every employee.",
        "subTechnical": true,
        "ask": "Answers like an enterprise assistant — data as a table, links and actions as buttons, charts where the figures suit one — built once and reused by every employee, today’s and future ones (“DRY”).",
        "status": "Delivered",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "<b>The four employee chats now draw every answer through Glisp’s card:</b> tables in the app’s frame with figures right-aligned, the text ⇄ chart toggle, one row of buttons, the trust receipt, copy and read aloud. The hand-made button rows are gone.",
            "full": "<b>The four employee chats now draw every answer through Glisp’s card:</b> tables in the app’s frame with figures right-aligned, the text ⇄ chart toggle, one row of buttons, the trust receipt, copy and read aloud. The hand-made button rows are gone.",
            "technical": false
          },
          {
            "text": "<b>One answer format for every agent:</b> records in a table, never pipe-joined bullets; in-app links; no charts drawn in text. Glisp’s layout rules moved there, so they exist once.",
            "full": "<b>One answer format for every agent:</b> records in a table, never pipe-joined bullets; in-app links; no charts drawn in text. Glisp’s layout rules moved there, so they exist once.",
            "technical": false
          },
          {
            "text": "<b>Old answers fixed too:</b> a stored run of pipe-joined bullets — such as the Accounts Payable thread from 7 October — renders as a table, and in-app links open in place.",
            "full": "<b>Old answers fixed too:</b> a stored run of pipe-joined bullets — such as the Accounts Payable thread from 7 October — renders as a table, and in-app links open in place.",
            "technical": false
          },
          {
            "text": "<b>Charts reach employee data,</b> and Accounts Payable and Search Visibility answers end with a button to their tab: payment run, bills, vendors and cash; topics, today’s picks and drafts.",
            "full": "<b>Charts reach employee data</b> (<code>visuals._rows_of</code> takes the first list of records and knows <code>balance</code>, <code>owed</code>, <code>amount_due</code>, <code>company</code>, <code>keyword</code>, <code>topic</code>), and Accounts Payable and Search Visibility answers end with a button to their tab.",
            "technical": false
          }
        ],
        "built": "One renderer for every chat surface, one answer-format prompt for every agent, and charts and tab buttons for employee answers.",
        "why": "A list of bills as a paragraph of pipes is data you have to read twice.",
        "value": "Every employee answers in the same clear shape, and the next employee gets it for free.",
        "shots": [
          {
            "route": "/employees/finance · Chat",
            "caption": "One answer format: a direct answer, a table, the next step as a link and a button, sources and freshness underneath.",
            "src": "/ci/d1008/finance-chat.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "Streaming, a wider thread, edit and resend, and no more flashes",
        "sub": "Frontend SPEC-354 · SPEC-355 · backend SPEC-363.",
        "subTechnical": true,
        "ask": "The reply and its tables should stream in rather than land, the thread should use the width, an edited question should replace the old one like ChatGPT — and chats load as skeletons, never the interface.",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>Paced streaming:</b> a bursty reply is drawn at a steady pace and the backlog drained within about a second; a table streams in row by row instead of appearing whole.",
            "full": "<b>Paced streaming:</b> a bursty reply is drawn at a steady pace and the backlog drained within about a second; a table streams in row by row instead of appearing whole.",
            "technical": false
          },
          {
            "text": "<b>A wider thread</b> for the employee chats, the composer and the skeleton alike.",
            "full": "<b>A wider thread</b> for the employee chats, the composer and the skeleton alike.",
            "technical": false
          },
          {
            "text": "<b>Edit and resend replaces:</b> editing a question deletes it and every later turn before the agent reads the history — in the Chat page, Ask Glisp and all four employees. The old “re-ask as a new turn” is retired.",
            "full": "<b>Edit and resend replaces:</b> editing a question deletes it and every later turn before the agent reads the history — in the Chat page, Ask Glisp and all four employees. The old “re-ask as a new turn” is retired.",
            "technical": false
          },
          {
            "text": "<b>Skeletons, not flashes:</b> no “No chats yet” before the list lands, no welcome screen for a frame before the remembered thread reopens, and Ask Glisp shows a skeleton while it restores. A hydration error in the employee chat is fixed.",
            "full": "<b>Skeletons, not flashes:</b> no “No chats yet” before the list lands, no welcome screen for a frame before the remembered thread reopens, and Ask Glisp shows a skeleton while it restores. A hydration error in the employee chat is fixed.",
            "technical": false
          }
        ],
        "built": "A stream pacer, a shared column width, server-side replace-from, and one set of chat skeletons.",
        "why": "A chat that jumps, flashes or keeps the wrong question in its history feels unfinished, whatever the answer says.",
        "value": "Chats that read smoothly, use the screen, and let you correct a question cleanly.",
        "shots": [
          {
            "route": "/chat",
            "caption": "The wider thread: projects, pinned answers and chats on the left, the conversation across the rest.",
            "src": "/ci/d1008/chat.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "06",
        "title": "One honest Klaviyo connection for both writers",
        "sub": "Backend SPEC-362 · SPEC-364 · SPEC-365 · frontend SPEC-353 · SPEC-356 — no migration.",
        "subTechnical": true,
        "ask": "Nothing of ours should appear in a store’s Klaviyo until it is needed; the Email Marketing Manager should adapt to what the key may do; and the Brief’s win-back should share one answer about it.",
        "status": "Delivered",
        "effort": "2h",
        "inside": [
          {
            "text": "<b>It finds out what a key may do</b> by itself — full, partial or read-only — with a probe that creates nothing, and re-checks every night. Each write button the key cannot use is disabled with the reason, and a banner points to Integrations.",
            "full": "<b>It finds out what a key may do</b> by itself — full, partial or read-only — with a probe that creates nothing, and re-checks every night. Each write button the key cannot use is disabled with the reason, and a banner points to Integrations.",
            "technical": false
          },
          {
            "text": "<b>Nothing of ours until needed:</b> connecting creates nothing. The test list is made when you first add test addresses or send a test, and the engagement segments on the first night the report runs — so their figures arrive a night or two after connecting. A reconnect reuses what is there.",
            "full": "<b>Nothing of ours until needed:</b> connecting creates nothing. The test list is made when you first add test addresses or send a test, and the engagement segments on the first night the report runs — so their figures arrive a night or two after connecting. A reconnect reuses what is there.",
            "technical": false
          },
          {
            "text": "<b>The win-back stopped recording what did not happen:</b> with a key that could not write, every customer was refused quietly yet recorded as synced — and counted in the outcome measurement. It now refuses first and records nothing; Customers → Win-back greys the button with the reason.",
            "full": "<b>The win-back stopped recording what did not happen:</b> with a key that could not write, every profile upsert was refused quietly yet each customer was recorded as treated — and counted in the outcome measurement. It now refuses first (<code>422 klaviyo_winback_not_allowed</code>) and records nothing; <code>GET /brief/winback</code> carries <code>klaviyo {can_sync, reason}</code>.",
            "technical": false
          },
          {
            "text": "<b>The autopilot never half-sends</b> on a key that cannot send: the campaign waits in review instead of failing inside the send.",
            "full": "<b>The autopilot never half-sends</b> on a key that cannot send: the campaign waits in review instead of failing inside the send.",
            "technical": false
          }
        ],
        "built": "Access-mode detection, helpers made on demand, one shared access answer, and refusals that follow a changed key at once.",
        "why": "A store may paste a read-only key just to look around; it should find the app honest about that, and its account untouched.",
        "value": "Both Klaviyo writers know what the key allows, say so before the click, and never record a sync that did not happen.",
        "shots": [
          {
            "route": "/email-marketing · Settings",
            "caption": "One Klaviyo connection: a key already saved on Integrations is offered here, with nothing to paste twice.",
            "src": "/ci/d1008/email-settings.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "07",
        "title": "Every employee reads its own store’s brain; Accounts Payable speaks plainly",
        "sub": "Backend SPEC-295 Patches — audit of every employee’s Brand Brain read.",
        "subTechnical": true,
        "ask": "Check every employee reads the Brand Brain dynamically, and fix the bills employee’s tone.",
        "status": "Delivered",
        "effort": "1h 30m",
        "inside": [
          {
            "text": "<b>Verified: no store is written into the product.</b> A new store starts from neutral starter content and is researched from its own data; every writer and chat reads that store’s brain at the moment it runs, and every AI path passes the store’s own trade.",
            "full": "<b>Verified: no store is written into the product.</b> A new store starts from neutral starter content and is researched from its own data; every writer and chat reads that store’s brain at the moment it runs, and every AI path passes the store’s own trade.",
            "technical": false
          },
          {
            "text": "<b>Accounts Payable no longer answers in the stylist’s voice:</b> it reads the brand’s rules without its identity and positioning, as Glisp does, and its prompt asks for plain accounts-payable language.",
            "full": "<b>Accounts Payable no longer answers in the stylist’s voice:</b> it reads the brand’s rules with <code>include_identity=False</code>, as Glisp does, and its prompt asks for plain accounts-payable language.",
            "technical": false
          }
        ],
        "built": "An audit of the Brand Brain across every employee, and a plainer voice for the bills employee.",
        "why": "A bills employee that talks like a fashion copywriter is hard to trust with money.",
        "value": "Each employee speaks for the store it serves, in the register its job calls for.",
        "shots": [
          {
            "route": "/employees/finance · Overview",
            "caption": "Accounts Payable in plain words: what each company can't cover, and the next step.",
            "src": "/ci/d1008/finance-overview.webp",
            "width": 1400,
            "height": 972
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "A new company’s first look",
        "change": "every page, most of them empty → only what has data, plus what it turns on",
        "why": "Your store stays on the full view."
      },
      {
        "name": "An Accounts Payable answer",
        "change": "bills as pipe-joined bullets → a table with figures right-aligned",
        "why": "Stored answers render the new way too."
      },
      {
        "name": "Editing a question",
        "change": "re-asked as a new turn → replaces the question and everything after it",
        "why": "In every chat, like ChatGPT."
      },
      {
        "name": "Win-back on a key that cannot write",
        "change": "customers recorded as synced → refused before anything is recorded",
        "why": "They were being counted in the outcome measurement."
      }
    ],
    "next": [
      {
        "title": "Guided view, Phases 5 and 6",
        "body": "Four of the six phases shipped today; the remaining two come next.",
        "technical": false
      },
      {
        "title": "A “Connect with Klaviyo” button",
        "body": "Pasting a key stays the way to connect for now; a sign-in button comes later.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "Your store sees none of this",
        "body": "It stays on the full view with no switches, and as owner you hold every permission — every page and every button is where it was.",
        "technical": false
      },
      {
        "title": "The server stays the guard",
        "body": "Greyed and hidden buttons only mirror the server’s rules, which are unchanged; nothing is allowed because a button showed.",
        "technical": false
      },
      {
        "title": "One test failed in a full run and passed alone",
        "body": "The scheduler test that failed in the full backend run passes three times out of three on its own; a known timing test also flickered once. Neither touches today’s changes.",
        "technical": true
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d1007",
    "kind": "daily",
    "period": "Wednesday, Oct 7, 2026",
    "sortDate": "2026-10-07",
    "hook": "Two new employees go live — a Customer Support Agent and an Email Marketing Manager — with every customer send made once and on purpose, and new companies able to connect and pay without getting stuck",
    "memo": "Today <b>two new digital employees went live</b>. The <b>Customer Support Agent</b> works your helpdesk’s conversations using what the helpdesk’s own AI cannot see — the real return, fit verdict, stock, warehouse lateness, customer value and order margin — and drafts replies for a person to approve. The <b>Email Marketing Manager</b> plans, builds and sends email through Klaviyo, judges each campaign by the profit it made against a holdout from your own orders, and follows each store’s own trade rather than yours. Before any of it could reach a customer, last night’s work was reviewed and the gaps closed: <b>every customer send now happens once, and only on purpose</b> — a double click, a second approver or the autopilot can no longer send twice, the sensitive subjects are never answered automatically, and the support agent starts in <i>Suggest</i> until you switch it on. A field-by-field check against Klaviyo’s real API found <b>eight mistakes</b> a test stand-in could not, each now fixed and pinned by a test. New companies can again <b>connect through the public Shopify app</b>, a paid checkout can no longer be lost or charged twice, onboarding’s plan step matches the pricing page, and support messages read like an email client. And a standing rule landed: <i>your store stays exactly as it is; every other company gets the SaaS</i>. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "25h",
    "views": "11 screens",
    "areas": 7,
    "days": [
      {
        "title": "A Customer Support Agent, live",
        "body": "Nine tabs over your helpdesk: it files every ticket, flags the sensitive ones, and drafts replies from the real order, return, fit, stock and margin — for a person to approve.",
        "technical": false
      },
      {
        "title": "An Email Marketing Manager, live",
        "body": "From a morning preview on sample data to a working employee by evening: it mirrors your Klaviyo account, measures every campaign against a holdout in profit, and sends only after its checks pass again on approval.",
        "technical": false
      },
      {
        "title": "Customer sends: once, and only on purpose",
        "body": "A review of last night’s work found sends that could reach a customer twice or without a deliberate act. Each is closed on the server, not just on the screen.",
        "technical": false
      },
      {
        "title": "A new company connects and pays without getting stuck",
        "body": "The public Shopify app connects again, a paid checkout is never lost or charged twice, onboarding resumes where it was left, and the plan step matches the pricing page.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "The Customer Support Agent — the seventh digital employee",
        "sub": "Backend SPEC-353 · frontend SPEC-346 — migration 0151, seven new tables with row-level security; a new step after every Gorgias sync.",
        "subTechnical": true,
        "ask": "“Complete the backend … all backend working, integrated with frontend … all possible test cases.”",
        "status": "Delivered · starts in Suggest until you switch it on",
        "effort": "7h",
        "inside": [
          {
            "text": "<b>Nine tabs:</b> Overview, Inbox, Approvals, Topics & playbooks, Knowledge, Insights, Performance, the employee’s own Chat, and Settings — on real data, with the sample data gone.",
            "full": "<b>Nine tabs:</b> Overview, Inbox, Approvals, Topics & playbooks, Knowledge, Insights, Performance, the employee’s own Chat, and Settings — on real data, with the sample data gone.",
            "technical": false
          },
          {
            "text": "<b>After every helpdesk sync</b> it files each ticket under one of fourteen topics and flags chargebacks, legal threats, injuries, harassment and press — by rules, not by a model — and keeps the queue, response deadlines and revenue at risk current.",
            "full": "<b>After every helpdesk sync</b> (a new <code>support_tick</code> step after <code>gorgias_sync</code>) it files each ticket under one of fourteen topics and flags chargebacks, legal threats, injuries, harassment and press — by rules, not by a model — and keeps the queue, response deadlines and revenue at risk current.",
            "technical": false
          },
          {
            "text": "<b>Replies written from facts the backend computed:</b> the order and its margin, fulfilment against your handling time, the Loop return, the fit verdict, stock, the customer’s value and your Brand Brain policies — up to eight drafts per pass. A goodwill offer is priced against that order’s margin, under your ceilings.",
            "full": "<b>Replies written from facts the backend computed:</b> the order and its margin, fulfilment against your handling time, the Loop return, the fit verdict, stock, the customer’s value and your Brand Brain policies — up to eight drafts per pass. A goodwill offer is priced against that order’s margin, under your ceilings.",
            "technical": false
          },
          {
            "text": "<b>Shopify and Loop stay read-only.</b> Refunds, cancellations, address changes, re-ships, codes and returns are prepared for a person, never done by the product. Every send is checked again on the server, and the kill switch stops the agent’s writes and withdraws its unsent replies — never a person’s.",
            "full": "<b>Shopify and Loop stay read-only.</b> Refunds, cancellations, address changes, re-ships, codes and returns are prepared for a person, never done by the product. Every send is checked again on the server (a 409 with the reasons), and the kill switch stops the agent’s writes and withdraws its unsent replies — never a person’s. One write module, <code>gorgias_writer.py</code>; a test fails the build if anything else writes to Gorgias.",
            "technical": false
          },
          {
            "text": "<b>Your decision, recorded:</b> asking for the backend complete is what extends the helpdesk connection from read-only to writing replies, notes and ticket updates — approve-first, like the Paid Ads Manager.",
            "full": "<b>Your decision, recorded:</b> asking for the backend complete is what extends the helpdesk connection from read-only to writing replies, notes and ticket updates — approve-first, like the Paid Ads Manager.",
            "technical": false
          }
        ],
        "built": "The support agent’s backend — classification, drafting, offer pricing, sending and reconciliation — and the nine-tab page, hub card, chat and in-app doc on top of it.",
        "why": "A helpdesk’s own AI sees the message; it does not see the order’s margin, the return already open, or that the size runs small.",
        "value": "Replies that know the order behind the message, approved by a person before anything is sent.",
        "shots": [
          {
            "route": "/customer-support · Overview",
            "caption": "The Customer Support Agent: tickets, resolution, first response and revenue at risk, then what needs you and why customers are writing.",
            "src": "/ci/d1007/support-overview.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/customer-support · Inbox",
            "caption": "The inbox: each ticket beside the customer, their order and fulfilment, and the agent's draft with its confidence.",
            "src": "/ci/d1007/support-inbox.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/customer-support · Knowledge",
            "caption": "Knowledge: policies that conflict with the Brand Brain, and the questions it could not answer yet.",
            "src": "/ci/d1007/support-knowledge.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/customer-support · Settings",
            "caption": "Settings: the helpdesk connection and what the agent can do through it.",
            "src": "/ci/d1007/support-settings.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "The Email Marketing Manager — from preview to live in one day",
        "sub": "Frontend SPEC-345 (preview) · backend SPEC-354 · backend SPEC-360 / frontend SPEC-350 (fully SaaS) — migration 0152, fourteen tables with row-level security.",
        "subTechnical": true,
        "ask": "“Complete the backend … all backend working, integrated with frontend … all possible test cases.”",
        "status": "Delivered",
        "effort": "6h",
        "inside": [
          {
            "text": "<b>The morning preview:</b> eleven tabs, a seven-step campaign builder, campaign and flow pages with a journey diagram, and a pre-send panel whose approve button is driven by the same checks it lists — margin floor, protected groups, daily ceiling, seed test, spam rate, banned words, stockout products, a typed confirm over the audience threshold.",
            "full": "<b>The morning preview:</b> eleven tabs, a seven-step campaign builder, campaign and flow pages with a journey diagram, and a pre-send panel whose approve button is driven by the same checks it lists — margin floor, protected groups, daily ceiling, seed test, spam rate, banned words, stockout products, a typed confirm over the audience threshold.",
            "technical": false
          },
          {
            "text": "<b>Live by evening.</b> Connecting checks the Klaviyo key before storing it, encrypted. Every hour it mirrors campaigns, flows (each sorted into one of fourteen lifecycles), lists and segments; each night it checks your sender records, counts who triggered each flow, measures every sent campaign against its holdout from your own orders — five days, profit after product cost and discount — and proposes the next four weeks.",
            "full": "<b>Live by evening.</b> Connecting checks the Klaviyo key before storing it, encrypted. <code>email_marketing_sync</code> (hourly :50) mirrors campaigns, flows (each sorted into one of fourteen lifecycles), lists and segments, and profiles with their consent daily; <code>email_marketing_reports</code> (03:20 UTC) makes exactly four values-report calls, checks SPF/DKIM/DMARC, counts who triggered each flow last month, measures every sent campaign against its holdout from your own orders — five days, profit after product cost and discount — and proposes the next four weeks.",
            "technical": false
          },
          {
            "text": "<b>Sends only on purpose:</b> consented and unsuppressed people only, minus protected groups, the weekly cap and a holdout; every check runs again on approve; offers use existing Shopify codes only; flows are built as drafts and turning one on is an approval; the kill switch cancels scheduled sends and pauses the flows it built.",
            "full": "<b>Sends only on purpose:</b> consented and unsuppressed people only, minus protected groups, the weekly cap and a holdout; every check runs again on approve; offers use existing Shopify codes only; flows are built as drafts and turning one on is an approval; the kill switch cancels scheduled sends and pauses the flows it built.",
            "technical": false
          },
          {
            "text": "<b>Each store as itself:</b> the trade comes from the store’s Brand Brain — a clothing store keeps the fit-check flow and size advice, any other store gets neutral wording and no fit check. Margin and stock are checked on every product an email shows, with landed cost.",
            "full": "<b>Each store as itself</b> (SPEC-360/350): the trade comes from the store’s Brand Brain store type — a clothing store keeps the fit-check flow, size advice and “Bracketers”, any other store gets neutral wording and no fit check. Margin and stock are checked on every product an email shows, with landed cost. A test counts only for the version it tested and cannot run twice at once.",
            "technical": false
          },
          {
            "text": "<b>Tested:</b> 74 new backend tests against a stand-in Klaviyo, 20 new frontend tests; both full suites green and the migration checked up, down and up again.",
            "full": "<b>Tested:</b> 74 new backend tests (a fake Klaviyo at the transport), full suite 3,786 passed; 20 new frontend tests, 2,426 passed, build green. Migration 0152 verified up/down/up on Postgres 17.",
            "technical": false
          }
        ],
        "built": "The Email Marketing Manager’s API, sync, nightly reports and guarded send path, its chat and its Email Copywriter, and the eleven-tab page moved from sample data onto it.",
        "why": "Email is judged by opens and clicks by default; what matters is the profit an email made that would not have happened without it.",
        "value": "An email employee that plans, builds and sends on your approval, and reports each campaign in profit against a holdout.",
        "shots": [
          {
            "route": "/email-marketing · Overview",
            "caption": "The Email Marketing Manager, with its autonomy and kill switch at the top and eleven tabs.",
            "src": "/ci/d1007/email-overview.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/email-marketing · Plan",
            "caption": "The plan tab, until Klaviyo is connected.",
            "src": "/ci/d1007/email-plan.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/email-marketing · Campaigns",
            "caption": "Campaigns, read from the email platform once connected.",
            "src": "/ci/d1007/email-campaigns.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "03",
        "title": "Klaviyo’s real API, checked field by field",
        "sub": "Backend SPEC-354 Patches · frontend SPEC-345 Patches — against Klaviyo’s OpenAPI revision 2026-07-15.",
        "subTechnical": true,
        "ask": "Make the Email Marketing Manager correct against the real Klaviyo, not just the stand-in the tests use.",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>Eight mistakes the stand-in could not catch,</b> found by reading the client against Klaviyo’s published specification line by line — each now has a test that fails on the old shape.",
            "full": "<b>Eight mistakes the stand-in could not catch,</b> found by reading the client against Klaviyo’s published specification line by line — each now has a test that fails on the old shape.",
            "technical": false
          },
          {
            "text": "<b>A scheduled send would have shifted every recipient</b> by your own time-zone offset; it now sends the wall-clock time Klaviyo expects for local delivery.",
            "full": "<b>A scheduled send would have shifted every recipient</b> by your own time-zone offset; it now sends the wall-clock time Klaviyo expects for local delivery.",
            "technical": false
          },
          {
            "text": "<b>Consent was at risk:</b> a capped profile read could have deleted real consent rows, and the seed list could default to double opt-in. Both are fixed; seeds are subscribed when saved.",
            "full": "<b>Consent was at risk:</b> a capped profile read could have deleted real consent rows, and the seed list could default to double opt-in. Both are fixed; seeds are subscribed when saved.",
            "technical": false
          },
          {
            "text": "<b>Reports read in full:</b> value reports now follow every page, trigger counts no longer double-count across two months, and list and segment sizes are read one by one, nightly, paced within Klaviyo’s limits.",
            "full": "<b>Reports read in full:</b> value reports now follow <code>links.next</code>, trigger counts no longer double-count across two months, list and segment sizes are read one by one, nightly, paced to 15 a minute (the collection endpoints refuse <code>additional-fields</code>), the holdout split uses <code>profile-sample</code>, and throttling offers only Klaviyo’s 12 allowed rates.",
            "technical": false
          }
        ],
        "built": "Eight corrections to the Klaviyo client and the matching screen changes for throttle rates and send times.",
        "why": "A stand-in only knows what its author believed about the API; the real one rejects the rest in production.",
        "value": "Sends land at the time you chose, consent is never lost, and the figures cover the whole account.",
        "shots": [
          {
            "route": "/email-marketing · Settings",
            "caption": "The Klaviyo connection: the key, the exact scopes it needs, and Klaviyo's own limits spelled out.",
            "src": "/ci/d1007/email-settings.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "Every customer send happens once, and only on purpose",
        "sub": "Backend SPEC-356 · frontend SPEC-347 — review of backend 54498f5 and frontend 81cacef / 149a9e2.",
        "subTechnical": true,
        "ask": "“Check … is there any issue” — then “first pull the latest merge and then fix”.",
        "status": "Delivered",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>Claimed before it is sent:</b> a support draft or an email campaign is claimed first, so a double click, a second approver or the autopilot can no longer send it twice. An unknown outcome at the send leaves the campaign failed, not approvable again.",
            "full": "<b>Claimed before it is sent:</b> a support draft or an email campaign is claimed (compare-and-set) before Gorgias or Klaviyo is called, so a double click, a second approver or the autopilot tick can no longer send it twice. An unknown outcome at the Klaviyo send leaves the campaign <code>failed</code>, not re-approvable; Klaviyo POSTs are no longer retried on network errors or 5xx.",
            "technical": false
          },
          {
            "text": "<b>Never automatic:</b> chargebacks, legal threats, injuries, harassment, press and wholesale — enforced on the server and shown locked in Settings.",
            "full": "<b>Never automatic:</b> chargebacks, legal threats, injuries, harassment, press and wholesale — enforced on the server and shown locked in Settings.",
            "technical": false
          },
          {
            "text": "<b>The right people:</b> a viewer can no longer write a support draft, and setting autonomy or the email guardrails needs the permission to send.",
            "full": "<b>The right people:</b> a viewer can no longer write a support draft, and setting autonomy or the email guardrails needs the permission to send.",
            "technical": false
          },
          {
            "text": "<b>Nothing by accident:</b> the support agent starts at <i>Suggest</i> — no drafts and nothing written to the helpdesk until you switch it on; a flow cannot go live while its email is still an outline; the Approvals shortcut and turning a flow on both ask first, one write at a time.",
            "full": "<b>Nothing by accident:</b> the support agent starts at <i>Suggest</i> — no drafts and nothing written to the helpdesk until you switch it on; a flow cannot go live while its email is still an outline; the Approvals shortcut and turning a flow on both ask first, one write at a time.",
            "technical": false
          }
        ],
        "built": "Server-side claims on every customer send, the never-automatic subjects, tighter permissions and confirmations on the keyboard paths.",
        "why": "These employees speak to your customers; a duplicate or an unintended send is a mistake the customer sees.",
        "value": "Each message reaches a customer once, because a person meant it to.",
        "shots": [
          {
            "route": "/email-marketing · Approvals",
            "caption": "Approvals: nothing goes to a customer without a deliberate approval.",
            "src": "/ci/d1007/email-approvals.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/automatic-sending",
            "caption": "Automatic sending: off unless you switch it on.",
            "src": "/ci/d1007/settings-automatic.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "Support messages that read like an email client, and Approvals that page",
        "sub": "Frontend SPEC-348 / backend SPEC-357 (migration 0154) · frontend SPEC-349 / backend SPEC-358.",
        "subTechnical": true,
        "ask": "“The best parsing of the message”, “fix the horizontal scrolling”, and “when I switch any filter just the data renders, not the UI.”",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>One reader for every message:</b> the new words first; earlier emails as cards with sender and date, in seven languages of reply headers; duplicates, map and phone links dropped; footers folded away; order emails shown as a receipt with addresses, items and totals.",
            "full": "<b>One reader for every message:</b> the new words first; earlier emails as cards with sender and date, in seven languages of reply headers; duplicates, map and phone links dropped; footers folded away; order emails shown as a receipt with addresses, items and totals.",
            "technical": false
          },
          {
            "text": "<b>Links and attachments as chips</b>, attachments with thumbnails synced from the helpdesk — and every message wraps, so no long link widens the page.",
            "full": "<b>Links and attachments as chips</b>, attachments with thumbnails synced from the helpdesk — and every message wraps, so no long link widens the page.",
            "technical": false
          },
          {
            "text": "<b>Only the data changes:</b> switching a queue, the sort, the page or a ticket keeps the page in place, the previous rows dimmed until the next arrive, neighbours fetched ahead.",
            "full": "<b>Only the data changes:</b> switching a queue, the sort, the page or a ticket keeps the page in place, the previous rows dimmed until the next arrive, neighbours fetched ahead.",
            "technical": false
          },
          {
            "text": "<b>Approvals filtered and paged:</b> confidence tags, topic and channel with counts, search, sort, twenty to a page — and the server reads message bodies only for that page’s tickets.",
            "full": "<b>Approvals filtered and paged:</b> confidence tags, topic and channel with counts, search, sort, twenty to a page from <code>GET /approvals/page</code>, which reads message bodies only for that page’s tickets.",
            "technical": false
          }
        ],
        "built": "The message renderer and attachment sync, a steady Inbox, and a filtered, paged Approvals queue.",
        "why": "A support reply is only as good as the reading of the message it answers.",
        "value": "Threads you can read at a glance, and an approvals queue you can work through by topic and confidence.",
        "shots": [
          {
            "route": "/customer-support · Approvals",
            "caption": "Approvals: the customer's message, the drafted reply, its confidence and brand-voice score, and where each fact came from.",
            "src": "/ci/d1007/support-approvals.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "06",
        "title": "A new company connects and pays without getting stuck",
        "sub": "Backend SPEC-355 (migration 0153) · SPEC-359 (migration 0155) · SPEC-314 Patches (migration 0156) · frontend SPEC-351.",
        "subTechnical": true,
        "ask": "“Sign out after the name → payment step; paid and stuck on the store → start there” — and a plan step that uses the pricing page’s dropdown, with no AI dollar figure.",
        "status": "Delivered",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>The public Shopify app connects again.</b> Approving it failed because newer Shopify apps must use expiring access; the platform now keeps the refreshing token and renews it before it runs out, marking a store expired only if Shopify refuses. Your store’s own app is unchanged.",
            "full": "<b>The public Shopify app connects again.</b> Apps created after 2026-04-01 must take expiring offline tokens; the exchange now sends <code>expiring=1</code>, keeps the rotating refresh token (migration 0153), and every Shopify read refreshes it under a row lock when under 30 minutes remain; a refused refresh marks the store <code>expired</code>. Your store’s custom app is unchanged.",
            "technical": false
          },
          {
            "text": "<b>A payment is never lost or taken twice:</b> every checkout is kept; a paid one that both the return page and the payment notice missed is recorded on the next onboarding visit, and a second checkout for the same plan opens no new payment page.",
            "full": "<b>A payment is never lost or taken twice:</b> every checkout is kept; a paid one that both the return page and the payment notice missed is recorded on the next onboarding visit, and a second checkout for the same plan opens no new payment page.",
            "technical": false
          },
          {
            "text": "<b>Onboarding resumes where it was left</b> — proven by a sign-out and sign-in test at the plan and store steps; no change was needed.",
            "full": "<b>Onboarding resumes where it was left</b> — proven by a sign-out and sign-in test at the plan and store steps; no change was needed.",
            "technical": false
          },
          {
            "text": "<b>The plan step matches the pricing page:</b> the same revenue dropdown and price column, and “Glisp and every AI employee, with a monthly AI allowance included” — no AI dollar figure on onboarding, pricing or billing. The first plan’s band now reads “Up to $3M”.",
            "full": "<b>The plan step matches the pricing page:</b> the same revenue dropdown and price column, and “Glisp and every AI employee, with a monthly AI allowance included” — no AI dollar figure on onboarding, pricing or billing. The first plan’s band now reads “Up to $3M”.",
            "technical": false
          },
          {
            "text": "<b>Your live database moved twice, each at your instruction</b>, after the local app failed every request on a missing column — every migration checked up and down on a throwaway database first.",
            "full": "<b>Your live database moved twice, each at your instruction</b>: 0149 → 0153 after the local backend failed every request on the missing <code>stores.shopify_refresh_token_encrypted</code>, then 0153 → 0156 — 0154, 0155 and 0156 each checked up/down on a throwaway Postgres first.",
            "technical": false
          }
        ],
        "built": "Expiring-token support for the public app, checkout recovery, a proven resume, and the plan picker on onboarding.",
        "why": "A new company that cannot connect, or pays and gets stuck, is a sign-up lost on the first day.",
        "value": "Sign-up that carries a new company from name to connected store without a dead end or a double charge.",
        "shots": []
      },
      {
        "n": "07",
        "title": "A standing rule for your store, and a clean build",
        "sub": "Root CLAUDE.md Rule 12 · backend SPEC-234 Patches · lint across ten files.",
        "subTechnical": true,
        "ask": "Your store stays as it is; every other organization gets the SaaS.",
        "status": "Delivered",
        "effort": "1h",
        "inside": [
          {
            "text": "<b>Rule 12:</b> your store keeps working exactly as it does today after every change. New behaviour reaches it only by your choice, never as a side effect; every spec now states what your store sees after it.",
            "full": "<b>Rule 12:</b> your store keeps working exactly as it does today after every change. New behaviour reaches it only by your choice, never as a side effect; every spec now states what your store sees after it.",
            "technical": false
          },
          {
            "text": "<b>A test that failed on every checkout since 1 October</b> dated its spending to a fixed September day but checked the budget on today’s clock. It now checks on its own date — the spending guard itself was right.",
            "full": "<b>A test that failed on every checkout since 1 October</b> (<code>test_ai_spend::test_a_reached_cap_stops_the_run</code>) dated its spending to a fixed September <code>NOW</code> but checked the budget on the real clock. It now checks at <code>NOW</code> — the spending guard itself was right.",
            "technical": false
          },
          {
            "text": "<b>Lint clean across the backend:</b> 26 long lines in ten files wrapped, with no behaviour change.",
            "full": "<b>Lint clean across the backend:</b> 26 long lines in ten files wrapped, with no behaviour change.",
            "technical": true
          }
        ],
        "built": "The new rule in the project’s instructions, a corrected test, and a lint-clean backend.",
        "why": "With every other company on the SaaS defaults, the store that already works needs a written guarantee it will not drift.",
        "value": "Every change from now on says, in writing, what your store will see.",
        "shots": []
      }
    ],
    "tiers": [
      {
        "name": "A customer send",
        "change": "could go twice on a double click or a second approver → claimed first, sent once",
        "why": "Enforced on the server, not only on the screen."
      },
      {
        "name": "The public Shopify app",
        "change": "failed after approval → connects, with access that renews itself",
        "why": "Newer Shopify apps must use expiring access."
      },
      {
        "name": "A paid checkout the return page missed",
        "change": "lost → recorded on the next onboarding visit",
        "why": "And a second checkout for the same plan opens no new payment page."
      },
      {
        "name": "The first plan’s band",
        "change": "“Under $3M” → “Up to $3M”",
        "why": "It reads like the plan’s name now."
      }
    ],
    "next": [
      {
        "title": "Switch the support agent on when you are ready",
        "body": "It starts at Suggest: no drafts and nothing written to the helpdesk until you switch it on in its Settings.",
        "technical": false
      },
      {
        "title": "Record the Klaviyo decision in the product document",
        "body": "Your go-ahead to build and send through Klaviyo is recorded in the Email Marketing spec; the product document’s “Coming Soon” line is not in this copy of the project to amend.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "Two outside systems now receive writes — by your decision",
        "body": "The helpdesk gets replies, notes and ticket updates, and Klaviyo gets campaigns and flows, each approve-first. Shopify and Loop stay read-only, and a test fails the build if anything but the one write module writes to the helpdesk.",
        "technical": false
      },
      {
        "title": "Proven against a stand-in, then against the real API’s shape",
        "body": "The tests talk to a fake Klaviyo; the field-by-field check against Klaviyo’s published specification is what found the eight mistakes the fake agreed with.",
        "technical": false
      },
      {
        "title": "Your store is unchanged",
        "body": "None of today’s defaults reaches your store’s existing rows; its custom Shopify app connects exactly as before.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d1006",
    "kind": "daily",
    "period": "Tuesday, Oct 6, 2026",
    "sortDate": "2026-10-06",
    "hook": "Any company can install from Shopify, a new store’s Brand Brain researches itself, and the employees are named for the job they do",
    "memo": "Today opened the platform to companies beyond your own. <b>A second, public Shopify app</b> now sits beside the custom one your store keeps, and a merchant who clicks <b>Install</b> in Shopify goes straight to Shopify’s approval and lands in onboarding with the store already approved — the last piece before Shopify’s review. A new store no longer starts with an empty brand: its <b>Brand Brain researches itself</b> — the store, what it sells, its voice, its colours, its competitors — while a toast follows the work across pages, and everything waits on one <b>Review</b> page until approved. The writers stop assuming every store sells clothing: <b>new stores read neutral instructions</b>, while yours reads exactly what it read before. The five employees are now named for their job — <b>Search Visibility, Social Media Manager, Paid Ads Manager, Accounts Payable, Report Builder</b> — and open in the sidebar on every page. Emails carry the new name and icon with their text back inside the card, a company without a store is taken back to onboarding instead of an error, sign-in shows Google but not Shopify, and the operator console’s Customers and Overview are repaired. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "23h",
    "views": "5 screens",
    "areas": 8,
    "days": [
      {
        "title": "Any company can install from Shopify",
        "body": "A public Shopify app for new companies, and Install in Shopify goes straight to Shopify’s approval and on into onboarding — while your store stays on its own app.",
        "technical": false
      },
      {
        "title": "A new store’s brand researches itself",
        "body": "Six steps read the store, its catalogue, its voice, its colours and its competitors after the first sync; a toast follows it, and nothing is used until it is approved on the Review page.",
        "technical": false
      },
      {
        "title": "Employees named for their job",
        "body": "Search Visibility, Social Media Manager, Paid Ads Manager, Accounts Payable and Report Builder — everywhere a person reads them, with Digital Employees open in the sidebar.",
        "technical": false
      },
      {
        "title": "First impressions, tidied",
        "body": "Writers that fit any trade, emails with the new name and icon, onboarding instead of an error for a company without a store, and Google back on the sign-in screens.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Any company can now install from Shopify",
        "sub": "Backend SPEC-349 · SPEC-352 · frontend SPEC-344 — migrations 0149 (<code>stores.shopify_app</code>) and 0150 (<code>shopify_installs</code>).",
        "subTechnical": true,
        "ask": "Every new company connects through the new public Shopify app, “ftes for Commerce”, while your store stays exactly as it is — and a merchant who clicks Install in Shopify must go straight to Shopify’s approval, as Shopify’s review requires: the last piece before the review.",
        "status": "Delivered · awaiting the next backend deploy and the app’s release on Shopify",
        "effort": "5h",
        "inside": [
          {
            "text": "<b>Two Shopify apps, side by side.</b> The app your store uses only installs on your own group of stores, so no other company could connect. New companies now connect through the public app; your store, and every store already connected, stays on its custom app for every reconnect.",
            "full": "<b>Two Shopify apps, side by side.</b> The existing app has custom distribution, so it installs only within one Plus organization. New stores connect through the public app (<code>SHOPIFY_PUBLIC_CLIENT_ID/SECRET</code>); every existing store is recorded <code>custom</code> (<code>stores.shopify_app</code>, migration 0149) and every reconnect reuses it. Webhooks signed by either app are accepted; anything else is still refused.",
            "technical": false
          },
          {
            "text": "<b>Nothing changes until the public app’s keys are set</b> — until then every flow behaves exactly as before.",
            "full": "<b>Nothing changes until the public app’s keys are set</b> — until then every flow behaves exactly as before.",
            "technical": false
          },
          {
            "text": "<b>Install from Shopify:</b> a merchant who clicks Install goes straight to Shopify’s approval screen, then to sign-up, where onboarding offers “Finish connecting &lt;shop&gt; — Shopify has already approved it”. Opening the app from the Shopify admin of a connected shop simply opens the app.",
            "full": "<b>Install from Shopify:</b> <code>proxy.ts</code> forwards Shopify’s launch to <code>/api/shopify/install</code>, which asks the backend for Shopify’s approval URL; the approved install waits as a pending row (<code>shopify_installs</code>, migration 0150) behind a one-time claim kept in an httpOnly cookie, and onboarding’s connect step offers “Connect &lt;shop&gt;”. A launch for a connected shop opens the app.",
            "technical": false
          },
          {
            "text": "<b>Safe by construction:</b> a launch Shopify did not sign, or one older than an hour, is refused; no store data is read before a company claims the install; the claim works once, and a shop another company owns is still refused.",
            "full": "<b>Safe by construction:</b> HMAC and a one-hour timestamp checked; only the claim’s SHA-256 is stored, and it expires in 7 days; no sync until the claim; the token copy is erased on claim; an owned-elsewhere shop is refused through the same <code>attach</code> as a normal connect. Proven end to end through the built app on a throwaway PostgreSQL.",
            "technical": false
          },
          {
            "text": "<b>The public app’s full configuration</b> — including the three privacy webhooks Shopify requires — is kept as one file, ready to release with Shopify’s own tool.",
            "full": "<b>The public app’s full configuration</b> — <code>shopify/ftes-for-commerce/shopify.app.toml</code>, with the three compliance webhooks and the install redirect URLs — released with <code>shopify app deploy --allow-updates</code>.",
            "technical": false
          }
        ],
        "built": "A second Shopify app beside the first, the install-first flow from launch to claim, and the onboarding step that finishes it.",
        "why": "A Shopify app that only one group of stores can install is not a product other companies can buy — and Shopify will not review an app that shows a login before its approval screen.",
        "value": "Any merchant can now find the app in Shopify, click Install and arrive in onboarding with their store already approved — while your store carries on untouched.",
        "shots": []
      },
      {
        "n": "02",
        "title": "A new store’s Brand Brain researches itself, for your review",
        "sub": "Backend SPEC-347 · frontend SPEC-341 — migration 0146 (<code>brand_research_runs</code>, row-level security).",
        "subTechnical": true,
        "ask": "“A store connects, it automatically starts researching it … competitor analysis … a persisted toaster in the top right … a review sub-tab with breadcrumbs … the best HCI.”",
        "status": "Delivered",
        "effort": "5h",
        "inside": [
          {
            "text": "<b>Six steps, on its own:</b> after a new store’s first sync it reads the store — its Shopify description, pages, homepage, best sellers and collections — writes a brand profile, learns the voice from the product descriptions, takes the Shopify brand colours and finds the competitors.",
            "full": "<b>Six steps, on its own:</b> <code>services/brand_brain/research.py</code> — store (read-only Shopify GETs and one GraphQL query, plus the homepage), catalogue (local Postgres), profile (a Knowledge Base source of kind <code>research</code> through the existing Brand Fact Extractor), voice (the existing Brand Voice Analyst), style (Shopify brand colours) and competitors (the existing Find, SPEC-280).",
            "technical": false
          },
          {
            "text": "<b>Nothing is used until you approve it.</b> Every finding waits — facts pending, customer types unconfirmed, voice, word and style rules switched off, competitors pending — so a research run changes no article, post or picture by itself.",
            "full": "<b>Nothing is used until you approve it.</b> Every finding waits — facts pending, customer types unconfirmed, voice, word and style rules switched off, competitors pending — so a research run changes no article, post or picture by itself.",
            "technical": false
          },
          {
            "text": "<b>Only an empty brain, only once.</b> It starts automatically only on a store whose Brand Brain holds nothing but the starter content; a brain with anything of its own — yours included — is never researched automatically.",
            "full": "<b>Only an empty brain, only once.</b> It starts automatically only on a store whose Brand Brain holds nothing but the starter content; a brain with anything of its own — yours included — is never researched automatically.",
            "technical": false
          },
          {
            "text": "<b>A toast that follows you:</b> top-right, across pages and reloads, with the step, the percentage, what it is reading and the elapsed time; it ends on “Your brand is ready to review”.",
            "full": "<b>A toast that follows you:</b> top-right, across pages and reloads, with the step, the percentage, what it is reading and the elapsed time; it ends on “Your brand is ready to review”.",
            "technical": false
          },
          {
            "text": "<b>Brand Brain → Review:</b> one page, with breadcrumbs, grouping everything found — about your store, your customers, how you sound, words, your look, competitors — each with where it came from, plus Approve all and per-item Approve, Edit and Remove.",
            "full": "<b>Brand Brain → Review</b> (<code>/spotlight/brand-brain/review</code>, second sub-tab): six groups with their source (“From your About us page”), Approve all (backend <code>/research/review/approve-all</code>) and per-item Approve / Edit / Remove over the existing routes.",
            "technical": false
          }
        ],
        "built": "The research run and its review API, the live toast, the Review sub-tab, and the in-app docs section.",
        "why": "A new customer’s writers start with a blank, generic brand; asking them to fill it by hand is the first thing that makes a new account feel empty.",
        "value": "A newly connected store gets a researched brand profile as soon as its first sync finishes, ready for the owner to approve in one place instead of typing it in.",
        "shots": [
          {
            "route": "/spotlight/brand-brain/review",
            "caption": "What the research found about the brand: competitors and facts read from the store, each waiting for approval before anything uses it.",
            "src": "/ci/d1006/brand-brain-review.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/spotlight/brand-brain/competitors",
            "caption": "Competitors: who ranks beside the store on its own searches, with price band, shipping and returns read from their sites.",
            "src": "/ci/d1006/brand-brain-competitors.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "03",
        "title": "The writers speak each store’s own trade",
        "sub": "Backend SPEC-348 — <code>stores.vertical</code> (migration 0147); neutral versions of 11 prompts and of the blog and hero-image strings.",
        "subTechnical": true,
        "ask": "The writers must not assume every store sells clothing — found in the multi-tenant review, to be fixed as SaaS with your store untouched.",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>What was wrong:</b> the writers were built for a clothing store — the blog writer demanded outfit ideas and fabric detail, prompts called every store “a fashion retailer”, and the hero image was framed as a fashion magazine. A store selling anything else got clothing-shaped articles.",
            "full": "<b>What was wrong:</b> the writers were built for a clothing store — the blog writer demanded outfit ideas and fabric detail, prompts called every store “a fashion retailer”, and the hero image was framed as a fashion magazine. A store selling anything else got clothing-shaped articles.",
            "technical": false
          },
          {
            "text": "<b>Every store now has a store type.</b> Existing stores, yours included, are clothing stores and read exactly the same instructions as before, word for word; new stores start general and read neutral versions.",
            "full": "<b>Every store now has a store type</b> (<code>apparel</code> | <code>general</code>). Migration 0147 sets every existing store <code>apparel</code>; a new store defaults to <code>general</code>, and <code>load_prompt</code> reads <code>&lt;name&gt;.general.md</code> only then — the apparel files are the same bytes.",
            "technical": false
          },
          {
            "text": "<b>The neutral versions keep everything else:</b> the same structure, rules and guardrails — only the trade changes, from outfit ideas to concrete ideas or uses, from fabric and fit to materials, specs and how it is used.",
            "full": "<b>The neutral versions keep everything else:</b> the same structure, rules and guardrails — only the trade changes, from outfit ideas to concrete ideas or uses, from fabric and fit to materials, specs and how it is used.",
            "technical": false
          },
          {
            "text": "<b>Set by approving one fact:</b> the Brand Researcher proposes a “Store type”; approving “Clothing & fashion” keeps the clothing wording, anything else switches to the neutral one.",
            "full": "<b>Set by approving one fact:</b> the Brand Researcher proposes a “Store type”; approving “Clothing & fashion” keeps the clothing wording, anything else switches to the neutral one.",
            "technical": false
          }
        ],
        "built": "The store-type column, the vertical-aware prompt loader, eleven neutral prompts and the neutral blog and hero wording.",
        "why": "A platform for many shops cannot write every shop’s blog as if it were a boutique.",
        "value": "A store selling, say, home and kitchen goods gets articles about its own products — and your store’s writing does not change by a word.",
        "shots": [
          {
            "route": "/spotlight/brand-brain/facts",
            "caption": "The facts every writer reads: identity, voice, guardrails and positioning, each with its source and its approval.",
            "src": "/ci/d1006/brand-brain-facts.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "The employees are named for the job they do",
        "sub": "Backend SPEC-351 · frontend SPEC-343 — display names only; routes, keys and agent names for trace history unchanged.",
        "subTechnical": true,
        "ask": "“Rename all the FTEs to their generic name … a simple name that tells the exact purpose” — and “the Digital Employees accordion is by default open”.",
        "status": "Delivered",
        "effort": "2h",
        "inside": [
          {
            "text": "<b>The new names:</b> Spotlight → <b>Search Visibility</b>, Social Growth → <b>Social Media Manager</b>, Performance Ads → <b>Paid Ads Manager</b>, Finance Oversight → <b>Accounts Payable</b>, Report FTE → <b>Report Builder</b>, with matching monograms.",
            "full": "<b>The new names:</b> Spotlight → <b>Search Visibility</b>, Social Growth → <b>Social Media Manager</b>, Performance Ads → <b>Paid Ads Manager</b>, Finance Oversight → <b>Accounts Payable</b>, Report FTE → <b>Report Builder</b>, with matching monograms.",
            "technical": false
          },
          {
            "text": "<b>Everywhere a person reads them:</b> the hub cards, sidebar, page headers, breadcrumbs, chats, permissions, emails, the reporting connector’s name, the System and AI Value labels, Glisp’s map of the platform and the in-app docs.",
            "full": "<b>Everywhere a person reads them:</b> roster, monograms, sidebar, headers, breadcrumbs, cards, chats, permissions, emails, the MCP server name, the System and AI Value labels, Glisp’s platform map (<code>business_analyst.md</code>) and the in-app docs.",
            "technical": false
          },
          {
            "text": "<b>Nothing breaks:</b> addresses, saved links and the AI cost history stay as they were — the internal names the history is grouped by were deliberately kept, so no chart splits in two.",
            "full": "<b>Nothing breaks:</b> addresses, saved links and the AI cost history stay as they were — the internal names the history is grouped by were deliberately kept, so no chart splits in two.",
            "technical": false
          },
          {
            "text": "<b>Digital Employees is open in the sidebar on every page</b>; the chevron still folds it for the rest of the visit.",
            "full": "<b>Digital Employees is open in the sidebar on every page</b>; the chevron still folds it for the rest of the visit.",
            "technical": false
          }
        ],
        "built": "The renamed roster and every user-facing label, and the sidebar hub that starts open.",
        "why": "A new company reading “Spotlight” or “Performance Ads” cannot tell what the employee does; the name has to be the job.",
        "value": "Anyone opening the platform for the first time can see at a glance who does what — and the employees are one click away on every page.",
        "shots": [
          {
            "route": "/employees",
            "caption": "The employees, named for the job they do: Search Visibility, Social Media Manager, Paid Ads Manager and the rest.",
            "src": "/ci/d1006/employees-full.webp",
            "width": 1400,
            "height": 1397
          }
        ]
      },
      {
        "n": "05",
        "title": "Every email carries the new name and the app icon",
        "sub": "Backend SPEC-346 · SPEC-313 patch — the icon embedded inline, one product-name source in the backend.",
        "subTechnical": true,
        "ask": "Your screenshot of an invitation: lines ran edge to edge, there was no icon, and it still carried the old name — “add the proper icon we use … use the proper name we changed last night”.",
        "status": "Delivered",
        "effort": "2h",
        "inside": [
          {
            "text": "<b>The header:</b> the app icon beside “ftes for Commerce” and “Digital employees for commerce”. An organization with its own logo still replaces the whole header.",
            "full": "<b>The header:</b> the app icon beside “ftes for Commerce” and “Digital employees for commerce”. An organization with its own logo still replaces the whole header.",
            "technical": false
          },
          {
            "text": "<b>The icon travels inside the email</b>, not as a link, so mail clients do not block it as a remote image.",
            "full": "<b>The icon travels inside the email</b> as an inline <code>cid:platform-icon</code> part (<code>app/assets/brand/ftes-icon.png</code>, 96 px), the same technique as organization logos.",
            "technical": false
          },
          {
            "text": "<b>Every other mention follows:</b> footers, “Open in ftes” buttons, invitation and code subjects, the sign-off on supervision emails, and the QuickBooks refusal message.",
            "full": "<b>Every other mention follows:</b> footers, “Open in ftes” buttons, invitation and code subjects, the sign-off on supervision emails, and the QuickBooks refusal message.",
            "technical": false
          },
          {
            "text": "<b>The text sits inside the card again.</b> The invitation, code, already-registered and deletion emails had their lines pushed out to the edge by mail clients; each now sits in the card’s padding.",
            "full": "<b>The text sits inside the card again.</b> The four account emails passed bare paragraphs between table rows, which mail clients hoist out of the card; each now goes through <code>account_emails._body_row</code> with the card’s 32 px padding.",
            "technical": false
          }
        ],
        "built": "One name source for the backend, the new email header with the embedded icon, and the account-email layout fix.",
        "why": "An invitation is often the first thing a new member sees of the product; it should look finished and carry the right name.",
        "value": "Every email the platform sends now looks like one product, with the current name and icon, and reads properly in any mail client.",
        "shots": []
      },
      {
        "n": "06",
        "title": "Sign-in: Google back, Shopify hidden",
        "sub": "Frontend SPEC-340 and its patch — one switch per provider; nothing deleted.",
        "subTechnical": true,
        "ask": "Email only on the sign-in screens for now — hide Continue with Google and Shopify; then “unhide the Continue with Google button, Shopify remains hidden”.",
        "status": "Delivered · awaiting Google’s redirect address registration",
        "effort": "1h 30m",
        "inside": [
          {
            "text": "<b>Where it ended the day:</b> login and sign-up show Continue with Google, then the email form; Continue with Shopify is hidden. The invitation page follows.",
            "full": "<b>Where it ended the day:</b> login and sign-up show Continue with Google, then the email form; Continue with Shopify is hidden. The invitation page follows.",
            "technical": false
          },
          {
            "text": "<b>One switch per provider</b>, so either can be turned on or off on its own without touching the code.",
            "full": "<b>One switch per provider:</b> Google shows unless <code>NEXT_PUBLIC_GOOGLE_SIGN_IN=false</code>; Shopify only with <code>NEXT_PUBLIC_SHOPIFY_SIGN_IN=true</code>; <code>NEXT_PUBLIC_SOCIAL_SIGN_IN</code> retired.",
            "technical": false
          },
          {
            "text": "<b>Nothing was removed:</b> the Shopify button and its routes are intact for when the Shopify app is settled, and anyone who signed up with a provider can still set a password through “Forgot password”.",
            "full": "<b>Nothing was removed:</b> the Shopify button and its routes are intact for when the Shopify app is settled, and anyone who signed up with a provider can still set a password through “Forgot password”.",
            "technical": false
          }
        ],
        "built": "A per-provider switch on the login, sign-up and invitation screens.",
        "why": "A sign-in button that fails is worse than no button; each provider should appear only when it is ready.",
        "value": "New users see only the ways in that work, and turning one on later is a setting, not a release.",
        "shots": [
          {
            "route": "/login",
            "caption": "Sign-in: Continue with Google is back; the Shopify sign-in is hidden.",
            "src": "/ci/d1006/login.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "07",
        "title": "A company without a store resumes onboarding, never an error page",
        "sub": "Frontend SPEC-342 — redirect from the workspace read the app layout already makes; a calm “Connect your store first” for a stray refusal.",
        "subTechnical": true,
        "ask": "A new account that had not connected its store opened Integrations and got “Something went wrong”.",
        "status": "Delivered",
        "effort": "2h",
        "inside": [
          {
            "text": "<b>Back to the right step:</b> a company that has no store is taken to onboarding — the plan or the connect step — from any page, with no extra request.",
            "full": "<b>Back to the right step:</b> a company that has no store is taken to onboarding — the plan or the connect step — from any page, with no extra request.",
            "technical": false
          },
          {
            "text": "<b>Only the store decides.</b> A company whose store is still syncing, or whose billing is unsettled, stays in the app; every company with a store — yours included — is never redirected, and a failed read never locks anyone out.",
            "full": "<b>Only the store decides.</b> A company whose store is still syncing, or whose billing is unsettled, stays in the app; every company with a store — yours included — is never redirected, and a failed read never locks anyone out.",
            "technical": false
          },
          {
            "text": "<b>A calm card as the safety net:</b> if a page still meets “no store connected”, it says “Connect your store first” with a button, not a red error with a useless Try again.",
            "full": "<b>A calm card as the safety net:</b> a new error kind <code>store</code> in <code>lib/error-boundary.ts</code> turns <code>409 store_not_connected</code> into “Connect your store first” → <code>/onboarding</code>, drawn with card tokens and <code>role=\"status\"</code>.",
            "technical": false
          }
        ],
        "built": "The no-store gate in the app layout and the store-aware error state.",
        "why": "A new customer who stops halfway through set-up should be taken back to where they stopped, not shown an error that suggests the product is broken.",
        "value": "New accounts always find their way back to the next step of set-up instead of a dead end.",
        "shots": []
      },
      {
        "n": "08",
        "title": "The operator console’s Customers and Overview work again",
        "sub": "Backend SPEC-350 — migration 0148 restores <code>video_generations</code> where absent; the two-apps column moved to 0149. Production migrated to 0147 at your instruction.",
        "subTechnical": true,
        "ask": "The admin console’s Customers and Overview pages answered “Internal server error” on every load.",
        "status": "Delivered · awaiting the next backend deploy",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>The cause, found read-only:</b> running the deployed code once against production showed one table missing — the database recorded the step that creates it as done, yet the table was absent. A check of every table and column found it to be the only gap.",
            "full": "<b>The cause, found read-only:</b> the deployed code run once against production with a read-only connection gave <code>relation \"video_generations\" does not exist</code>; <code>0138</code> was recorded as applied yet the table was absent. A comparison of every model against the live schema found it the only gap (152 tables otherwise present, no column missing).",
            "technical": false
          },
          {
            "text": "<b>The repair only fills the gap:</b> it creates the table, with its indexes and its isolation rule, only where it is missing, and changes nothing anywhere it already exists.",
            "full": "<b>The repair only fills the gap:</b> it creates the table, with its indexes and its isolation rule, only where it is missing, and changes nothing anywhere it already exists.",
            "technical": false
          },
          {
            "text": "<b>Your database was brought up to date</b> at your instruction, after a local backend running the new code against it failed on the new store-type column — and checked read-only afterwards.",
            "full": "<b>Production migrated 0145 → 0147</b> at your instruction (0146 brand research runs, 0147 store type) after a local backend running the new code failed on <code>stores.vertical</code>; checked read-only afterwards: the new table with RLS on and no rows, every existing store <code>apparel</code>.",
            "technical": false
          },
          {
            "text": "<b>The repair itself waits for the next deploy</b> — it was not applied from a laptop.",
            "full": "<b>The repair itself waits for the next deploy</b> — the tool refused a production write; Railway applies 0148–0150 on the next backend deploy, or <code>uv run alembic upgrade head</code>.",
            "technical": false
          }
        ],
        "built": "A self-checking repair for the missing table, proven on a copy in production’s state, and the production database brought to the current schema.",
        "why": "The operator console is where you see your customers and revenue; two of its main pages being down hides the whole business.",
        "value": "Once deployed, Customers and Overview load again — and the repair cannot harm a database that never had the problem.",
        "shots": []
      }
    ],
    "tiers": [
      {
        "name": "A merchant clicking Install in Shopify",
        "change": "met a login screen, and only your group of stores could install → straight to Shopify’s approval, then sign-up with the store already approved",
        "why": "Your store stays on its custom app for every reconnect."
      },
      {
        "name": "A new store’s Brand Brain",
        "change": "the neutral starter only → researched from its own store, site and competitors, waiting for review",
        "why": "Nothing reaches a writer until it is approved."
      },
      {
        "name": "The employees’ names",
        "change": "Spotlight · Social Growth · Performance Ads · Finance Oversight · Report FTE → Search Visibility · Social Media Manager · Paid Ads Manager · Accounts Payable · Report Builder",
        "why": "Addresses and the AI cost history are unchanged."
      },
      {
        "name": "A company without a store",
        "change": "“Something went wrong” → back to the onboarding step it stopped at",
        "why": "Companies with a store are never redirected."
      }
    ],
    "next": [
      {
        "title": "Deploy the backend",
        "body": "The repair for the operator console and the two Shopify database changes run on the next backend deploy; until then Customers and Overview still fail there.",
        "technical": false
      },
      {
        "title": "Release the public app on Shopify",
        "body": "The app’s configuration, with its privacy webhooks and install address, is ready as one file to release with Shopify’s own tool — the step before submitting it for review.",
        "technical": false
      },
      {
        "title": "Register Google sign-in’s redirect address",
        "body": "Continue with Google is back on the sign-in screens, but it completes only once its redirect address is registered in Google Cloud.",
        "technical": false
      },
      {
        "title": "Decide the Social Media Manager role description",
        "body": "One role template still describes “Spotlight articles”; it was seeded into your database, so changing it is a data change on production and was left for your decision.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "Your store is untouched",
        "body": "It stays on its custom Shopify app, its writers read the same instructions word for word, its full Brand Brain is never researched automatically, and it is never sent to onboarding.",
        "technical": false
      },
      {
        "title": "Research proposes, you decide",
        "body": "Every fact, customer type, rule and competitor the Brand Researcher finds waits switched off or pending; a writer’s brand block was checked to be identical before and after a run.",
        "technical": false
      },
      {
        "title": "Two production changes, both at your instruction",
        "body": "The brand-research table and the store-type column were applied to your database from a laptop after the local backend failed on the missing column, then checked read-only. The console repair was not, and waits for the deploy.",
        "technical": true
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d1005",
    "kind": "daily",
    "period": "Monday, Oct 5, 2026",
    "sortDate": "2026-10-05",
    "hook": "Every integration connect bound to whoever started it, database isolation ready to switch on, a Dashboard that survives a failed alert, and the app renamed ftes for Commerce",
    "memo": "Today closed the gaps a multi-tenant review found. <b>Every integration connect now belongs to whoever started it</b> — Meta, Google and QuickBooks check the person, the company and the store before anything is attached, a QuickBooks company belongs to one organization, and a refusal says why in a sentence. The <b>database’s own isolation between companies is ready to switch on</b>: the two places it would have broken are fixed, a restricted account is one command away, and the backend will refuse to start if isolation is not really on — production stays as it is until you make the switch. The <b>Dashboard no longer goes down when one alert fails</b>, after your live store’s database ran short of memory on the dead-stock alert. And the app now presents itself as <b>ftes for Commerce</b>: the login page no longer greets the next visitor with the last organization’s name, the product name lives in one place, and each person can <b>choose what their sidebar shows</b>. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "18h",
    "views": "5 screens",
    "areas": 6,
    "days": [
      {
        "title": "Every connect belongs to whoever started it",
        "body": "Meta, Google and QuickBooks connects are checked against the person, company and store that began them, within 10 minutes — and a QuickBooks company now belongs to one organization.",
        "technical": false
      },
      {
        "title": "Database isolation, ready to switch on",
        "body": "The two code paths that would have broken are fixed, a restricted database account is one command, and a boot guard refuses to run without real isolation. Production is unchanged until your switch-over.",
        "technical": false
      },
      {
        "title": "The Dashboard survives a failed alert",
        "body": "When the database ran short of memory on the dead-stock alert, the whole Dashboard failed. Now that alert is simply not shown and the rest of the page is served.",
        "technical": false
      },
      {
        "title": "ftes for Commerce, and a sidebar you choose",
        "body": "The app carries its new name from one source, the login page forgets the last organization, and each person can switch sidebar pages and tabs off and on.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Every integration connect belongs to whoever started it",
        "sub": "Backend SPEC-344 · frontend SPEC-336 — one signed connect state for Meta Social, Meta Ads, Google Search Console and QuickBooks.",
        "subTechnical": true,
        "ask": "“Fix it, it’s a real issue … a very professional experience.” — after a multi-tenant review found that connects did not check who started them, and that one QuickBooks company could sit in two organizations.",
        "status": "Delivered",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "<b>The gap that was closed:</b> Meta Social and Google never checked who had started a connect, QuickBooks threw that information away, and Meta Ads links never expired. A code from another session — or a member who switched workspace halfway through — could attach another company’s Page, Search Console or books.",
            "full": "<b>The gap that was closed:</b> Meta Social and Google never checked their <code>state</code>, QuickBooks discarded the user it signed, and Meta Ads had no expiry. A code from another session — or a member who switched workspace halfway through — could attach another company’s Page, Search Console or books (SPEC-344 §Why).",
            "technical": false
          },
          {
            "text": "<b>Now every connect carries a signed note</b> of the person, the company and the store that started it, valid for <b>10 minutes</b>, checked <b>before</b> the provider is ever called — so a refused link spends nothing and changes nothing.",
            "full": "<b>Now every connect carries a signed note</b> of the person, the company and the store that started it, valid for <b>10 minutes</b>, checked <b>before</b> the provider is ever called (<code>services/integrations/connect_state.py</code>) — so a refused link spends nothing and changes nothing.",
            "technical": false
          },
          {
            "text": "<b>Refusals say why, in a sentence:</b> the link expired, the link isn’t valid, or the connection was started from a different account or workspace — shown on the Meta and Google banners instead of “the connection failed”.",
            "full": "<b>Refusals say why, in a sentence:</b> <code>connect_link_invalid</code>, <code>connect_link_expired</code> or <code>connect_started_elsewhere</code>, carried back as a code and turned into a sentence by <code>lib/connect-reasons.ts</code> on the Meta and Google banners (frontend SPEC-336). Only a known code is ever rendered.",
            "technical": false
          },
          {
            "text": "<b>One QuickBooks company, one organization.</b> A company another organization already holds is refused with a clear message, and a disconnect only cuts access at Intuit when no other store still uses that company — so one customer can never silently break another’s connection.",
            "full": "<b>One QuickBooks company, one organization.</b> A company another organization already holds is refused (409 <code>quickbooks_company_connected_elsewhere</code>), and a disconnect revokes at Intuit only when no other store still holds the company (<code>realm_connection_count</code> in <code>platform_scope()</code>).",
            "technical": false
          }
        ],
        "built": "One signed connect state for all four non-Shopify connects, the QuickBooks ownership rule, and reason-carrying banners on the Integrations pages.",
        "why": "In a platform many companies share, a connection that can land in the wrong company is the kind of mistake that ends trust in one go.",
        "value": "Every Page, Search Console account and set of books lands only in the company that asked for it — and when something is refused, the person is told exactly why.",
        "shots": [
          {
            "route": "/integrations · Connected",
            "caption": "Every connection on Integrations, each tied to whoever started it.",
            "src": "/ci/d1005/integrations.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "The database’s own tenant isolation, ready to switch on",
        "sub": "Backend SPEC-345 — <code>platform_scope()</code>, the <code>provision_app_role</code> script and the <code>REQUIRE_TENANT_ISOLATION</code> boot guard; verified on a throwaway PostgreSQL 18.",
        "subTechnical": true,
        "ask": "“Fix this up right now.” — the database’s row-level-security rules existed, but production connects as the tables’ owner, which Postgres exempts from them.",
        "status": "Delivered · awaiting your switch-over on Railway",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>Why it mattered:</b> companies were kept apart only by the filter in each query. The database had its own rules ready, but they do not apply to the account production signs in with — so one forgotten filter would have leaked.",
            "full": "<b>Why it mattered:</b> companies were kept apart only by the <code>WHERE store_id = …</code> in each query. SPEC-340/341 policies existed on every tenant table, but Postgres never applies them to a superuser or the tables’ owner, which is how production connects.",
            "technical": false
          },
          {
            "text": "<b>Two places that would have broken were fixed first:</b> connecting a Shopify shop another company owns now says “already connected elsewhere” instead of an error, and Talk to Glisp inside a chat project no longer comes back “not found”.",
            "full": "<b>Two places that would have broken were fixed first:</b> the Shopify “owned elsewhere” lookup now runs in <code>platform_scope()</code> (a 500 became the 409 <code>store_owned_elsewhere</code>), and the live call’s project check runs in the token’s organization scope (it was a 404).",
            "technical": false
          },
          {
            "text": "<b>A restricted database account, created by one command</b> that never reads the app’s own settings, grants it everything including future tables, and proves it by signing in as it.",
            "full": "<b>A restricted database account, created by one command:</b> <code>uv run python -m app.scripts.provision_app_role --owner-url …</code> creates <code>fte_app</code> (no superuser, no bypass), never reads <code>DATABASE_URL</code>, grants every table including future ones, and verifies isolation is enforced by logging in as it.",
            "technical": false
          },
          {
            "text": "<b>A safety switch:</b> once turned on, the backend refuses to start unless the database is really enforcing isolation — so a wrong setting can never quietly put the unrestricted account back.",
            "full": "<b>A safety switch:</b> <code>REQUIRE_TENANT_ISOLATION=true</code> refuses to boot unless <code>rls_status</code> is <code>enforced</code>. Proven by a real boot as <code>fte_app</code> (enforced, 200) and as the owner (refused); 25 RLS/restore tests green as the restricted role.",
            "technical": false
          }
        ],
        "built": "The two code fixes, the provisioning script, the boot guard, and a step-by-step switch-over for production.",
        "why": "Isolation that depends on every query remembering a filter is one mistake away from a leak; isolation the database enforces is not.",
        "value": "When you switch it on, the database itself keeps each company’s data apart — a second lock behind the one the code already provides.",
        "shots": []
      },
      {
        "n": "03",
        "title": "One failed alert no longer takes the Dashboard down",
        "sub": "Backend SPEC-039 patch — each alert signal guarded on its own inside the Dashboard’s single gather.",
        "subTechnical": true,
        "ask": "The Dashboard crashed on your live store — you sent the screenshot and the log.",
        "status": "Delivered",
        "effort": "2h",
        "inside": [
          {
            "text": "<b>The cause:</b> the production database ran out of shared memory while computing the dead-stock alert, and because all the alerts are fetched together, that one failure turned the whole Dashboard into an error.",
            "full": "<b>The cause:</b> <code>dead_stock_totals</code> failed with <code>DiskFullError: could not resize shared memory segment</code> (Postgres ran out of shared memory for a parallel query), and since the alert signals run inside the Dashboard’s one <code>asyncio.gather</code>, <code>GET /dashboard</code> returned 500.",
            "technical": false
          },
          {
            "text": "<b>Now each alert stands alone:</b> if one fails, it is logged and simply not shown; the figures, the chart and the tables are served as normal.",
            "full": "<b>Now each alert stands alone:</b> <code>_alert_signals</code> guards each signal — a database error is logged, the session rolled back, and that signal returned as <code>None</code>, which the page already treats as “no alert”. Covered by <code>tests/test_dashboard_signal_failure.py</code>.",
            "technical": false
          },
          {
            "text": "<b>The database’s memory limit itself</b> is an infrastructure setting, raised with you separately.",
            "full": "<b>The database’s memory limit itself</b> is an infrastructure setting, raised with you separately.",
            "technical": false
          }
        ],
        "built": "A guard around each Dashboard alert so a database error costs one alert, never the page.",
        "why": "The Dashboard is the first screen you open; a single side calculation should never be able to blank it.",
        "value": "Your Dashboard stays up even when the database has a bad moment — you lose one alert at worst, not the whole view.",
        "shots": [
          {
            "route": "/dashboard",
            "caption": "The Dashboard, whole: money at stake, the day's figures, revenue by hour and net sales, each card loading on its own.",
            "src": "/ci/d1005/dashboard.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "The login screen stops remembering the last organization",
        "sub": "Frontend SPEC-339 — the year-long <code>fte_org</code> cookie retired; one sign-in round trip fewer.",
        "subTechnical": true,
        "ask": "The bare login page greeted visitors with “Welcome to” the last organization’s name — is that good? Remove it if not, and finish the naming.",
        "status": "Delivered",
        "effort": "1h 30m",
        "inside": [
          {
            "text": "<b>What was wrong:</b> signing in remembered your organization for a year, and the plain login page then greeted <i>every</i> later visitor on that computer with its name, logo and picture — on a shared machine, a leak of who uses the product.",
            "full": "<b>What was wrong:</b> signing in stored the slug in a year-long <code>fte_org</code> cookie, and the bare <code>/login</code> then drew that organization’s screen for every later visitor.",
            "technical": false
          },
          {
            "text": "<b>Now the plain login page is always the platform’s own.</b> Your team’s own login link still shows your branded screen, for that visit only — the name is in the address, so the visitor chose it.",
            "full": "<b>Now the plain login page is always the platform’s own.</b> <code>/login?org=&lt;slug&gt;</code> still draws the organization’s screen, for that visit only, via a request header set by <code>proxy.ts</code>; old cookies are expired on the next visit.",
            "technical": false
          },
          {
            "text": "<b>Sign-in got one step quicker</b>, and the leftover “AI Business Analyst” wording on login, sign-up, pricing and the share card now reads from the new product name.",
            "full": "<b>Sign-in lost an <code>/auth/me</code> round trip</b>, and the leftover “AI Business Analyst” / “Ecommerce ·” text on login, sign-up, pricing, share-card descriptions and the docs overview now reads from <code>PRODUCT</code>.",
            "technical": false
          }
        ],
        "built": "A login page that forgets, a branded link that still works, and the last of the old wording on the public screens.",
        "why": "A multi-company product must never show one company’s name to the next person at the same computer.",
        "value": "Your login page belongs to the platform, your team link still carries your brand, and nobody sees who signed in before them.",
        "shots": [
          {
            "route": "/login",
            "caption": "The login screen: no organization remembered from a previous visit.",
            "src": "/ci/d1005/login.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "The app is now ftes for Commerce",
        "sub": "Frontend SPEC-337 — one source for the name (<code>lib/product.ts</code>), guarded by <code>tests/brand-name.test.ts</code>.",
        "subTechnical": true,
        "ask": "Rename the app from “Ecommerce FTE” to ftes for Commerce — company ftes.ai, short name ftes, “Digital employees for commerce”, ftes.ai/commerce; employee names unchanged.",
        "status": "Delivered · awaiting new logo artwork",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>The name had no single home</b> — it was typed by hand into 24 files. It now lives in one place, so the next rename is one edit.",
            "full": "<b>The name had no single home</b> — it was typed into 24 files. It now lives once in <code>lib/product.ts</code> (<code>PRODUCT</code>, <code>displayBrandName</code>).",
            "technical": false
          },
          {
            "text": "<b>Your own brand still wins.</b> An organization’s own name, logo and colour show wherever they did before; only the platform fallback changed — to “ftes”.",
            "full": "<b>Your own brand still wins.</b> An organization’s own name, logo and colour show wherever they did before; only the platform fallback changed — to “ftes”.",
            "technical": false
          },
          {
            "text": "<b>Where the new name shows:</b> browser tab titles (“Dashboard · ftes”), the share card, pricing links to ftes.ai/commerce, Settings → Branding, the in-app docs, and the line under the sidebar logo — now “Digital employees for commerce”.",
            "full": "<b>Where the new name shows:</b> browser tab titles (“Dashboard · ftes”), the share card, pricing links to ftes.ai/commerce, Settings → Branding, the in-app docs, and the line under the sidebar logo — now “Digital employees for commerce”.",
            "technical": false
          },
          {
            "text": "<b>The old name cannot creep back:</b> a test fails the build if it reappears. Saved browser preferences were deliberately left under their old keys so nobody’s choices reset.",
            "full": "<b>The old name cannot creep back:</b> <code>tests/brand-name.test.ts</code> fails the build outside an allowlist; three <code>localStorage</code> key prefixes kept so no saved choice resets. Sample-store stand-ins now read “Example Store”.",
            "technical": false
          },
          {
            "text": "<b>Not yet changed:</b> the drawn “E + commerce” logo and the logo images (new artwork needed), and the backend, marketing site and admin panel.",
            "full": "<b>Not yet changed:</b> the drawn “E + commerce” logo and the logo images (new artwork needed), and the backend, marketing site and admin panel.",
            "technical": false
          }
        ],
        "built": "The single product-name source, every customer-visible use routed through it, and a build guard against the old name.",
        "why": "A name typed in two dozen places is a name that drifts; one source means the brand reads the same everywhere.",
        "value": "The app now presents itself as ftes for Commerce, consistently — and any future change of name is a single edit.",
        "shots": [
          {
            "route": "/settings/branding · Branding",
            "caption": "ftes for Commerce: the platform's own mark wherever a store has not uploaded its logo.",
            "src": "/ci/d1005/settings-branding.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "06",
        "title": "Choose what your sidebar shows",
        "sub": "Frontend SPEC-338 — Settings → Account → Sidebar; stored per account in a cookie the app reads on the server; no backend change.",
        "subTechnical": true,
        "ask": "A Settings tab to switch sidebar pages, and the sub-screens inside them, off and on — all on by default, and an off item stays out of the sidebar until switched back on.",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>A switch for everything:</b> every sidebar page, the five employees under Digital Employees, and the tabs of 17 pages behind an “N tabs” disclosure, with “Show everything” to reset.",
            "full": "<b>A switch for everything:</b> every sidebar page, the five employees under Digital Employees, and the tabs of 17 pages behind an “N tabs” disclosure, with “Show everything” to reset.",
            "technical": false
          },
          {
            "text": "<b>Nothing can lock you out:</b> Settings and every page’s first tab are always on. A hidden page or tab still opens from a link, and its tab is drawn while you are on it.",
            "full": "<b>Nothing can lock you out:</b> Settings and every page’s first tab are always on. A hidden page or tab still opens from a link, and its tab is drawn while you are on it.",
            "technical": false
          },
          {
            "text": "<b>It is yours, not the company’s:</b> the choice is kept per person, so two people sharing a browser keep separate sidebars — and it is a display choice only, never a permission.",
            "full": "<b>It is yours, not the company’s:</b> stored in <code>nav_hidden_&lt;hash&gt;</code>, keyed by account; role and workspace rules on the backend are untouched.",
            "technical": false
          },
          {
            "text": "<b>Right on the first paint:</b> the app reads your choice before drawing the page, and a switch repaints the sidebar instantly without a request.",
            "full": "<b>Right on the first paint:</b> the app reads your choice before drawing the page, and a switch repaints the sidebar instantly without a request.",
            "technical": false
          }
        ],
        "built": "The Sidebar settings page, the filter behind the sidebar and seventeen tab bars, and the Settings doc section.",
        "why": "Most people use a handful of pages; a sidebar with every destination makes the ones they use harder to find.",
        "value": "Each person sees the sidebar they actually work from, without losing access to anything.",
        "shots": [
          {
            "route": "/settings/sidebar · Account",
            "caption": "Sidebar navigation: switch off the pages and tabs you don't use. Only your own sidebar changes.",
            "src": "/ci/d1005/settings-sidebar.webp",
            "width": 1400,
            "height": 972
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "An integration connect",
        "change": "any returning code could attach a Page, Search Console or books → only the person, company and store that started it, within 10 minutes",
        "why": "Checked before Meta, Google or Intuit is ever called."
      },
      {
        "name": "A QuickBooks company",
        "change": "two organizations could hold it, and one disconnect broke the other → one company, one organization",
        "why": "Access at Intuit is cut only when no other store still holds it."
      },
      {
        "name": "The plain login page",
        "change": "greeted every visitor with the last organization’s name → always the platform’s own screen",
        "why": "Your team’s own link still shows your brand, for that visit."
      },
      {
        "name": "A failed Dashboard alert",
        "change": "the whole page returned an error → that alert is hidden, the rest is served",
        "why": "The database ran out of shared memory on the dead-stock alert."
      }
    ],
    "next": [
      {
        "title": "Switch on database isolation on Railway",
        "body": "Snapshot the database, run the provisioning command with the owner address, point the backend at the restricted account and turn the safety switch on. The boot log then reads that isolation is enforced; the rollback is one setting.",
        "technical": false
      },
      {
        "title": "Raise the database’s shared-memory limit",
        "body": "The Dashboard now survives the shortage, but the limit that caused it is an infrastructure setting on your side.",
        "technical": false
      },
      {
        "title": "New logo artwork for ftes",
        "body": "The drawn “E + commerce” mark and the logo images still read as the old name; changing the word alone would read “E ftes”, so it needs new artwork.",
        "technical": false
      },
      {
        "title": "Rename the backend, marketing site and admin panel",
        "body": "Today’s rename covered the app frontend only; emails, the public site and the operator console still carry the old name.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "Production isolation is unchanged today",
        "body": "Everything for the database’s own isolation was proven on a throwaway database. Until the switch-over, companies are still kept apart by the filter in each query — as they were yesterday.",
        "technical": false
      },
      {
        "title": "Some signed-in screens were not checked by eye",
        "body": "The sidebar, Settings → Branding, the docs and the new Sidebar settings were verified by tests and a production build, not clicked through, as there was no local session. Each spec carries a short manual checklist.",
        "technical": false
      },
      {
        "title": "One unrelated backend test is failing",
        "body": "An AI-spend test pins its data to September, so it has failed since Oct 1 regardless of today’s work. Every other backend test passed.",
        "technical": true
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d1002",
    "kind": "daily",
    "period": "Friday, Oct 2, 2026",
    "sortDate": "2026-10-02",
    "hook": "Report FTE now emails the people you choose on the schedule you set, tells you through a new notification bell, and no longer invents anything in its summary",
    "memo": "Today made the <b>Report FTE</b>’s two buttons do what they say. A live check had found that <i>Approve & send</i> emailed nobody and that scheduling a report weekly saved a daily schedule. Now <b>Send</b> opens a dialog with your address filled in and every address from Settings — members, shop and location managers, warehouse, support and returns — one tick away, and <b>Schedule</b> saves exactly the cadence, day, time and people you chose, rebuilds the report with the latest data each time, and either sends it or waits for your approval. Every scheduled run leaves a note in a new <b>notification bell</b>, and the reports you opt in appear on Daily Reports. The narrator was caught closing an executive report with a product launch that was in no figure; it now receives only your brand’s limits and must state figures exactly as given — four live runs confirm it. And the exports no longer carry our internal audit trail, while the Composer keeps its side panels whole and scrolls only the report. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "14h",
    "views": "5 screens",
    "areas": 5,
    "days": [
      {
        "title": "Send reaches real people",
        "body": "A dialog with your address filled in and every address from Settings one tick away — before today, <i>Approve & send</i> emailed nobody.",
        "technical": false
      },
      {
        "title": "A schedule that does what it says",
        "body": "Daily, weekly or monthly, the day, the time, the people, and whether to send automatically or ask you first — rebuilt with the latest data every time.",
        "technical": false
      },
      {
        "title": "A notification bell",
        "body": "Every scheduled report leaves a note: sent to N people, ready for your approval, or could not be built. Opted-in reports appear on Daily Reports.",
        "technical": false
      },
      {
        "title": "A summary that only says what the figures say",
        "body": "The narrator no longer copies brand example copy into an executive report; four live runs close on revenue, orders, customers, top product and the stock alert — nothing else.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Approve & send — to the people you choose",
        "sub": "Backend SPEC-343 · frontend SPEC-335 — a recipients directory read in one parallel step.",
        "subTechnical": true,
        "ask": "“A modal with the owner email prefilled, editable, a dropdown of every email from Settings including managers …”",
        "status": "Delivered",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "<b>What was wrong:</b> the plan’s recipients were role names with no addresses, so <i>Approve & send</i> recorded a delivery to nobody.",
            "full": "<b>What was wrong:</b> the plan’s recipients were role placeholders (<code>Owner</code>, <code>Shop managers</code>) with empty emails, so <code>send</code> recorded an in-app delivery to <code>[]</code>.",
            "technical": false
          },
          {
            "text": "<b>Send now opens a dialog</b> with your address filled in and every address the store already keeps one tick away, labelled: the owner, every member by role, shop managers, each location’s manager, and the warehouse, support and returns addresses — duplicates removed. Any other address can be typed in.",
            "full": "<b>Send now opens a dialog</b> fed by <code>GET /report-fte/recipients</code>: the organization’s owner, every other active member (labelled by role), <code>stores.manager_emails</code>, each location’s manager, and the warehouse / support / returns role addresses — deduplicated, three reads in one gather. Any other address can be typed in.",
            "technical": false
          },
          {
            "text": "<b>Addresses are checked:</b> a malformed address is named, and sending to nobody is refused with “Choose at least one recipient”.",
            "full": "<b>Addresses are checked:</b> <code>to</code> takes 1–20 addresses; a malformed one is a 422 that names it, an empty list is a 422 (“Choose at least one recipient”). Omitting <code>to</code> keeps the old behaviour for existing callers.",
            "technical": false
          }
        ],
        "built": "The recipients directory, validated sending to chosen addresses, and the Send dialog over them.",
        "why": "A button that says it sent a report and emailed nobody is worse than no button — nobody knows the report never arrived.",
        "value": "A finished report reaches exactly the people you tick, from the addresses you have already set up.",
        "shots": [
          {
            "route": "/report-fte/delivered · Scheduled",
            "caption": "Delivered & scheduled: who each report goes to, in which formats, and whether it waits for your approval.",
            "src": "/ci/d1002/report-fte-delivered.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "Approve & schedule — a schedule that does what it says",
        "sub": "Backend SPEC-343 · frontend SPEC-335 — migration 0145, applied to production, with row-level security.",
        "subTechnical": true,
        "ask": "“If I set weekly, every week at that time it regenerates with the latest data and sends …”",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>What was wrong:</b> “schedule weekly” saved the template’s own cadence — the Executive Report’s is daily — with the same empty recipients, waiting for an approval nobody was told about.",
            "full": "<b>What was wrong:</b> “schedule weekly” saved the template’s own cadence — the Executive Report’s is daily — with the same empty recipients, waiting for an approval nobody was told about.",
            "technical": false
          },
          {
            "text": "<b>Schedule now opens a dialog:</b> daily, weekly or monthly, the day, the time, the recipients, <i>Send automatically</i> or <i>Ask me first</i>, and whether to show it on Daily Reports. The next run is worked out in your store’s time zone, and the button shows what was saved — for example “Mon 07:00”.",
            "full": "<b>Schedule now opens a dialog</b> (<code>POST /report-fte/runs/{id}/schedule</code>): <code>cadence</code>, <code>weekday</code>, <code>day_of_month</code> (1–28), <code>hour</code>, <code>minute</code>, <code>recipients</code>, <code>mode</code> (<code>auto</code> → <code>sends_alone</code>, <code>ask</code> → <code>approve_each</code>) and <code>show_on_reports</code>. <code>next_run_at</code> is computed in the store’s timezone and the button shows the saved label (“Mon 07:00”, “Daily 06:00”, “1st monthly 07:00”).",
            "technical": false
          },
          {
            "text": "<b>Each run is rebuilt with the latest data</b>, linked to its schedule, and either sent to its people or held for your approval. Scheduling the same report again updates its schedule rather than adding a second.",
            "full": "<b>Each run is rebuilt with the latest data</b>, records <code>report_runs.schedule_id</code>, and is sent to the schedule’s recipients (auto) or held for approval (ask). Schedules stay one per template, so scheduling again updates it; legacy recipient shapes are read by <code>recipient_emails</code>.",
            "technical": false
          }
        ],
        "built": "Schedules saved with the exact cadence, day, time, recipients and send mode, and scheduled runs that regenerate and then send or wait.",
        "why": "A schedule that silently saves something other than what you chose is one you stop relying on after the first missed report.",
        "value": "Set it once — weekly, Monday at seven, to your managers — and the report arrives fresh every time, or waits for your yes if you asked it to.",
        "shots": [
          {
            "route": "/report-fte/history",
            "caption": "History: every scheduled run, ready to sign, with its figures grounded and its delivery recorded.",
            "src": "/ci/d1002/report-fte-history.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "03",
        "title": "A notification bell, and scheduled reports on Daily Reports",
        "sub": "Backend SPEC-343 · frontend SPEC-335 — a store-level notifications inbox.",
        "subTechnical": true,
        "ask": "“Also on our Daily Reports page … automatic sends a notification, ask shows a notification to approve.”",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>Every scheduled run tells you what happened:</b> “sent to N people”, or that it was not emailed and why; “ready — approve to send”, linking straight to that report; or that it could not be built.",
            "full": "<b>Every scheduled run tells you what happened:</b> auto → “[title] sent to N people” (or “… was not emailed: [reason]”); ask → “[title] is ready — approve to send”, linking to the Composer for that run; a failed build → “[title] could not be built”.",
            "technical": false
          },
          {
            "text": "<b>A bell in the sidebar and the phone header</b> holds those notes, with read and read-all.",
            "full": "<b>A bell in the sidebar and the phone header</b> over <code>GET /notifications</code>, read and read-all.",
            "technical": false
          },
          {
            "text": "<b>Daily Reports lists the scheduled reports you opted in</b>, under Daily, Weekly and Monthly.",
            "full": "<b>Daily Reports lists the scheduled reports you opted in</b>, under Daily, Weekly and Monthly.",
            "technical": false
          }
        ],
        "built": "The notifications inbox and its three kinds of note, the bell in both layouts, and the scheduled-reports list on Daily Reports.",
        "why": "An automatic send nobody hears about, or an approval nobody is asked for, is how a report quietly stops reaching anyone.",
        "value": "You know every time a scheduled report goes out, waits for you or fails — and the ones you want are on the Daily Reports page beside the rest.",
        "shots": [
          {
            "route": "/reports",
            "caption": "Daily Reports, with the scheduled report's run alongside the day's figures.",
            "src": "/ci/d1002/reports.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "A summary that says only what the figures say",
        "sub": "Backend SPEC-283 · SPEC-289 patches — the narrator’s brand input and prompt.",
        "subTechnical": true,
        "ask": "“QUICKLY FIX IT UP.”",
        "status": "Delivered",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>What happened:</b> a live Executive Report closed by announcing a product launch that appears in no figure.",
            "full": "<b>What happened:</b> a live Executive Report closed with a product launch that is in no figure.",
            "technical": false
          },
          {
            "text": "<b>The cause:</b> the narrator was handed the brand’s rules for customer copy, and copied their quoted example — a “new in … ships today” line — into an executive report.",
            "full": "<b>The cause:</b> <code>rulebook.voice_notes</code> passed the Brand Brain’s customer-copy rules, whose quoted example (“New in: the … dress … ships today from …”) the narrator copied into an executive report.",
            "technical": false
          },
          {
            "text": "<b>The fix:</b> it now receives only the brand’s limits — what never to say and the banned words, with examples stripped — and must give figures in digits exactly as supplied, with no greetings, no praise and nothing that is not in the report’s sections.",
            "full": "<b>The fix:</b> <code>voice_notes</code> now passes only the brand’s limits (its “never” line, examples stripped, and banned words); the narrator prompt requires figures in digits exactly as given and forbids greetings, praise and anything not in the sections.",
            "technical": false
          },
          {
            "text": "<b>Verified on four live runs:</b> the closing now states revenue, orders, customers, the top product and the stock alert — nothing else.",
            "full": "<b>Verified on four live runs:</b> the closing now states revenue, orders, customers, the top product and the stock alert — nothing else.",
            "technical": false
          }
        ],
        "built": "A narrower brand input for the narrator and a stricter narrator prompt, checked on four live runs.",
        "why": "An executive report is read as fact; one invented sentence is enough to make every figure beside it doubtful.",
        "value": "The summary you forward to your team now says only what the numbers above it say.",
        "shots": [
          {
            "route": "/report-fte · Desk",
            "caption": "The Desk: ask for a report in your own words, or start from one of fourteen templates.",
            "src": "/ci/d1002/report-fte-desk.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "Clean exports and a Composer that fits the screen",
        "sub": "Backend SPEC-283 · frontend SPEC-286 patches — PDF, Excel and the Composer layout.",
        "subTechnical": true,
        "ask": "“Why these two sections are cut off … only middle part scroll, not the right/left side.”",
        "status": "Delivered",
        "effort": "2h",
        "inside": [
          {
            "text": "<b>Exports carry the report, not our audit trail:</b> the PDF’s “Every figure’s source” page and the Excel “Trace” sheet — internal tool names, arguments, timings and the AI model — are removed. The trail stays in the Composer’s Tool calls panel.",
            "full": "<b>Exports carry the report, not our audit trail:</b> the PDF’s “Every figure’s source” page and the Excel “Trace” sheet (internal tool names, arguments, timings, the AI model) are removed; the trail stays in the Composer’s Tool calls panel.",
            "technical": false
          },
          {
            "text": "<b>The summary spans the full report width</b> instead of half of it.",
            "full": "<b>The summary spans the full report width</b> instead of half of it.",
            "technical": false
          },
          {
            "text": "<b>The side panels are whole:</b> the Deliver and Ask-for-a-change cards no longer clip their own bottoms, and on wide screens the three columns are one screen-high workspace where only the report scrolls.",
            "full": "<b>The side panels are whole:</b> the Deliver and Ask-for-a-change cards clipped their bottoms (shrinking flex children); on wide screens the three columns are now one viewport-high workspace where only the report scrolls.",
            "technical": false
          }
        ],
        "built": "Trace-free PDF and Excel exports, a full-width summary, and a Composer layout where the side panels stay put and only the report moves.",
        "why": "A report sent to a manager should not include a page of machinery, and a working screen whose controls are cut off has to be fought with.",
        "value": "What you send looks like a report, and the Composer’s controls stay in view while you read.",
        "shots": [
          {
            "route": "/report-fte/composer",
            "caption": "The Composer, sized to the screen.",
            "src": "/ci/d1002/report-fte-composer.webp",
            "width": 1400,
            "height": 972
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "Approve & send",
        "change": "recorded a delivery to nobody → emails the addresses you tick, each one checked",
        "why": "The plan’s recipients had been role names with no addresses."
      },
      {
        "name": "Approve & schedule weekly",
        "change": "saved a daily schedule with no recipients → saves exactly the cadence, day, time and people chosen",
        "why": "The template’s own cadence had overridden your choice."
      },
      {
        "name": "The Executive Report’s closing",
        "change": "an invented product launch → revenue, orders, customers, top product and the stock alert",
        "why": "Verified on four live runs."
      },
      {
        "name": "The PDF and Excel exports",
        "change": "an internal audit-trail page and sheet → the report alone",
        "why": "The trail stays in the Composer’s Tool calls panel."
      }
    ],
    "next": [],
    "cautions": [
      {
        "title": "Checked on live runs, not only in tests",
        "body": "The narrator fix was confirmed on four live Executive Report runs, and the new table behind schedules and notifications is applied to production.",
        "technical": false
      },
      {
        "title": "Older ways of sending keep working",
        "body": "A send or a schedule that names no people or no cadence behaves as it did before, so nothing already set up breaks.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "w1002",
    "kind": "weekly",
    "period": "Sep 26 – Oct 2, 2026",
    "sortDate": "2026-10-02",
    "hook": "The week your store moved onto the new platform — and any merchant can sign up, pay and be walled off from every other",
    "memo": "The week Ecommerce FTE became a platform other companies can join. It began on Saturday with the foundations — organizations, sign-up and plans, connect-by-link, a permission behind every store endpoint and each organization’s own branding. On Monday <b>your store moved onto the new database</b> as organization #1 — 9,114,349 rows in 126 tables, every timestamp exact, the old database only ever read — and the customer’s journey was built on screen, from sign-up through onboarding to <b>Stripe checkout</b>. Tuesday gave you <b>a place to run the business</b>: an Ecommerce section in the admin panel over real organizations, subscriptions and AI spend, with packages as database rows you edit; Settings was redesigned and one tab style now runs across the app. Wednesday rebuilt Integrations to tell the truth, made the <b>Morning Brief open in 0.19–0.38 s</b> instead of 2.86 s, and enforced each package’s video and image limits. On Thursday isolation rules on 140 tables were built and proven under load, Finance Oversight learned to <b>prove what it saves</b>, and Performance Ads began reading and auditing your real Meta account, read-only. Friday made the Report FTE’s <b>Send and Schedule do what they say</b>, with a notification bell, and stopped its summary inventing anything. Each day below carries what you asked for, what was built, why it matters and the value it delivers; the daily reports carry the detail.",
    "effort": "141h 30m",
    "views": "9 screens",
    "areas": 6,
    "days": [
      {
        "title": "Sat Sep 26",
        "body": "Ecommerce FTE started becoming <b>a multi-tenant SaaS</b> on the backend — sign-up, plans by revenue, Shopify connected by link, roles and branding — with <b>three leaks between organizations closed</b> and the live database untouched; a clearer marketing site.",
        "technical": false
      },
      {
        "title": "Mon Sep 28",
        "body": "<b>Your store moved</b> onto the new platform database — 9,114,349 rows, every timestamp exact; sign-up to dashboard built on screen; a pricing page and <b>Stripe checkout</b>; team, roles and branding in Settings; every new store starts neutral.",
        "technical": false
      },
      {
        "title": "Tue Sep 29",
        "body": "An <b>Ecommerce section in the admin panel</b> on real data, with packages as rows you edit — the $500 package’s AI allowance now $200, up from $50; <b>Settings redesigned</b>; one tab style across the app; the last of six tenancy fixes.",
        "technical": false
      },
      {
        "title": "Wed Sep 30",
        "body": "<b>Integrations that tell the truth</b>, testing a key before saving it; the <b>Morning Brief from 2.86 s to 0.19–0.38 s</b>; video and image limits counted and enforced; the operator console on charged revenue and a seven-step sign-up journey.",
        "technical": false
      },
      {
        "title": "Thu Oct 1",
        "body": "Finance Oversight’s <b>value ledger</b> and full multi-company support; <b>isolation rules on 140 tables</b>, a full data download and a safe deletion — 0 foreign rows under load; <b>your real Meta ads</b> read and audited; clicks matched to orders by channel.",
        "technical": false
      },
      {
        "title": "Fri Oct 2",
        "body": "The Report FTE’s <b>Send reaches the people you tick</b> and its <b>schedule saves what you chose</b>; a notification bell for every scheduled run; a summary that says only what the figures say; clean exports.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Sat Sep 26 — Ecommerce FTE started becoming a SaaS",
        "sub": "Saturday, Sep 26, 2026 — 8 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today Ecommerce FTE started becoming <b>a product any Shopify merchant can sign up for</b>. The plan was set down — thirteen decisions and twelve slices — and eleven backend slices were built: organizations and memberships, sign-up by email, Google or Shopify, plans by annual revenue, connecting Shopify by link with a first 30-day sync that runs itself, a permission behind every one of the 441 store endpoints with six system roles plus custom ones, each organization’s own logo and login screen, and an AI allowance per plan. Along the way <b>three leaks between organizations were closed</b> — the last AI key saved by anyone was used by everyone, integrations without their own card borrowed the first client’s accounts, and AI spend was charged to the first store — and the test suite can no longer reach the live database. Your store becomes organization #1 on a new database; the live database was not touched. The marketing site gained a two-destination navbar and a Social Growth section that sells the value.",
        "status": "Delivered · migrations written, not yet run",
        "effort": "30h 30m",
        "inside": [
          {
            "text": "<b>Organizations, memberships and per-organization state</b>.",
            "full": "<b>Organizations, memberships and per-organization state</b>. Backend SPEC-308 (master plan) · SPEC-309 · SPEC-310 · SPEC-311 — slices S1–S2, migrations 0128–0129.",
            "technical": false
          },
          {
            "text": "<b>Closing the leaks between organizations</b>.",
            "full": "<b>Closing the leaks between organizations</b>. Backend SPEC-309 · SPEC-310 · SPEC-311.",
            "technical": false
          },
          {
            "text": "<b>Every store on its own clock</b>.",
            "full": "<b>Every store on its own clock</b>. Backend SPEC-312 — slice S3, no migration.",
            "technical": false
          },
          {
            "text": "<b>Sign up, sign in and choose a plan</b>.",
            "full": "<b>Sign up, sign in and choose a plan</b>. Backend SPEC-313 · SPEC-314 — slices S4–S5, migrations 0130–0131.",
            "technical": false
          },
          {
            "text": "<b>Connect Shopify by link — and the first sync runs itself</b>.",
            "full": "<b>Connect Shopify by link — and the first sync runs itself</b>. Backend SPEC-315 · SPEC-316 — slices S6–S7, migrations 0132–0133.",
            "technical": false
          },
          {
            "text": "<b>Roles and permissions behind every endpoint</b>.",
            "full": "<b>Roles and permissions behind every endpoint</b>. Backend SPEC-317 — slice S8, migration 0134.",
            "technical": false
          },
          {
            "text": "<b>Branding, the workspace and an AI allowance per plan</b>.",
            "full": "<b>Branding, the workspace and an AI allowance per plan</b>. Backend SPEC-318 · SPEC-319 · SPEC-320 — slices S9–S11, migrations 0135–0136.",
            "technical": false
          },
          {
            "text": "<b>Marketing site — a two-destination navbar, a Social Growth section that sells, and links that land</b>.",
            "full": "<b>Marketing site — a two-destination navbar, a Social Growth section that sells, and links that land</b>. Marketing site SPEC-003 · SPEC-005 · SPEC-014.",
            "technical": false
          }
        ],
        "built": "The SaaS master plan and eleven backend slices — organizations, sign-up, plans, connect-by-link, a self-running first sync, roles on every endpoint, branding, the workspace read and an AI allowance per plan — plus a clearer marketing site.",
        "why": "Every answer the product gave was resolved from “the first store”; a second customer would have seen the first one’s data, keys and bill.",
        "value": "A new company can create its account, choose a plan and connect its store without anyone on your side — and each organization’s people, keys and spend are its own.",
        "shots": [
          {
            "route": "/signup",
            "caption": "Create your account: Google or work email, and the store waits on the other side.",
            "src": "/ci/w1002/signup.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/roles · Roles",
            "caption": "Roles and their permissions: the built-in roles, and every permission each one carries, grouped by area.",
            "src": "/ci/w1002/settings-roles.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "Mon Sep 28 — your store moved, and the customer’s journey went on screen",
        "sub": "Monday, Sep 28, 2026 — 7 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today <b>your store moved onto the new platform database</b> as organization #1 — 9,114,349 rows in 126 tables, every timestamp exact, verified table by table, with the old database only ever read — and a catch-up tool brings over whatever the running app writes after the copy. The customer’s journey was built on screen: sign in and sign up by email with a code, Google or Shopify; onboarding that names the company, picks a plan and connects Shopify by link; and a first sync you watch land. A public pricing page and <b>Stripe checkout</b> followed, proven with a live test-mode session. Team, roles, branding and a brand colour arrived in Settings, and the sidebar shows each member only what their role, connections and plan allow. Five of the six tenancy-audit fixes shipped, so every Shopify call and scheduled job runs as its own store, and a new store starts from a neutral brand and AI with money in its own currency.",
        "status": "Delivered · awaiting deploy and the final catch-up",
        "effort": "27h 30m",
        "inside": [
          {
            "text": "<b>Your store moves to the new database — row for row, timestamps exact</b>.",
            "full": "<b>Your store moves to the new database — row for row, timestamps exact</b>. Backend SPEC-321 — slice S12, run on your instruction; catch-up in §7.",
            "technical": false
          },
          {
            "text": "<b>Every Shopify call and every scheduled job, as its own store</b>.",
            "full": "<b>Every Shopify call and every scheduled job, as its own store</b>. Backend SPEC-324 · SPEC-325 — tenancy-audit fixes.",
            "technical": false
          },
          {
            "text": "<b>Neutral for every new store — brand, AI and money</b>.",
            "full": "<b>Neutral for every new store — brand, AI and money</b>. Backend SPEC-326 · SPEC-327 · SPEC-328 · frontend SPEC-318 · SPEC-319 (slices F8, F8b).",
            "technical": false
          },
          {
            "text": "<b>Sign in, sign up and onboarding — on screen</b>.",
            "full": "<b>Sign in, sign up and onboarding — on screen</b>. Frontend SPEC-312 · SPEC-313 · SPEC-314 — slices F2–F4, over backend SPEC-313–316.",
            "technical": false
          },
          {
            "text": "<b>A pricing page and Stripe checkout</b>.",
            "full": "<b>A pricing page and Stripe checkout</b>. Backend SPEC-322 · frontend SPEC-320 · SPEC-321 · marketing SPEC-016 — no migration.",
            "technical": false
          },
          {
            "text": "<b>Team, roles, branding and a brand colour — and a sidebar that shows only what’s yours</b>.",
            "full": "<b>Team, roles, branding and a brand colour — and a sidebar that shows only what’s yours</b>. Frontend SPEC-315 · SPEC-316 · SPEC-317 · SPEC-322 · backend SPEC-323 — slices F5–F7.",
            "technical": false
          },
          {
            "text": "<b>Marketing site — “Workforce”, contacts where they belong, and phones</b>.",
            "full": "<b>Marketing site — “Workforce”, contacts where they belong, and phones</b>. Marketing SPEC-014 · SPEC-005 · SPEC-012 · SPEC-010 · SPEC-004 · SPEC-001.",
            "technical": false
          }
        ],
        "built": "The move tool with its verification and catch-up, the full sign-up and onboarding screens, the pricing page with Stripe checkout, Team, Roles and Branding in Settings, and five tenancy-audit fixes.",
        "why": "Your store’s history is the product’s memory, and the first five minutes decide whether a new merchant stays.",
        "value": "Your store keeps every record exactly as it happened, and a new merchant can go from your link to a paid plan and their own dashboard without help.",
        "shots": [
          {
            "route": "/pricing",
            "caption": "The pricing page: the plan for the store's revenue band, what every plan includes, and checkout through Stripe.",
            "src": "/ci/w1002/pricing-full.webp",
            "width": 1400,
            "height": 1474
          }
        ]
      },
      {
        "n": "03",
        "title": "Tue Sep 29 — a console to run the business, and one look across the app",
        "sub": "Tuesday, Sep 29, 2026 — 6 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today you got <b>a place to run Ecommerce FTE as its owner</b>: an Ecommerce section in the admin panel — thirteen pages covering customers, packages and their internal economics, revenue, AI cost, health, the funnel, data-request deadlines and an audit log — reading real organizations, subscriptions and AI spend through a signed operator API. <b>Packages now live in the database</b> and are edited from the admin panel; the $500 package carries the AI and compute costs you entered, so its AI allowance follows that budget — $200, up from $50. Inside the app, <b>Settings was rebuilt</b> to the approved mockup with new Organization, Billing & plan, Profile and Security tabs, the folder tabs you picked now run across every page’s tab bar, and Pricing became one card with a revenue dropdown. The white-label review’s leftovers were closed, and chat now checks membership on every request — the last of the six tenancy fixes.",
        "status": "Delivered",
        "effort": "21h",
        "inside": [
          {
            "text": "<b>The admin panel’s Ecommerce section — thirteen pages to run the product</b>.",
            "full": "<b>The admin panel’s Ecommerce section — thirteen pages to run the product</b>. Admin frontend SPEC-003 — the operator console’s Ecommerce section.",
            "technical": false
          },
          {
            "text": "<b>Packages in the database, and real data behind every admin screen</b>.",
            "full": "<b>Packages in the database, and real data behind every admin screen</b>. Backend SPEC-332 · admin backend SPEC-005 · admin frontend SPEC-003 “Live data” — migration 0137.",
            "technical": false
          },
          {
            "text": "<b>Settings, redesigned — a tab bar, new account and billing tabs</b>.",
            "full": "<b>Settings, redesigned — a tab bar, new account and billing tabs</b>. Frontend SPEC-324 · backend SPEC-331.",
            "technical": false
          },
          {
            "text": "<b>One tab style across the app, and pricing on one card</b>.",
            "full": "<b>One tab style across the app, and pricing on one card</b>. Frontend SPEC-325 · SPEC-326 · marketing SPEC-016 Patches.",
            "technical": false
          },
          {
            "text": "<b>The white-label review’s leftovers, closed</b>.",
            "full": "<b>The white-label review’s leftovers, closed</b>. Frontend SPEC-323 · backend SPEC-330 — guard tests in both repos.",
            "technical": false
          },
          {
            "text": "<b>Chat checks membership on every request; a live call opens on the right store</b>.",
            "full": "<b>Chat checks membership on every request; a live call opens on the right store</b>. Backend SPEC-329 — tenancy-audit fix 6 of 6.",
            "technical": false
          }
        ],
        "built": "The admin panel’s thirteen-page Ecommerce section on a signed operator API, packages as database rows, a redesigned Settings, one folder-tab component on every tab bar, and the last tenancy fix.",
        "why": "Running a SaaS means seeing every customer, package and cost in one place, with numbers the owner entered rather than assumed.",
        "value": "One console for the business behind the product, and an app that looks like one product on every page and screen size.",
        "shots": [
          {
            "route": "/settings/profile · Account",
            "caption": "The redesigned Settings: Store, Organization and Account across the top, each with its own tabs. Account › Profile.",
            "src": "/ci/w1002/settings-profile.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "Wed Sep 30 — an Integrations page that tells the truth, and a Brief that is ready",
        "sub": "Wednesday, Sep 30, 2026 — 6 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today rebuilt the <b>Integrations page</b> the way enterprise software does it: a health strip, a Needs you card with a plain reason and the fix, one page per app with its sync history and permissions, and a connect step that <b>tests a key before it saves it</b> — and the page no longer contradicts itself about what is connected. The <b>Morning Brief</b> no longer does its heavy work while you wait: it is computed after every 15-minute sync, so on a production-sized store the page went from 2.86 s to 0.19–0.38 s, and a Dashboard revisit from 2.16 s to 0.65 s. Each package’s <b>video and image limits</b> are now counted and enforced, and a failed video never uses one up. In the operator console, revenue now counts only what is actually charged, AI run on a customer’s own keys is visible, and a new sign-up journey shows who is stuck at which of seven steps.",
        "status": "Delivered",
        "effort": "21h",
        "inside": [
          {
            "text": "<b>The Integrations hub — every connection, its health and its fix</b>.",
            "full": "<b>The Integrations hub — every connection, its health and its fix</b>. Backend SPEC-337 · frontend SPEC-328 — five new endpoints; the integration cards read in one query.",
            "technical": false
          },
          {
            "text": "<b>The Morning Brief, computed after the sync instead of while you wait</b>.",
            "full": "<b>The Morning Brief, computed after the sync instead of while you wait</b>. Backend SPEC-336 — a per-process view cache, refreshed by a fifth step after every 15-minute sync.",
            "technical": false
          },
          {
            "text": "<b>Package limits on videos and images, counted and enforced</b>.",
            "full": "<b>Package limits on videos and images, counted and enforced</b>. Backend SPEC-335 · frontend SPEC-327 — migration 0138 adds one row per video started.",
            "technical": false
          },
          {
            "text": "<b>Operator console: revenue that counts only what is charged, and AI on customers’ own keys</b>.",
            "full": "<b>Operator console: revenue that counts only what is charged, and AI on customers’ own keys</b>. Backend SPEC-333 · admin frontend SPEC-003 — operator API and the console’s Overview, Customers, Revenue and AI screens.",
            "technical": false
          },
          {
            "text": "<b>Operator console: the sign-up journey, step by step</b>.",
            "full": "<b>Operator console: the sign-up journey, step by step</b>. Backend SPEC-334 · admin frontend SPEC-003 — three reads in one gather, then pure rules.",
            "technical": false
          },
          {
            "text": "<b>Operator console: Ecommerce only, live data only, and its own deploy</b>.",
            "full": "<b>Operator console: Ecommerce only, live data only, and its own deploy</b>. Admin backend SPEC-005 (the bridge) · SPEC-006 (Railway) · admin frontend SPEC-003.",
            "technical": false
          }
        ],
        "built": "The Integrations hub with test-before-save connects, a Brief and Dashboard computed after each sync, enforced video and image limits, and an operator console on charged revenue with a seven-step sign-up journey.",
        "why": "A page that never said whether a connection worked, a morning page that made you wait for work the system could have done earlier, and a revenue figure that counted a package nobody pays for each had to be checked by hand.",
        "value": "One look at what works and what needs you, a Brief ready when you are, packages that mean what they say, and console figures that match what Stripe collects.",
        "shots": [
          {
            "route": "/integrations · Connected",
            "caption": "Connection health at the top, then every connected app with its status, last sync, recent runs and the pages it powers.",
            "src": "/ci/w1002/integrations.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/brief",
            "caption": "The Morning Brief, read from figures computed after the sync: yesterday, today's decisions, the overnight watch and integration health.",
            "src": "/ci/w1002/brief.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "Thu Oct 1 — Finance proves its worth, companies walled off, your real Meta ads audited",
        "sub": "Thursday, Oct 1, 2026 — 7 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today made <b>Finance Oversight</b> show what it is worth: every early-pay discount and possible duplicate bill is recorded and then settled from the books, so a new Value tab reads what it kept you, measured, and what more it estimates — never added into one number. It also became fully multi-company: mixed currencies converted at QuickBooks’ own rate, your store’s clock, and books you can disconnect one at a time or all at once. The platform took its biggest SaaS step: <b>isolation rules on 140 tables</b>, a download of all your data as a ZIP with files included, a deletion with a 30-day grace and a restore link, deletions visible in the operator console, and a one-company restore — proven under load with no foreign row seen. <b>Performance Ads</b> now connects to the real Meta ad account, read-only, and audits it against fixed rules with the spend at risk. And “Between the click and the order” now matches visits to orders by channel, and the AI employees open straight from the sidebar.",
        "status": "Delivered · awaiting the restricted database role and Meta App Review",
        "effort": "27h 30m",
        "inside": [
          {
            "text": "<b>Finance Oversight’s value ledger — what it kept you, measured</b>.",
            "full": "<b>Finance Oversight’s value ledger — what it kept you, measured</b>. Backend SPEC-338 · frontend SPEC-330 — migration 0139; read-only toward QuickBooks, enforced by a test.",
            "technical": false
          },
          {
            "text": "<b>Finance Oversight, fully SaaS — many companies, many currencies, disconnect one or all</b>.",
            "full": "<b>Finance Oversight, fully SaaS — many companies, many currencies, disconnect one or all</b>. Backend SPEC-339 · frontend SPEC-331 · SPEC-338 patches — migration 0140, applied to production.",
            "technical": false
          },
          {
            "text": "<b>Row-level isolation, a full data download and a safe deletion</b>.",
            "full": "<b>Row-level isolation, a full data download and a safe deletion</b>. Backend SPEC-340 · frontend SPEC-332 — migration 0141; isolation on 140 tables.",
            "technical": false
          },
          {
            "text": "<b>Strict isolation, export with files, deletions in the console, one-company restore</b>.",
            "full": "<b>Strict isolation, export with files, deletions in the console, one-company restore</b>. Backend SPEC-341 · frontend SPEC-334 · admin frontend SPEC-004 — migration 0143, applied on Railway.",
            "technical": false
          },
          {
            "text": "<b>Performance Ads reads your real Meta ad account — and audits it</b>.",
            "full": "<b>Performance Ads reads your real Meta ad account — and audits it</b>. Backend SPEC-342 · frontend SPEC-333 (+ patches) — migration 0144, six tables with row-level security; read-only, enforced by a test.",
            "technical": false
          },
          {
            "text": "<b>“Between the click and the order” — matched by channel</b>.",
            "full": "<b>“Between the click and the order” — matched by channel</b>. Backend SPEC-219 patch · frontend SPEC-284 patch — a pure channel-folding module.",
            "technical": false
          },
          {
            "text": "<b>Digital Employees opens in the sidebar</b>.",
            "full": "<b>Digital Employees opens in the sidebar</b>. Frontend SPEC-329 — navigation only; no backend change.",
            "technical": false
          }
        ],
        "built": "Finance’s value ledger and multi-company support, row-level isolation with a full export, safe deletion and one-company restore, a read-only Meta Ads connection with a fixed-rule audit, channel matching and an expandable employees row.",
        "why": "An accounts-payable employee is worth a salary only for money that would have leaked and didn’t, and on a shared platform one company seeing another’s data is the failure that ends the business.",
        "value": "Finance shows, line by line, what it kept you; each company can take its data and leave with a way back; and your ad account is audited without handing over the keys to change it.",
        "shots": [
          {
            "route": "/employees/finance · Value",
            "caption": "What Finance Oversight was worth this month: discounts kept, duplicates stopped, late fees avoided, and the ledger of every finding behind those figures.",
            "src": "/ci/w1002/finance-value.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/ads · Audit",
            "caption": "Connect Meta Ads: what the audit reads, what it checks, and the promise that it never changes, pauses or spends.",
            "src": "/ci/w1002/ads-audit.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "06",
        "title": "Fri Oct 2 — the Report FTE’s buttons do what they say",
        "sub": "Friday, Oct 2, 2026 — 5 areas in the daily report.",
        "subTechnical": false,
        "ask": "Today made the <b>Report FTE</b>’s two buttons do what they say, after a live check found that Approve & send emailed nobody and that scheduling a report weekly saved a daily schedule. <b>Send</b> now opens a dialog with your address filled in and every address from Settings one tick away, and <b>Schedule</b> saves exactly the cadence, day, time and people you chose, rebuilding the report with the latest data each time and either sending it or waiting for your approval. Every scheduled run leaves a note in a new <b>notification bell</b>, and the reports you opt in appear on Daily Reports. The narrator was caught closing an executive report with a product launch that was in no figure; it now receives only your brand’s limits, confirmed on four live runs. And the exports no longer carry the internal audit trail, while the Composer keeps its side panels whole.",
        "status": "Delivered",
        "effort": "14h",
        "inside": [
          {
            "text": "<b>Approve & send — to the people you choose</b>.",
            "full": "<b>Approve & send — to the people you choose</b>. Backend SPEC-343 · frontend SPEC-335 — a recipients directory read in one parallel step.",
            "technical": false
          },
          {
            "text": "<b>Approve & schedule — a schedule that does what it says</b>.",
            "full": "<b>Approve & schedule — a schedule that does what it says</b>. Backend SPEC-343 · frontend SPEC-335 — migration 0145, applied to production, with row-level security.",
            "technical": false
          },
          {
            "text": "<b>A notification bell, and scheduled reports on Daily Reports</b>.",
            "full": "<b>A notification bell, and scheduled reports on Daily Reports</b>. Backend SPEC-343 · frontend SPEC-335 — a store-level notifications inbox.",
            "technical": false
          },
          {
            "text": "<b>A summary that says only what the figures say</b>.",
            "full": "<b>A summary that says only what the figures say</b>. Backend SPEC-283 · SPEC-289 patches — the narrator’s brand input and prompt.",
            "technical": false
          },
          {
            "text": "<b>Clean exports and a Composer that fits the screen</b>.",
            "full": "<b>Clean exports and a Composer that fits the screen</b>. Backend SPEC-283 · frontend SPEC-286 patches — PDF, Excel and the Composer layout.",
            "technical": false
          }
        ],
        "built": "A recipients directory with a validated Send dialog, schedules saved exactly as chosen, a notifications inbox with its bell, a stricter narrator, and trace-free exports with a steadier Composer.",
        "why": "A button that says it sent a report and emailed nobody is worse than no button, and one invented sentence makes every figure beside it doubtful.",
        "value": "Set a report once — weekly, Monday at seven, to your managers — and it arrives fresh every time, says only what its figures say, and you hear about every send.",
        "shots": [
          {
            "route": "/report-fte/delivered · Scheduled",
            "caption": "Delivered & scheduled: who each report goes to, in which formats, and whether it waits for your approval.",
            "src": "/ci/w1002/report-fte-delivered.webp",
            "width": 1400,
            "height": 972
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "The Morning Brief page",
        "change": "2.86 s → 0.19–0.38 s",
        "why": "Measured on a production-sized store; the heaviest statement now runs once per sync instead of twice per page open."
      },
      {
        "name": "The $500 package’s AI allowance",
        "change": "$50 → $200, from the AI cost you entered",
        "why": "A package’s allowance is now its AI budget; 10% of the price only when none is set."
      },
      {
        "name": "Revenue in the operator console",
        "change": "counted a package nobody pays for → counts Stripe-billed packages only",
        "why": "Packages given without a card are shown beside it, labelled “Not charged”."
      },
      {
        "name": "Finance Oversight’s worth",
        "change": "a scorecard of how the books were run → an itemised ledger of money kept and lost, each line checkable",
        "why": "Measured money and estimates are never added into one number."
      },
      {
        "name": "Approve & send",
        "change": "recorded a delivery to nobody → emails the addresses you tick, each one checked",
        "why": "The plan’s recipients had been role names with no addresses."
      }
    ],
    "next": [
      {
        "title": "Switch the app to a restricted database role",
        "body": "The isolation rules are built, proven and in place, but the database does not apply them to its owner account; they take effect once the app connects as a restricted role. The rollout steps are written down.",
        "technical": false
      },
      {
        "title": "Create the one missing video table on the live database",
        "body": "The video-limit table was never created on the live database, a gap that predates this week. Until it is, the video limit returns an error.",
        "technical": false
      },
      {
        "title": "Meta App Review for reading ads",
        "body": "Meta must approve the read-ads permission before businesses outside the app’s own Business Manager can connect their accounts.",
        "technical": false
      },
      {
        "title": "Enter the rest of each package’s costs and limits",
        "body": "The $500 package carries the $200 AI and $100 compute you gave; every other cost and limit is empty until you enter it — nothing was assumed. Trials, coupons, announcements and settings in the console say plainly that they are not built yet.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "The old database was only ever read",
        "body": "The move and the catch-up write only to the new database; clashes are reported, never forced, and the half-filled first attempt was thrown away rather than patched.",
        "technical": false
      },
      {
        "title": "Read-only toward QuickBooks and Meta, enforced by tests",
        "body": "The build fails if a write verb appears in the finance service, or if the Meta Ads connection ever asks for the permission to manage ads. Nothing here can pay a bill or change an ad.",
        "technical": false
      },
      {
        "title": "Measured on copies, not on your live data",
        "body": "The Brief timings come from a production-sized copy — 650,000 orders, 150,000 customers — and the isolation, restore and load tests ran on throwaway databases. The live database was migrated only on your instruction.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d1001",
    "kind": "daily",
    "period": "Thursday, Oct 1, 2026",
    "sortDate": "2026-10-01",
    "hook": "Finance Oversight now proves what it saves, every company’s data is walled off by the database itself, and Performance Ads reads and audits your real Meta account",
    "memo": "Today made <b>Finance Oversight</b> show what it is worth: every early-pay discount and possible duplicate bill is now recorded and then settled from the books — kept or missed, stopped or paid twice — so the new <b>Value</b> tab reads “this month I kept you $X, measured, and about $Y more, estimated”, every line checkable and every assumption sourced. It also became fully multi-company: mixed currencies converted at QuickBooks’ own rate, your store’s clock, and books you can disconnect one at a time or all at once. The platform took its biggest SaaS step: <b>database-level isolation</b> so one company can never read another’s rows, a <b>download of all your data</b> as a ZIP with files included, a deletion with a 30-day grace and a restore link, deletions visible in the operator console, and a way to restore one company from a backup — proven under load with no foreign row seen. <b>Performance Ads</b> now connects to the real Meta ad account, read-only, reads campaigns, ads and daily results, and audits them against fixed rules with the spend at risk; Meta lives in one card on Integrations. And “Between the click and the order” now matches visits to orders by channel, and the AI employees open straight from the sidebar. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "27h 30m",
    "views": "8 screens",
    "areas": 7,
    "days": [
      {
        "title": "Finance Oversight proves its value",
        "body": "A ledger of every discount kept or missed and every duplicate stopped or paid twice, checked against the books — measured money and estimates kept visibly apart on a new Value tab.",
        "technical": false
      },
      {
        "title": "Every company walled off, in the database",
        "body": "Isolation rules on 140 tables, a full data download, deletion with a 30-day grace and a restore link, and a one-company restore from backup — 0 foreign rows across every load test.",
        "technical": false
      },
      {
        "title": "Your real Meta ads, audited",
        "body": "A read-only Meta Ads connection reads campaigns, ads and daily results every three hours and flags the waste — no purchases, below break-even, tired creative — with the spend at risk.",
        "technical": false
      },
      {
        "title": "Clicks matched to orders by channel",
        "body": "Instagram traffic no longer shows 0 orders because Clarity and Shopify spell the source differently: both sides now fold into one channel.",
        "technical": false
      },
      {
        "title": "The AI employees, one click from anywhere",
        "body": "Digital Employees opens in the sidebar with all five employees listed.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Finance Oversight’s value ledger — what it kept you, measured",
        "sub": "Backend SPEC-338 · frontend SPEC-330 — migration 0139; read-only toward QuickBooks, enforced by a test.",
        "subTechnical": true,
        "ask": "“Its not about increasing UI … what problem being solved, how much pain … quantify, and show real values and outcomes … how much time, money increasing or saving.”",
        "status": "Delivered",
        "effort": "5h",
        "inside": [
          {
            "text": "<b>Researched first:</b> the leading accounts-payable products and AI bookkeepers, plus independent benchmarks. None shows a small business an itemised, checkable record of money it saved — and late fees, the pain everyone names, are the smallest; missed discounts, paying early and review time are where the money is.",
            "full": "<b>Researched first:</b> BILL, Ramp, Tipalti, Stampli, AvidXchange, Medius, Coupa, Vic.ai, Melio, Intuit’s QuickBooks agents and the AI bookkeepers, plus BLS, APQC, Ardent, AFP and FBI IC3 benchmarks. None shows a small business an itemised, checkable record of money it saved — and late fees are the smallest pain; missed discounts, paying early and review time are where the money is.",
            "technical": false
          },
          {
            "text": "<b>Every catch is recorded and settled from the books.</b> A discount is <i>kept</i> when the bill is paid inside the window and <i>missed</i> after it; a duplicate is <i>stopped</i> when a copy is deleted before payment and <i>lost</i> when both are paid. A new check catches the same vendor, amount and bill number in two different companies.",
            "full": "<b>Every catch is recorded and settled from the books</b> (<code>finance_findings</code>, migration <code>0139</code>). A discount is <i>kept</i> when the bill is paid inside the window (checked by the amount when the payment was smaller) and <i>missed</i> after it; a duplicate is <i>stopped</i> when a copy is deleted before payment and <i>lost</i> when both are paid. A new flag catches the same vendor + amount + bill number in two companies.",
            "technical": false
          },
          {
            "text": "<b>The Value tab</b> leads with one line — money kept (measured) and money more (estimated) never added into one number — then what is at stake now, the ledger line by line, the year before Finance as a baseline (including bills probably paid twice), and the five assumptions behind every estimate, each sourced and editable. Fraud figures are shown as context, never added to a total.",
            "full": "<b>The Value tab</b> (<code>GET /finance/value?month=</code>) leads with one line — money kept (measured) and money more (estimated) never added together — then what is at stake now, the ledger, the frozen year-before baseline (including bills probably paid twice), and five sourced, editable assumptions (<code>finance_value_settings</code>). FBI/AFP fraud context is never added to a total.",
            "technical": false
          },
          {
            "text": "<b>You stay in charge of the ledger:</b> mark a finding “not a problem” or restore it, and a cleared duplicate stops flagging both copies. With nothing connected, the tab shows a clearly labelled sample business and writes nothing.",
            "full": "<b>You stay in charge of the ledger:</b> mark a finding “not a problem” or restore it, and a cleared duplicate stops flagging both copies. With nothing connected, the tab shows a clearly labelled sample business and writes nothing.",
            "technical": false
          },
          {
            "text": "<b>It travels:</b> the Finance chat can state the value, and the Monday finance card adds a value line. The statement computes in about 8 ms over a year of bills.",
            "full": "<b>It travels:</b> a new chat tool <code>get_value_statement</code>, and a value line on the Monday finance card. The statement computes in ~8 ms over a year of bills; the endpoint is one parallel read deep.",
            "technical": false
          }
        ],
        "built": "The findings table and its settlement rules, the value statement with its baseline and assumptions, the Value tab with its ledger, and the chat and Monday-card lines.",
        "why": "An accounts-payable employee is worth a salary only for money that would have leaked and didn’t, and hours you no longer spend — and the employee measured neither.",
        "value": "For the first time the employee can show, line by line and checkable against your books, what it kept you this month — with every estimate labelled as one.",
        "shots": [
          {
            "route": "/employees/finance · Value",
            "caption": "What Finance Oversight was worth this month: discounts kept, duplicates stopped, late fees avoided, and the ledger of every finding behind those figures.",
            "src": "/ci/d1001/finance-value.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "Finance Oversight, fully SaaS — many companies, many currencies, disconnect one or all",
        "sub": "Backend SPEC-339 · frontend SPEC-331 · SPEC-338 patches — migration 0140, applied to production.",
        "subTechnical": true,
        "ask": "“I WANT IT FULLY SAAS … make sure if we connect multiple books I can disconnect singly and once as well.”",
        "status": "Delivered",
        "effort": "4h 30m",
        "inside": [
          {
            "text": "<b>Disconnect one company, or all of them.</b> Disconnecting a company now removes its findings, its quoted rates and its baseline too; <i>Disconnect all</i> asks you to type DISCONNECT, on the Overview and on the Integrations card.",
            "full": "<b>Disconnect one company, or all of them.</b> Disconnecting a company now removes its value findings, its quoted rates and its frozen baseline; <i>Disconnect all</i> (<code>DELETE /finance/connections</code>) asks for a typed DISCONNECT, on the Overview and on the Integrations card.",
            "technical": false
          },
          {
            "text": "<b>Currencies are no longer added together.</b> Every figure is in your store’s reporting currency, converted at QuickBooks’ own rate, with the original kept; a currency with no rate holds that company out until you set one, and small non-dollar amounts no longer show a “$”.",
            "full": "<b>Currencies are no longer added together.</b> Every figure is in the store’s reporting currency at QuickBooks’ own rate — direct, or the cross rate through a company’s home currency from <code>Preferences</code> — originals kept (<code>original_*</code>, <code>fx_rate</code>, <code>qbo_fx_rates</code>). A currency with no rate holds that company out; <code>PUT /finance/fx/{currency}</code> sets one; <code>compactMoney</code> no longer writes “$” for small non-USD amounts.",
            "technical": false
          },
          {
            "text": "<b>“Today” is your store’s today:</b> late, due and discount windows and the daily snapshot follow the store’s time zone instead of UTC. Two syncs of the same books can no longer run at once, even across servers.",
            "full": "<b>“Today” is your store’s today:</b> late, due and discount windows and the snapshot follow the store’s zone instead of UTC. The one-sync-per-store lock is now also a Postgres advisory lock (<code>qbo:{store}</code>); a second process gets <code>busy</code>.",
            "technical": false
          },
          {
            "text": "<b>It no longer assumes the first client:</b> the prompt, chat, page header, Overview, Profile and doc speak of “your QuickBooks companies” instead of three named ones, and the Monday finance card goes to the owner of your organization — it was going to the first user in the database.",
            "full": "<b>It no longer assumes the first client:</b> the prompt, chat tool, page header, Overview, Profile, chat placeholder and in-app doc speak of “your QuickBooks companies”; the Monday finance card goes to <code>OrganizationRepository.owner_of_store</code> instead of the first user in the database.",
            "technical": false
          },
          {
            "text": "<b>Two more fixes:</b> the Finance card on Digital Employees showed “—” for outstanding and past due and never needed you — it now reads the real figures and needs you when bills are past due; and every Finance tab returning an error on a database without the new table is fixed.",
            "full": "<b>Two more fixes:</b> the employee card now reads the A/P bands in one grouped query (needs-you = past-due bills); and a 500 on every Finance tab on a database without migration <code>0139</code> is fixed — the read of cleared duplicates is non-fatal and logged (SPEC-338 Patches, regression test).",
            "technical": false
          }
        ],
        "built": "Full disconnect and disconnect-all, currency conversion with originals kept, the store’s own clock, a cross-server sync lock, neutral wording and the right recipient for the Monday card.",
        "why": "An audit found six places where the first client’s shape — three US companies, one currency, one clock, one server — still leaked into Finance; any other business would have seen wrong totals.",
        "value": "Finance Oversight now works the same for any business, however many companies and currencies it keeps — and leaves nothing behind when you disconnect.",
        "shots": [
          {
            "route": "/employees/finance · Overview",
            "caption": "Many companies on one desk: each QuickBooks company, what it owes, its cash, and the shortfall per company.",
            "src": "/ci/d1001/finance-overview.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/employees/finance · Profile",
            "caption": "Its profile: the job, the authority it holds and never holds, its scorecard, and the books it reads.",
            "src": "/ci/d1001/finance-profile.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "03",
        "title": "Row-level isolation, a full data download and a safe deletion",
        "sub": "Backend SPEC-340 · frontend SPEC-332 — migration 0141; isolation on 140 tables.",
        "subTechnical": true,
        "ask": "“Yes please, do that right now.”",
        "status": "Delivered · awaiting the switch to a restricted database role",
        "effort": "5h 30m",
        "inside": [
          {
            "text": "<b>The database itself keeps companies apart:</b> an isolation rule on 140 tables means a request for one store can only see that store’s rows. The build fails if a new table is added without one.",
            "full": "<b>The database itself keeps companies apart:</b> migration <code>0141</code> puts a <code>tenant_isolation</code> policy on 140 tables (113 store tables, organization tables, users through memberships, child tables through their parents); <code>app/database/tenant_guard.py</code> tells Postgres the store of each transaction. <code>tests/test_rls_registry.py</code> fails the build on an uncovered table.",
            "technical": false
          },
          {
            "text": "<b>Download all your data:</b> Settings → Organization → Your data gives the owner a ZIP of CSV files for the organization and every store — credentials left out.",
            "full": "<b>Download all your data:</b> <code>GET /organizations/current/export</code> streams a ZIP of CSVs (organization + every store, keyset-paged, flat memory), no credential columns, binary as size; owner only, from Settings → Organization → Your data.",
            "technical": false
          },
          {
            "text": "<b>Delete with a way back:</b> typing the company’s name locks it at once, cancels the plan at Stripe and emails a signed restore link; after 30 days it is erased in one go, sole members are anonymised and billing records are kept, anonymised.",
            "full": "<b>Delete with a way back:</b> <code>POST /organizations/current/deletion</code> (type the name) locks the organization, cancels the plan at Stripe and returns + emails a signed restore link (<code>/restore?token=</code>, <code>POST /auth/organization-restore</code>); the daily <code>organization_purge</code> (03:20 UTC) erases after 30 days in one transaction.",
            "technical": false
          },
          {
            "text": "<b>Proven under load:</b> 30 companies and 1,200 requests with isolation enforced — no server errors, and not one foreign row among the 35,900 checked; enforced it served 459 requests a second against 418 without.",
            "full": "<b>Proven under load</b> on a throwaway local Postgres as a restricted role: 12/12 RLS tests, migration up/down/up, and a load test of 30 companies and 1,200 requests — 0 5xx, 0 foreign rows of 35,900 checked, 459 req/s enforced vs 418 unenforced.",
            "technical": false
          },
          {
            "text": "<b>A rebuild can run again from scratch:</b> an empty database stopped part-way through the setup steps, because one of them used a file removed in the white-label pass — which would have blocked a new environment or a disaster rebuild. Fixed; existing databases are unaffected.",
            "full": "<b>A rebuild can run again from scratch:</b> migration <code>0116</code> imported <code>app.services.brand_brain.seed</code>, gone since the white-label pass, so <code>alembic upgrade head</code> stopped at 0116 on any empty database. The import now sits after the “no stores” early return (SPEC-340 Patches).",
            "technical": false
          }
        ],
        "built": "The isolation policies and the per-transaction store marker, the streamed ZIP export, the deletion with a restore link and a 30-day purge, and the Your data panel.",
        "why": "On a shared platform, one company seeing another’s data is the failure that ends the business; the application keeping them apart is good, the database refusing as well is the enterprise standard.",
        "value": "Each customer can take all of its data, leave with a 30-day way back, and trust that the database itself — not just the code — keeps its rows to itself.",
        "shots": [
          {
            "route": "/settings/organization · Your data",
            "caption": "Your data: export everything as a ZIP of CSV files, or close the organization with a 30-day window to restore it.",
            "src": "/ci/d1001/settings-organization.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "Strict isolation, export with files, deletions in the console, one-company restore",
        "sub": "Backend SPEC-341 · frontend SPEC-334 · admin frontend SPEC-004 — migration 0143, applied on Railway.",
        "subTechnical": true,
        "ask": "“Just fix it up and make this FTE 100% SaaS.”",
        "status": "Delivered · awaiting one missing table on the live database",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "<b>No company selected means no data.</b> With no store, organization or declared system scope, the database returns nothing. Every signed-in request is scoped to its organization — team, billing, chat history and store connection included — and the build fails on any route left unscoped.",
            "full": "<b>No company selected means no data.</b> With no store, organization or declared system scope the database returns nothing. Signed-in requests are scoped to their organization (and store); sign-in, onboarding, the operator API, Stripe/Shopify webhooks, public links, the MCP key check, boot, every scheduled job and the scripts are declared system work. <code>tests/test_route_scopes.py</code> fails the build on an unscoped route; <code>TENANT_ISOLATION=open</code> is the no-deploy escape hatch.",
            "technical": false
          },
          {
            "text": "<b>The download includes your files:</b> a checkbox in Settings → Your data adds every image, video and upload to the ZIP.",
            "full": "<b>The download includes your files:</b> <code>?files=true</code> puts every image, video and upload in <code>files/</code>; Settings → Your data has the checkbox.",
            "technical": false
          },
          {
            "text": "<b>The operator console sees deletions:</b> customers show Deleting or Deleted with dates, with Restore and Purge now (type the name to confirm), both audited.",
            "full": "<b>The operator console sees deletions:</b> customers show Deleting or Deleted with dates, with Restore and Purge now (type the name to confirm), both audited.",
            "technical": false
          },
          {
            "text": "<b>Restore one company from a backup</b>, in one transaction, keeping its ids and leaving billing untouched — without rolling back anyone else.",
            "full": "<b>Restore one company from a backup:</b> <code>app.scripts.organization_restore</code> copies one organization from a backup restored into a side database, one transaction, ids kept, billing untouched.",
            "technical": false
          },
          {
            "text": "<b>Proven:</b> 17 strict isolation tests including the scheduled jobs, 3 restore tests, and 1,500 requests across 14 kinds of endpoint, sign-in and the Shopify webhook included — 0 errors, 0 foreign rows.",
            "full": "<b>Proven</b> on throwaway Postgres: 17 strict RLS tests (scheduler jobs included), 3 restore tests; load test strict as a restricted role, 1,500 requests across 14 endpoint kinds incl. sign-in and the Shopify webhook: 0 errors, 0 non-200, 0 foreign rows. Backend 3,448 passed, frontend 2,253, admin frontend 31.",
            "technical": false
          }
        ],
        "built": "Strict scoping with declared system work, files in the export, the console’s deletion view with restore and purge, and a one-company restore script.",
        "why": "The last SaaS gaps were the dangerous kind: code with no company selected still had a master key, exports left files out, the console could not see a deletion, and one company could not be restored alone.",
        "value": "A company’s data is unreachable without its own scope, leaves with every file, and can be brought back on its own — the standard enterprise buyers ask about.",
        "shots": []
      },
      {
        "n": "05",
        "title": "Performance Ads reads your real Meta ad account — and audits it",
        "sub": "Backend SPEC-342 · frontend SPEC-333 (+ patches) — migration 0144, six tables with row-level security; read-only, enforced by a test.",
        "subTechnical": true,
        "ask": "“Start from meta, what to get, how someone connects, how it will take its current ads, how it will audit … is it better than to hire an agency” — then “YES PLEASE ADD THAT” for a read-only connection.",
        "status": "Delivered · awaiting Meta App Review",
        "effort": "4h 30m",
        "inside": [
          {
            "text": "<b>Read-only by construction:</b> its own Meta sign-in asks only to read ads and list the business’s ad accounts — never the permission to manage them — and the build fails on any write. You choose which ad accounts to include.",
            "full": "<b>Read-only by construction:</b> a new package <code>services/ad_platforms/</code> (kept apart from the platform-free <code>services/ads/</code>) with its own consent for <code>ads_read</code> + <code>business_management</code> only, through the callback Social already uses (the signed state’s purpose routes it). <code>tests/test_ad_platforms_readonly.py</code> fails the build on any write verb or <code>ads_management</code>.",
            "technical": false
          },
          {
            "text": "<b>What it reads:</b> campaigns, ad sets, ads with their creative, and daily results per ad — 90 days the first time, then the last 7 — every three hours, or on <i>Sync now</i>.",
            "full": "<b>What it reads:</b> campaigns, ad sets, ads with creative, and daily ad-level results — 90 days first, then the last 7 — idempotently, every 3 hours (<code>ad_platforms_sync</code>) or on Sync now, under the advisory lock <code>adplat:{store}</code>.",
            "technical": false
          },
          {
            "text": "<b>The Audit tab:</b> return on ad spend, cost per purchase, click rate, cost per thousand and per click, frequency, hook rate, and marketing efficiency from your Shopify net sales — then fixed rules that flag no purchases, below break-even, cost per purchase over target, tired creative, low click rate, weak video hooks, learning limited and missing purchase tracking, each with the spend at risk.",
            "full": "<b>The Audit tab:</b> ROAS, CPA, CTR, CPM, CPC, frequency, hook rate and MER from Shopify net sales, and a fixed-rule audit (no purchases, below break-even, CPA over target, creative fatigue, low CTR, weak video hook, learning limited, no purchase tracking) with spend at risk.",
            "technical": false
          },
          {
            "text": "<b>A Connect button that is always there:</b> the Audit tab showed none when the server had no Meta app; now it is always present, disabled with one plain reason when it cannot work.",
            "full": "<b>A Connect button that is always there:</b> the Audit tab showed none when the server had no Meta app; now it is always present, disabled with one plain reason when it cannot work.",
            "technical": false
          },
          {
            "text": "<b>One Meta card on Integrations,</b> as you asked: Posting and Ads audit side by side — connect, choose accounts, sync, change accounts, open the audit, disconnect — with “choose ad accounts” and “sign in again” under Needs you. Meta returns you to whichever screen started the sign-in, and Meta Ads left the Coming soon list.",
            "full": "<b>One Meta card on Integrations</b> (SPEC-342/333 patches): its runs are the ad-account reads (Sync now, 7 h staleness), its Needs you includes “choose ad accounts” / “sign in again”, and its Settings tab has Posting and Ads audit parts on the same <code>/ads/platforms/*</code> endpoints and cache as the Audit tab. Meta Ads left the Coming soon list.",
            "technical": false
          }
        ],
        "built": "The read-only Meta Ads connection, the three-hourly read into six local tables, the figures and fixed-rule audit on a new Audit tab, and the Ads part of the one Meta card.",
        "why": "An agency’s first job is to read the account and find the waste; Performance Ads had a money-safety engine but had never seen a real ad.",
        "value": "Your ad account is read and audited automatically, with the spend at risk on each finding — the audit an agency would sell, without handing over the keys to change anything.",
        "shots": [
          {
            "route": "/ads · Audit",
            "caption": "Connect Meta Ads: what the audit reads, what it checks, and the promise that it never changes, pauses or spends.",
            "src": "/ci/d1001/ads-audit.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/ads · Overview",
            "caption": "The Paid Ads Manager's overview: spend against attributed profit, and what to run next.",
            "src": "/ci/d1001/ads-overview.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "06",
        "title": "“Between the click and the order” — matched by channel",
        "sub": "Backend SPEC-219 patch · frontend SPEC-284 patch — a pure channel-folding module.",
        "subTechnical": true,
        "ask": "“YES FIX IT AS WELL.”",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>Why it matched almost nothing:</b> the behaviour tool names a source “Facebook”, “L.Instagram.Com”, “Ig” or “Klaviyo”, while Shopify says “instagram”, a Facebook web address, “email” or a mail app’s id. Matching them letter for letter showed Instagram traffic with 0 orders.",
            "full": "<b>Why it matched almost nothing:</b> Clarity says <code>Facebook</code>, <code>L.Instagram.Com</code>, <code>Ig</code>, <code>Klaviyo</code>; Shopify says <code>instagram</code>, <code>https://facebook.com/</code>, <code>email</code>, Gmail’s app id. The exact join showed Instagram traffic with 0 orders.",
            "technical": false
          },
          {
            "text": "<b>Both sides now fold into one channel:</b> Meta is Facebook and Instagram, Email is Klaviyo and the mail apps, search engines by name, and your store’s own domains become one “Your own website” row.",
            "full": "<b>Both sides now fold into one channel</b> in <code>services/clarity/channels.py</code> (pure): Meta = Facebook + Instagram, Email = Klaviyo + mail apps, search engines by name, the store’s own domains into one “Your own website” row; rows carry <code>label</code> + <code>raw_sources</code>.",
            "technical": false
          },
          {
            "text": "<b>Each screen shows what it should:</b> the Ads card leaves out your own site and direct visits, and the Traffic table keeps them, labelled.",
            "full": "<b>Each screen shows what it should:</b> the Ads card leaves out your own site and direct visits, and the Traffic table keeps them, labelled.",
            "technical": false
          }
        ],
        "built": "A channel-folding step applied to both the behaviour data and the orders, and the Ads card and Traffic table updated to use it.",
        "why": "A card that says Instagram brought 0 orders sends you to cut the wrong channel.",
        "value": "The card now answers the question it asks — which channel’s visits turned into orders — so a channel is judged on its real results.",
        "shots": [
          {
            "route": "/traffic/website · Website",
            "caption": "Between the click and the order: each product page where visitors hit friction, ordered by the revenue behind it.",
            "src": "/ci/d1001/traffic-website.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "07",
        "title": "Digital Employees opens in the sidebar",
        "sub": "Frontend SPEC-329 — navigation only; no backend change.",
        "subTechnical": true,
        "ask": "“The Digital Employees navigation must have the chevron, on click all the FTEs we have open in a drop down and we navigate through here as well.”",
        "status": "Delivered",
        "effort": "1h 30m",
        "inside": [
          {
            "text": "<b>A chevron on the row</b> opens Spotlight, Social Growth, Performance Ads, Finance Oversight and Report FTE in the hub’s own order — each one click from any page. Before this, every employee was two clicks away, through the hub.",
            "full": "<b>A chevron on the row</b> opens Spotlight, Social Growth, Performance Ads, Finance Oversight and Report FTE in the hub’s own order — each one click from any page. Before this, every employee was two clicks away, through the hub.",
            "technical": false
          },
          {
            "text": "<b>It knows where you are:</b> the list stays open with the current employee highlighted while you are inside any of them.",
            "full": "<b>It knows where you are:</b> the list stays open with the current employee highlighted while you are inside any of them.",
            "technical": false
          },
          {
            "text": "<b>It follows the rest of the sidebar:</b> Finance Oversight appears only once QuickBooks is connected, and the row’s NEW badge is gone.",
            "full": "<b>It follows the rest of the sidebar:</b> progressive disclosure — Finance Oversight appears only once QuickBooks is connected; the row’s NEW badge is gone. <code>hubChildren</code> in <code>lib/navigation.ts</code>, <code>NavRow</code> in <code>components/layout/app-sidebar.tsx</code>.",
            "technical": false
          }
        ],
        "built": "The expandable Digital Employees row with the five employees, the open-while-inside rule and the current-employee highlight.",
        "why": "Employees you use every day should not sit behind a page you have to pass through each time.",
        "value": "Every AI employee is one click from anywhere in the app.",
        "shots": [
          {
            "route": "/employees",
            "caption": "Digital Employees, opened from the sidebar: every employee, its status and what it needs from you.",
            "src": "/ci/d1001/employees.webp",
            "width": 1400,
            "height": 972
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "Finance Oversight’s worth",
        "change": "a scorecard of how the books were run → an itemised ledger of money kept and lost, each line checkable",
        "why": "Measured money and estimates are never added into one number."
      },
      {
        "name": "Amounts in other currencies",
        "change": "added together as if they were one → converted at QuickBooks’ own rate, originals kept",
        "why": "A currency with no rate holds its company out instead of guessing."
      },
      {
        "name": "The Monday finance card",
        "change": "sent to the first user in the database → sent to the owner of your organization",
        "why": "On a shared platform the first user can be somebody else’s owner."
      },
      {
        "name": "Instagram in “Between the click and the order”",
        "change": "0 orders matched → matched by channel, Facebook and Instagram together as Meta",
        "why": "Clarity and Shopify spell the same source differently."
      }
    ],
    "next": [
      {
        "title": "Switch the app to a restricted database role",
        "body": "The isolation rules are built, proven and in place, but the database does not apply them to its owner account — they take effect once the app connects as a restricted role. The rollout steps are written in the specification.",
        "technical": false
      },
      {
        "title": "Create the one missing video table on the live database",
        "body": "The video-limit table was never created on the live database, a gap that predates today. Until the one-table instruction is run there, the video limit returns an error.",
        "technical": false
      },
      {
        "title": "Meta App Review for reading ads",
        "body": "Meta must approve the read-ads permission before businesses outside the app’s own Business Manager can connect their accounts.",
        "technical": false
      },
      {
        "title": "Decide whether Finance Oversight is plan-gated",
        "body": "Gating Finance by package was left as part of the one-card pricing decision.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "Read-only toward QuickBooks and Meta, enforced by tests",
        "body": "The build fails if a write verb appears in the finance service, or if the Meta Ads package ever asks for the permission to manage ads. Nothing here can pay a bill or change an ad.",
        "technical": false
      },
      {
        "title": "One test failure predates today",
        "body": "A spending-cap test fails identically on a checkout from before today’s work; it is not caused by these changes. Every other backend test passed.",
        "technical": false
      },
      {
        "title": "Proven on throwaway databases first",
        "body": "Isolation, restore and load tests ran on throwaway databases. The live database was migrated on your instruction — “run any migration remains”.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d0930",
    "kind": "daily",
    "period": "Wednesday, Sep 30, 2026",
    "sortDate": "2026-09-30",
    "hook": "An Integrations page that tells the truth, a Morning Brief that opens in well under half a second, enforced video and image limits, and an operator console on real sign-ups and real revenue",
    "memo": "Today rebuilt the <b>Integrations page</b> the way enterprise software does it: a health strip, a <i>Needs you</i> card with a plain reason and the fix for anything that needs you, one page per app with its sync history and permissions, and a connect step that <b>tests a key before it saves it</b> — and the page no longer contradicts itself about what is connected. The <b>Morning Brief</b> no longer does its heavy work while you wait: it is computed after every 15-minute sync, so on a production-sized store the page went from 2.86 s to 0.19–0.38 s, and the Dashboard revisit from 2.16 s to 0.65 s. Each package’s <b>video and image limits</b> are now counted and enforced, and a failed video never uses one up. In the operator console, every Ecommerce tab was checked against the live data: <b>revenue now counts only what is actually charged</b>, AI run on a customer’s own keys is visible, and a new <b>sign-up journey</b> shows who is stuck at which of seven steps, longest wait first. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "21h",
    "views": "4 screens",
    "areas": 6,
    "days": [
      {
        "title": "Integrations that tell the truth",
        "body": "A health strip, <i>Needs you</i> cards with the reason and the fix, a page per app, and a connect dialog that tests a login before it saves it. The page’s contradictions — “only Shopify is connected”, Meta Ads “Coming soon” under a live Meta connection — are gone.",
        "technical": false
      },
      {
        "title": "The Brief, computed before you open it",
        "body": "Its heavy work now runs after every sync. Measured on a production-sized store: <b>2.86 s → 0.19–0.38 s</b> for the Brief, <b>2.16 s → 0.65 s</b> for a Dashboard revisit.",
        "technical": false
      },
      {
        "title": "Package limits on videos and images, enforced",
        "body": "Each package’s monthly videos and images are counted and enforced; a failed video is given back, and Settings shows how many are used this month.",
        "technical": false
      },
      {
        "title": "The operator console on real numbers",
        "body": "Revenue counts only Stripe-billed packages, own-key AI spend is shown, and a seven-step sign-up journey names exactly who is waiting and why.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "The Integrations hub — every connection, its health and its fix",
        "sub": "Backend SPEC-337 · frontend SPEC-328 — five new endpoints; the integration cards read in one query.",
        "subTechnical": true,
        "ask": "“Make it real now … proper model if any app not connected and all thing properly.”",
        "status": "Delivered",
        "effort": "5h",
        "inside": [
          {
            "text": "<b>One page that says what works.</b> A health strip across the top, then a <i>Needs you</i> card for every connection that needs the owner, each with a plain reason and the fix, and the last 24 syncs of each app.",
            "full": "<b>One page that says what works.</b> A health strip across the top, then a <i>Needs you</i> card for every connection that needs the owner, each with a plain reason and the fix, and the last 24 syncs of each app — <code>GET /integrations/overview</code>, four reads in one gather.",
            "technical": false
          },
          {
            "text": "<b>Five views:</b> Connected (as a list, as cards or by area), Browse apps, Activity — syncs and audited changes in one timeline — and Included in your plan (the AI allowance and your own key, your own mail server, the Shopify permissions). Each app shows its own logo.",
            "full": "<b>Five views:</b> Connected (as a list, as cards or by area), Browse apps, Activity — syncs and audited changes in one timeline (<code>GET /integrations/activity</code>, paged) — and Included in your plan (the AI allowance and your own key, your own mail server, the Shopify permissions). Each app shows its own logo.",
            "technical": false
          },
          {
            "text": "<b>A page per app</b> with Overview, Settings, Sync history and Permissions, a <i>Sync now</i> that refuses a second run, and a proper Disconnect button.",
            "full": "<b>A page per app</b> with Overview, Settings, Sync history and Permissions, a <i>Sync now</i> that refuses a second run (<code>POST /integrations/{key}/sync</code>), and a proper Disconnect button (<code>DELETE /integrations/{key}</code>, key apps only, audited).",
            "technical": false
          },
          {
            "text": "<b>Test before save.</b> Connecting an app with a key tries the login with one read-only call first and saves nothing if it fails — the vendor’s own error text never reaches the screen. Google, Meta and QuickBooks sign-ins return you to that app’s own Settings tab.",
            "full": "<b>Test before save.</b> Connecting an app with a key tries the login with one read-only call first and saves nothing if it fails (<code>POST /integrations/{key}/test</code>) — the vendor’s own error text never reaches the screen. Google, Meta and QuickBooks sign-ins return you to that app’s own Settings tab.",
            "technical": false
          },
          {
            "text": "<b>The contradictions are gone:</b> the header no longer says only Shopify is connected, “Meta Ads — Coming soon” no longer sits under a live Meta connection, the “Built to extend” card is removed, and iPacky and V-Count sync times say “store time” instead of “(NY)” for every customer.",
            "full": "<b>The contradictions are gone:</b> the header no longer says only Shopify is connected, “Meta Ads — Coming soon” no longer sits under a live Meta connection, the “Built to extend” card is removed, and iPacky and V-Count sync times say “store time” instead of “(NY)” for every customer. The in-app doc no longer names the first client’s companies, and <code>IntegrationSettingsService.describe</code> reads all of a store’s rows in one query instead of seven.",
            "technical": false
          }
        ],
        "built": "The status, activity, test, sync and disconnect endpoints, and the hub page over them — health strip, Needs you, four views, a page per app and a test-first connect dialog.",
        "why": "A page of forms that never said whether a connection worked is a page the owner has to check by hand, and one that contradicted itself could not be trusted at all.",
        "value": "One look tells you which systems are healthy, which need you and exactly what to do about it — and a bad key is caught before it is saved, not after a sync fails.",
        "shots": [
          {
            "route": "/integrations · Connected",
            "caption": "Connection health at the top, then every connected app with its status, last sync, recent runs and the pages it powers.",
            "src": "/ci/d0930/integrations.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/integrations · Browse apps",
            "caption": "Browse apps: what else can be connected, and what each one adds.",
            "src": "/ci/d0930/integrations-browse.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "The Morning Brief, computed after the sync instead of while you wait",
        "sub": "Backend SPEC-336 — a per-process view cache, refreshed by a fifth step after every 15-minute sync.",
        "subTechnical": true,
        "ask": "“Have the Brief computed after each 15-minute sync and saved … I do not want such types of issue any more.”",
        "status": "Delivered",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "<b>Measured first.</b> On a production-sized copy of a store — 650,000 orders, 1.76 million order lines, 150,000 customers — the Brief page took 2.86 s, and one statement dominated it: every customer’s lifetime orders and spend, 1.7 s, run twice per page open.",
            "full": "<b>Measured first.</b> On a production-sized local Postgres — 650,000 orders, 1.76 million order lines, 150,000 customers — the Brief page took 2.86 s, and one statement dominated it: <code>customer_order_stats</code>, 1.7 s, one row per customer, run twice per page open (once by the Brief, once by Win-back).",
            "technical": false
          },
          {
            "text": "<b>The 40–50 seconds you saw</b> was that work multiplied by a database reached over the public internet; the same code beside its database costs about 3 s — still too slow for the first page of the morning.",
            "full": "<b>The 40–50 seconds you saw</b> was that work multiplied by a laptop reaching the database over Railway’s public proxy; the same code beside its database costs about 3 s — still too slow for the first page of the morning.",
            "technical": false
          },
          {
            "text": "<b>Now the heavy part runs once per sync:</b> the Brief’s inputs, the dormant VIPs (shared by the Brief and Win-back) and the Dashboard’s money strip are refreshed right after every sync. Today’s approve/skip and the comparison snapshot stay live.",
            "full": "<b>Now the heavy part runs once per sync:</b> <code>services/view_cache.py</code> (single-flight, 20-minute ceiling) holds the Brief’s inputs, the dormant VIPs (shared by the Brief and Win-back) and <code>/dashboard/money</code>; lane A’s new fifth step <code>views_warm</code> refreshes them after every sync. Today’s approve/skip and the comparison snapshot stay live. The response shape is unchanged.",
            "technical": false
          },
          {
            "text": "<b>The result:</b> the Brief page from 2.86 s to 0.19–0.38 s, and a Dashboard revisit from 2.16 s to 0.65 s, with 12 new tests.",
            "full": "<b>The result:</b> the Brief page from 2.86 s to 0.19–0.38 s, and a Dashboard revisit from 2.16 s to 0.65 s; 12 new tests in <code>tests/test_brief_precomputed.py</code>, backend suite green.",
            "technical": false
          }
        ],
        "built": "A shared view cache with one in-flight computation at a time, the split of the Brief into a cached base and a small live overlay, and a sync step that refreshes it.",
        "why": "The Brief is the first thing you open every morning; a page that makes you wait for work the system could have done fifteen minutes earlier is the wrong way round.",
        "value": "The morning page is ready when you are — the expensive work is already done by the time you open it.",
        "shots": [
          {
            "route": "/brief",
            "caption": "The Morning Brief, read from figures computed after the sync: yesterday, today's decisions, the overnight watch and integration health.",
            "src": "/ci/d0930/brief.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "03",
        "title": "Package limits on videos and images, counted and enforced",
        "sub": "Backend SPEC-335 · frontend SPEC-327 — migration 0138 adds one row per video started.",
        "subTechnical": true,
        "ask": "“We limit the videos and images per package.”",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>A video counts when it starts</b>, and if that generation fails it is given back — a failure never uses up a video. Before this, the console’s “videos used” was really counting seconds of video.",
            "full": "<b>A video counts when it starts</b> (a <code>video_generations</code> row, migration <code>0138</code>), and if that generation fails it is marked refunded — a failure never uses up a video. Before this, the console’s “videos used” was really counting ledger seconds.",
            "technical": false
          },
          {
            "text": "<b>An image counts when it is made</b>, and once the month’s allowance is used the next one is refused before the image provider is ever called — social images, carousel slides, blog headers and style tests alike.",
            "full": "<b>An image counts when it is made</b>, and once the month’s allowance is used the next one is refused before the image provider is ever called — <code>MeteredImageProvider._guard</code> covers social images, carousel slides, blog headers and style tests (<code>media_limit_reached</code>, 402).",
            "technical": false
          },
          {
            "text": "<b>The allowance</b> is the package’s limit plus anything extra granted from the console this month; a package with no limit set has none, and the operator’s unmetered switch lifts it. If the check itself fails, generation goes through — a blip never switches it off.",
            "full": "<b>The allowance</b> is the package’s limit plus this month’s operator grants; a <code>null</code> limit is no limit and <code>ai_unmetered</code> lifts it. If the check itself fails, generation goes through and the error is logged — a blip never switches it off.",
            "technical": false
          },
          {
            "text": "<b>You see where you stand:</b> Settings → Billing shows videos and images used this month, of how many, with the reset date, and Social says plainly when a package limit is reached instead of “try again”.",
            "full": "<b>You see where you stand:</b> Settings → Organization → Billing & plan shows “Videos & images this month” (from <code>media</code> on <code>GET /billing/ai-allowance</code>), and Social shows the limit sentence instead of “Image generation failed — try again” (<code>imageFailure</code> in <code>lib/social-post.ts</code>).",
            "technical": false
          }
        ],
        "built": "The per-video record and its refund, the image check at the one place every image passes, the two meters in Billing and a plain refusal on Social.",
        "why": "A limit that is recorded but not enforced is a price list, not a package — and a customer should see the limit coming, not discover it as an error.",
        "value": "Packages now mean what they say, and the console and the product count videos the same way, so they can never disagree.",
        "shots": [
          {
            "route": "/settings/billing · Billing & plan",
            "caption": "Videos & images this month: the package's allowance, counted against what was generated.",
            "src": "/ci/d0930/settings-billing.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "Operator console: revenue that counts only what is charged, and AI on customers’ own keys",
        "sub": "Backend SPEC-333 · admin frontend SPEC-003 — operator API and the console’s Overview, Customers, Revenue and AI screens.",
        "subTechnical": true,
        "ask": "“Check the previous tabs are actually completed.”",
        "status": "Delivered",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "<b>Every Ecommerce tab checked against the live data</b> — Overview, Customers, Packages, Revenue, AI & usage and Health — and what was wrong fixed.",
            "full": "<b>Every Ecommerce tab checked against the live data</b> — Overview, Customers, Packages, Revenue, AI & usage and Health — and what was wrong fixed (backend <code>c7de843</code>, admin frontend <code>f54885a</code>).",
            "technical": false
          },
          {
            "text": "<b>Revenue counted a package nobody pays for:</b> the first client’s $1,200 package is given without a card, yet it was counted as monthly revenue. Revenue now counts Stripe-billed packages only; packages not charged are shown beside it and labelled “Not charged” on Overview, Customers, the customer page and Revenue.",
            "full": "<b>Revenue counted a package nobody pays for:</b> the first client’s $1,200 package is on the dummy provider (no card), yet it was counted in MRR. Revenue, the trend, revenue by package and the subscriptions summary now count Stripe-billed packages only; <code>not_charged_*</code> fields report the rest, labelled “Not charged”.",
            "technical": false
          },
          {
            "text": "<b>AI on a customer’s own keys was invisible:</b> a customer running entirely on its own keys showed $0 and no biggest AI cost ($57.98 that month). Own-key spend now shows beside the platform’s cost, and “Unmetered — the platform carries it” became “No AI limit (unmetered)”.",
            "full": "<b>AI on a customer’s own keys was invisible:</b> a customer running entirely on its own keys showed $0 and no biggest AI cost ($57.98 that month). <code>ai_own_key_cents</code> now shows beside the platform’s cost, AI by feature includes both keys, and “Unmetered — the platform carries it” became “No AI limit (unmetered)”.",
            "technical": false
          },
          {
            "text": "<b>Integration names are the product’s own:</b> “Smtp”, “Vcount” and “Ipacky” now read SMTP (email), V-Count and iPacky.",
            "full": "<b>Integration names are the product’s own:</b> “Smtp”, “Vcount” and “Ipacky” now read SMTP (email), V-Count and iPacky.",
            "technical": false
          }
        ],
        "built": "Charged-only revenue with the not-charged packages reported beside it, own-key AI spend next to the platform’s, and the product’s own integration names.",
        "why": "A revenue figure that includes a package nobody pays for overstates the business, and an AI cost that hides own-key spend understates what each customer really uses.",
        "value": "The console’s money figures now match what Stripe actually collects, and every customer’s AI use is visible whoever pays for it.",
        "shots": []
      },
      {
        "n": "05",
        "title": "Operator console: the sign-up journey, step by step",
        "sub": "Backend SPEC-334 · admin frontend SPEC-003 — three reads in one gather, then pure rules.",
        "subTechnical": true,
        "ask": "“Then the Funnel: what, why, which values.”",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>Seven real steps</b> every person who signed up passes through: signed up, verified email, created their company, chose a package, paid, connected Shopify, store ready. Invited users are left out.",
            "full": "<b>Seven real steps</b> every person who signed up passes through: signed up, verified email, created their company, chose a package, paid, connected Shopify, store ready. Invited users are left out.",
            "technical": false
          },
          {
            "text": "<b>Per step:</b> how many reached it, how many are stuck before it, and the usual time from the step before. Notes say what the step means — Google and Shopify sign-ups are verified automatically, a package given without a card passes “Paid”, a failed first sync is counted and named.",
            "full": "<b>Per step:</b> how many reached it, how many are stuck before it, and the median hours from the step before. Notes say what the step means — Google and Shopify sign-ups are verified automatically, a package given without a card passes “Paid”, a failed first sync is counted and named.",
            "technical": false
          },
          {
            "text": "<b>“N stuck” lists exactly who is waiting</b>, longest first, with the first-sync error, filtered by period and sign-up method.",
            "full": "<b>“N stuck” lists exactly who is waiting</b>, longest first, with the first-sync error (<code>GET /operator/funnel/people?step=</code>), filtered by period and sign-up method.",
            "technical": false
          },
          {
            "text": "<b>It survives an older backend:</b> the new Funnel first crashed against the live backend, which did not yet send the newer fields; the screens now fill them with safe defaults, so the two apps can be deployed at different times.",
            "full": "<b>It survives an older backend:</b> the new Funnel first crashed against the live backend (<code>methods</code> undefined); <code>normalizeFunnel</code> and guarded fields now give newer fields safe defaults, so the two apps can be deployed at different times.",
            "technical": false
          }
        ],
        "built": "The seven-step journey in the operator API, the stuck-people list, and the rebuilt Funnel screen with its filters and notes.",
        "why": "A funnel of page views says nothing about why a paying customer never arrived; a journey of real steps says who is waiting and where.",
        "value": "You can see every person who started signing up, the step they are stuck on and how long they have waited — a list to act on, not a chart to admire.",
        "shots": []
      },
      {
        "n": "06",
        "title": "Operator console: Ecommerce only, live data only, and its own deploy",
        "sub": "Admin backend SPEC-005 (the bridge) · SPEC-006 (Railway) · admin frontend SPEC-003.",
        "subTechnical": true,
        "ask": "Run the admin panel’s Ecommerce section on real data, tab by tab.",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>The console is the Ecommerce section.</b> Its sidebar lists only Ecommerce, and signing in goes straight there; the older screens that read tables the console’s own database does not hold are no longer linked.",
            "full": "<b>The console is the Ecommerce section.</b> Its sidebar lists only Ecommerce, and signing in goes straight there; the older screens that read tables the console’s own database does not hold are no longer linked.",
            "technical": false
          },
          {
            "text": "<b>Real data only:</b> the sample dataset and its switch are removed, so every screen always reads Ecommerce FTE and the badge reads “Live data”. Trials & coupons, Announcements and Settings say plainly that they are not built in Ecommerce FTE yet.",
            "full": "<b>Real data only:</b> the sample dataset, its adapter and the <code>NEXT_PUBLIC_ECOMMERCE_DATA</code> switch are removed, so every screen always reads the operator API through the admin backend and the badge reads “Live data”. Trials & coupons, Announcements and Settings show their “not built in Ecommerce FTE yet” panel.",
            "technical": false
          },
          {
            "text": "<b>A guarded bridge:</b> the console reaches Ecommerce FTE only for a signed-in admin, only on an allowed list of paths, with a short-lived signed pass; every write is recorded in the audit log, and a network failure never shows the address or the secret.",
            "full": "<b>A guarded bridge:</b> <code>/api/v1/admin/ecommerce/{path}</code> needs a signed-in admin, forwards only allow-listed paths, and signs a two-minute token with <code>ECOMMERCE_OPERATOR_SECRET</code>; every write is recorded in <code>admin_audit_log</code>, and a network failure is a 502 that never leaks the URL or the secret.",
            "technical": false
          },
          {
            "text": "<b>It can now deploy:</b> the first Railway deploy failed with “No start command detected”. The console’s backend now says how it is built, migrated and started, with a health check — verified by building and running it against a throwaway database.",
            "full": "<b>It can now deploy:</b> the first Railway deploy failed with “No start command detected”. A <code>Dockerfile</code>, <code>railway.json</code> (migrations before every deploy, <code>GET /health</code>) and <code>.dockerignore</code> now say how it is built and run — verified by running the Railway sequence against a throwaway Postgres (migrations 0001–0003, start in production, <code>/health</code> 200).",
            "technical": false
          },
          {
            "text": "<b>Two configuration traps closed:</b> the database address is accepted in Railway’s own form, and production no longer refuses to start without a seed password — while the seed script refuses to run without one, so it can never reset the admin password to a default.",
            "full": "<b>Two configuration traps closed:</b> <code>DATABASE_URL</code> accepts Railway’s <code>postgres://</code> form, and <code>ADMIN_SEED_PASSWORD</code> is optional in production (<code>change-me</code> is still refused) while <code>scripts.seed_admin</code> refuses to run without one.",
            "technical": false
          }
        ],
        "built": "The console narrowed to the Ecommerce section on live data only, the signed bridge to Ecommerce FTE, and the Railway build, migrate and health-check setup.",
        "why": "A console that can show sample numbers is a console whose numbers you have to double-check; one that cannot deploy is not a console at all.",
        "value": "Every figure in the operator console now comes from the real platform, through a guarded and audited path, from a backend that deploys cleanly.",
        "shots": []
      }
    ],
    "tiers": [
      {
        "name": "The Morning Brief page",
        "change": "2.86 s → 0.19–0.38 s",
        "why": "Measured on a production-sized store; the heaviest statement now runs once per sync instead of twice per page open."
      },
      {
        "name": "A Dashboard revisit",
        "change": "2.16 s → 0.65 s",
        "why": "The money strip is computed after the sync, not on the visit."
      },
      {
        "name": "The integration cards",
        "change": "seven database reads per view → one",
        "why": "Same response, one query."
      },
      {
        "name": "Revenue in the operator console",
        "change": "counted a package nobody pays for → counts Stripe-billed packages only",
        "why": "Packages given without a card are shown beside it, labelled “Not charged”."
      }
    ],
    "next": [
      {
        "title": "Trials, coupons, announcements and settings in the console",
        "body": "These three Ecommerce screens say plainly that Ecommerce FTE has not built them yet; their sample-only editors were removed rather than left showing made-up data.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "Measured on a production-sized copy, not your live database",
        "body": "The Brief timings come from a local database loaded to the size of a real store — 650,000 orders, 150,000 customers — built by the real migration chain. Nothing was run against your live data to measure it.",
        "technical": false
      },
      {
        "title": "Three tests failed while another session was editing",
        "body": "The full backend suite passed 3,369 tests; three scheduler and Brief tests failed during a concurrent session’s edit and pass on re-run.",
        "technical": false
      },
      {
        "title": "The console was checked on throwaway databases",
        "body": "The sign-up journey was tested in the browser against throwaway databases only — 3,340 backend and 46 console tests.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d0929",
    "kind": "daily",
    "period": "Tuesday, Sep 29, 2026",
    "sortDate": "2026-09-29",
    "hook": "An Ecommerce section in the admin panel on real data, packages moved into the database, Settings redesigned, and one tab style across the app",
    "memo": "Today you got <b>a place to run Ecommerce FTE as its owner</b>: a new Ecommerce section in the admin panel — thirteen pages covering customers, packages and their internal economics, revenue, AI cost, video and image use, health, the funnel, data-request deadlines and an audit log — reading <b>real organizations, subscriptions and AI spend</b> through a signed operator API. <b>Packages now live in the database</b> and are edited from the admin panel; the $500 package carries the AI and compute costs you entered, and its AI allowance now follows that AI budget — <b>$200, up from $50</b>. Inside the app, <b>Settings was rebuilt</b> to the mockup you approved, with new Organization, Billing & plan, Profile and Security tabs; the <b>folder tabs</b> you picked now run across every page’s tab bar; and Pricing became one card with a revenue dropdown. The white-label review’s leftovers were closed — Continuous Innovation is locked to its own organization and the first client’s names are gone from screens and the AI — and the last tenancy fix makes chat check membership on <i>every</i> request. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "21h",
    "views": "6 screens",
    "areas": 6,
    "days": [
      {
        "title": "Run the business from the admin panel",
        "body": "Thirteen pages: customers, packages, revenue, AI cost, video and image use, health, funnel, data requests and an audit log — every list paged, sorted, searchable and filterable.",
        "technical": false
      },
      {
        "title": "Packages, real and editable",
        "body": "The three packages are rows in the database, edited from the admin panel. The $500 package’s AI allowance follows the AI cost you entered: <b>$200, up from $50</b>.",
        "technical": false
      },
      {
        "title": "Settings, redesigned",
        "body": "A full-width tab bar, a skeleton per tab, and new Organization, Billing & plan, Profile and Security tabs — every existing link unchanged.",
        "technical": false
      },
      {
        "title": "Closed to everyone but its owner",
        "body": "Continuous Innovation is checked against its organization before it renders, and a member removed from an organization loses chat at once.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "The admin panel’s Ecommerce section — thirteen pages to run the product",
        "sub": "Admin frontend SPEC-003 — the operator console’s Ecommerce section.",
        "subTechnical": true,
        "ask": "“Create a special page on the admin panel for our ecommerce … I want all and all things there” — with “proper pagination, proper UI, proper skeleton loading”.",
        "status": "Delivered",
        "effort": "5h 30m",
        "inside": [
          {
            "text": "<b>Thirteen pages behind one tab bar:</b> Overview (revenue, this month’s margin once costs are entered, AI cost against budget, customers at risk with the reason, usage, funnel), Customers, Packages, Revenue, AI & usage, Health, Funnel, Trials & coupons, Announcements, Data requests with their 30-day deadlines, Settings and an Audit log.",
            "full": "<b>Thirteen pages behind one persistent tab bar</b> (admin frontend SPEC-003): Overview (revenue, this month’s margin once costs are entered, AI cost against budget, customers at risk with the reason, usage, funnel), Customers, Packages, Revenue, AI & usage, Health, Funnel, Trials & coupons, Announcements, Data requests with their 30-day deadlines, Settings and an Audit log.",
            "technical": false
          },
          {
            "text": "<b>A customer’s page has eight tabs</b> and the owner’s levers: suspend or reactivate, view as the customer with a reason, change package, grant extra videos or images, and switch features on or off.",
            "full": "<b>A customer’s page has eight tabs</b> and the owner’s levers: suspend or reactivate, view as the customer with a reason, change package, grant extra videos or images, and switch features on or off.",
            "technical": false
          },
          {
            "text": "<b>Packages show their economics:</b> price, revenue band, video and image limits, and the internal AI, compute and other costs with a live margin. You enter every cost line yourself — nothing is assumed and no profit figure is invented; limits are on videos and images only.",
            "full": "<b>Packages show their economics:</b> price, revenue band, video and image limits, and the internal AI, compute and other costs with a live margin. You enter every cost line yourself — nothing is assumed and no profit figure is invented; limits are on videos and images only.",
            "technical": false
          },
          {
            "text": "<b>Every list</b> has numbered pagination, page size, sort, search and filters kept in the link; every page has a real-layout skeleton, an error state with Retry and an empty state. Checked in the browser at desktop and phone widths.",
            "full": "<b>Every list</b> has numbered pagination, page size, sort, search and filters kept in the URL; every page has a real-layout skeleton, an error state with Retry and an empty state. Browser-verified at 1440 px and 390 px; the repo gained Vitest (31 tests) and its builds now type-check.",
            "technical": false
          },
          {
            "text": "Before the live data existed it ran on a clearly labelled sample (“Sample data” badge, changes kept to the tab); one setting switches it to the real operator API.",
            "full": "It reads a typed contract (<code>lib/ecommerce/types.ts</code>); before the operator API existed it ran on a labelled deterministic sample (“Sample data” badge, changes kept to the tab), and <code>NEXT_PUBLIC_ECOMMERCE_DATA=live</code> switches it.",
            "technical": false
          }
        ],
        "built": "A new Ecommerce entry in the admin panel’s sidebar with thirteen pages, an eight-tab customer view and full list controls, built screens-first against a typed contract.",
        "why": "Running a SaaS means seeing every customer, package and cost in one place — not reading the database.",
        "value": "One console for the business behind the product: who is paying, what each package earns, what the AI costs and who is at risk.",
        "shots": []
      },
      {
        "n": "02",
        "title": "Packages in the database, and real data behind every admin screen",
        "sub": "Backend SPEC-332 · admin backend SPEC-005 · admin frontend SPEC-003 “Live data” — migration 0137.",
        "subTechnical": true,
        "ask": "“For packages I want real data, in database … make sure org, user and relevant to all things are real … the AI usage … real.”",
        "status": "Delivered · video and image limits recorded, not yet enforced",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>The three packages are now rows in the database</b>, and every place that reads a plan — pricing, choosing a plan, checkout, the Stripe record, the AI allowance — reads them. The public plans list is unchanged.",
            "full": "<b>Migration 0137 adds <code>plans</code></b> (seeded with the three plans), <code>usage_grants</code> and <code>operator_audit_events</code>; every plan read — pricing, choose, checkout, the Stripe record, organization setup, the AI allowance — now reads the table. The public <code>/plans</code> is unchanged.",
            "technical": false
          },
          {
            "text": "<b>The $500 package carries your numbers:</b> $200 of AI and $100 of compute; every other cost and limit is left empty for you to enter. A package’s AI allowance is now its AI budget (else 10% of its price), so the $500 package’s allowance is <b>$200, up from $50</b>.",
            "full": "<b>The $500 package carries your numbers:</b> $200 of AI and $100 of compute; every other cost and limit is left empty for you to enter. A package’s AI allowance is now its AI budget (else 10% of its price), so the $500 package’s allowance is <b>$200, up from $50</b>.",
            "technical": false
          },
          {
            "text": "<b>A signed operator API</b> serves the overview, customers, packages, subscriptions, usage, health, funnel, privacy requests and its own audit trail — and accepts suspend/reactivate, feature switches, extra video and image grants, package changes and package edits.",
            "full": "<b>The operator API</b> (<code>/api/v1/operator/*</code>, a 2-minute HS256 token signed with <code>OPERATOR_API_SECRET</code>, off when unset) serves overview, customers, packages, subscriptions, usage, health, funnel, privacy requests and its own audit trail, and writes suspend/reactivate, features, unit grants, dummy-billed package changes (Stripe-billed: 409) and package edits (bands validated).",
            "technical": false
          },
          {
            "text": "<b>The admin panel never holds the key to the product:</b> its backend checks the operator, signs a short-lived token and forwards only allow-listed paths. A package change for a Stripe-billed customer is refused rather than half-done.",
            "full": "<b>The bridge</b> (admin backend SPEC-005, <code>/api/v1/admin/ecommerce/*</code>) checks the operator, signs the token and forwards allow-listed paths only; a package change for a Stripe-billed customer answers 409.",
            "technical": false
          },
          {
            "text": "On the screens, package names and filters come from the data; an unset limit reads “No limit set”; trials, coupons, announcements, settings and view-as say plainly that they are not built yet. Video and image limits are recorded and shown, <b>not enforced yet</b>.",
            "full": "On the screens, package keys, names and filters come from the data; an unset limit reads “No limit set”; trials, coupons, announcements, settings and view-as say they aren’t built yet. Video/image limits are recorded and shown, <b>not enforced yet</b>. Tests: backend 3,336 (31 operator), admin backend 45 (9 new), admin frontend 38.",
            "technical": false
          }
        ],
        "built": "The packages table and its seed, every plan read moved onto it, the operator API with its audit trail, the admin backend’s signed bridge, and the admin screens switched to live data.",
        "why": "A package that lives in code can only be changed by a developer; a number the owner did not enter is a number nobody can defend.",
        "value": "You set prices, costs and limits yourself, and every admin screen shows the real organizations, subscriptions and AI spend behind them.",
        "shots": []
      },
      {
        "n": "03",
        "title": "Settings, redesigned — a tab bar, new account and billing tabs",
        "sub": "Frontend SPEC-324 · backend SPEC-331.",
        "subTechnical": true,
        "ask": "“Tab bar not sidebar, full width, skeleton on every tab, custom dropdowns … cache it like every page, roles see only their tabs, keep the manager-email link” — with no two-factor sign-in, data export or delete-organization.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>A two-row tab bar</b>, full width: Store · Organization · Account first, then that group’s tabs. One panel style, a skeleton shaped like each tab, and revisits served from the cache.",
            "full": "<b>A two-row tab bar</b>, full width: Store · Organization · Account first, then that group’s tabs. One panel style, a skeleton shaped like each tab, and revisits served from the cache.",
            "technical": false
          },
          {
            "text": "<b>Custom time dropdowns</b> that keep the saved minute, and the design-system checkbox in the role grid. Tabs follow the member’s role; a tab that isn’t theirs sends them to their own first tab.",
            "full": "<b>Custom time dropdowns</b> that keep the saved minute, and the design-system checkbox in the role grid. Tabs follow the member’s role; a tab that isn’t theirs sends them to their own first tab.",
            "technical": false
          },
          {
            "text": "<b>New tabs:</b> Organization (name, login link, calendar); Billing & plan (plan, AI allowance, Stripe invoices, change plan through checkout and back, the Stripe customer portal); Audit log, moved out of Team; Profile, where the name now really saves; and Security — change or set a password, see where you’re signed in, sign out one device or all the others.",
            "full": "<b>New tabs:</b> Organization (name, login link, calendar); Billing & plan (plan, AI allowance, Stripe invoices, change plan through Checkout and back, Stripe customer portal); Audit log (moved out of Team); Profile (the name now really saves — <code>PATCH /auth/me</code>); Security (change or set a password, where you’re signed in, sign out one or all others).",
            "technical": false
          },
          {
            "text": "<b>Nothing you rely on moved:</b> every existing link and the manager-email deep link are unchanged, and no saved value was migrated.",
            "full": "<b>Nothing you rely on moved:</b> every existing URL and the manager-email deep link are unchanged; no saved value is migrated. Frontend 2,177 tests and build green; backend account/billing suites 32 green.",
            "technical": false
          }
        ],
        "built": "The redesigned Settings shell and its tabs, plus the backend’s account, sessions, billing-portal and organization-name endpoints behind the new ones.",
        "why": "Settings had grown into a sidebar of mixed concerns; billing, security and your own profile had nowhere to live.",
        "value": "Everything about the store, the organization and your own account in one predictable place — and each member sees only the tabs their role allows.",
        "shots": [
          {
            "route": "/settings/profile · Account",
            "caption": "The redesigned Settings: Store, Organization and Account across the top, each with its own tabs. Account › Profile.",
            "src": "/ci/d0929/settings-profile.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/security · Account",
            "caption": "Account › Security: the password, and every device signed in, each one removable.",
            "src": "/ci/d0929/settings-security.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/billing · Organization",
            "caption": "Organization › Billing & plan.",
            "src": "/ci/d0929/settings-billing.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "One tab style across the app, and pricing on one card",
        "sub": "Frontend SPEC-325 · SPEC-326 · marketing SPEC-016 Patches.",
        "subTechnical": true,
        "ask": "You picked design #5, “Connected folder”, from ten mockups: “make it implement throughout the app … mobile responsive as well” — and mockup #4 for pricing.",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>One shared folder-tab component on all 19 page tab bars</b>, plus Brand Brain inside Spotlight. The open tab joins the panel its page opens in, in both themes.",
            "full": "<b>One shared component</b> (<code>components/shared/folder-tabs.tsx</code>) on all 19 page tab bars, plus Brand Brain nested inside Spotlight; the open tab joins its panel through a <code>--tab-panel</code> token in both themes.",
            "technical": false
          },
          {
            "text": "<b>On phones</b> the bar scrolls sideways with edge fades and brings the open tab into view. The focus ring shows for the keyboard only, so a click no longer leaves a box. No link or data behaviour changed.",
            "full": "<b>On phones</b> the bar scrolls sideways with edge fades and brings the open tab into view. The focus ring shows for the keyboard only, so a click no longer leaves a box. No link or data behaviour changed.",
            "technical": false
          },
          {
            "text": "<b>Pricing becomes one card</b> with a revenue dropdown: price, cost per day and the AI included change in place. “Choose this plan” keeps its exact link, and the page’s tabs take the “Binder stairs” style.",
            "full": "<b>Pricing becomes one card</b> with a revenue dropdown (SPEC-326): price, cost per day and AI included change in place; “Choose this plan” keeps its exact link (<code>/signup?plan=</code> / <code>/onboarding?plan=</code>); the folder tabs there switch to the Binder stairs style. Frontend 2,183 tests and build green.",
            "technical": false
          },
          {
            "text": "<b>The marketing site’s pricing copy</b> now says plans are paid monthly by card through Stripe’s secure checkout, instead of saying no card is needed.",
            "full": "<b>Marketing site:</b> the FAQ and <code>llms.txt</code> no longer say no card is needed to start; plans are paid monthly by card through Stripe’s checkout (SPEC-016 patch).",
            "technical": false
          }
        ],
        "built": "A single tab component rolled out to every tab bar with its phone behaviour, the one-card pricing layout, and the matching marketing copy.",
        "why": "Nineteen slightly different tab bars read as nineteen different products; three side-by-side plan cards made a visitor compare instead of choose.",
        "value": "The app looks like one product on every page and every screen size, and a visitor picks their revenue band and sees their price at once.",
        "shots": [
          {
            "route": "/products · Overview",
            "caption": "One tab style across the app: the Product Analyst's tabs, drawn the same way as every other page's.",
            "src": "/ci/d0929/products-tabs.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/pricing",
            "caption": "Pricing on one card: choose your revenue band, see the price and what you get.",
            "src": "/ci/d0929/pricing.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "The white-label review’s leftovers, closed",
        "sub": "Frontend SPEC-323 · backend SPEC-330 — guard tests in both repos.",
        "subTechnical": true,
        "ask": "An external review rated the platform 8.5/10 and listed what customer #2 would still see of the first client. Your answer: “yes please” — close them.",
        "status": "Delivered",
        "effort": "2h",
        "inside": [
          {
            "text": "<b>Continuous Innovation is locked to its organization:</b> any organization’s member could previously open those reports by typing the link. The page now checks the organization’s feature on the server before rendering, and nothing is pre-rendered.",
            "full": "<b>The <code>/ci</code> layout now checks the organization’s <code>ci</code> feature on the server</b> before rendering; the reports are read through a <code>server-only</code> module and nothing is pre-rendered.",
            "technical": false
          },
          {
            "text": "<b>Checked before fixed:</b> the review said the reports sat in the public JavaScript — that was tested and was not the case; no browser file held them.",
            "full": "<b>Checked before fixed:</b> the review said the reports sat in the public JavaScript — that was tested and was not the case; no browser file held them.",
            "technical": false
          },
          {
            "text": "<b>The first client’s names, places and niche wording</b> were replaced with neutral examples on screens and in the AI’s examples, and Finance amounts now follow the store’s currency.",
            "full": "<b>The first client’s names, places and niche wording</b> were replaced with neutral examples on screens and in the AI’s examples, and Finance amounts now follow the store’s currency.",
            "technical": false
          },
          {
            "text": "<b>It cannot drift back:</b> guard tests in both repos fail the build if a client name, place or niche word returns.",
            "full": "<b>It cannot drift back:</b> guard tests in both repos fail the build if a client name, place or niche word returns. Backend 3,273 tests, frontend 2,146, build green.",
            "technical": false
          }
        ],
        "built": "The server-side feature gate on Continuous Innovation, the neutral replacements across screens and prompts, store-currency Finance amounts, and the guard tests.",
        "why": "A second customer who sees the first client’s name in an example, or can open its reports, does not trust the product with their own.",
        "value": "A platform that reads as yours to every new customer, with the first client’s reports visible to the first client only.",
        "shots": []
      },
      {
        "n": "06",
        "title": "Chat checks membership on every request; a live call opens on the right store",
        "sub": "Backend SPEC-329 — tenancy-audit fix 6 of 6.",
        "subTechnical": true,
        "ask": "“Go ahead and fix the six.”",
        "status": "Delivered",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>Chat history trusted the sign-in token for up to 30 minutes.</b> The history screens — list, rename, pin, delete, projects, feedback, the active thread, import — now check the caller’s membership on every request, so a removed member is refused at once, and the history needs the same chat permission as chat itself.",
            "full": "<b>Eleven history routes</b> (list, rename, pin, delete, projects, feedback, active pointer, import) now resolve the caller through the one tenant read, so a removed member is refused at once and the history needs <code>chat.use</code> like the chat itself.",
            "technical": false
          },
          {
            "text": "<b>A live call always opened on the organization’s first store.</b> It now answers for the store requested, under the same rule as every other request, through one shared resolver.",
            "full": "<b>A live call</b> now honours <code>X-Store-Id</code> under the same multi-store rule as every request, through one shared resolver (<code>services/organizations/tenancy.resolve_tenant</code>). Backend 3,271 tests green.",
            "technical": false
          },
          {
            "text": "Nothing changes for a single-store organization today: the app sends no store choice yet, and multi-store stays off by default.",
            "full": "Nothing changes for a single-store organization today: the app sends no store choice yet, and multi-store stays off by default.",
            "technical": false
          }
        ],
        "built": "One membership check behind every chat-history request and one store resolver shared by the live call and the rest of the API.",
        "why": "Removing someone from your team has to take effect the moment you do it, not half an hour later.",
        "value": "The last of the six tenancy fixes — chat and voice now obey the same organization boundary as every other screen.",
        "shots": [
          {
            "route": "/chat",
            "caption": "Chat with AI: projects, pinned answers and threads, with the composer below.",
            "src": "/ci/d0929/chat.webp",
            "width": 1400,
            "height": 972
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "The $500 package’s AI allowance",
        "change": "$50 → $200, from the AI cost you entered",
        "why": "A package’s allowance is now its AI budget; 10% of the price only when none is set."
      },
      {
        "name": "Packages",
        "change": "a catalogue in code → rows you edit from the admin panel",
        "why": "Every plan read in the product now reads the table."
      },
      {
        "name": "Continuous Innovation reports",
        "change": "open by link to any organization’s member → checked against the organization on the server first",
        "why": "Nothing is pre-rendered."
      },
      {
        "name": "A removed team member’s chat",
        "change": "trusted for up to 30 minutes → refused at once",
        "why": "Membership is checked on every request."
      }
    ],
    "next": [
      {
        "title": "Enter the rest of each package’s costs and limits",
        "body": "The $500 package carries the $200 AI and $100 compute you gave; every other cost and every video and image limit is empty until you enter it — nothing was assumed.",
        "technical": false
      },
      {
        "title": "Video and image limits are shown, not enforced",
        "body": "The limits are recorded and displayed in the admin panel; refusing work past a limit is still to be built.",
        "technical": false
      },
      {
        "title": "Trials, coupons, announcements, settings and view-as",
        "body": "These admin pages say plainly that they are not built yet; they wait on your go-ahead.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "The live database was not touched",
        "body": "Migration 0137 was run up, down and up on a throwaway database, and the admin section was proven end to end on throwaway databases only.",
        "technical": false
      },
      {
        "title": "The operator API is narrow by design",
        "body": "It is off unless its secret is set, accepts only a two-minute signed token, and the admin panel forwards only allow-listed paths. Every operator change is written to its own audit trail.",
        "technical": false
      },
      {
        "title": "Checked before fixed",
        "body": "The review’s claim that the reports sat in the public JavaScript was tested and was not true; the fix closed the real gap — the link itself.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d0928",
    "kind": "daily",
    "period": "Monday, Sep 28, 2026",
    "sortDate": "2026-09-28",
    "hook": "Your store moved onto the new platform database with every timestamp exact, the whole sign-up-to-dashboard journey built on screen, and Stripe checkout proven",
    "memo": "Today <b>your store moved onto the new platform database</b> as organization #1 — 9,114,349 rows in 126 tables, every timestamp exact, verified table by table, the old database only ever read — with a catch-up tool that brings over whatever the running app writes after the copy. The customer’s journey was built on screen: <b>sign in and sign up</b> by email with a code, Google or Shopify; onboarding that names the company, picks a plan and connects Shopify by link; a first sync you watch land; a public <b>pricing page</b>; and <b>Stripe checkout</b>, proven with a live test-mode session. Team, roles, branding and a brand colour arrived in Settings, and the sidebar now shows each member only what their role, connections and plan allow. Five of the six tenancy-audit fixes shipped: every Shopify call uses the store’s own credentials, every scheduled job runs as its store, and a new store starts from a <i>neutral</i> brand and AI with money in its own currency. The marketing site’s menu became “Workforce” and its contacts found their places. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "27h 30m",
    "views": "10 screens",
    "areas": 7,
    "days": [
      {
        "title": "Your store, moved — timestamps exact",
        "body": "9,114,349 rows in 126 tables copied to the new database as organization #1, verified table by table; the old database was only read.",
        "technical": false
      },
      {
        "title": "Sign-up to dashboard, on screen",
        "body": "Sign in, sign up, verify, forgot password, invitations, onboarding and a first sync you can watch — the step always comes from the server, so a reload resumes.",
        "technical": false
      },
      {
        "title": "Pricing and Stripe checkout",
        "body": "A public pricing page, a plan carried from the click to onboarding, and Stripe checkout that records the paid plan once.",
        "technical": false
      },
      {
        "title": "Neutral for every new store",
        "body": "A new store starts from its own name, neutral personas and rules, AI instructions without the first client’s niche, and money in its own currency.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Your store moves to the new database — row for row, timestamps exact",
        "sub": "Backend SPEC-321 — slice S12, run on your instruction; catch-up in §7.",
        "subTechnical": true,
        "ask": "Copy the first client’s data into the new platform database with exact dates and times, without disturbing the running one; make it organization #1; and catch up anything written after the snapshot at switch-over.",
        "status": "Delivered · final catch-up at switch-over",
        "effort": "6h",
        "inside": [
          {
            "text": "<b>9,114,349 rows in 126 tables</b>, every timestamp as recorded. Your store is organization #1 on the top plan, with Continuous Innovation and its calendar setting switched on and its own Shopify connection and integration cards. Verified table by table; the old database untouched.",
            "full": "<b>9,114,349 rows in 126 tables</b>, every timestamp as recorded. Your store is organization #1 on the top plan, with Continuous Innovation and its calendar setting switched on and its own Shopify connection and integration cards. Verified table by table; the old database untouched.",
            "technical": false
          },
          {
            "text": "<b>A catch-up tool</b> brings the new database level with what the running app writes after the snapshot: small tables reconciled in full, large ones by new records and change time, only the old database’s own columns written, clashes reported and never forced.",
            "full": "<b>The move tool’s catch-up mode</b> brings the new database level with what the running app wrote after the snapshot: small tables reconciled in full, large ones by new ids and change time, only the old database’s own columns written, setup’s rows kept, clashes reported never forced.",
            "technical": false
          },
          {
            "text": "<b>A dry run on the real databases</b> found 8,530 new and 1,230 changed rows, with none refused.",
            "full": "<b>A dry run on the real databases</b> found 8,530 new and 1,230 changed rows, with none refused.",
            "technical": false
          },
          {
            "text": "<b>Two problems found and fixed on the way:</b> the copy failed on JSON columns, so they are now carried as their exact stored text, byte for byte (the half-filled first target was abandoned for a fresh database); and the setup had bumped the store’s last-updated time, now restored to its exact original.",
            "full": "<b>Two fixes:</b> the Postgres COPY failed on JSON columns the driver had decoded into Python objects — now read as exact stored text, byte for byte (the half-filled first target was abandoned for a fresh database); and setup bumped the store row’s <code>updated_at</code> — restored, and setup now writes it back unchanged. Backend suites: 3,175 and 3,179 passed.",
            "technical": false
          }
        ],
        "built": "The move tool, its table-by-table verification, the catch-up mode with its dry run, and the two fixes that made the copy exact.",
        "why": "Your store’s history is the product’s memory — a report, a trend or a send log that shows the wrong date is a wrong answer.",
        "value": "Your store keeps every record exactly as it happened while it moves onto the platform every new customer will use.",
        "shots": [
          {
            "route": "/settings · General",
            "caption": "On the new database: the same Shopify connection, syncing every 15 minutes as before.",
            "src": "/ci/d0928/settings-store.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/system · Overview",
            "caption": "Every scheduled job running on the new platform, with today's runs counted.",
            "src": "/ci/d0928/system.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "Every Shopify call and every scheduled job, as its own store",
        "sub": "Backend SPEC-324 · SPEC-325 — tenancy-audit fixes.",
        "subTechnical": true,
        "ask": "Make it 100% SaaS: “do all the fix one after another.”",
        "status": "Delivered · awaiting deploy",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>Shopify calls could fall back to the platform’s own token.</b> Every call now uses the store’s own encrypted credentials or stops with a plain “not connected”. This is what restores your store’s live blog publishing once deployed.",
            "full": "<b>Shopify calls could fall back to the platform <code>.env</code> token</b> (SPEC-324). Every call now uses the store’s own encrypted credentials or fails <code>not_connected</code> — which restores live blog publishing once deployed.",
            "technical": false
          },
          {
            "text": "<b>Scheduled reports, the Knowledge Base recheck and scheduled posting ran outside any store</b> — on the platform’s AI keys and mail server, and a suspended organization’s posts still went out. All three now run per store, as that store.",
            "full": "<b>Scheduled reports, the Knowledge Base recheck and scheduled posting ran outside any store</b> (SPEC-325) — on the platform’s AI keys and mail server, and a suspended organization’s posts still went out. All three now run per store through <code>for_each_store</code>.",
            "technical": false
          }
        ],
        "built": "Store-only Shopify credentials with no platform fallback, and the three remaining store jobs moved onto the per-store runner.",
        "why": "On a shared platform, a job that runs as “nobody” spends the platform’s keys and can post for a customer who has been suspended.",
        "value": "Every store’s data, posts and AI spend come from that store’s own connection — and your blog publishing comes back on deploy.",
        "shots": [
          {
            "route": "/integrations · Connected",
            "caption": "Each system syncing as its own store: last sync, cadence and recent runs per connection.",
            "src": "/ci/d0928/integrations.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "03",
        "title": "Neutral for every new store — brand, AI and money",
        "sub": "Backend SPEC-326 · SPEC-327 · SPEC-328 · frontend SPEC-318 · SPEC-319 (slices F8, F8b).",
        "subTechnical": true,
        "ask": "Part of the same audit: a neutral starting brand, no client niche in the AI, and money in the store’s currency.",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>A neutral starting Brand Brain:</b> a new store starts from its own name and domain, five general personas and neutral rules; the first client’s starter content is gone from the code.",
            "full": "<b>A neutral starting Brand Brain:</b> a new store starts from its own name and domain, five general personas and neutral rules; the first client’s starter content is gone from the code.",
            "technical": false
          },
          {
            "text": "<b>No client niche in the AI:</b> 17 prompt files, the agents and the Spotlight and Social defaults are brand-neutral; the Hebrew-calendar guidance reaches only organizations that use that calendar. A guard test fails the build if the niche wording returns.",
            "full": "<b>No client niche in the AI:</b> 17 prompt files, the agents and the Spotlight and Social defaults are brand-neutral; the Hebrew-calendar guidance reaches only organizations that use that calendar. A guard test fails the build if the niche wording returns.",
            "technical": false
          },
          {
            "text": "<b>Money in the store’s currency:</b> one formatter replaces about 70 hard-coded dollar amounts in emails, reports, nudges and verdicts, and every agent that writes amounts is told the currency. AI spend and QuickBooks keep their own; a test fails the build on a new hard-coded amount.",
            "full": "<b>Money in the store’s currency</b> (SPEC-328): one formatter (<code>services/money.py</code>) reads the currency from the tenant scope; ~70 hard-coded <code>$</code> amounts in emails, reports, nudges and verdicts now use it; agents that write amounts are told the currency; AI spend and QuickBooks keep their own. A test fails the build on a new <code>${…}</code> amount.",
            "technical": false
          },
          {
            "text": "<b>On screen too:</b> money in the store’s currency and times in its timezone across the app, set in the browser only; platform prices and AI spend stay in dollars. The festival-aware comparison and Continuous Innovation appear only for organizations that have them. Your store’s output is unchanged.",
            "full": "<b>On screen</b> (frontend SPEC-319, F8b): currency and timezone app-wide from the workspace, set in the browser only (never shared on the server); platform prices and AI spend stay USD. F8 (SPEC-318): the Hebrew-calendar comparison only for Hebrew-calendar organizations (an old <code>compare=hebrew_year</code> link falls back to last year), <code>/ci</code> only with the <code>ci</code> feature. Backend 3,264 tests, frontend 2,140, build green.",
            "technical": false
          }
        ],
        "built": "A neutral Brand Brain starter, neutral prompts and defaults, one currency formatter on both sides, and guard tests that keep all three neutral.",
        "why": "A new customer who meets the first client’s niche, calendar or currency on day one sees someone else’s product.",
        "value": "Every new store starts as itself — its own name, its own currency, its own clock — while your store keeps exactly what it had.",
        "shots": []
      },
      {
        "n": "04",
        "title": "Sign in, sign up and onboarding — on screen",
        "sub": "Frontend SPEC-312 · SPEC-313 · SPEC-314 — slices F2–F4, over backend SPEC-313–316.",
        "subTechnical": true,
        "ask": "Sign in and sign up screens — email and password with a code, Google, Shopify, forgot password, invitations — “very seamless, frictionless”.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>The screens:</b> sign in (email and password, Continue with Google, Continue with Shopify), sign up, a six-digit verification code with a 60-second resend, forgot and reset password, the Google and Shopify return pages, and invitation links. A user with no organization is taken to onboarding from any page.",
            "full": "<b>The screens</b> (SPEC-312): <code>/login</code>, <code>/signup</code>, <code>/verify</code> (6-digit code, 60 s resend), <code>/forgot</code> + <code>/reset</code>, the Google/Shopify return pages and <code>/invite/[token]</code>; <code>/api/session</code> handles every sign-in kind and stays the only place tokens are set.",
            "technical": false
          },
          {
            "text": "<b>Onboarding</b> names the company, chooses the plan, connects Shopify by link, then shows the first sync step by step — <b>Open your dashboard</b> once the orders are in, <b>Try again</b> if it failed. The step always comes from the server, so a reload resumes where you were.",
            "full": "<b>Onboarding</b> names the company, chooses the plan, connects Shopify by link, then shows the first sync step by step — <b>Open your dashboard</b> once the orders are in, <b>Try again</b> if it failed. The step always comes from the server, so a reload resumes where you were.",
            "technical": false
          },
          {
            "text": "<b>The first sync, live:</b> a progress toast on every page, and pages that wait calmly and open by themselves as their step lands. A store already synced costs one read.",
            "full": "<b>The first sync, live</b> (SPEC-314): a progress toast on every page (SSE through the proxy, 3 s poll fallback) and pages that open by themselves as their step lands; a synced store costs one read.",
            "technical": false
          },
          {
            "text": "<b>A login screen worth landing on:</b> after two rounds of mockups (eight, then six in red and beige) you picked “R5 · Red Band” — the marketing site’s paper and honeycomb above a brand-red band, the app drawn as a window of bars, never numbers. The marketing site’s logo replaces the old wordmark across the app, and sign-in shows the real Google and Shopify marks.",
            "full": "<b>A login screen worth landing on:</b> after two rounds of mockups (eight, then six in red and beige) you picked “R5 · Red Band” — the marketing site’s paper and honeycomb above a brand-red band, the app drawn as a window of bars, never numbers. The marketing site’s logo replaces the old wordmark across the app, and sign-in shows the real Google and Shopify marks.",
            "technical": false
          }
        ],
        "built": "The full set of auth screens, the four-step onboarding, the live first-sync progress, and the new login showcase and logo.",
        "why": "The first five minutes decide whether a new merchant stays; every extra click or unclear step is a lost customer.",
        "value": "A merchant goes from your link to their own dashboard without help — and lands on a screen that looks like the product they were sold.",
        "shots": [
          {
            "route": "/login",
            "caption": "Sign in, on screen.",
            "src": "/ci/d0928/login.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/signup",
            "caption": "Sign up, on screen: the first step of the journey into onboarding.",
            "src": "/ci/d0928/signup.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "A pricing page and Stripe checkout",
        "sub": "Backend SPEC-322 · frontend SPEC-320 · SPEC-321 · marketing SPEC-016 — no migration.",
        "subTechnical": true,
        "ask": "Give the plans a public pricing page and a real way to pay — you reopened the no-pricing decision for the marketing site.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>A public pricing page in the app</b>, in the marketing site’s identity, with the plans read from the product itself. You asked for it without a navigation bar: it opens straight on the hero, and the way on stays on the page.",
            "full": "<b>A public pricing page in the app</b>, in the marketing site’s identity, with the plans read from the product itself. You asked for it without a navigation bar: it opens straight on the hero, and the way on stays on the page.",
            "technical": false
          },
          {
            "text": "<b>The plan travels with the visitor:</b> “Choose this plan” → sign up → verify → onboarding with the plan already selected, even through Google or Shopify sign-in.",
            "full": "<b>The plan travels:</b> “Choose this plan” → <code>/signup?plan=</code> → <code>/verify?…&plan=</code> → <code>/onboarding?plan=</code> with the plan step preselected; an <code>fte_plan</code> cookie carries it through Google/Shopify sign-in.",
            "technical": false
          },
          {
            "text": "<b>Stripe checkout:</b> “Continue to payment” opens Stripe for the catalogue price; the return page and Stripe’s own signed notification both record the paid plan, once per subscription; a cancel comes back with the plan still selected; a plan change cancels the old subscription.",
            "full": "<b>Stripe checkout</b> (backend SPEC-322, frontend SPEC-321): with <code>STRIPE_SECRET_KEY</code> set, “Continue to payment” opens Stripe Checkout; the return page (<code>/onboarding/billing</code>) and the signature-verified webhook (<code>/webhooks/stripe</code>) both record the paid plan, once per Stripe subscription; a cancel keeps the plan; a plan change cancels the old subscription; the dummy start is refused while Stripe is on.",
            "technical": false
          },
          {
            "text": "<b>The marketing site’s Pricing now links there</b>, and its FAQ explains how pricing works without writing a price. Proven with one live test-mode checkout session, created and read.",
            "full": "<b>Marketing</b> (SPEC-016): Pricing links to the app’s page; the FAQ says how pricing really works without a price. Backend 3,193 tests, frontend 2,118, marketing 105; one live test-mode session created and read.",
            "technical": false
          }
        ],
        "built": "The pricing page, the plan journey through sign-up and onboarding, Stripe checkout with its return page and webhook, and the marketing site’s links and FAQ.",
        "why": "A product that cannot take payment is a pilot; a plan lost between the pricing page and onboarding is a sale lost.",
        "value": "A visitor can pick a plan, sign up and pay in one unbroken path, and every paid plan is recorded exactly once.",
        "shots": [
          {
            "route": "/pricing",
            "caption": "The pricing page: the plan for the store's revenue band, what every plan includes, and checkout through Stripe.",
            "src": "/ci/d0928/pricing-full.webp",
            "width": 1400,
            "height": 1474
          },
          {
            "route": "/settings/billing · Billing & plan",
            "caption": "After checkout: the active plan, its renewal date and its invoices.",
            "src": "/ci/d0928/settings-billing.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "06",
        "title": "Team, roles, branding and a brand colour — and a sidebar that shows only what’s yours",
        "sub": "Frontend SPEC-315 · SPEC-316 · SPEC-317 · SPEC-322 · backend SPEC-323 — slices F5–F7.",
        "subTechnical": true,
        "ask": "The settings that make it a SaaS: invite a team and give each member a role, put the organization’s own logo and colour on the app, and show each member only what applies to them.",
        "status": "Delivered",
        "effort": "4h 30m",
        "inside": [
          {
            "text": "<b>Team and Roles:</b> members, invite, change role, disable or enable, remove, make owner, pending invitations and the activity log in plain sentences; roles with a permission grid to create, duplicate, edit, reset and delete. Only actions the member may take are offered, and nobody can grant a permission they don’t hold.",
            "full": "<b>Team and Roles:</b> members, invite, change role, disable or enable, remove, make owner, pending invitations and the activity log in plain sentences; roles with a permission grid to create, duplicate, edit, reset and delete. Only actions the member may take are offered, and nobody can grant a permission they don’t hold.",
            "technical": false
          },
          {
            "text": "<b>Branding:</b> light and dark logos, previewed on their surface, and the login screen as an image, a video with a poster, or a 2–6 picture carousel. The sidebar shows the organization’s logo and name, and Settings shows the team’s branded login link with Copy and Open.",
            "full": "<b>Branding:</b> light and dark logos, previewed on their surface, and the login screen as an image, a video with a poster, or a 2–6 picture carousel. The sidebar shows the organization’s logo and name, and Settings shows the team’s branded login link with Copy and Open.",
            "technical": false
          },
          {
            "text": "<b>A brand colour:</b> suggested from the logo or entered by hand, previewed in both themes before saving, then applied to buttons, accents, focus rings, the active navigation and the login screen. It is adjusted slightly when needed so buttons stay readable; status colours never change.",
            "full": "<b>Brand colour</b> (frontend SPEC-322, backend SPEC-323): swatches from the logo or a custom hex, a live preview in both themes, then <code>--primary</code>, <code>--brand</code>, rings, the active nav and the login band take it, server-rendered with no flash; contrast is kept at 3:1 for the fill and 4.5:1 for its text; <code>--destructive</code>, status and chart colours are never set; a colour near the error red is warned about, not blocked.",
            "technical": false
          },
          {
            "text": "<b>Progressive disclosure:</b> the sidebar shows only what the member’s role allows, what is connected and what the plan includes; typing the link of a hidden page answers with the reason. If that can’t be read, nothing is hidden.",
            "full": "<b>Progressive disclosure</b> (SPEC-315): the sidebar follows role, connections and plan from one <code>/workspace</code> read beside the user; a typed URL for a hidden page answers with its reason; nothing is hidden when it cannot be read. Frontend 2,064–2,140 tests across the slices, build green.",
            "technical": false
          }
        ],
        "built": "Team and Roles settings, the Branding tab with logos, login media, login link and brand colour, and the role-, connection- and plan-aware sidebar.",
        "why": "A customer’s team needs different access, and a white-label product has to look like the customer’s, not ours.",
        "value": "Each organization invites its people, decides what they can do, and sees its own name, logo and colour every time it signs in.",
        "shots": [
          {
            "route": "/settings/team · Team",
            "caption": "The team: members, roles, status and invitations.",
            "src": "/ci/d0928/settings-team.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/roles · Roles",
            "caption": "Roles: built-in and your own, each a set of permissions.",
            "src": "/ci/d0928/settings-roles.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/branding · Branding",
            "caption": "Branding: logo for each theme and a brand colour the whole app takes.",
            "src": "/ci/d0928/settings-branding.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "07",
        "title": "Marketing site — “Workforce”, contacts where they belong, and phones",
        "sub": "Marketing SPEC-014 · SPEC-005 · SPEC-012 · SPEC-010 · SPEC-004 · SPEC-001.",
        "subTechnical": true,
        "ask": "Rename the menu, put the ftes.ai contacts each where it belongs, and make the site work properly on phones.",
        "status": "Delivered",
        "effort": "2h",
        "inside": [
          {
            "text": "<b>The nav’s “The FTEs” is now “Workforce”</b>: a wider menu with the Glisp card, the five FTEs in two columns and “See all five at work”; the phone menu is renamed too and stays one column.",
            "full": "<b>The nav’s “The FTEs” is now “Workforce”</b>: a wider menu with the Glisp card, the five FTEs in two columns and “See all five at work”; the phone menu is renamed too and stays one column.",
            "technical": false
          },
          {
            "text": "<b>Contacts, each where it belongs:</b> one footer grid with the brand, Platform, FTEs, Company and Contact; the general address under the brand description; the phone line, office, “within 24 hours on business days” and the contact form in the Contact column; a support line on every employee page whose email subject names that employee; the security address on the Security page. A separate contact band was tried and rejected, and there are no social links.",
            "full": "<b>Contacts</b>: one footer grid; the general address is now <code>SITE.email</code>, so the old address is gone from the trust pages, home, JSON-LD, <code>llms.txt</code> and the demo fallback; data lives once in <code>lib/site.ts</code> <code>CONTACT</code>; <code>tests/site.test.ts</code> fails if the old address returns or support/security reappear in the footer.",
            "technical": false
          },
          {
            "text": "<b>Phones and accessibility:</b> every mockup fits on a phone, buttons in the ftes.ai style and a cleaner hero; stronger contrast, keyboard-reachable scroll regions and valid labels for assistive and agentic browsing; and the animated hex field pauses when it is off screen or the tab is hidden, to cut work on phones.",
            "full": "<b>Phones and accessibility:</b> every mockup fits on a phone, buttons in the ftes.ai style and a cleaner hero; stronger contrast, keyboard-reachable scroll regions and valid labels for assistive and agentic browsing; and the animated hex field pauses when it is off screen or the tab is hidden, to cut work on phones.",
            "technical": false
          }
        ],
        "built": "The Workforce menu, the contact placement with its guard test, phone-fitted mockups, the accessibility pass and the paused background animation.",
        "why": "Visitors judge the company by its site, and most of them arrive on a phone.",
        "value": "A clearer menu, the right contact in the right place, and a site that stays light and usable on any device.",
        "shots": []
      }
    ],
    "tiers": [
      {
        "name": "A Shopify call without its own key",
        "change": "the platform’s token → the store’s own credentials, or a plain “not connected”",
        "why": "Restores your store’s live blog publishing once deployed."
      },
      {
        "name": "Scheduled reports and posting",
        "change": "run on the platform’s keys and mail, even for a suspended organization → per store, as that store",
        "why": "Three jobs moved onto the per-store runner."
      },
      {
        "name": "Money in emails and reports",
        "change": "about 70 hard-coded dollar signs → the store’s own currency",
        "why": "A test fails the build on a new hard-coded amount."
      },
      {
        "name": "Copying JSON columns",
        "change": "a failed copy → the exact stored text, byte for byte",
        "why": "Found during the move; the old database was only read."
      }
    ],
    "next": [
      {
        "title": "Switch over and run the final catch-up",
        "body": "The dry run on the real databases found 8,530 new and 1,230 changed rows, none refused; the final run brings the new database level at the moment of switching.",
        "technical": false
      },
      {
        "title": "Deploy the store-only credentials",
        "body": "Your store’s live blog publishing comes back once this is deployed.",
        "technical": false
      },
      {
        "title": "The sixth tenancy fix",
        "body": "Chat checking membership on every request and a live call opening on the right store is specified and not yet built.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "The old database was only ever read",
        "body": "The move and the catch-up write only to the new database; clashes are reported, never forced, and the half-filled first attempt was thrown away rather than patched.",
        "technical": false
      },
      {
        "title": "Neutral is enforced by tests",
        "body": "Guard tests fail the build if the first client’s niche wording returns to the AI or a hard-coded dollar amount returns to the code.",
        "technical": false
      },
      {
        "title": "Your store sees what it saw",
        "body": "Currency, timezone and calendar now come from each organization’s own settings; for your store the output is unchanged.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d0926",
    "kind": "daily",
    "period": "Saturday, Sep 26, 2026",
    "sortDate": "2026-09-26",
    "hook": "Ecommerce FTE becomes a multi-tenant SaaS on the backend — sign-up, plans, connect-by-link, roles and branding — with the leaks between organizations closed and the live database untouched",
    "memo": "Today Ecommerce FTE started becoming <b>a product any Shopify merchant can sign up for</b>. The plan was set down — thirteen decisions and twelve slices — and eleven backend slices were built: organizations and memberships, <b>sign-up by email, Google or Shopify</b>, plans by annual revenue, <b>connecting Shopify by link</b> with a first 30-day sync that runs itself, a permission behind every one of the 441 store endpoints with six system roles plus custom ones, each organization’s own logo and login screen, a workspace that shows a member only what is connected and allowed, and an AI allowance per plan. Along the way three leaks between organizations were closed — <b>the last AI key saved by anyone was used by everyone</b>, integrations without their own card borrowed the first client’s accounts, and AI spend was charged to the first store — and the test suite can no longer reach the live database. Your store becomes organization #1 on a new database; <i>the live database was not touched</i>. The marketing site gained a two-destination navbar, a Social Growth section that sells the value, and section links that land where they should. Each item below carries what you asked for, what was built, why it matters and the value it delivers.",
    "effort": "30h 30m",
    "views": "11 screens",
    "areas": 8,
    "days": [
      {
        "title": "A SaaS plan, set down",
        "body": "Thirteen decisions and twelve slices: any company signs up, picks a plan, connects Shopify by link and brands its own login — your store becomes organization #1 with every timestamp kept.",
        "technical": false
      },
      {
        "title": "Sign up, pick a plan, connect by link",
        "body": "Email with a code, Google or Shopify; three plans by annual revenue; Shopify connected by link, then a 30-day first sync that runs itself.",
        "technical": false
      },
      {
        "title": "Each organization sealed off",
        "body": "AI keys, integrations, AI spend, time zones and inventory updates now belong to the store in scope — never to “the first store”.",
        "technical": false
      },
      {
        "title": "A clearer marketing site",
        "body": "Two destinations in the navbar, a Social Growth section that shows why each post was made, and section links that land on the section.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Organizations, memberships and per-organization state",
        "sub": "Backend SPEC-308 (master plan) · SPEC-309 · SPEC-310 · SPEC-311 — slices S1–S2, migrations 0128–0129.",
        "subTechnical": true,
        "ask": "Turn Ecommerce FTE into a multi-tenant, white-label SaaS that any company can sign up for — with your store as organization #1 on a new database, every timestamp preserved, and the live database never touched.",
        "status": "Delivered · migrations written, not yet run",
        "effort": "5h",
        "inside": [
          {
            "text": "<b>The plan:</b> thirteen owner decisions and twelve slices on the backend, eight on the frontend — sign-up, plans by revenue band with a stand-in payment for now, connect Shopify by link, a 30-day first sync, branding without subdomains, fully custom roles, and per-organization features instead of client-specific code.",
            "full": "<b>The plan:</b> backend <code>SPEC-308-saas-platform-master.md</code> (decisions D1–D13, slices S1–S12) and frontend <code>SPEC-311-saas-platform-master.md</code> (F1–F8) — sign-up, plans by revenue band with a dummy payment, connect Shopify by link, a 30-day first sync, branding without subdomains, fully custom roles, per-organization features.",
            "technical": false
          },
          {
            "text": "<b>Organizations, roles and memberships:</b> the sign-in token carries the active organization, every store request finds its store through the caller’s membership in one query, and a member of several organizations can switch. No “first store” lookup is left in the API, and a test enforces it.",
            "full": "<b>Tenancy core</b> (SPEC-309, migration 0128): <code>organizations</code>, <code>roles</code>, <code>memberships</code>, <code>stores.organization_id</code>; the access token carries the active organization; every store route resolves through the active membership in one query (test-enforced); <code>POST /auth/organizations/switch</code>; an optional <code>X-Store-Id</code> for multi-store organizations.",
            "technical": false
          },
          {
            "text": "<b>Your existing data becomes organization #1</b> with every user as Owner — the migration was checked up and down on a throwaway database.",
            "full": "<b>Your existing data becomes organization #1</b> with every user as Owner — the migration was checked up and down on a throwaway database.",
            "technical": false
          },
          {
            "text": "<b>Per-organization state:</b> AI settings per store, email through the organization’s own mail server or else the platform’s, time zones per store and per location, and chat threads and projects per organization.",
            "full": "<b>Per-organization state</b> (SPEC-310/311, migration 0129): per-store AI settings (<code>services/ai/store_settings.py</code>, <code>core/tenant_context.py</code>), email through the organization’s SMTP card else the platform’s, store/location time zones (<code>locations.iana_timezone</code>), chat threads and projects per organization. Backend suite: 2,983 passed.",
            "technical": false
          }
        ],
        "built": "The SaaS master plan, the organization–role–membership core with its single-store-to-organization-#1 migration, and per-organization AI, email, time and chat.",
        "why": "Every answer the product gives was resolved from “the first store”; a second customer would have seen the first one’s data.",
        "value": "The foundation every SaaS feature stands on: each company’s people, store and settings are its own.",
        "shots": [
          {
            "route": "/settings/organization · General",
            "caption": "The organization as its own record: its name, its branded login link, the calendar it compares by, and its plan — with the data controls beneath.",
            "src": "/ci/d0926/settings-organization.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/team · Team",
            "caption": "Memberships: each person, the role they hold in this organization, and when they joined.",
            "src": "/ci/d0926/settings-team.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "02",
        "title": "Closing the leaks between organizations",
        "sub": "Backend SPEC-309 · SPEC-310 · SPEC-311.",
        "subTechnical": true,
        "ask": "Part of the same programme: nothing one organization does may reach another’s data, keys or bill.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>One organization’s AI keys were every organization’s:</b> the last provider card saved by anyone was what every organization’s next AI, image, search and video call used. Cards now apply to a per-store copy carried through each request, live call and job; the platform settings are never changed.",
            "full": "<b>AI keys</b> (SPEC-310): cards were written onto the one process-wide <code>Settings</code>, so the last card saved by anyone served every organization — and a store’s “env fallback” already returned another store’s key. Cards now overlay a per-store copy carried through each request, live call, MCP request and job.",
            "technical": false
          },
          {
            "text": "<b>Integrations borrowed the first client’s accounts:</b> an organization without its own Gorgias, Loop, Klaviyo, iPacky, V-Count or Clarity card used the platform’s. Now it is its own card or nothing, and the credential read-back never returns a platform secret.",
            "full": "<b>Integrations</b> (SPEC-311): an organization with no Gorgias/Loop/Klaviyo/iPacky/V-Count/Clarity card resolved the <code>.env</code> values; now its own card or nothing — only platform defaults (the mail server, sync times) fall back, and the secret read-back never returns a platform secret.",
            "technical": false
          },
          {
            "text": "<b>AI spend was charged to “the first store”</b> — now to the store in scope when the run started. A hard-coded New York timezone was removed in favour of each store’s and location’s own zone.",
            "full": "<b>AI spend was charged to “the first store”</b> — now to the store in scope when the run started. A hard-coded New York timezone was removed in favour of each store’s and location’s own zone.",
            "technical": false
          },
          {
            "text": "<b>Inventory updates from Shopify were applied to the first store</b> — now routed by the signed shop the update came from; an unknown shop is acknowledged and ignored.",
            "full": "<b>Inventory updates from Shopify were applied to the first store</b> — now routed by the signed shop the update came from; an unknown shop is acknowledged and ignored.",
            "technical": false
          },
          {
            "text": "<b>The test suite could reach the live database:</b> loading the app quietly copied the live database address into the test run. Tests are now pinned to an in-memory database before anything loads, and any test that leaves another database behind fails.",
            "full": "<b>The test suite could reach the live database</b> (SPEC-309): LiteLLM’s <code>load_dotenv()</code> copied <code>.env</code>’s <code>DATABASE_URL</code> into the test process and the module-level engine was built on it. <code>tests/conftest.py</code> now pins in-memory SQLite before any import and per test, and fails any test that leaves a non-SQLite engine behind.",
            "technical": false
          }
        ],
        "built": "Per-store AI settings, card-or-nothing integrations, spend attributed to the store in scope, per-zone time, shop-routed inventory webhooks and a sealed test suite.",
        "why": "On a shared platform a leaked key is someone else’s bill, and a leaked account is someone else’s customers.",
        "value": "Each organization pays for its own AI, reads its own accounts and sees its own clock — and development can never reach your live data by accident.",
        "shots": []
      },
      {
        "n": "03",
        "title": "Every store on its own clock",
        "sub": "Backend SPEC-312 — slice S3, no migration.",
        "subTechnical": true,
        "ask": "Time belongs to the organization’s store and its locations: every schedule, day boundary, report and email runs on that store’s own timezone.",
        "status": "Delivered",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>Every store job runs once per active store</b>, each with its own scope and its own run record, four at a time — one store’s failure never stops another’s.",
            "full": "<b>Every store job runs once per active store</b> (<code>scheduler/stores.py</code> <code>for_each_store</code> — own scope, own <code>job_runs</code> row, 4 at a time, one failure never stops another).",
            "technical": false
          },
          {
            "text": "<b>Morning jobs at the store’s own local time:</b> the daily report, brief auto-send, the Monday cards and the end-of-day finalizers run per store through one five-minute store clock.",
            "full": "<b>Local-time jobs:</b> the daily report, brief auto-send, Monday cards and iPacky/V-Count finalizers run per store at its local time through one 5-minute <code>store_clock</code> (<code>services/scheduling/store_clock.py</code>).",
            "technical": false
          },
          {
            "text": "<b>A store is synced only with its own Shopify credentials</b>, the heavy-job guard is per store, and the System page shows an organization only its own runs. No “first store” lookup remains anywhere in the backend.",
            "full": "<b>Own credentials</b> (<code>services/shopify/credentials.py</code>), a per-store heavy-job gate, <code>/system</code> scoped to the organization, scripts naming their store with <code>STORE_ID</code>. No “first store” lookup remains in <code>app/</code>. Backend suite: 2,997 passed.",
            "technical": false
          }
        ],
        "built": "A per-store scheduler runner, a store clock for local-time jobs, store-only Shopify credentials for sync, and per-organization system history.",
        "why": "A morning report that lands at 6 a.m. in one timezone lands in the middle of the night in another.",
        "value": "Every customer’s reports, emails and syncs arrive on their own clock, and one store’s trouble never delays another’s.",
        "shots": [
          {
            "route": "/settings/daily-report · Daily report",
            "caption": "The daily report runs at the store's own hour, in the store's own timezone, with the next run shown.",
            "src": "/ci/d0926/settings-daily-report.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "04",
        "title": "Sign up, sign in and choose a plan",
        "sub": "Backend SPEC-313 · SPEC-314 — slices S4–S5, migrations 0130–0131.",
        "subTechnical": true,
        "ask": "Sign-up and sign-in by email and password with a code, Google or Shopify; onboarding that picks a plan by annual revenue — $500, $800 or $1,200 a month, with a stand-in payment for now.",
        "status": "Delivered · payment is a stand-in for now",
        "effort": "4h 30m",
        "inside": [
          {
            "text": "<b>Email and password, verified by an emailed six-digit code</b> (five attempts, ten minutes, rate-limited); “Continue with Google” and “Continue with Shopify”, which verify themselves; forgot and reset by code, which signs every device out.",
            "full": "<b>Email and password, verified by an emailed six-digit code</b> (five attempts, ten minutes, rate-limited); “Continue with Google” and “Continue with Shopify”, which verify themselves; forgot and reset by code, which signs every device out.",
            "technical": false
          },
          {
            "text": "<b>Device sessions</b> with sign-out and sign-out-everywhere, and invitations to create, list, revoke, preview and accept.",
            "full": "<b>Device sessions</b> with refresh rotation, replay detection, logout and logout-all; invitations (create/list/revoke, public preview, register-with-link, accept).",
            "technical": false
          },
          {
            "text": "<b>No screen reveals whether an address already has an account</b>, and an account registered but never verified cannot be taken over.",
            "full": "<b>No screen reveals whether an address already has an account</b>, and an account registered but never verified cannot be taken over.",
            "technical": false
          },
          {
            "text": "<b>Plans by annual revenue:</b> up to $3M → $500 a month, $3M–$30M → $800, over $30M → $1,200. The new owner is working in their organization at once; the onboarding step is always worked out by the server — organization, plan, connect store, ready. Payment goes through a stand-in for now; no card is charged.",
            "full": "<b>Plans</b> (SPEC-314): <code>GET /plans</code> — up to $3M → $500/mo, $3M–$30M → $800/mo, $30M+ → $1,200/mo; <code>POST /onboarding/organization</code>; <code>POST|GET /billing/subscription</code> through a <code>PaymentProvider</code> seam with a dummy provider (no card); <code>GET /onboarding</code> derives the step. Backend suite: 3,041 passed.",
            "technical": false
          }
        ],
        "built": "The sign-up and sign-in backend for three methods with codes, sessions and invitations, and the plan catalogue with onboarding and a payment seam.",
        "why": "A merchant who cannot sign up alone is a sales call, not a customer.",
        "value": "A new company can create its account, verify it and choose a plan without anyone on your side doing anything.",
        "shots": [
          {
            "route": "/signup",
            "caption": "Create your account: Google or work email, and the store waits on the other side.",
            "src": "/ci/d0926/signup.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/login",
            "caption": "Welcome back: the sign-in screen beside a preview of what the merchant is about to see.",
            "src": "/ci/d0926/login.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/pricing",
            "caption": "Choose a plan: one plan per revenue band, every feature in every plan.",
            "src": "/ci/d0926/pricing.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "05",
        "title": "Connect Shopify by link — and the first sync runs itself",
        "sub": "Backend SPEC-315 · SPEC-316 — slices S6–S7, migrations 0132–0133.",
        "subTechnical": true,
        "ask": "Connect Shopify by link, with no one pasting a token; on connect, sync the last 30 days with live progress, then run every scheduled job once.",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "<b>Connect by link:</b> Shopify’s own sign-in flow, verified; the shop’s name, currency and timezone read on connect; each store’s own token stored encrypted. One shop belongs to one organization; reconnect and disconnect are supported.",
            "full": "<b>Connect by link</b> (SPEC-315): <code>POST /stores/connect/start|callback</code> (offline OAuth, HMAC-verified, name/currency/timezone read on connect, webhooks registered best-effort); each store’s encrypted token behind <code>shopify_credentials</code>; one shop ↔ one organization; <code>stores.organization_id</code> is NOT NULL.",
            "technical": false
          },
          {
            "text": "<b>Privacy and uninstall handled:</b> Shopify’s uninstall and three privacy notices are received; a customer redaction is applied at once, and data requests and shop erasure are recorded for the operator.",
            "full": "<b>Privacy and uninstall handled:</b> Shopify’s uninstall and three privacy notices are received; a customer redaction is applied at once, and data requests and shop erasure are recorded for the operator.",
            "technical": false
          },
          {
            "text": "<b>The first sync starts at once:</b> orders, customers and discounts from the <b>last 30 days</b> and the whole catalogue, then stock, order journeys and landed costs, the connected integrations, the analysis jobs and yesterday’s report — nothing that emails or posts.",
            "full": "<b>The first sync</b> (SPEC-316): a new store starts <code>pending</code>; orders, customers and discounts from the last 30 days (catalogue whole), then stock, journeys and landed costs, integrations, analysis jobs (forecasts, verdicts, Spotlight’s nightly chain, tax, ads, Clarity, QuickBooks) and yesterday’s report — the scheduler’s own jobs scoped to that store, nothing that emails or posts.",
            "technical": false
          },
          {
            "text": "<b>Progress you can follow</b>, step by step with the screens each step unlocks, and a retry. The regular jobs serve a store only once its first sync is done, and a five-minute check resumes a run a restart cut off.",
            "full": "<b>Progress</b> on the store row: <code>GET /stores/current/bootstrap</code>, <code>/events</code> (SSE), <code>/retry</code>; the regular jobs serve a store only once its first sync is <code>done</code>; a 5-minute <code>store_bootstrap</code> tick resumes an interrupted run. Backend suite: 3,078 passed.",
            "technical": false
          }
        ],
        "built": "Shopify connect-by-link with encrypted per-store tokens and privacy webhooks, and the self-running first sync with live progress and resume.",
        "why": "A new store with an empty dashboard for a day is a cancelled trial.",
        "value": "A merchant connects their store with a click and watches their own numbers fill in within the first session.",
        "shots": [
          {
            "route": "/settings · General",
            "caption": "The Shopify connection after connect-by-link: the store, the last sync and how often it runs, and the platform's status.",
            "src": "/ci/d0926/settings-store.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/system · Overview",
            "caption": "The schedule every store runs on, with the first sync for a newly connected store as its own job.",
            "src": "/ci/d0926/system.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "06",
        "title": "Roles and permissions behind every endpoint",
        "sub": "Backend SPEC-317 — slice S8, migration 0134.",
        "subTechnical": true,
        "ask": "User access control, fully customisable: system role templates, custom roles, managers, social media managers and so on — enforced on every endpoint and every AI tool.",
        "status": "Delivered",
        "effort": "4h 30m",
        "inside": [
          {
            "text": "<b>Sixty named permissions and six system roles</b> in every organization — Owner, Admin, Manager, Social media manager, Analyst, Viewer — plus any custom roles.",
            "full": "<b>Sixty named permissions and six system roles</b> in every organization — Owner, Admin, Manager, Social media manager, Analyst, Viewer — plus any custom roles.",
            "technical": false
          },
          {
            "text": "<b>Every one of the 441 store endpoints needs a named permission</b>, checked on data the request already reads, closed by default and enforced by a test. Sending needs the send permission, exporting needs the export permission, and a member limited to one location cannot name another.",
            "full": "<b>Every one of the 441 store endpoints needs a named permission</b> (<code>services/access/</code>), checked on the tenant row the request already reads (no query, ~9 µs), fail closed and test-enforced; <code>send</code> needs <code>messages.send</code>, exports need <code>data.export</code>; location-scoped members cannot name another location.",
            "technical": false
          },
          {
            "text": "<b>The AI follows the asker’s role:</b> Glisp’s and the employees’ tools, the live call, Report FTE runs and schedules and API keys see only what the asker — or the key’s creator — may see.",
            "full": "<b>The AI follows the asker’s role:</b> Glisp’s and the employees’ tools, the live call, Report FTE runs and schedules and API keys see only what the asker — or the key’s creator — may see.",
            "technical": false
          },
          {
            "text": "<b>Team and roles management</b> with guards so nobody can raise their own access, and a log of every access change.",
            "full": "<b>Team & roles API</b> (<code>/organizations/current/members|roles|owner|permissions|audit</code>) with no-escalation guards; an <code>audit_events</code> log for every access change; <code>/auth/me</code> carries permissions. Backend suite: 3,105 passed.",
            "technical": false
          }
        ],
        "built": "The permission catalogue, six system roles and custom roles, a permission on every store endpoint and AI tool, and the team-and-roles API with its audit log.",
        "why": "A social media manager should publish posts, not read the finance books — and the AI must not answer what the screen would refuse.",
        "value": "Each organization decides exactly who can see and do what, and the server holds the line on every request.",
        "shots": [
          {
            "route": "/settings/roles · Roles",
            "caption": "Roles and their permissions: the built-in roles, and every permission each one carries, grouped by area.",
            "src": "/ci/d0926/settings-roles.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "07",
        "title": "Branding, the workspace and an AI allowance per plan",
        "sub": "Backend SPEC-318 · SPEC-319 · SPEC-320 — slices S9–S11, migrations 0135–0136.",
        "subTechnical": true,
        "ask": "Each organization brands its logo and login screen (image, video or carousel; no subdomains), sees only what it has connected and what its role allows, and gets the AI its plan includes — its own keys taking precedence.",
        "status": "Delivered · awaiting your confirmation of the AI allowance",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "<b>Branding:</b> a light and a dark logo, and the login screen as an image, a video with a poster, or a 2–6 picture carousel. Every image is re-encoded with its metadata stripped; the login and invitation screens read the branding without sign-in; emails, the daily report and Report FTE files carry the organization’s logo.",
            "full": "<b>Branding</b> (SPEC-318): <code>/organizations/current/branding</code> (<code>settings.manage</code>); images re-encoded by Pillow (metadata stripped, SVG refused, bounded size), videos checked by container; <code>GET /branding/{slug}</code> with no sign-in, one query; assets served immutable-cached with <code>Range</code>; emails and the daily-report and Report FTE PDFs carry the logo.",
            "technical": false
          },
          {
            "text": "<b>The workspace:</b> one read tells the app the user, organization, role and permissions, store and first-sync progress, plan, onboarding step, branding, which integrations are connected, and for each of the 28 sidebar destinations whether it is visible, ready, and why not.",
            "full": "<b>The workspace</b> (SPEC-319): <code>GET /workspace</code> — user, organization, role and permissions, store and first-sync progress, plan, onboarding step, branding, integrations (own card vs platform), and each of the 28 destinations with <code>visible</code>/<code>ready</code>/<code>reason</code> — in exactly 4 queries.",
            "technical": false
          },
          {
            "text": "<b>Per-organization features, not client code:</b> Continuous Innovation exists only for organizations that have it, and the Hebrew calendar is now an organization setting that governs Season Radar, the festival comparison, Glisp’s calendar tool and the occasions — the weekly planner no longer assumes it for every store.",
            "full": "<b>Per-organization features, not client code:</b> Continuous Innovation exists only for organizations that have it, and the Hebrew calendar is now an organization setting that governs Season Radar, the festival comparison, Glisp’s calendar tool and the occasions — the weekly planner no longer assumes it for every store.",
            "technical": false
          },
          {
            "text": "<b>AI per plan:</b> every plan includes platform AI worth 10% of its fee a month ($50 / $80 / $120 — pending your confirmation); an organization’s own keys are never limited. Once the month’s allowance is used, a platform-key call is refused before the vendor, in the same plain words everywhere, and the spend ledger records whose key paid.",
            "full": "<b>AI per plan</b> (SPEC-320): 10% of the fee ($50 / $80 / $120, pending confirmation); <code>llm.AllowanceGuardedModel</code>, images, video, web search and live voice refuse a platform-key call before the vendor once used (402 <code>ai_allowance_exhausted</code>); one query, cached 60 s, fails open; the ledger records <code>key_source</code>; <code>GET /billing/ai-allowance</code>; <code>ai_unmetered</code> lifts it for your store until its keys move. Backend suite: 3,160 passed.",
            "technical": false
          }
        ],
        "built": "Organization branding with safe uploads, the single workspace read behind progressive disclosure, per-organization feature flags, and the plan’s AI allowance guarded at every AI boundary.",
        "why": "A white-label product has to wear the customer’s brand, and an included AI allowance without a ceiling is an open tab on your account.",
        "value": "Each customer sees their own brand and only what applies to them, and the AI they get with their plan has a known monthly cost to you.",
        "shots": [
          {
            "route": "/settings/branding · Branding",
            "caption": "Branding per organization: the team's login link, a logo for light and dark backgrounds, and the brand colour.",
            "src": "/ci/d0926/settings-branding.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/settings/billing · Billing & plan",
            "caption": "The plan, the billing cycle, and the AI allowance that comes with it.",
            "src": "/ci/d0926/settings-billing.webp",
            "width": 1400,
            "height": 972
          }
        ]
      },
      {
        "n": "08",
        "title": "Marketing site — a two-destination navbar, a Social Growth section that sells, and links that land",
        "sub": "Marketing site SPEC-003 · SPEC-005 · SPEC-014.",
        "subTechnical": true,
        "ask": "Simplify the marketing site’s navigation, show the value of Social Growth rather than its activity, and fix what was wrong on the home page.",
        "status": "Delivered",
        "effort": "2h 30m",
        "inside": [
          {
            "text": "<b>A two-destination navbar:</b> the logo, then “The FTEs” and “Pricing” with a thin red line under the page you are on, then Log in, the theme switch and <b>Hire your FTEs</b>. The FTEs menu shows Glisp as a featured card plus the five FTEs with their icons and roles; everything that left the bar stays reachable from the page and the footer. You chose no pricing page for now, so Pricing is held until one exists.",
            "full": "<b>A two-destination navbar:</b> the logo, then “The FTEs” and “Pricing” with a thin red line under the page you are on, then Log in, the theme switch and <b>Hire your FTEs</b>. The FTEs menu shows Glisp as a featured card plus the five FTEs with their icons and roles; everything that left the bar stays reachable from the page and the footer. You chose no pricing page for now, so Pricing is held until one exists.",
            "technical": false
          },
          {
            "text": "<b>The Social Growth section sells the value:</b> five different products, each with the sales reason it was picked for, a “why this post” panel, value tiles, a six-step “how next week got made” strip and working Approve and Regenerate. Its Wednesday reel is your own ten-second video of the linen overshirt, re-encoded from 3.8 to 1.6 MB.",
            "full": "<b>The Social Growth section sells the value:</b> five different products, each with the sales reason it was picked for, a “why this post” panel, value tiles, a six-step “how next week got made” strip and working Approve and Regenerate. Its Wednesday reel is your own ten-second video of the linen overshirt, re-encoded from 3.8 to 1.6 MB.",
            "technical": false
          },
          {
            "text": "<b>The Social Growth page shows two real reels, one per post</b> — every screen about the linen overshirt now shows the overshirt reel or its frames, where before they showed the hoodie reel under an overshirt label.",
            "full": "<b>The Social Growth page shows two real reels, one per post</b> — every screen about the linen overshirt now shows the overshirt reel or its frames, where before they showed the hoodie reel under an overshirt label.",
            "technical": false
          },
          {
            "text": "<b>Two fixes:</b> an approved reel claimed to be “Scheduled” although reels are posted by hand — it now reads “Ready to post”, and a test fails if the old wording returns. And links into a home-page section landed thousands of pixels past it; after the fix the “Five FTEs” link lands with its section just under the header.",
            "full": "<b>Two fixes:</b> an approved reel read “Scheduled” — now “Ready to post” (<code>lib/social-week.ts</code>, pinned by <code>tests/social-week.test.ts</code>). And every section carried <code>content-visibility: auto</code> with a 1100 px placeholder, so <code>/#ftes</code> scrolled 3,194 px past its section; both classes removed, and <code>/#ftes</code> now lands 96 px from the top.",
            "technical": false
          }
        ],
        "built": "The new site header and FTEs menu, the value-led Social Growth section with the owner’s reel, corrected reel frames, and the two home-page fixes.",
        "why": "The marketing site makes the first promise; a menu with too many doors, a reel under the wrong label or a link that misses its section breaks it.",
        "value": "Visitors see two clear choices, a Social Growth story that shows why each post earns money, and links that take them where they clicked.",
        "shots": []
      }
    ],
    "tiers": [
      {
        "name": "AI provider keys",
        "change": "the last card saved by anyone, used by every organization → each store’s own copy, carried through every request, call and job",
        "why": "The platform settings are never changed."
      },
      {
        "name": "An organization without an integration card",
        "change": "borrowed the first client’s accounts → its own card or nothing",
        "why": "The secret read-back never returns a platform secret."
      },
      {
        "name": "AI spend and traces",
        "change": "charged to “the first store” → charged to the store in scope",
        "why": "Each organization’s bill is its own."
      },
      {
        "name": "A link into a home-page section",
        "change": "3,194 px past the section → 96 px from the top, just under the header",
        "why": "A placeholder height was misleading the browser."
      }
    ],
    "next": [
      {
        "title": "Confirm the AI allowance per plan",
        "body": "Each plan includes platform AI worth 10% of its fee — $50, $80 and $120 a month — pending your confirmation. An organization’s own keys are never limited.",
        "technical": false
      },
      {
        "title": "Move your store onto the new database",
        "body": "The last slice copies your store into the new database as organization #1 with every timestamp as recorded. Until then the new migrations are written and tested but not run.",
        "technical": false
      },
      {
        "title": "Real payment",
        "body": "Plans are recorded with a stand-in payment for now; no card is charged until a real payment provider is switched on.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "The live database was never touched",
        "body": "Every slice was built and tested on in-memory databases and throwaway copies; the new migrations are written and checked, not run. The test suite now fails if a test ever leaves a real database connected.",
        "technical": false
      },
      {
        "title": "Permissions are enforced by a test, not by memory",
        "body": "Every one of the 441 store endpoints must name its permission, and the build fails on one that does not. The AI’s tools follow the same rules as the screens.",
        "technical": false
      },
      {
        "title": "No account is given away",
        "body": "No sign-up or reset screen reveals whether an address already has an account, and an account registered but never verified cannot be taken over.",
        "technical": false
      },
      {
        "title": "How these screens were captured",
        "body": "Every screen in this report was captured from the live app on your real data on Oct 9, in the light theme, with personal contact details blurred. Each shows the screen as it stands today, so it can also carry work that landed after the day it illustrates. Time is estimated per area from the scope of the work.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "d0925",
    "kind": "daily",
    "period": "Friday, Sep 25, 2026",
    "sortDate": "2026-09-25",
    "hook": "413 catalogue pages ranking with no search copy, 130 styles that mis-fit, and $885K of refunds in one buying habit",
    "memo": "Today the platform started finding money nobody had gone looking for. <b>Money pages</b> ranks every product and collection page Google already shows by what a properly written one would be worth — the first read returned <b>413 pages, not one of which had any search copy at all</b> — and drafts the title, description and copy for you to paste in. The <b>refresh loop</b> does the same for articles already published, finding the searches they rank 8–20 for and were never written for. <b>Fit</b> reads 3,039 of your Loop returns and the sizes customers exchanged to, and judges <b>130 styles</b>: 48 run small, 38 run large, each with a size guide. <b>Bracketing</b> puts a number on a habit that was invisible — 8,842 orders bought one style in two sizes, <b>$885.4K of your refunds</b>. The Dashboard can now compare a week against <b>the same Hebrew date last year</b>, which turns a −98.5% artefact into a real −61.1%. And the payable gained <b>four watches and a Monday card</b>. Each item below carries what you asked for, what was built, why it matters, the value it delivers, the time it took, and an exact screenshot from the live app.",
    "effort": "24h 30m",
    "views": "9 screens",
    "areas": 6,
    "days": [
      {
        "title": "Money pages — the pages that sell, unwritten",
        "body": "Every product and collection page Google already shows, ranked by what a properly written page would be worth. First read: <b>413 of them, and not one had any search copy at all</b>.",
        "technical": false
      },
      {
        "title": "The refresh loop",
        "body": "A published article that ranks 8–20 for a search it was never written for is the cheapest win you own. Found every Monday, rewritten on one press, back to review.",
        "technical": false
      },
      {
        "title": "Which way each style fits",
        "body": "Read from 3,039 Loop returns and the sizes customers exchanged to: <b>130 styles judged</b>, 48 running small, 38 large — with a size guide each.",
        "technical": false
      },
      {
        "title": "Three more: brackets, festivals, watches",
        "body": "Orders that bought one style in two sizes; comparing a week against the same Hebrew date last year; and four watches on the payable with a Monday card.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Money pages — what your catalogue is worth written properly",
        "sub": "Backend SPEC-304 · frontend SPEC-308 — migration 0126; draft-only toward Shopify, enforced by a test.",
        "subTechnical": true,
        "ask": "“Money pages — what do they mean, where do they lie, and why?” — then: “go ahead and do all that one by one, end to end, all working.”",
        "status": "Delivered · 413 pages waiting",
        "effort": "5h 30m",
        "inside": [
          {
            "text": "<b>The finding, on the first read: 413 product and collection pages ranking in Google with no search copy at all.</b> Not a low score — no title and no description on any of them, so Shopify has been falling back to the product name on every page you sell from.",
            "full": "<b>The finding, on the first read: 413 product and collection pages ranking in Google with no search copy at all.</b> Not a low score — no title and no description on any of them, so Shopify has been falling back to the product name on every page you sell from.",
            "technical": false
          },
          {
            "text": "<b>Ranked by money, not by impressions.</b> Google’s position and impressions give the visits a rewrite would add; your own trading gives what a visit is worth. The loud page nobody buys from sits below the quiet page everybody does — which is the opposite of what every SEO tool reports.",
            "full": "<b>Ranked by money, not by impressions.</b> Google’s position and impressions give the visits a rewrite would add; your own trading gives what a visit is worth. The loud page nobody buys from sits below the quiet page everybody does — which is the opposite of what every SEO tool reports.",
            "technical": false
          },
          {
            "text": "<b>Write it</b> drafts the search title, the description and the page copy in your brand’s voice, beside what is live now, with a copy button and a character count against Google’s limits. <b>You paste it into Shopify.</b> Nothing is written to your store.",
            "full": "<b>Write it</b> drafts the search title, the description and the page copy in your brand’s voice, beside what is live now, with a copy button and a character count against Google’s limits. <b>You paste it into Shopify.</b> Nothing is written to your store.",
            "technical": false
          },
          {
            "text": "<b>Three corrections, each found by running it on your store rather than by a test.</b> Dividing all-channel revenue by search clicks priced an in-store bestseller with three Google clicks at <b>$343,523 a month</b>; 89% of your orders are taken in the shop, where there is no journey at all. Corrected, one $89 order over one click still read $31,570. The figure now rests on your shop’s own measured rate — <b>$12.95 a search visit</b>, over 12,849 visits — and every row says which rate priced it.",
            "full": "<b>Three corrections, each found by running it on your store rather than by a test.</b> Dividing all-channel revenue by search clicks priced an in-store bestseller with three Google clicks at <b>$343,523 a month</b>; 89% of your orders are taken in the shop, where there is no journey at all. Corrected, one $89 order over one click still read $31,570. The figure now rests on your shop’s own measured rate — <b>$12.95 a search visit</b>, over 12,849 visits — and every row says which rate priced it.",
            "technical": false
          },
          {
            "text": "The whole list is two Search Console reads and two database reads at once: <b>5.8–8.8 seconds</b>, then cached for the day.",
            "full": "The whole list is two Search Console reads and two database reads at once: <b>5.8–8.8 seconds</b>, then cached for the day.",
            "technical": false
          }
        ],
        "built": "The scoring engine and its three gates, the catalogue’s own page copy (filled with no new Shopify call), the Brand-Brain-grounded writer, the read-only invariant test, and the ninth Spotlight tab over it.",
        "why": "You do not sell from articles. You sell from product and collection pages, and nobody had ever rewritten one.",
        "value": "A ranked list of your own pages with the money beside each one — and the copy to fix them, written and waiting.",
        "shots": [
          {
            "route": "/spotlight · Money pages",
            "caption": "The list: what the catalogue is worth written properly, then the filter counts, the search, the sort, and the richest pages with the searches they already appear for. Captured on a later read, so the figures have moved — the list is re-read every day.",
            "src": "/ci/d0925/money-pages-2026-09-25__01-money-pages.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "… filters",
            "caption": "Narrowed to collections. Every filter carries its own count, so you can see the size of a slice before choosing it.",
            "src": "/ci/d0925/money-pages-2026-09-25__04-collections.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "… pager",
            "caption": "Twenty a page, 21 pages. Filtering, searching and sorting all run in the browser on the day’s single read — no control costs a request.",
            "src": "/ci/d0925/money-pages-2026-09-25__06-pager.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "… dark",
            "caption": "The same tab in the dark theme — tokens only.",
            "src": "/ci/d0925/money-pages-2026-09-25__07-money-pages-dark.webp",
            "width": 1400,
            "height": 875
          }
        ]
      },
      {
        "n": "02",
        "title": "The refresh loop — the cheapest wins in search",
        "sub": "Backend SPEC-302 · frontend SPEC-305 — migration 0124; a Monday job, nothing republished.",
        "subTechnical": true,
        "ask": "Part of the same “do all three, end to end” instruction.",
        "status": "Delivered · waiting on live posts",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "<b>Every article you publish ends up ranking for searches nobody wrote it for.</b> Until now the only way to see them was to read Search Console URL by URL, so nobody did.",
            "full": "<b>Every article you publish ends up ranking for searches nobody wrote it for.</b> Until now the only way to see them was to read Search Console URL by URL, so nobody did.",
            "technical": false
          },
          {
            "text": "Every Monday it reads what each live post actually ranked for over 28 days — one call per post, run together: <b>8 URLs in 5.8 seconds</b>.",
            "full": "Every Monday it reads what each live post actually ranked for over 28 days — one call per post, run together: <b>8 URLs in 5.8 seconds</b>.",
            "technical": false
          },
          {
            "text": "<b>The band is 8–20</b>, tighter than for a new topic: a page at 23 is not nearly there. And what the post was <i>already written for</i> is excluded <b>by phrase, not by string</b> — its keyword and every one of its headings.",
            "full": "<b>The band is 8–20</b>, tighter than for a new topic: a page at 23 is not nearly there. And what the post was <i>already written for</i> is excluded <b>by phrase, not by string</b> — its keyword and every one of its headings.",
            "technical": false
          },
          {
            "text": "<b>Rewrite</b> runs the writer you already have, told exactly which searches the article is missing. It keeps the title, the URL and the template, and the draft <b>returns to review</b>. Nothing is republished.",
            "full": "<b>Rewrite</b> runs the writer you already have, told exactly which searches the article is missing. It keeps the title, the URL and the template, and the draft <b>returns to review</b>. Nothing is republished.",
            "technical": false
          },
          {
            "text": "<b>Verified on your own data, where it correctly found nothing:</b> you have no live posts today (9 in review, 8 unpublished). Run against the real Search Console rows for those 8 URLs anyway, it correctly withheld two office-wear searches from the office-wear article as its own keyword re-worded — and every remaining row was a 1–3 impression query, including Google’s own junk (“samples please”, “try again?”).",
            "full": "<b>Verified on your own data, where it correctly found nothing:</b> you have no live posts today (9 in review, 8 unpublished). Run against the real Search Console rows for those 8 URLs anyway, it correctly withheld two office-wear searches from the office-wear article as its own keyword re-worded — and every remaining row was a 1–3 impression query, including Google’s own junk (“samples please”, “try again?”).",
            "technical": false
          }
        ],
        "built": "The Monday scan and its table, the pure decision and its three gates, the rewrite path through the existing refine loop, and the third Published view.",
        "why": "The page already exists, is indexed and is trusted. A rewrite is the shortest route to more traffic there is.",
        "value": "The searches your own articles are losing, listed with what each is worth, and one button that fixes one.",
        "shots": [
          {
            "route": "/spotlight · Worth rewriting",
            "caption": "The third view under Published. It says what the Monday scan looks for and when it looks again — with no posts live today, an empty list is the correct answer rather than a blank panel.",
            "src": "/ci/d0925/money-pages-2026-09-25__08-worth-rewriting.webp",
            "width": 1400,
            "height": 875
          }
        ]
      },
      {
        "n": "03",
        "title": "Which way each style fits — and the size guide it earns",
        "sub": "Backend SPEC-303 · frontend SPEC-306 — migration 0125; read over Loop returns, nothing written to Shopify.",
        "subTechnical": true,
        "ask": "PBI-15/16 of the strategy document — “tell me which products run small or large, and give me the size guidance.”",
        "status": "Delivered",
        "effort": "5h",
        "inside": [
          {
            "text": "<b>69.5% of your returns are about fit</b> — 2,112 of 3,039 — and <b>$161.2K</b> has gone back on them.",
            "full": "<b>69.5% of your returns are about fit</b> — 2,112 of 3,039 — and <b>$161.2K</b> has gone back on them.",
            "technical": false
          },
          {
            "text": "It reads the reason (“too small” / “too big”) <b>and the size the customer actually exchanged to</b>, which is the half most tools never look at.",
            "full": "It reads the reason (“too small” / “too big”) <b>and the size the customer actually exchanged to</b>, which is the half most tools never look at.",
            "technical": false
          },
          {
            "text": "<b>130 styles now carry a verdict:</b> 48 run small, 38 run large, 39 fit varies, 5 true to size. A style needs at least five fit returns before it gets one; 700 are still below that and say so rather than guessing.",
            "full": "<b>130 styles now carry a verdict:</b> 48 run small, 38 run large, 39 fit varies, 5 true to size. A style needs at least five fit returns before it gets one; 700 are still below that and say so rather than guessing.",
            "technical": false
          },
          {
            "text": "<b>Vendors are pooled with their names normalised</b>, so a label’s whole range is judged together — MELI true to size across 325 styles, HAILEY fit varies across 116.",
            "full": "<b>Vendors are pooled with their names normalised</b>, so a label’s whole range is judged together — MELI true to size across 325 styles, HAILEY fit varies across 116.",
            "technical": false
          },
          {
            "text": "Each style gets <b>per-size advice and a generated size guide</b> with a Copy button. Nothing is written to Shopify.",
            "full": "Each style gets <b>per-size advice and a generated size guide</b> with a Copy button. Nothing is written to Shopify.",
            "technical": false
          }
        ],
        "built": "The fit engine and its verdicts, the exchange-size column backfilled from Loop’s payload, the vendor pooling, and the Fit tab over it.",
        "why": "A fit return is the most expensive kind: you pay the shipping twice and lose the sale, and the cause is one sentence you could have put on the page.",
        "value": "The size note that prevents the return, per style, taken from your own returns rather than from the supplier’s chart.",
        "shots": [
          {
            "route": "/products/fit",
            "caption": "Products → Fit: how much of your return bill is fit, how each label leans, and the 130 styles with a verdict. A style below five fit returns is listed as not enough data.",
            "src": "/ci/d0925/daily-2026-09-25__01-fit.webp",
            "width": 1400,
            "height": 875
          }
        ]
      },
      {
        "n": "04",
        "title": "Two sizes in one order — and who does it every time",
        "sub": "Backend SPEC-306 · frontend SPEC-309 — Shopify orders and refunds, all channels.",
        "subTechnical": true,
        "ask": "PBI-20 — “bracketing, and the customers who return most.”",
        "status": "Delivered",
        "effort": "4h",
        "inside": [
          {
            "text": "A bracket is one order holding <b>the same style in two or more sizes</b>. Live, over 365 days: <b>8,842 bracket orders — 6.1% of all orders — and $885.4K refunded on them, 13.4% of your whole refund bill</b>.",
            "full": "A bracket is one order holding <b>the same style in two or more sizes</b>. Live, over 365 days: <b>8,842 bracket orders — 6.1% of all orders — and $885.4K refunded on them, 13.4% of your whole refund bill</b>.",
            "technical": false
          },
          {
            "text": "<b>How they end</b> is the useful part: kept all, kept one, kept some, returned everything — split by channel, with the styles that draw the behaviour and their Fit verdict beside them.",
            "full": "<b>How they end</b> is the useful part: kept all, kept one, kept some, returned everything — split by channel, with the styles that draw the behaviour and their Fit verdict beside them.",
            "technical": false
          },
          {
            "text": "Two customer lists: <b>repeat bracketers</b> (3+ bracket orders that ended in a refund, from at least half of them) and <b>high-return customers</b> (5+ orders, half the units refunded). Named, with emails masked.",
            "full": "Two customer lists: <b>repeat bracketers</b> (3+ bracket orders that ended in a refund, from at least half of them) and <b>high-return customers</b> (5+ orders, half the units refunded). Named, with emails masked.",
            "technical": false
          },
          {
            "text": "<b>Described as a pattern, not a verdict.</b> A refund can be an exchange, a fault or a fit problem. Nothing is sent to these customers and nothing is flagged in Shopify.",
            "full": "<b>Described as a pattern, not a verdict.</b> A refund can be an exchange, a fault or a fit problem. Nothing is sent to these customers and nothing is flagged in Shopify.",
            "technical": false
          },
          {
            "text": "A cache bug caught the same day: a range that included today never hit, because the key held the “now” end.",
            "full": "A cache bug caught the same day: a range that included today never hit, because the key held the “now” end.",
            "technical": false
          }
        ],
        "built": "The bracketing engine over orders and refunds, the two customer rules, the analyst tool and the Report FTE row, and the sixth Returns tab.",
        "why": "Bracketing is invisible in every returns report, because each order looks normal on its own.",
        "value": "The real size of a behaviour that costs you $885K a year, and the styles and customers it concentrates in.",
        "shots": [
          {
            "route": "/returns · Bracketing",
            "caption": "Returns Analytics → Bracketing. The card states plainly that this is a pattern in your own orders, not a verdict about anyone.",
            "src": "/ci/d0925/daily-2026-09-25__04-bracketing.webp",
            "width": 1400,
            "height": 875
          }
        ]
      },
      {
        "n": "05",
        "title": "Compare a week against the same festival last year",
        "sub": "Backend SPEC-305 · frontend SPEC-307 — a fourth compare mode; the calendar maths costs 0.17 ms.",
        "subTechnical": true,
        "ask": "PBI-23/27 — “our year does not run on the Gregorian calendar; compare it properly.”",
        "status": "Delivered",
        "effort": "3h",
        "inside": [
          {
            "text": "<b>Your demand runs on the Hebrew calendar, and the dashboard was comparing Gregorian dates.</b> The two drift by up to three weeks, so a like-for-like comparison was not available at all.",
            "full": "<b>Your demand runs on the Hebrew calendar, and the dashboard was comparing Gregorian dates.</b> The two drift by up to three weeks, so a like-for-like comparison was not available at all.",
            "technical": false
          },
          {
            "text": "A fourth compare mode, <b>the same Hebrew dates one Hebrew year earlier</b> — with the awkward cases handled (a 30th that does not exist in the earlier year, and Adar against Adar II).",
            "full": "A fourth compare mode, <b>the same Hebrew dates one Hebrew year earlier</b> — with the awkward cases handled (a 30th that does not exist in the earlier year, and Adar against Adar II).",
            "technical": false
          },
          {
            "text": "<b>The Dashboard had no compare control at all.</b> It has one now, it labels every delta with <b>the dates the backend actually compared</b>, and it names the festivals in both windows.",
            "full": "<b>The Dashboard had no compare control at all.</b> It has one now, it labels every delta with <b>the dates the backend actually compared</b>, and it names the festivals in both windows.",
            "technical": false
          },
          {
            "text": "<b>When the comparison is not like for like it says so</b>, with one click to switch — measured on your data: Pesach 2025 reads <b>−98.5%</b> against Gregorian dates (it landed on the peak week <i>before</i> Pesach 2024) and <b>−61.1%</b> against Pesach 2024 itself. The first number is an artefact; the second is the business.",
            "full": "<b>When the comparison is not like for like it says so</b>, with one click to switch — measured on your data: Pesach 2025 reads <b>−98.5%</b> against Gregorian dates (it landed on the peak week <i>before</i> Pesach 2024) and <b>−61.1%</b> against Pesach 2024 itself. The first number is an artefact; the second is the business.",
            "technical": false
          }
        ],
        "built": "The Hebrew-calendar window maths, the fourth mode across the dashboard, brief, Loop and Gorgias routes, the Compare menu and the festival note.",
        "why": "A 98.5% drop that is really 61% is worse than no comparison: someone acts on it.",
        "value": "Your seasons compared against the season, not against a date that happened to fall in the same week last year.",
        "shots": [
          {
            "route": "/dashboard · Compare",
            "caption": "The Dashboard’s new Compare menu. Every delta on the page is labelled with the window it was actually measured against.",
            "src": "/ci/d0925/daily-2026-09-25__06-dashboard-compare.webp",
            "width": 1400,
            "height": 875
          }
        ]
      },
      {
        "n": "06",
        "title": "Four watches on the money, and a card that arrives on Monday",
        "sub": "Backend SPEC-307 · frontend SPEC-310 — migration 0127; deterministic, no model on its path.",
        "subTechnical": true,
        "ask": "The third of the three: “finish Finance Oversight.”",
        "status": "Delivered · awaiting your Intuit sign-in",
        "effort": "3h 30m",
        "inside": [
          {
            "text": "Finance Oversight answers everything about the payable — <b>but only when somebody opens it</b>. These are the two halves a page cannot do.",
            "full": "Finance Oversight answers everything about the payable — <b>but only when somebody opens it</b>. These are the two halves a page cannot do.",
            "technical": false
          },
          {
            "text": "<b>Four watches:</b> money past due, bills due in 7 days, the whole outstanding balance, and how many companies cannot cover their week from their own bank. Set a line, get told when it is crossed.",
            "full": "<b>Four watches:</b> money past due, bills due in 7 days, the whole outstanding balance, and how many companies cannot cover their week from their own bank. Set a line, get told when it is crossed.",
            "technical": false
          },
          {
            "text": "All four are answered from <b>one</b> read of the payable per check, not four — proved by a test that counts the reads.",
            "full": "All four are answered from <b>one</b> read of the payable per check, not four — proved by a test that counts the reads.",
            "technical": false
          },
          {
            "text": "<b>A company with no bank account in QuickBooks is never counted as short.</b> Nobody has measured a shortfall there, and firing a warning about a fact nobody has is worse than staying quiet.",
            "full": "<b>A company with no bank account in QuickBooks is never counted as short.</b> Nobody has measured a shortfall there, and firing a warning about a fact nobody has is worse than staying quiet.",
            "technical": false
          },
          {
            "text": "<b>The Monday card</b> — 07:30 in your timezone, off until you switch it on — carries the same note the page shows, the four totals, and anyone short. <b>No model runs on its path</b>, so a weekly email can neither cost anything nor invent a figure. Nothing is sent when nothing is owed.",
            "full": "<b>The Monday card</b> — 07:30 in your timezone, off until you switch it on — carries the same note the page shows, the four totals, and anyone short. <b>No model runs on its path</b>, so a weekly email can neither cost anything nor invent a figure. Nothing is sent when nothing is owed.",
            "technical": false
          },
          {
            "text": "<b>Checked against your live books, where it behaves exactly as designed:</b> no QuickBooks company is connected yet, so all four read “—” rather than a truthful-looking $0.00 — which would have fired every <i>below</i> watch you had set.",
            "full": "<b>Checked against your live books, where it behaves exactly as designed:</b> no QuickBooks company is connected yet, so all four read “—” rather than a truthful-looking $0.00 — which would have fired every <i>below</i> watch you had set.",
            "technical": false
          }
        ],
        "built": "The four watch readers over one payable read, the deterministic Monday card and its email, the schedule that Settings turns on and off live, and the switch.",
        "why": "A page you have to remember to open is a page that tells you after the fact.",
        "value": "The payable comes to you — on a line you set, or on a Monday morning.",
        "shots": [
          {
            "route": "/settings · automatic sending",
            "caption": "The Monday Payable Card switch, beside the manager report card. Off until you turn it on, and silent when nothing is owed.",
            "src": "/ci/d0925/money-pages-2026-09-25__09-payable-card.webp",
            "width": 1400,
            "height": 269
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "Your catalogue",
        "change": "no ranked list → 413 pages priced, with the copy to fix them written",
        "why": "Draft-only toward Shopify, enforced by a test."
      },
      {
        "name": "Published articles",
        "change": "read Search Console by hand → a Monday scan and one Rewrite button",
        "why": "Nothing republished; the draft returns to review."
      },
      {
        "name": "Fit",
        "change": "“returns are high” → 130 styles judged, 48 small, 38 large, a guide each",
        "why": "69.5% of returns are about fit; $161.2K back."
      },
      {
        "name": "Bracketing",
        "change": "invisible → 8,842 orders, 6.1%, $885.4K of your refunds",
        "why": "A pattern, never a verdict; nothing sent."
      },
      {
        "name": "Comparison",
        "change": "Gregorian dates only → the same Hebrew dates last year, festivals named",
        "why": "Pesach 2025: −98.5% the old way, −61.1% the right way."
      },
      {
        "name": "The payable",
        "change": "open the page to know → four watches and a Monday card",
        "why": "Built and green; waiting on your Intuit sign-in."
      }
    ],
    "next": [
      {
        "title": "Press <b>Write it</b> on the first money page",
        "body": "The list is ranked and waiting. Drafting costs a model call against your key, so nothing has been generated yet — the first draft is yours to start, and it takes one press.",
        "technical": false
      },
      {
        "title": "Sign in to the three QuickBooks companies",
        "body": "Finance Oversight, its four watches and the Monday card are all built and green. One Intuit sign-in per company fills them within the hour.",
        "technical": false
      },
      {
        "title": "Top up the image account",
        "body": "Blog headers, social creative and carousels are still refused until the image provider has credit.",
        "technical": false
      },
      {
        "title": "Decide the plans waiting on Continuous Innovation",
        "body": "None of them is started without your yes.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "Nothing was written to your store",
        "body": "Money pages hands you copy with a button; the refresh loop returns a draft to review; Fit generates a size guide you copy. The build fails if a write verb appears in any of those services — the same discipline that keeps Shopify read-only.",
        "technical": false
      },
      {
        "title": "The figures came from your data, not from a model",
        "body": "Every number in this report — 413 pages, $12.95 a visit, 69.5%, 8,842 orders, $885.4K, −61.1% — is a query against your own database or a read of Google’s own rows. The AI wrote none of them.",
        "technical": false
      },
      {
        "title": "Three wrong numbers were caught by running it, not by tests",
        "body": "Money pages priced a page at $343,523 a month, then $31,570, before the rate rested on your shop’s own measured trading. The tests agreed with the code every time; only the live store disagreed. All three are written into the spec.",
        "technical": false
      },
      {
        "title": "Two features are correctly showing nothing",
        "body": "The refresh loop lists nothing because you have no live posts, and the finance watches read “—” because no company is connected. Both are the designed answer, not a gap — a zero there would have been a lie.",
        "technical": false
      }
    ],
    "pages": []
  },
  {
    "id": "w0925",
    "kind": "weekly",
    "period": "Sep 21 – Sep 25, 2026",
    "sortDate": "2026-09-25",
    "hook": "The week the platform stopped reporting and started finding — your catalogue priced, your fit read, and a returns habit worth $885K",
    "memo": "The week the platform stopped reporting and started <b>finding</b>. Monday gave you a reporting employee that plans a report while you watch, and competitors it reads for itself. Tuesday put the four AI employees in one hub, with faces, and let Spotlight be talked to. Wednesday connected your real <b>QuickBooks books</b> and made your brand’s rules — words and pictures — rows you edit rather than lines in a prompt. Thursday turned Finance Oversight into a working desk and traced <b>$40.52 of a $55.05 AI bill to one cache key</b>. Then Friday found what nobody had gone looking for: <b>413 catalogue pages ranking in Google with no search copy at all</b>, 130 styles that do not fit the way the label says, and <b>$885.4K</b> of refunds sitting in a single buying habit. Each day below carries what you asked for, what was built, why it matters, the value it delivers, the time it took, and exact screenshots from the live app; the five daily reports carry every screen.",
    "effort": "129h",
    "views": "20 screens",
    "areas": 5,
    "days": [
      {
        "title": "Mon Sep 21",
        "body": "The <b>Report FTE</b> became a real employee: fourteen reports seeded, a workbench that plans while you watch, history, and edits by conversation. <b>Competitors</b> arrived in the Brand Brain — find them, read them, approve them — on a new web-search seam that runs on whichever key you hold. Clarity had synced nothing for a week; the column name was wrong.",
        "technical": false
      },
      {
        "title": "Tue Sep 22",
        "body": "<b>Digital Employees</b> became one hub with four fewer sidebar rows — and the employees got faces that follow your cursor. Spotlight gained <b>its own chat</b>, where “write about X” starts the article in the thread. Competitor gaps began filing themselves into the query bank, and every article is now planned against the page-one competitor.",
        "technical": false
      },
      {
        "title": "Wed Sep 23",
        "body": "<b>Finance Oversight</b> shipped as the fifth employee and QuickBooks really connected, on your own books. The Brand Brain reached <b>every</b> writer through one rulebook, and the <b>Style Guide</b> made your pictures’ rules editable — the prompt shown, tested on a real best-seller, and saved.",
        "technical": false
      },
      {
        "title": "Thu Sep 24",
        "body": "Finance Oversight became a working desk: <b>eight tabs</b> over three sets of books, with a progress bar per company so a sync is something you watch. Your <b>AI bill was traced to one cache key</b> — $40.52 of $55.05 — and cut to roughly a tenth. A dead chat turned out to be Gemini answering <i>busy</i>, and now retries.",
        "technical": false
      },
      {
        "title": "Fri Sep 25",
        "body": "The platform started <b>finding money nobody had looked for</b>: 413 catalogue pages ranking in Google with no search copy at all, 130 styles that do not fit the way the label says, and <b>$885.4K</b> of refunds concentrated in one buying habit. Plus a Monday scan for published articles, a comparison on your own calendar, and four watches on the payable.",
        "technical": false
      }
    ],
    "sections": [
      {
        "n": "01",
        "title": "Mon Sep 21 — a reporting employee, competitors, and a week of silent failure found",
        "sub": "Monday, Sep 21, 2026 — 10 areas, 36 screens in the daily report.",
        "subTechnical": false,
        "ask": "Today the <b>Report FTE</b> became real: fourteen templates on the engine’s own 53 tools, one narrator writing over computed figures, PDF · Excel · email, schedules with a kill switch and an MCP server — and by the afternoon a workbench: ask in a sentence, watch the report take shape, read it arranged like a report, keep every one you built, and change it by talking. <b>Web research</b> now works on any key on a card, in the store’s own market — and its first use found <b>eleven competitors</b> from your own searches, each read and profiled, waiting for your review. <b>Clarity</b> had synced nothing for a week; fixed the same hour, then 55 pages with real links into Clarity, a page of its own per product, and the Morning Brief saying which money page broke yesterday. Eight posts that had been live and were hidden are listed with why and what they earned; the Brand Brain lost two tabs nobody needed.",
        "status": "Delivered",
        "effort": "37h",
        "inside": [
          {
            "text": "<b>The Report FTE engine — templates as data, the analyst’s own tools, one narrator</b> — 6h. Catalogue, composer, templates, plan, narrator, renderer, delivery, schedules, the service, the MCP server and five tables.",
            "full": "<b>The Report FTE engine — templates as data, the analyst’s own tools, one narrator</b> — 6h. Catalogue, composer, templates, plan, narrator, renderer, delivery, schedules, the service, the MCP server and five tables.",
            "technical": false
          },
          {
            "text": "<b>The Report FTE live in the app — the mock retired</b> — 4h. The query registry, the actions and the SSE reader, the composer state, the delivered list, the editor, the key panel.",
            "full": "<b>The Report FTE live in the app — the mock retired</b> — 4h. The query registry, the actions and the SSE reader, the composer state, the delivered list, the editor, the key panel.",
            "technical": false
          },
          {
            "text": "<b>The workbench — ask in a sentence, watch it compose, read it arranged, edit it by chat</b> — 5h. The Desk prompt, the planning and section skeletons, the arrangement and the document page, sticky columns, History and its three writes, the Report Editor agent and the revision thread.",
            "full": "<b>The workbench — ask in a sentence, watch it compose, read it arranged, edit it by chat</b> — 5h. The Desk prompt, the planning and section skeletons, the arrangement and the document page, sticky columns, History and its three writes, the Report Editor agent and the revision thread.",
            "technical": false
          },
          {
            "text": "<b>Web research on any key — the search provider seam</b> — 4h. The provider interface, three adapters, the factory, the metered wrapper, the tool, and seven agents moved onto it.",
            "full": "<b>Web research on any key — the search provider seam</b> — 4h. The provider interface, three adapters, the factory, the metered wrapper, the tool, and seven agents moved onto it.",
            "technical": false
          },
          {
            "text": "<b>Brand Brain › Competitors — find, review, add by hand</b> — 6h. The run row and its SSE, the sweep and ranking, the site reader, two agents, the routes; the tab, the cards, the toast, the dialog, the profile page.",
            "full": "<b>Brand Brain › Competitors — find, review, add by hand</b> — 6h. The run row and its SSE, the sweep and ranking, the site reader, two agents, the routes; the tab, the cards, the toast, the dialog, the profile page.",
            "technical": false
          },
          {
            "text": "<b>The Brand Brain is seven tabs — Measured folded into Facts, History into Coverage</b> — 1h. Two redirects, a filter read on first paint, a bounded history panel; one view removed; docs and the screen registry trimmed.",
            "full": "<b>The Brand Brain is seven tabs — Measured folded into Facts, History into Coverage</b> — 1h. Two redirects, a filter read on first paint, a bounded history panel; one view removed; docs and the screen registry trimmed.",
            "technical": false
          },
          {
            "text": "<b>Spotlight › Published › Live | Unpublished</b> — 2h 30m. Two columns and their reasons, the reconcile’s hidden case, a list read; the view bar, the card, Publish again.",
            "full": "<b>Spotlight › Published › Live | Unpublished</b> — 2h 30m. Two columns and their reasons, the reconcile’s hidden case, a list read; the view bar, the card, Publish again.",
            "technical": false
          },
          {
            "text": "<b>Clarity had synced nothing for a week — a column name</b> — 1h. The dimension’s own name accepted first, and a fixture that cannot drift from the live API again.",
            "full": "<b>Clarity had synced nothing for a week — a column name</b> — 1h. The dimension’s own name accepted first, and a fixture that cannot drift from the live API again.",
            "technical": false
          },
          {
            "text": "<b>Website friction — controls, an opening row, real Clarity links, a page of its own</b> — 3h 30m.",
            "full": "<b>Website friction — controls, an opening row, real Clarity links, a page of its own</b> — 3h 30m. Every page with its links, a detail read, a pure link builder with tests, SQL filtering; the controls, the opening row, the page.",
            "technical": false
          },
          {
            "text": "<b>Clarity, read for the CEO — the Brief, a watch, a tool, the sources</b> — 4h. A rule and a read for the Brief, a watch metric with detail, an engine tool, the sources join; the panel, the verdict card, the ✦s.",
            "full": "<b>Clarity, read for the CEO — the Brief, a watch, a tool, the sources</b> — 4h. A rule and a read for the Brief, a watch metric with detail, an engine tool, the sources join; the panel, the verdict card, the ✦s.",
            "technical": false
          }
        ],
        "built": "Catalogue, composer, templates, plan, narrator, renderer, delivery, schedules, the service, the MCP server and five tables.",
        "why": "A report that re-computes its own figures is a second source of truth; one that reads the engine’s tools is the same truth on paper.",
        "value": "Any report the pages could answer, built from a sentence, traced figure by figure to its tool, for a few cents.",
        "shots": [
          {
            "route": "/report-fte",
            "caption": "The Desk: the ask with room above, Build it, example asks, the templates beneath.",
            "src": "/ci/w0925/report-fte-2026-09-21b__01-desk.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "/spotlight/brand-brain/competitors",
            "caption": "Built: Find competitors pressed — the toast follows the run step by step.",
            "src": "/ci/w0925/competitors-2026-09-21__02-toast-running.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "/spotlight/brand-brain/coverage",
            "caption": "Coverage with Recent changes folded in; the tab bar without Measured and History.",
            "src": "/ci/w0925/brand-brain-2026-09-21__01-coverage-six-tabs.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "/traffic/website",
            "caption": "The list: search, severity chips, pages of ten, revenue order.",
            "src": "/ci/w0925/traffic-website-2026-09-21__01-list.webp",
            "width": 1400,
            "height": 875
          }
        ]
      },
      {
        "n": "02",
        "title": "Tue Sep 22 — one hub, four employees with faces, and Spotlight learned to talk",
        "sub": "Tuesday, Sep 22, 2026 — 6 areas, 16 screens in the daily report.",
        "subTechnical": false,
        "ask": "Today the four AI employees came together: Spotlight, Social Growth, Performance Ads and the Report FTE moved off the sidebar into one <b>Digital Employees</b> page — a card each with a status read from its own service, what needs you, and a character that looks at your cursor and does its job on hover. Then <b>Spotlight got its own chat</b>: ask what to write next and it answers from today’s picks; say “write about …” and the article starts there, the run shows in the thread, and a card opens the finished draft — proven on your store in 7 m 51 s. <b>Competitors began to earn their place</b>: the topics they cover and you don’t now enter your query bank, and every article is planned against the competitor page that already ranks for its keyword. And five things you pointed at on one screenshot round were rebuilt the same day — the Dashboard’s empty band, the daily report’s white space, the Desk, the Ask Glisp bubble — along with two latent bugs that could have thrown away a finished article.",
        "status": "Delivered",
        "effort": "21h 30m",
        "inside": [
          {
            "text": "<b>Digital Employees — one hub, four fewer sidebar rows</b> — 3h 30m. The roster read and its five rules, the hub page and its cards, the sidebar model, the breadcrumb and the employee doc.",
            "full": "<b>Digital Employees — one hub, four fewer sidebar rows</b> — 3h 30m. The roster read and its five rules, the hub page and its cards, the sidebar model, the breadcrumb and the employee doc.",
            "technical": false
          },
          {
            "text": "<b>… and the employees have faces</b> — 2h 30m. The character component and its pure half, the gaze hook, the moods, the card redrawn around the stage, the doc and hero recaptured.",
            "full": "<b>… and the employees have faces</b> — 2h 30m. The character component and its pure half, the gaze hook, the moods, the card redrawn around the stage, the doc and hero recaptured.",
            "technical": false
          },
          {
            "text": "<b>Talk to Spotlight — its own chat, and “write about this”</b> — 5h 30m. The employee registry, the Spotlight agent and its prompt, five tools, the thread column, the generation card and the employee thread table.",
            "full": "<b>Talk to Spotlight — its own chat, and “write about this”</b> — 5h 30m. The employee registry, the Spotlight agent and its prompt, five tools, the thread column, the generation card and the employee thread table.",
            "technical": false
          },
          {
            "text": "<b>Competitors that earn their place — gaps in the bank, and beating the page that ranks</b> — 4h 30m. The gap filer and its validation, the discovery lane’s second source, the beat finder and its brief, the Inbound filter and chips, the card’s filed line and the draft’s panel.",
            "full": "<b>Competitors that earn their place — gaps in the bank, and beating the page that ranks</b> — 4h 30m. The gap filer and its validation, the discovery lane’s second source, the beat finder and its brief, the Inbound filter and chips, the card’s filed line and the draft’s panel.",
            "technical": false
          },
          {
            "text": "<b>Five things you pointed at, on one screenshot round</b> — 4h. The dashboard column fill and the twenty-row read, the report strip and its panels, the Desk, the selection bubble’s draft path.",
            "full": "<b>Five things you pointed at, on one screenshot round</b> — 4h. The dashboard column fill and the twenty-row read, the report strip and its panels, the Desk, the selection bubble’s draft path.",
            "technical": false
          },
          {
            "text": "<b>Two bugs that could throw away a finished article</b> — 1h 30m. The guardrail’s owner-field reader, the harness’s revision guard, the job runner’s terminal state, and four tests.",
            "full": "<b>Two bugs that could throw away a finished article</b> — 1h 30m. The guardrail’s owner-field reader, the harness’s revision guard, the job runner’s terminal state, and four tests.",
            "technical": false
          }
        ],
        "built": "The roster read and its five rules, the hub page and its cards, the sidebar model, the breadcrumb and the employee doc.",
        "why": "Four features scattered down a sidebar read as four tools. One page of employees reads as a team you manage.",
        "value": "Open one page and know who is working, who needs you and what each one did last — then click into the one that matters.",
        "shots": [
          {
            "route": "/employees",
            "caption": "The hub: four employees, each with its status, what needs you, three figures and the last thing it did.",
            "src": "/ci/w0925/employees-2026-09-22__01-employees.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "/employees · hover",
            "caption": "The four characters on hover, left to right: Spotlight’s telescope sweeping its beam, Social Growth’s megaphone with hearts, Performance Ads’ arrow in the bullseye, the Report FTE writing its clipboard. The raised hand is the “needs you” mood.",
            "src": "/ci/w0925/employees-2026-09-22__07-characters-row.webp",
            "width": 1092,
            "height": 256
          },
          {
            "route": "… answered from its tools",
            "caption": "“What should I write next?” — the top two with the reason from the tools’ own fields.",
            "src": "/ci/w0925/spotlight-chat-2026-09-22__03-thread-ready.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "/spotlight?tab=inbound",
            "caption": "The Competitor gaps filter: the filed topic under its category, tagged with whose gap it is.",
            "src": "/ci/w0925/competitor-gaps-2026-09-22__01-inbound-gaps.webp",
            "width": 1400,
            "height": 875
          }
        ]
      },
      {
        "n": "03",
        "title": "Wed Sep 23 — a fifth employee on real books, and the brand reached every writer",
        "sub": "Wednesday, Sep 23, 2026 — 6 areas, 14 screens in the daily report.",
        "subTechnical": false,
        "ask": "Today added a <b>fifth employee</b> and made your brand reach every one of them. <b>Finance Oversight</b> connects to your real QuickBooks — pick a company at Intuit, come back with it named — and from then on reads every unpaid bill hourly and read-only: what you owe across all three companies, what is past due, the next 7 and 30 days, aging, and what each shop owes against the margin it earns. Then the <b>Brand Brain</b> was verified the hard way and found five places a change did not reach — including the critic that grades every draft, which had no copy of your brand at all; all five are closed, and your rules now travel with all 13 writers. Your <b>pictures</b> got the same treatment: the palette, light, framing and banner crop that lived in code are 21 rows you can read and re-word, the exact prompt an image model receives is on the page, and <b>you can edit it</b> — save and every picture uses your words, one click puts the rules back.",
        "status": "Delivered",
        "effort": "24h 30m",
        "inside": [
          {
            "text": "<b>Finance Oversight — the fifth digital employee</b> — 5h.",
            "full": "<b>Finance Oversight — the fifth digital employee</b> — 5h. The connection model and its encrypted tokens, the finance service and its SQL, the employee card, the page and its tiles, and the invariants test.",
            "technical": false
          },
          {
            "text": "<b>QuickBooks really connects — and the bills are your own</b> — 5h 30m. The OAuth exchange and token storage, the hourly bill read, the two tables, the Integrations card, the connected/refused notices and the read-only invariants.",
            "full": "<b>QuickBooks really connects — and the bills are your own</b> — 5h 30m. The OAuth exchange and token storage, the hourly bill read, the two tables, the Integrations card, the connected/refused notices and the read-only invariants.",
            "technical": false
          },
          {
            "text": "<b>Your Brand Brain now reaches every FTE</b> — 4h 20m. The rulebook and its cache, the dynamic instructions for 13 agents, the critic’s brand payload and its gate, the input guardrail, the Report FTE’s voice and the analyst’s.",
            "full": "<b>Your Brand Brain now reaches every FTE</b> — 4h 20m. The rulebook and its cache, the dynamic instructions for 13 agents, the critic’s brand payload and its gate, the input guardrail, the Report FTE’s voice and the analyst’s.",
            "technical": false
          },
          {
            "text": "<b>A Style Guide for your pictures</b> — 4h. The rule section column and the style rules, the renderer, the seeds transcribed from the old code, the tab and its cards.",
            "full": "<b>A Style Guide for your pictures</b> — 4h. The rule section column and the style rules, the renderer, the seeds transcribed from the old code, the tab and its cards.",
            "technical": false
          },
          {
            "text": "<b>The prompt itself — shown, tested, and editable</b> — 5h. The prompt read and the owner’s stored block, the bench and its five renders, the editor, the safety warning and the reset.",
            "full": "<b>The prompt itself — shown, tested, and editable</b> — 5h. The prompt read and the owner’s stored block, the bench and its five renders, the editor, the safety warning and the reset.",
            "technical": false
          },
          {
            "text": "<b>Two accounts to top up — every picture is blocked until you do</b> — 40m. The billing-reply reader, and a fix so the spend guard reads the right ledger instead of the live one during tests.",
            "full": "<b>Two accounts to top up — every picture is blocked until you do</b> — 40m. The billing-reply reader, and a fix so the spend guard reads the right ledger instead of the live one during tests.",
            "technical": false
          }
        ],
        "built": "The connection model and its encrypted tokens, the finance service and its SQL, the employee card, the page and its tiles, and the invariants test.",
        "why": "Three QuickBooks companies means three logins and three answers. One page is one answer.",
        "value": "See everything owed across all three companies, what is late, and whether each shop earns enough to cover it — without opening Intuit.",
        "shots": [
          {
            "route": "/employees · the fifth card",
            "caption": "The hub with Finance Oversight beside the four AI employees — its own character, its own status.",
            "src": "/ci/w0925/finance-live-2026-09-23__05-hub-light.webp",
            "width": 1400,
            "height": 1061
          },
          {
            "route": "/integrations",
            "caption": "QuickBooks among your connected systems, with its own status and connect step.",
            "src": "/ci/w0925/quickbooks-integration-2026-09-23__02-integrations-light.webp",
            "width": 1400,
            "height": 2400
          },
          {
            "route": "/spotlight/brand-brain/style-guide",
            "caption": "The Style Guide: 21 picture rules, grouped the way a prompt reads them.",
            "src": "/ci/w0925/style-guide-2026-09-23__01-style-guide.webp",
            "width": 1400,
            "height": 2400
          },
          {
            "route": "/spotlight/brand-brain/style-guide",
            "caption": "The prompt for the blog hero, composed from your rules — 21 rules, 3,996 characters, safety last.",
            "src": "/ci/w0925/style-prompt-2026-09-23__01-compiled.webp",
            "width": 1400,
            "height": 2400
          }
        ]
      },
      {
        "n": "04",
        "title": "Thu Sep 24 — the finance desk, a watchable sync, and the AI bill traced to one line",
        "sub": "Thursday, Sep 24, 2026 — 6 areas, 9 screens in the daily report.",
        "subTechnical": false,
        "ask": "Today built <b>Finance Oversight</b> out into a working desk: eight tabs over your three QuickBooks companies — what to pay now, what is due this week, what needs a look, aging, vendors, cash for the next thirteen weeks, its own chat and a profile stating its job and its scorecard — with bill lines, payments, bank balances and a daily snapshot behind them, and a <b>progress bar per company</b> so a sync is something you watch rather than wait out. Alongside it, your <b>AI bill was traced and cut</b>: page commentary was $40.52 of the month’s $55.05, rewriting the same Inventory verdict every fifteen minutes — now capped to at most sixteen runs a day, with 7,334 stale rows swept out. The Finance chat’s “internal error” turned out to be Gemini answering <i>busy</i>, which the platform now retries twice and names in plain words instead of losing. And four things you pointed at are done: your credentials readable behind an eye, one NEW badge instead of twelve, the app’s own confirmation dialog, and replies rendered with real headings, links and code.",
        "status": "Delivered",
        "effort": "21h 30m",
        "inside": [
          {
            "text": "<b>Finance Oversight v2 — eight tabs over three sets of books</b> — 7h. The second-version backend — bill lines, payments, balances, snapshots, flag rules, week verdicts, the morning note and six endpoints — and the eight-tab page with vendor and bill pages over it.",
            "full": "<b>Finance Oversight v2 — eight tabs over three sets of books</b> — 7h. The second-version backend — bill lines, payments, balances, snapshots, flag rules, week verdicts, the morning note and six endpoints — and the eight-tab page with vendor and bill pages over it.",
            "technical": false
          },
          {
            "text": "<b>Watching a QuickBooks sync, company by company</b> — 3h. The sync-state columns and their seven steps, the single-run guard, the progress endpoint, and the bar on both surfaces.",
            "full": "<b>Watching a QuickBooks sync, company by company</b> — 3h. The sync-state columns and their seven steps, the single-run guard, the progress endpoint, and the bar on both surfaces.",
            "technical": false
          },
          {
            "text": "<b>Your AI bill — found, explained and cut</b> — 3h. The banded cache key, the rate floor, the nightly prune job and the tests that pin all three.",
            "full": "<b>Your AI bill — found, explained and cut</b> — 3h. The banded cache key, the rate floor, the nightly prune job and the tests that pin all three.",
            "technical": false
          },
          {
            "text": "<b>Read your own credentials, and the badge that meant nothing</b> — 2h 30m. The one-field reveal endpoint and its audit line, the eye and its cache, and the sidebar badge rule.",
            "full": "<b>Read your own credentials, and the badge that meant nothing</b> — 2h 30m. The one-field reveal endpoint and its audit line, the eye and its cache, and the sidebar badge rule.",
            "technical": false
          },
          {
            "text": "<b>“The assistant hit an internal error” — what it really was</b> — 4h. The retry policy, the reason-keeping on every trace, the busy-provider message and the set-based thread delete.",
            "full": "<b>“The assistant hit an internal error” — what it really was</b> — 4h. The retry policy, the reason-keeping on every trace, the busy-provider message and the set-based thread delete.",
            "technical": false
          },
          {
            "text": "<b>The app asks in its own voice, and answers in full</b> — 2h. The shared confirmation dialog and its wording, and the completed Markdown renderer.",
            "full": "<b>The app asks in its own voice, and answers in full</b> — 2h. The shared confirmation dialog and its wording, and the completed Markdown renderer.",
            "technical": false
          }
        ],
        "built": "The second-version backend — bill lines, payments, balances, snapshots, flag rules, week verdicts, the morning note and six endpoints — and the eight-tab page with vendor and bill pages over it.",
        "why": "The first version answered “what do we owe”. This one answers “what do I pay, and what is left afterwards”.",
        "value": "One page for three companies: what to pay now, what is due, what is late, what each vendor costs you, and whether the cash covers it.",
        "shots": [
          {
            "route": "/employees/finance",
            "caption": "The overview: the money strip, the three piles (pay now · due this week · needs a look), aging and what moved since yesterday. The figures fill the moment a company is connected.",
            "src": "/ci/w0925/finance-v2-2026-09-24__01-overview.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "… payment run",
            "caption": "The payment run: what to pay this week, in order, against what each company has.",
            "src": "/ci/w0925/finance-v2-2026-09-24__03-payment-run.webp",
            "width": 1400,
            "height": 972
          },
          {
            "route": "/integrations",
            "caption": "QuickBooks on Integrations: each company with its own state and its own progress while it reads.",
            "src": "/ci/w0925/finance-v2-2026-09-24__08-integrations.webp",
            "width": 1400,
            "height": 2400
          },
          {
            "route": "/integrations · revealed",
            "caption": "One field revealed: the real value, read-only, with the eye to hide it again. Nothing else on the page carries a credential.",
            "src": "/ci/w0925/secret-eye-2026-09-24__01-revealed.webp",
            "width": 1400,
            "height": 875
          }
        ]
      },
      {
        "n": "05",
        "title": "Fri Sep 25 — 413 unwritten pages, 130 styles that mis-fit, and $885K in one habit",
        "sub": "Friday, Sep 25, 2026 — 6 areas, 9 screens in the daily report.",
        "subTechnical": false,
        "ask": "Today the platform started finding money nobody had gone looking for. <b>Money pages</b> ranks every product and collection page Google already shows by what a properly written one would be worth — the first read returned <b>413 pages, not one of which had any search copy at all</b> — and drafts the title, description and copy for you to paste in. The <b>refresh loop</b> does the same for articles already published, finding the searches they rank 8–20 for and were never written for. <b>Fit</b> reads 3,039 of your Loop returns and the sizes customers exchanged to, and judges <b>130 styles</b>: 48 run small, 38 run large, each with a size guide. <b>Bracketing</b> puts a number on a habit that was invisible — 8,842 orders bought one style in two sizes, <b>$885.4K of your refunds</b>. The Dashboard can now compare a week against <b>the same Hebrew date last year</b>, which turns a −98.5% artefact into a real −61.1%. And the payable gained <b>four watches and a Monday card</b>.",
        "status": "Delivered",
        "effort": "24h 30m",
        "inside": [
          {
            "text": "<b>Money pages — what your catalogue is worth written properly</b> — 5h 30m. The scoring engine and its three gates, the catalogue’s own page copy (filled with no new Shopify call), the Brand-Brain-grounded writer, the read-only invariant test, and the ninth Spotlight tab over it.",
            "full": "<b>Money pages — what your catalogue is worth written properly</b> — 5h 30m. The scoring engine and its three gates, the catalogue’s own page copy (filled with no new Shopify call), the Brand-Brain-grounded writer, the read-only invariant test, and the ninth Spotlight tab over it.",
            "technical": false
          },
          {
            "text": "<b>The refresh loop — the cheapest wins in search</b> — 3h 30m. The Monday scan and its table, the pure decision and its three gates, the rewrite path through the existing refine loop, and the third Published view.",
            "full": "<b>The refresh loop — the cheapest wins in search</b> — 3h 30m. The Monday scan and its table, the pure decision and its three gates, the rewrite path through the existing refine loop, and the third Published view.",
            "technical": false
          },
          {
            "text": "<b>Which way each style fits — and the size guide it earns</b> — 5h. The fit engine and its verdicts, the exchange-size column backfilled from Loop’s payload, the vendor pooling, and the Fit tab over it.",
            "full": "<b>Which way each style fits — and the size guide it earns</b> — 5h. The fit engine and its verdicts, the exchange-size column backfilled from Loop’s payload, the vendor pooling, and the Fit tab over it.",
            "technical": false
          },
          {
            "text": "<b>Two sizes in one order — and who does it every time</b> — 4h. The bracketing engine over orders and refunds, the two customer rules, the analyst tool and the Report FTE row, and the sixth Returns tab.",
            "full": "<b>Two sizes in one order — and who does it every time</b> — 4h. The bracketing engine over orders and refunds, the two customer rules, the analyst tool and the Report FTE row, and the sixth Returns tab.",
            "technical": false
          },
          {
            "text": "<b>Compare a week against the same festival last year</b> — 3h. The Hebrew-calendar window maths, the fourth mode across the dashboard, brief, Loop and Gorgias routes, the Compare menu and the festival note.",
            "full": "<b>Compare a week against the same festival last year</b> — 3h. The Hebrew-calendar window maths, the fourth mode across the dashboard, brief, Loop and Gorgias routes, the Compare menu and the festival note.",
            "technical": false
          },
          {
            "text": "<b>Four watches on the money, and a card that arrives on Monday</b> — 3h 30m. The four watch readers over one payable read, the deterministic Monday card and its email, the schedule that Settings turns on and off live, and the switch.",
            "full": "<b>Four watches on the money, and a card that arrives on Monday</b> — 3h 30m. The four watch readers over one payable read, the deterministic Monday card and its email, the schedule that Settings turns on and off live, and the switch.",
            "technical": false
          }
        ],
        "built": "The scoring engine and its three gates, the catalogue’s own page copy (filled with no new Shopify call), the Brand-Brain-grounded writer, the read-only invariant test, and the ninth Spotlight tab over it.",
        "why": "You do not sell from articles. You sell from product and collection pages, and nobody had ever rewritten one.",
        "value": "A ranked list of your own pages with the money beside each one — and the copy to fix them, written and waiting.",
        "shots": [
          {
            "route": "/spotlight · Money pages",
            "caption": "The list: what the catalogue is worth written properly, then the filter counts, the search, the sort, and the richest pages with the searches they already appear for. Captured on a later read, so the figures have moved — the list is re-read every day.",
            "src": "/ci/w0925/money-pages-2026-09-25__01-money-pages.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "… pager",
            "caption": "Twenty a page, 21 pages. Filtering, searching and sorting all run in the browser on the day’s single read — no control costs a request.",
            "src": "/ci/w0925/money-pages-2026-09-25__06-pager.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "/products/fit",
            "caption": "Products → Fit: how much of your return bill is fit, how each label leans, and the 130 styles with a verdict. A style below five fit returns is listed as not enough data.",
            "src": "/ci/w0925/daily-2026-09-25__01-fit.webp",
            "width": 1400,
            "height": 875
          },
          {
            "route": "/returns · Bracketing",
            "caption": "Returns Analytics → Bracketing. The card states plainly that this is a pattern in your own orders, not a verdict about anyone.",
            "src": "/ci/w0925/daily-2026-09-25__04-bracketing.webp",
            "width": 1400,
            "height": 875
          }
        ]
      }
    ],
    "tiers": [
      {
        "name": "Your catalogue",
        "change": "never audited → 413 pages priced by what writing them is worth",
        "why": "Friday’s first read: not one product or collection page had any search copy at all. The copy to fix them is drafted and waiting on a press."
      },
      {
        "name": "Your returns",
        "change": "a rate → which way each style fits, and one habit costing $885.4K",
        "why": "130 styles judged from 3,039 returns and the sizes customers exchanged to; 8,842 orders bought one style in two sizes, 13.4% of your whole refund bill."
      },
      {
        "name": "Your books",
        "change": "a spreadsheet nobody consolidated → a working finance desk",
        "why": "Eight tabs over three QuickBooks companies, a watchable sync, four watches and a Monday card. Read-only toward Intuit, enforced by a test."
      },
      {
        "name": "Your brand",
        "change": "rules pasted into prompts → rows you edit that reach every writer",
        "why": "One rulebook behind thirteen writing agents, and a Style Guide whose prompt you can read, test on a real best-seller, and save."
      },
      {
        "name": "Your team",
        "change": "features in a sidebar → five digital employees with faces and chats",
        "why": "One hub, four fewer sidebar rows, a Report FTE that plans while you watch, and Spotlight answering in its own thread."
      },
      {
        "name": "The AI bill",
        "change": "unread → traced to one cache key and cut to a tenth",
        "why": "$40.52 of the month’s $55.05 was one line rewriting itself every fifteen minutes. The image account still needs credit."
      }
    ],
    "next": [
      {
        "title": "Press <b>Write it</b> on the first money page",
        "body": "413 pages are ranked and waiting, the richest first. Drafting costs a model call against your key, so nothing has been generated yet — the first one is yours to start, and it takes one press.",
        "technical": false
      },
      {
        "title": "Sign in to the three QuickBooks companies",
        "body": "Finance Oversight, its eight tabs, its four watches and the Monday card are all built and green. One Intuit sign-in per company fills them within the hour, and the progress bar shows it happening.",
        "technical": false
      },
      {
        "title": "Top up the image account, and set the AI ceiling",
        "body": "Blog headers, social creative and carousels are refused until the image provider has credit. With page commentary cut to roughly a tenth, the monthly ceiling to choose is a much smaller number than before.",
        "technical": false
      },
      {
        "title": "Decide the plans waiting on Continuous Innovation",
        "body": "Open each, read to the end, and say Yes or No — a No with your notes is as useful as a Yes. None of them starts without it.",
        "technical": false
      }
    ],
    "cautions": [
      {
        "title": "Measured, not estimated",
        "body": "Every figure in this report — 413 pages, $12.95 a search visit, 69.5% of returns about fit, 8,842 bracket orders, $885.4K, −61.1% — was read from your own database or from Google’s own rows. Where a number could not be trusted honestly, the page says so instead of estimating.",
        "technical": true
      },
      {
        "title": "The backend calculates, the AI interprets",
        "body": "A week that added money pages, a fit engine, a bracketing engine and a calendar comparison did not move that line: no figure in any of them was produced by a model. The writer that drafts a page is never handed a number at all.",
        "technical": false
      },
      {
        "title": "Nothing was written to your store or your books",
        "body": "Money pages hands you copy with a button; the refresh loop returns a draft to review; Fit generates a guide you copy; Finance never writes to Intuit. In each case the build fails if a write verb appears — enforced, not promised.",
        "technical": false
      },
      {
        "title": "Three wrong numbers were caught by running it, not by tests",
        "body": "Money pages priced one page at $343,523 a month, then $31,570, before the figure rested on your shop’s own measured rate. Bracketing’s cache never hit for a range including today. The tests agreed with the code every time; only the live store disagreed.",
        "technical": false
      }
    ],
    "pages": []
  }
];
