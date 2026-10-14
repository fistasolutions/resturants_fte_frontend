# SPEC-346 — Customer Support Agent, a digital employee that works the helpdesk (frontend)

**Status:** implemented 2026-10-07 (frontend, sample data) · **Repo:** frontend · **Backend:** not
started; the contract it must meet is in *Backend API contract* below.
**Builds on:** SPEC-290/291/343 (Digital Employees hub, characters, plain names), SPEC-293/301
(employee chat), SPEC-182/183 (Paid Ads Manager approve-first money safety), SPEC-230 (client
data cache), SPEC-232 (persistent shells), SPEC-301 (shallow tab links), SPEC-080/302 (secret
inputs), SPEC-328 (Integrations hub), SPEC-338 (sidebar preferences), `SPEC-229-in-app-docs.md`
(Rule 11). Written alongside `SPEC-345-email-marketing-manager.md` (same session day, same
preview conventions).

## Why

Support is where a store meets its customers one at a time, and today the helpdesk's own
automation answers from two things: the Shopify order and the help-centre articles. The
platform already knows far more — the real Loop return and refund timing, which way a style
fits, stock and incoming transfers, where an order sits in the warehouse against the shop's own
handling time, the customer's value and health, bracketing behaviour, the order's true margin,
the brand's voice, and how each human agent performs. The Customer Support Agent answers and
resolves conversations **through the store's own helpdesk**, Gorgias first, using all of that.

**The helpdesk stays the inbox and the sending engine. Ecommerce FTE is the brain.**

## Scope

**In:** the whole frontend — route, shell, nine tabs, the hub card and character, the
employee's chat, Settings (connection, autonomy per topic, guardrails, kill switch, hours and
SLAs, languages, sign-off, hand-off map, activity log), the in-app doc, sidebar preferences,
and the pure logic with tests. Ticket data reads **sample data** through the query layer
(`lib/mock/customer-support.ts`, the Rule 6 mock pattern `/ads` and `/report-fte` started
with). **The connection is real:** it reads the existing Gorgias integration (Integrations hub
overview, integration settings, `/gorgias/agents`), so a store that connected Gorgias on
Integrations sees it connected here, and the key form *is* the Integrations key form.

**Out (this slice):** the backend, any write to Gorgias, any send to a customer.

**Out (the product, until an owner decision):** every change to an order in Shopify (refund,
cancel, address change, re-ship, creating a discount code) and starting a return in Loop. The
product is read-only toward Shopify and Loop. For these the agent **prepares** the action with
every detail, shows *Do this in Shopify / Loop* with a deep link, and waits for a human to mark
it done. Each is labelled **Needs an owner decision to automate**.

## Product decisions for the owner (they bind the backend slice, not this one)

1. **Replying to customers is an outbound action.** `docs/prd.md` carves Gorgias out as a
   **read-only** integration (Team Performance, Rule 2's 2026-08-01 note). Creating ticket
   messages, tags, assignments or closes in Gorgias **extends that carve-out to writes**. Before
   the backend slice ships the owner must approve outbound writes and amend `docs/prd.md`'s
   Coming Soon addendum. This frontend writes nothing anywhere.
2. **Default autonomy is Approve to send**, and Autopilot is off for every topic until the owner
   switches a topic on. The never-auto topics (chargebacks, legal threats, allergic reactions or
   injuries, harassment, press, wholesale) cannot be set above Draft.
3. **One Gorgias connection, not two.** The Settings → Connection card embeds Integrations' own
   key panel (`KeySettingsPanel`) and reads the hub's Gorgias row. Writing needs a Gorgias API
   key whose user can create messages; the backend slice validates that, the UI states it.
4. **The hub's "setup" state** is the existing contract: status `not_started` with a `setup`
   action — *Connect Gorgias* when the Integrations hub reports it unconnected, *Review
   settings* when it is connected (the employee still has no backend). There is no separate
   `setup` status.
5. **Preview data is visible in production behind a permanent notice** (below), only when
   Gorgias is connected; an unconnected store sees the not-connected state on every tab.

## Preview honesty

While ticket data is sample data the shell carries a permanent notice: *"Preview — sample
tickets for Example Store. The connection is real; the tickets, drafts and figures are not.
Nothing is sent to customers or written to Gorgias. Changes reset when you reload."* Every
write button works against the in-browser preview store and its confirmation says *"Preview:
recorded here only."* The kill switch is client state in the preview and says so.

## Existing Gorgias surfaces — audit and decision

| Surface | Spec | Decision |
| --- | --- | --- |
| Team Performance (`/team-performance`, Overview · Conversations · Agents · Alerts · Voice of Customer) | SPEC-081-team-performance-page, SPEC-094 | **Unchanged.** It measures the human team. Performance links to it for the human side; Insights links to its Voice of Customer tab. |
| Revenue at risk + contact rate | SPEC-096 (backend SPEC-098) | **Reused as the idea, not re-derived.** A ticket's money at stake is the backend's existing definition: the customer's Shopify lifetime value while the ticket is unanswered, over 24 h or unhappy (`conversation_service.revenue_at_risk`). The queue sorts by it. |
| Support-agent supervision (detect → email → Results) | SPEC-147 (backend SPEC-148) | **Unchanged; linked.** Hand-offs land with human agents that supervision already measures. |
| Gorgias workspace conversation data | SPEC-094 (backend SPEC-087/088) | **Unchanged.** The backend slice reads the same synced tables for history and adds write calls. |
| Gorgias on Integrations (key form, test, disconnect) | SPEC-080, SPEC-302, SPEC-328 | **Reused in place** — the Connection card embeds `KeySettingsPanel` (same fields, same endpoint, Reveal/Replace). |
| `/gorgias/agents` | SPEC-081 | **Reused** — the Connection card's agent count and the hand-off picker's people. |
| Fit Intelligence (`lib/fit.ts` `VERDICT_META`, `fitStyleHref`) | SPEC-306 | **Reused** for verdict labels, tones and links. |
| Customer health tones | SPEC-247 | **Reused** (`healthBadgeClass`). |
| Bracketing (Returns → Bracketing) | SPEC-309 | **Linked**; wording is behaviour, never "fraud" (`bracketingLine`). |
| Warehouse / Inventory / Returns / Customers pages | — | **Linked** from the context panel and Insights. |

## Safety model

Mirrors `services/ads/` and the Paid Ads Manager: approve-first.

- **Four autonomy levels**, per employee, overridable per topic: `suggest` (classify and
  summarise only) · `draft` (internal-note draft for a human to send) · `approve` (**default**:
  every reply waits for one click in Approvals) · `autopilot` (only topics the owner switched
  on, inside the guardrails). `effectiveAutonomy()` resolves topic override → employee level,
  caps never-auto topics at `draft`, and drops everything to `suggest` while the kill switch is
  on.
- **Guardrails** (Settings): never-auto topics; anger threshold for an automatic hand-off; VIP
  handling (always human / human-reviewed); maximum goodwill offer (% of order and a currency
  ceiling) and a margin floor; confidence floor for autopilot; maximum agent replies per ticket
  before a hand-off; business hours and the SLA per channel; languages it may answer in; words
  and claims it may never use (from Brand Brain); required sign-off and signature.
- `guardrailCheck(ticket, draft, guardrails)` returns every check as `pass | warn | block` with
  a reason; `canSend()` folds them, so the Send button is disabled by the same function the
  panel lists. `handoffDecision()` says whether the ticket must go to a human and why.
- **The pre-send panel**, shown before every Send (Inbox draft, Approvals): the customer's
  message; what the agent found (order, shipment, return, fit verdict, stock, customer value,
  prior tickets); a **source chip for every fact** in the reply; confidence with its band and
  reasons; brand-voice score and any banned-word hits; the cost of any offer against the
  order's margin; the channel it goes out on.
- **Hand-off is first-class:** assign to a team or person, an internal note with a three-line
  summary and the suggested next step, and a priority — a human never re-reads the thread.
- **Kill switch** visible on every tab (the shell strip): drops the agent to Suggest and
  cancels queued sends (`queued → cancelled`).
- **Activity log**: every action the employee took in the helpdesk — tag, assign, reply, note,
  close, snooze, priority, hand-off, kill switch — with actor, time and a link to the ticket.

## What the helpdesk can do (the capability matrix)

`lib/helpdesk-providers.ts` — rows `gorgias` (available) and `zendesk`, `freshdesk`, `reamaze`,
`helpscout`, `intercom`, `kustomer`, `richpanel`, `shopify_inbox` (coming soon, shown by name).
Booleans: `replyOnChannel`, `internalNotes`, `tags`, `customFields`, `assignTeams`, `snooze`,
`macros`, `rulesRead`, `csat`, `realtimeWebhooks`, `sidebarWidget`, `voice`, plus `channels[]`,
`auth[]` and the rate limit. The UI asks `can(provider, capability)` and never compares a
provider name. Gorgias facts the UI states: REST at `https://{subdomain}.gorgias.com/api`; HTTP
Basic (email + API key) today, OAuth2 for a public app (shown as *coming*); leaky bucket 40
requests / 20 s on a key, 80 / 20 s on OAuth; `429` with `Retry-after`. Message sends are
asynchronous — created ≠ sent until `sent_datetime` — so a reply shows **Queued → Sent /
Failed (retry)**.

Every action on screen maps to a real Gorgias capability: ticket update (status, assignee
user/team, tags, priority critical/high/normal/low, snooze, spam), message create on the
customer's channel (`from_agent`, `public: false` for notes), users and teams (hand-off picker),
tags/custom fields (the classifier), macros (library and proposals), rules (read — shown so
ours never fight them), satisfaction surveys (CSAT), events (activity). Gorgias statistics are a
cross-check only; our figures are the backend's (Rule 8).

## Route, navigation, shell

- Route `/customer-support` (`app/(app)/customer-support/`). `/team-performance` is untouched.
- `navItems`: `{ title: "Customer Support Agent", href: "/customer-support", icon: LifeBuoy,
  within: "/employees" }` (`Headset` is Team Performance's). `HUB_ORDER` places it after Paid Ads
  Manager's group, before Accounts Payable.
- `layout.tsx` → `features/customer-support/customer-support-shell.tsx` (breadcrumb,
  `PageHeader`, preview notice, the status strip with autonomy, approvals count and kill switch,
  the tab bar). Tabs are `?tab=` moved with `ShallowLink` — no server render per switch; hover
  or focus warms the tab's query.
- Hub: `EmployeeKey` gains `customer_support`; `CHARACTERS.customer_support = { kind: "headset" }`
  with its own hair (short crop) and prop (a headset with a mic boom; on hover a speech bubble's
  dots pulse, gated by `prefers-reduced-motion`). Until the roster returns it,
  `withCustomerSupportPreview()` in `lib/mock/customer-support.ts` appends one entry in
  `employeesQueries.roster` (the only call site the backend slice deletes); the roster read also
  reads the hub overview in parallel to choose *Connect Gorgias* or *Review settings*.
- Sidebar preferences (SPEC-338): the nine tabs registered in `PAGE_TABS`.
- `isChatWorkspace` treats `/customer-support?tab=chat` as a chat workspace; the Ask Glisp drawer
  offers the support prompts Glisp has tools for.

## Tabs and acceptance criteria

Every tab: a skeleton of the right shape · an empty state that says what to do next ·
`QueryErrorState` · the not-connected state leading to Settings → Connection · a stale note
when the helpdesk's last successful sync is over 2 hours old · a rate-limit note when intake was
delayed by the helpdesk's limit.

1. **Overview** — money strip: tickets 24 h and 7 d; share resolved by the agent vs humans;
   first-response and resolution time, agent vs human; CSAT agent vs human; revenue at risk in
   open tickets; hours saved **with its basis shown**. *Needs you*: approvals waiting, hand-offs,
   SLA breaches, failed sends — each a link to the filtered Inbox or Approvals. *Why customers
   are writing*: top five topics with trend arrows, each to Insights. The last five things it did.
2. **Inbox** — three panes on desktop (queue · conversation · context), stacked with a back
   button on phones. Filters: needs approval, auto-answered, handed off, waiting on customer,
   snoozed, closed, spam. Sort: revenue at risk, SLA, newest. Paginated (25 a page). The
   conversation shows the thread across channels with channel icons, internal notes visibly
   different, each outbound message's send state, the agent's draft inline with Send · Edit ·
   Hand off · Internal note, and the prepared outside actions. The context panel: customer
   (value, VIP, health, prior tickets), order and fulfilment (warehouse status, carrier, late vs
   handling time), the Loop return or exchange, the fit verdict per item, stock and incoming
   restock, the bracketing line, suggested macros. The selected ticket lives in the URL.
3. **Approvals** — every waiting reply with the full pre-send panel. Approve · Edit · Send back
   (reason ≥ 10 characters) · Reject. Keyboard j/k/a/r/e, plus b for send back (not while
   typing). Bulk approve only on topics marked bulk-safe and only for items whose guardrails all
   pass with autopilot-level confidence.
4. **Topics & playbooks** — the fourteen topics, each card with volume, autonomy, confidence,
   CSAT, resolution rate and the facts it checks. A playbook editor per topic: steps, data it
   must check, what it may offer, when it must hand off, tone. A test bench: pick a real past
   ticket and see the reply the agent would write today with the current playbook.
5. **Knowledge** — the Brand Brain facts and policies it uses (shipping, returns, warranty,
   sizing), help-centre articles and macros, each with its source and when last checked.
   *Gaps*: questions it could not answer, with *Add an answer* (creates a Brand Brain fact or a
   macro, approve-first). *Stale or conflicting* answers flagged (e.g. returns window 30 days in
   one place, 14 in another).
6. **Insights** — recurring problems turned into fixes with an owner and a money figure and its
   basis: size-chart errors by product (to Fit), damage by carrier or warehouse, late orders by
   location, policy confusion with the page to rewrite, products most written about. Each has
   *Send to* (Product Analyst, Warehouse, Search Visibility) as a link — no new route.
7. **Performance** — the agent next to the human agents: first response, resolution, one-touch,
   reopen, CSAT, hand-off rate and accuracy by topic; a Recharts trend; best and worst topics;
   the snapshot time; a link to Team Performance for the humans.
8. **Chat** — the employee's own chat on the shared `EmployeeChatPanel` (SPEC-293), its stream
   served through the transport seam in `services/customer-support-chat.ts` (sample replies
   until the backend's `employee` exists). Replies can carry action cards that open the Inbox
   filtered or a playbook.
9. **Settings** — Connection (helpdesk picker: Gorgias enabled, the rest by name as coming
   soon; the Integrations key panel embedded; OAuth shown as coming; account, agent count,
   status, last sync; disconnect via the same panel); autonomy per topic; guardrails and the
   kill switch; business hours and SLAs per channel; languages; signature and sign-off; the
   hand-off team map; the activity log.

## Types (`types/customer-support.ts`)

`HelpdeskProviderKey`, `HelpdeskCapabilities`, `HelpdeskProvider`, `Channel`, `Money`
(`{ amountMinor, currency }`), `SupportTicket`, `SupportMessage` (`channel`, `direction`,
`visibility` public/internal, `sendState` queued | sent | failed | cancelled), `SupportCustomer`,
`TicketContext` (order, fulfilment, return, fit, stock, value, bracketing, prior tickets,
macros), `TopicKey`, `Topic`, `Playbook`, `AutonomyLevel`, `Guardrails`, `DraftReply` (`body`,
`sources[]`, `confidence`, `reasons[]`, `voiceScore`, `bannedHits[]`, `offer`), `GoodwillOffer`
(amount, order margin), `OutsideAction`, `Handoff`, `Approval`, `KnowledgeItem`, `KnowledgeGap`,
`Insight`, `PerformanceSnapshot`, `ActivityEntry`, `SupportWorkspace`, `SupportOverview`. Every
helpdesk-side object carries `provider` and an optional `externalId`.

## Query keys (`lib/queries/customer-support.ts`)

`["customer-support", <name>]` for `workspace`, `overview`, `inbox`, `ticket` + id, `approvals`,
`topics`, `knowledge`, `insights`, `performance`, `activity`, `bench` + topic + ticket. Writes
in `services/customer-support-actions.ts`; `features/customer-support/use-support-actions.ts`
invalidates `["customer-support"]` after each. The connection reads the existing
`integrationQueries.overview()`, `integrationQueries.settings()` and `gorgiasQueries.agents()`.
Each customer-support query's path is defined in `customerSupportPaths` today; the backend
slice replaces each `load` with a GET on that path and deletes the mock.

## Backend API contract (`/api/v1/customer-support/*`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/workspace` | Provider + capabilities, autonomy (employee and per topic), guardrails, kill switch, intake state (last sync, rate-limit delay), snapshot time |
| GET | `/overview` | Money strip, needs-you counts, top topics with trend, last five actions |
| GET | `/tickets?queue=&sort=&page=` | The queue page (25), with counts per queue |
| GET | `/tickets/{id}` | Thread, context (order, fulfilment, return, fit, stock, value, bracketing, history, macros), draft, prepared outside actions |
| POST | `/tickets/{id}/draft` | Regenerate the draft |
| POST | `/tickets/{id}/reply` | `{body, channel}` → Gorgias message create (`from_agent`), returns the message with `send_state` |
| POST | `/tickets/{id}/note` | Internal note (`public: false`) |
| POST | `/tickets/{id}/handoff` | `{to, summary[3], next_step, priority}` → assignee + note + priority |
| PATCH | `/tickets/{id}` | Tags, priority, snooze, status, spam |
| POST | `/messages/{id}/retry` · `/messages/{id}/cancel` | Async send recovery |
| POST | `/outside-actions/{id}/done` | A human did it in Shopify / Loop |
| GET | `/approvals` | Queue with pre-send panels |
| POST | `/approvals/{id}/approve` · `/send-back` (`reason`) · `/reject` | Decisions; `/approvals/bulk-approve` only for bulk-safe topics |
| GET | `/topics` · PUT `/topics/{key}/playbook` · PUT `/topics/{key}/autonomy` | Topics and playbooks |
| POST | `/topics/{key}/bench` `{ticket_id}` | Test bench reply with the current playbook |
| GET | `/knowledge` · POST `/knowledge/gaps/{id}/answer` | Knowledge; an answer becomes a pending Brand Brain fact or a draft macro |
| GET | `/insights` | Recurring problems with owner and money basis |
| GET | `/performance?period=` | Agent vs humans, trend, topics, snapshot time |
| PUT | `/autonomy` · `/guardrails` · `/hours` · `/languages` · `/signature` · `/handoff-map` | Settings |
| POST | `/kill-switch` `{active, reason}` | Drop to Suggest, cancel queued sends |
| GET | `/activity?page=` | Activity log |
| POST | `/chat` with `employee: "customer_support"` | The shared chat engine |

Rate limits are the backend's: intake by Gorgias HTTP integration events (no polling) once
available, otherwise a paced sync inside the 40 / 20 s bucket; `Retry-after` is honoured and the
delay surfaces as `intake.rate_limited_seconds`.

## Mock strategy

`lib/mock/customer-support.ts` holds one sample workspace for **Example Store /
examplestore.com**, vertical-neutral, invented customers at `@example.com`, internally consistent
(counts sum, rates from counts, offers priced against each order's margin), dated relative to
now. A module-level store carries the preview's changes in the browser; each query's `load`
returns a copy. Mock reads are **not** server-prefetched (a server render would overwrite the
browser's preview changes on the next visit); the real connection reads are. The backend slice
adds `prefetch()` for each tab's read in `page.tsx`.

## Performance budget

Tab switch: no network (shallow link), paints from cache. Inbox ticket switch: no network in
the preview (URL `replaceState` + cache), < 50 ms; with the backend, the next ticket is
prefetched on hover/focus. First paint: the shell paints without waiting on any read; the
connection reads are prefetched in parallel and streamed. Long queues paginate at 25.

## Manual verification checklist

- `/employees`: a card for Customer Support Agent, *Not started* with *Connect Gorgias* (or
  *Review settings* when Gorgias is connected), its character with a headset; hover pulses the
  speech dots (not with reduced motion).
- Sidebar: listed under Digital Employees; Settings → Sidebar lists its nine tabs.
- `/customer-support`: breadcrumb, preview notice, status strip with the kill switch, nine tabs;
  switching tabs makes no request.
- Gorgias not connected: every tab shows the not-connected state → Settings → Connection, which
  shows the Integrations key form.
- Overview: strip with agent vs human, hours-saved basis; Needs-you links open the Inbox filtered.
- Inbox: filters, sorts, pagination; selecting a ticket updates the URL; the context panel shows
  order, Loop return, fit, stock, bracketing wording without "fraud"; Send is disabled when a
  guardrail blocks; Hand off opens the dialog with a three-line summary; an outside action says
  *Do this in Shopify* with a link and *Mark done*.
- Approvals: j/k/a/r/e; Send back asks for a reason of 10+ characters; Bulk approve appears only
  for bulk-safe topics.
- Topics: change autonomy; never-auto topics cannot go above Draft; playbook editor saves; the
  test bench shows a reply for a picked ticket.
- Knowledge: gaps with *Add an answer*; conflicts flagged.
- Insights: each with owner, money and basis, and a *Send to* link.
- Performance: chart renders in both themes; snapshot time shown.
- Chat: starters stream a sample reply with an action card that opens the Inbox filtered.
- Kill switch on: banner on every tab; queued sends show cancelled; autonomy reads Suggest.
- Light and dark; phone width (Inbox stacks; no horizontal scroll); keyboard only.

## Tests

`tests/customer-support.test.ts` (routing, guardrails, hand-off, SLA, offer vs margin,
confidence band, send state, comparisons, bracketing wording, autonomy, tab model, money
format), `tests/support-inbox.test.ts`, `tests/support-insights.test.ts`,
`tests/helpdesk-providers.test.ts`, `tests/customer-support-mock.test.ts` (sample data is
internally consistent and white-label clean), plus the existing navigation, character, nav-prefs,
chat-drawer and docs tests extended for the new destination.

## Verification (2026-10-07)

Commands, inside `ecommerce-fte-frontend/`:

- `npx tsc --noEmit` — clean.
- `npm run lint` — 0 errors (3 pre-existing warnings in `features/social` and `features/spotlight`, none in files this spec touches).
- `npm test` — 215 files, 2,443 tests passed, including the new `customer-support`,
  `support-inbox`, `support-insights`, `helpdesk-providers` and `customer-support-mock` files and
  the extended `navigation`, `employee-character`, `employees`, `employee-chat`, `nav-prefs`,
  `chat-drawer-prompts`, `brand-name` and `docs` tests.
- `npm run build` — compiled; `/customer-support` is a dynamic route.

Performance (Rule 5). A tab switch and an Inbox ticket switch make no network request in the
preview (shallow links; the reads resolve from the in-browser store into the client cache). The
data work behind each, measured in Node over 200 runs: overview 0.08 ms, an Inbox page sorted by
revenue at risk 0.04 ms, a ticket's detail 0.02 ms, approvals 0.11 ms, topics 0.05 ms,
performance 0.06 ms. The one network read is the real Gorgias connection
(`/integrations/overview`), prefetched unawaited by the page and shared with Integrations' cache;
the hub adds the same read **in parallel** with `/employees`, never after it. First paint and
revisit timings in a signed-in browser were **not** measured in this session (no signed-in
session was available) — they are the first item of the manual checklist.

| # | Acceptance criterion | State |
| --- | --- | --- |
| 1 | Overview: strip (agent vs team), hours-saved basis, Needs you, top five topics, last five actions | done |
| 2 | Inbox: three panes / stacked, seven queues, three sorts, paging, URL selection, j/k, thread with send states, draft with Send · Edit · Hand off · Internal note, context panel, outside actions | done |
| 3 | Approvals: pre-send panel, approve / edit / send back / reject, keys, bulk-safe only | done |
| 4 | Topics & playbooks: cards, autonomy per topic (never-auto capped), bulk-safe, playbook editor, test bench | done |
| 5 | Knowledge: sources and check dates, gaps with approve-first answers, conflicts, helpdesk rules | done |
| 6 | Insights: owner, money and basis, Send to links to existing pages | done |
| 7 | Performance: agent vs team, trend (Recharts), best / worst topics, snapshot time | done |
| 8 | Chat: shared panel, starters, streamed preview replies with action cards | done |
| 9 | Settings: connection (picker, Integrations' own connect dialog and key panel, OAuth as coming), autonomy, guardrails, hours & SLAs, languages, sign-off, hand-off map, activity log | done |
| 10 | States: skeletons, empty states, `QueryErrorState`, not-connected, stale note, rate-limit note | done |
| 11 | Hub card, character (headset), sidebar entry, sidebar preferences | done |
| 12 | In-app doc with a section per tab; overview's Gorgias line; hub doc | done (no capture yet — each section says so) |
| 13 | Measured first paint / revisit in a signed-in browser | not done — see above |

## Patches

- 2026-10-07 — the damaged-item sample offered $10 on a $54 order, which is 18.5 % of the order
  and over the 15 % ceiling, while its copy said it only neared the margin floor. The new
  `customer-support-mock` test caught it; the sample is now $7 on an $18.40 margin (21 % left,
  a warning near the 20 % floor), and its outside action says so.
- 2026-10-07 — **Live on backend SPEC-353** (owner: "complete the backend … integrated with
  frontend"). Every `customerSupportQueries` loader is a GET on its path (camelCase on the
  wire, no adapter) and the page prefetches the opening tab's reads; every action posts through
  `services/customer-support-actions.ts`; the Chat tab runs on the shared engine
  (`useEmployeeChat("customer_support")`) with `link` cards (`lib/employee-chat.ts`
  `linkCardsFrom`, in-app paths only); the hub card comes from the backend roster. Deleted:
  `lib/mock/customer-support.ts`, the scripted chat, the preview notice and their test. The
  Inbox shows why the agent could not draft (`draftError`) and offers *Ask the agent to draft*.
  `Topic.confidence` and a performance topic's `accuracy` are nullable — "—" until the agent
  has drafted on that topic. The in-app doc now describes the live product.
