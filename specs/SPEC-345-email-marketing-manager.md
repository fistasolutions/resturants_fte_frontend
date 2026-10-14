# SPEC-345 — Email Marketing Manager, the sixth digital employee (frontend)

**Status:** implemented 2026-10-07 (frontend, sample data) · **Repo:** frontend · **Backend:** not
started; the contract it must meet is in *Backend API contract* below.
**Builds on:** SPEC-290/291/343 (Digital Employees hub, characters, plain names), SPEC-293/301
(employee chat), SPEC-182/183 (Paid Ads Manager money safety), SPEC-230 (client data cache),
SPEC-232 (persistent shells), SPEC-301 (shallow tab links), SPEC-080/302 (secret inputs),
SPEC-338 (sidebar preferences), `SPEC-229-in-app-docs.md` (Rule 11).

## Why

Email is the cheapest revenue a store has, and most stores run it badly: the flows are missing
or stale, campaigns go to everyone on a blast calendar, and success is judged by the revenue the
email platform *attributes to itself*. The platform already knows what an email platform cannot:
true margin and landed cost, stock and the season forecast, fit and returns, customer health and
the repeat clock, the brand's voice, the posts Search Visibility publishes, and which discount
codes actually lift sales.

The Email Marketing Manager runs a store's email and SMS **through the store's own email
platform**, Klaviyo first, and judges every send by **profit and incremental lift**, not
attributed revenue. Klaviyo stays the system of record and the sending engine; this employee is
the brain.

## Scope

**In:** the whole frontend: route, shell, eleven tabs, the campaign builder, campaign and flow
detail pages, the hub card and character, the employee's chat, Settings (connection, autonomy,
guardrails, kill switch, defaults, seed list, activity), the in-app doc, sidebar preferences, and
the pure logic with tests. Everything reads **sample data** through the query layer
(`lib/mock/email-marketing.ts`, the Rule 6 mock pattern `/ads` and `/report-fte` started with).

**Out:** the backend, any real Klaviyo call, storing a key, sending anything. The existing
Klaviyo surfaces (the Brief win-back sync button, the Customers win-back page, Klaviyo's card on
Integrations) are **not changed**; see *Existing Klaviyo surfaces*.

## Product decisions for the owner (they bind the backend slice, not this one)

1. **Sending is an outbound mutation to real customers.** `docs/prd.md` lists Klaviyo under
   Coming Soon; Rule 2's Klaviyo note already calls the win-back sync unreconciled precedent.
   Before the backend slice ships, the owner must (a) approve outbound sending and (b) add a
   `docs/prd.md` carve-out, as was done for Gorgias and Loop. This frontend sends nothing.
2. **One Klaviyo connection, not two.** The backend should widen the existing `klaviyo`
   integration row (today a private key with Lists + Profiles write, used by win-back) to this
   employee's scope list, so Integrations and this Settings tab show the same connection. The
   mock keeps its own state until then.
3. **Win-back moves into the employee.** When the backend lands, the Brief's "Sync to Klaviyo"
   becomes the employee's *Win-back / VIP going quiet* flow, and the button links there.
   Until then it stays exactly as it is.
4. **The hub's "setup" state** is the existing contract: status `not_started` with a `setup`
   action ("Connect Klaviyo"). There is no separate `setup` status.

## Preview honesty

The shell carries a permanent notice while the data is sample data: *"Preview — sample data for
Example Store. Nothing here is connected to Klaviyo and no email or SMS is sent. Changes reset
when you reload."* The hub card says **Not started · Connect Klaviyo**, which is true. Inside,
the sample account reads as connected so every screen can be explored; Settings → Disconnect
shows the not-connected state on every tab. Connecting with a key in the preview never stores
or sends the key; it only restores the sample account and says so.

## Safety model

Mirrors `services/ads/` and the Paid Ads Manager UI.

- **Autonomy levels**, per employee, overridable per program (campaign or flow):
  `suggest` (ideas only) · `draft` (builds in Klaviyo as draft) · `approve` (**default**:
  nothing leaves without an owner click) · `autopilot` (only for programs the owner switched on,
  inside the guardrails).
- **Guardrails** (Settings): frequency cap per profile per week; quiet hours in the customer's
  timezone; max audience without a second approval; max discount %; margin floor for
  discounted products; excluded segments; daily send ceiling; required seed list.
- **The pre-send panel**, shown before every send button (builder review, approvals, campaign
  detail): recipient estimate, exclusions with reasons, expected **profit** range and its basis,
  discount cost, holdout size, deliverability checks, brand-voice score, guardrail results, and a
  rendered preview on desktop and mobile in light and dark.
- **Send test** is one click everywhere. Final send over the audience threshold needs the
  audience size typed back; under it, an explicit confirm.
- **Kill switch** on every tab (the shell strip): pauses every live flow the employee created and
  cancels scheduled sends. It is a backend state; in the preview it is client state and says so.
- **Activity timeline**: every action with actor (owner, employee, Klaviyo), time and what
  changed in Klaviyo.

`lib/email-marketing.ts` `guardrailChecks()` returns each check with `pass | warn | block` and a
reason; `approvalReadiness()` folds them, so the send button is disabled by the same function the
panel lists.

## Route, navigation, shell

- Route `/email-marketing` (not `/email`: the backend's `services/email/` is SMTP).
- `navItems`: `{ title: "Email Marketing Manager", href: "/email-marketing", icon: MailCheck,
  within: "/employees" }`; `HUB_ORDER` after Paid Ads Manager.
- `app/(app)/email-marketing/layout.tsx` → `features/email-marketing/email-marketing-shell.tsx`
  (breadcrumb, `PageHeader`, preview notice, the status strip with autonomy and kill switch, the
  tab bar). Tabs are `?tab=` moved with `ShallowLink` (SPEC-301): no server render per switch.
- Sub-routes own their header (breadcrumb with trail), the shell passes them bare:
  `/email-marketing/campaigns/new`, `/email-marketing/campaigns/[id]`,
  `/email-marketing/flows/[id]`.
- Hub: `EmployeeKey` gains `email_marketing`; `CHARACTERS.email_marketing = { kind: "envelope" }`
  with its own hair and prop (an envelope whose flap opens and letter rises on hover, gated by
  `prefers-reduced-motion`). Until the roster returns it, `withEmailMarketingPreview()` in
  `lib/mock/email-marketing.ts` appends one entry in `employeesQueries.roster` (the only call
  site the backend slice deletes).
- Sidebar preferences (SPEC-338): the eleven tabs registered in `PAGE_TABS`.
- `isChatWorkspace` treats `/email-marketing?tab=chat` as a chat workspace.

## Tabs and acceptance criteria

Every tab: a skeleton of the right shape, an empty state that says what to do, `QueryErrorState`,
the not-connected state leading to Settings → Connection, and a stale note when the reporting
snapshot is over 36 hours old.

1. **Overview**: money strip (email revenue 30d attributed vs incremental, profit from email,
   revenue per recipient, list growth, unsubscribe and spam rate against healthy bands); Needs
   you (approvals, broken flows, deliverability warnings); Money left on the table (missing or
   weak flows priced per month, each with *Build it*); this week's plan; the last five things it
   did.
2. **Plan**: month and week calendar of campaigns and flow changes; each slot shows its reason
   (occasion, season, stock, repeat clock), audience and expected profit; the proposed four-week
   plan with accept or reject (a rejection needs a reason of 10+ characters, the CI Plans shape);
   accepted slots move by drag or by the keyboard-accessible "Move" menu.
3. **Campaigns**: list with status chips draft · in review · scheduled · sending · sent ·
   cancelled · failed, filterable. **Builder** (`/campaigns/new`, prefillable by `?goal=`) in seven
   steps: Goal, Audience (live recipient estimate, exclusions), Offer (margin impact; blocked
   under the margin floor), Content (3–5 scored subject variants, blocks: hero, product grid,
   size advice, blog teaser, UGC, footer; brand-voice score), Test (variants, holdout %),
   Schedule (now, time, smart send time, throttled; quiet hours applied), Review & approve (the
   pre-send panel). **Detail** (`/campaigns/[id]`): results with attributed vs incremental, a
   plain-English verdict, cancel for scheduled sends.
4. **Flows**: the fourteen lifecycle flows with existence in the provider, status (live · manual ·
   draft · missing), revenue per recipient and a health verdict. **Detail** (`/flows/[id]`): the
   journey as a vertical step diagram (trigger → delay → split → message), tokens only, no canvas
   library; each message opens a preview; activation is a deliberate approve step.
5. **Audiences**: FTE segments next to provider lists and segments: size, overlap, consent
   breakdown (email/SMS subscribed, never subscribed, suppressed), "Sync to Klaviyo" (as list or
   segment, by capability) with last sync time and direction. Consent is never editable here.
6. **Content**: templates (ours and the provider's), a block editor, the writer bound to Brand
   Brain, product picker from the catalog, the brand-voice check (banned words, claims),
   reusable sections, and the four-way preview.
7. **Approvals**: queue with the full pre-send panel; approve, edit, send back with a reason,
   reject; keyboard j/k/a/r.
8. **Performance**: campaigns and flows side by side (attributed vs incremental, profit, RPR,
   CTR, CTOR, unsubscribe, spam, bounce), a trend chart (Recharts), top and bottom performers,
   subject-line learnings, and the snapshot time.
9. **Deliverability**: SPF / DKIM / DMARC as reported, bounce and spam trends against the
   Gmail/Yahoo bulk-sender thresholds (spam < 0.3%, aim < 0.1%), engaged vs unengaged, a sunset
   recommendation.
10. **Chat**: the employee's own chat on the shared panel (`EmployeeChatView`), streamed through
    `services/email-marketing-chat.ts` (sample replies until the backend's `employee` exists);
    replies can carry action cards that open a prefilled builder.
11. **Settings**: connection (provider picker, Klaviyo enabled and the rest by name as coming
    soon; private key with the secret-input pattern, never echoed; required scopes; account and
    status; disconnect), autonomy, guardrails, kill switch, default from-name/email/reply-to,
    seed list, activity log.

## Types (`types/email-marketing.ts`)

`EmailProviderKey`, `ProviderCapabilities`, `EmailProviderInfo`, `Money` (`{ amount` minor units,
`currency }`), `EmailConnection`, `AutonomyLevel`, `Guardrails`, `CampaignStatus`,
`CampaignGoal`, `EmailCampaign`, `CampaignMessage`, `CampaignResults`, `Audience`,
`AudienceSource`, `ConsentBreakdown`, `Offer`, `SendStrategy`, `ContentBlock`, `Template`,
`Flow`, `FlowStep`, `FlowStatus`, `Approval`, `PerformanceSnapshot`, `DeliverabilityHealth`,
`ActivityEntry`, `EmailPlan`, `PlanSlot`, `FlowGap`, `EmailOverview`. Every provider-side object
carries `provider` and `externalId: string | null`.

## Capability matrix (`lib/email-providers.ts`)

Rows: `klaviyo` (enabled) and `mailchimp`, `omnisend`, `shopify_email`, `hubspot`, `attentive`,
`postscript` (coming soon). Booleans: `campaigns`, `flowsCreate`, `segmentsCreate`, `listsWrite`,
`smsChannel`, `emailChannel`, `uniqueCoupons`, `smartSendTime`, `throttledSend`, `reporting`,
`catalogSync`, `customEvents`, `templatesWrite`. The UI asks `can(provider, capability)`, never
`provider === "klaviyo"`.

## Query keys (`lib/queries/email-marketing.ts`)

`["email-marketing", <name>]` for `workspace` (connection, autonomy, guardrails, kill switch,
snapshot time), `overview`, `plan`, `campaigns`, `campaign`, id, `flows`, `flow`, id,
`audiences`, `content`, `approvals`, `performance`, `deliverability`, `activity`. Writes in
`services/email-marketing-actions.ts`; `features/email-marketing/use-email-marketing-actions.ts`
invalidates `["email-marketing"]` after each.

## Backend API contract (`/api/v1/email-marketing/*`)

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/workspace` | Connection, provider capabilities, autonomy, guardrails, kill switch, snapshot time |
| PUT | `/connection` | Store a private key (write-only), validate scopes, read the account |
| DELETE | `/connection` | Disconnect |
| PUT | `/autonomy` | Employee level and per-program overrides |
| PUT | `/guardrails` | Guardrails |
| POST | `/kill-switch` | `{active, reason}`: pause created flows, cancel scheduled sends |
| GET | `/overview` | Money strip, needs-you, flow gaps, week plan, recent activity |
| GET | `/plan?from=&to=` | Slots and proposals |
| POST | `/plan/{slot}/accept` · `/reject` · `/move` | Plan decisions (`reject` needs `reason`) |
| GET | `/campaigns` · `/campaigns/{id}` | List, detail with results |
| POST | `/campaigns` | Create a draft in the provider |
| POST | `/campaigns/{id}/estimate` | Recipient estimate with exclusions |
| POST | `/campaigns/{id}/test` | Send to the seed list |
| POST | `/campaigns/{id}/approve` | Owner approval → provider send job (or schedule) |
| POST | `/campaigns/{id}/cancel` | Cancel a scheduled send |
| GET | `/flows` · `/flows/{id}` | Library, journey with messages |
| POST | `/flows` | Create from definition (provider limit ~100 creates/day) |
| POST | `/flows/{id}/status` | `draft` · `manual` · `live` (live needs approval) |
| GET | `/audiences` | FTE segments and provider lists/segments with consent |
| POST | `/audiences/{key}/sync` | Push as list or segment |
| GET | `/content` | Templates, sections, brand-voice rules |
| POST | `/content/templates` · `/content/render` · `/content/voice-check` · `/content/subjects` | Write, render, check, subject variants |
| GET | `/approvals` · POST `/approvals/{id}/{approve,send-back,reject}` | Queue |
| GET | `/performance` · `/deliverability` | Nightly cached snapshots (reporting ~2/min, 225/day) |
| GET | `/activity` | Timeline |
| POST | `/chat` with `employee: "email_marketing"` | The shared chat engine |

Rate limits are the backend's: reports from a nightly snapshot, never per page view; flow
creates queued under the daily limit.

## Mock strategy

`lib/mock/email-marketing.ts` holds one sample workspace for **Example Store /
examplestore.com**, vertical-neutral, internally consistent (rates from counts, profit ≤ revenue,
incremental ≤ attributed), dated relative to today. A module-level store carries the preview's
changes in the browser; each query's `load` returns a copy. The backend slice replaces each
`load` with a GET and deletes the module and `withEmailMarketingPreview()`.

## Performance budget

Tab switch: no network (shallow link), < 50 ms to paint from cache. First paint of the shell:
no blocking read (the workspace query is prefetched and streamed). No chart library beyond the
existing Recharts; the journey diagram is DOM.

## Existing Klaviyo surfaces

Unchanged in this slice (decision 3): `features/brief/winback-sync-button.tsx`, the Customers
win-back page, `lib/integration-catalog.ts` `klaviyo`. The backend slice points them here.

## Manual verification checklist

- `/employees`: a sixth card, Email Marketing Manager, *Not started · Connect Klaviyo*, its
  character with an envelope; hover opens the flap (not with reduced motion).
- Sidebar: listed under Digital Employees after Paid Ads Manager.
- `/email-marketing`: preview notice, status strip, eleven tabs; switching tabs makes no request.
- Overview → *Build it* on a gap opens the builder prefilled.
- Builder: all seven steps by keyboard; the discount step blocks under the margin floor; review
  shows the pre-send panel; over-threshold send asks for the typed count.
- Campaign detail: incremental verdict; a scheduled campaign can be cancelled.
- Flows → a flow: vertical journey; open a message preview; activation asks for approval.
- Approvals: j/k move, a approves, r asks for a reason.
- Kill switch: banner on every tab, scheduled sends show cancelled.
- Settings → Disconnect: every tab shows the not-connected state; connect restores the sample.
- Light and dark; phone width.

## Verification (2026-10-07)

Verified in an isolated git worktree holding only this spec's changes: a second session was
building SPEC-346 (Customer Support) in the same checkout at the same time, and its unfinished
files do not type-check yet. Nothing of it was touched or copied.

| # | Criterion | Status | Evidence |
| --- | --- | --- | --- |
| Route, nav, shell | done | `/email-marketing` + 3 sub-routes in the build; nav entry and `HUB_ORDER`; `tests/navigation.test.ts` |
| Hub card + character | done | `withEmailMarketingPreview` appends once (`tests/employees.test.ts`); `CHARACTERS.email_marketing` envelope; flap/letter CSS gated by reduced motion |
| Safety model | done | `guardrailChecks` / `approvalReadiness` drive both the panel and the button; 10 blocking cases, typed confirm, quiet hours, seed test (`tests/email-marketing.test.ts`) |
| Kill switch | done (preview state) | cancels scheduled sends, sets employee flows to manual (`tests/email-marketing-preview.test.ts`) |
| 1 Overview | done | strip from `overviewTiles`; needs-you, gaps priced as profit, week, recent |
| 2 Plan | done | month/week grid, drag + keyboard move, accept, reject ≥ 10 chars (`email-plan` tests) |
| 3 Campaigns + builder + detail | done | 7 steps with `stepProblem`; margin floor judged on the thinnest product; verdict with incremental figures |
| 4 Flows + journey | done | 14 flows; DOM journey from `layoutFlow`; build-as-draft then approve to turn on |
| 5 Audiences | done | consent breakdown, read-only; sync by capability |
| 6 Content | done | templates, block editor, catalog picker (stockout-risk products disabled), voice check, sections |
| 7 Approvals | done | full pre-send panel; j/k/a/r |
| 8 Performance | done | side-by-side tables, Recharts trend, top/bottom, learnings, snapshot time |
| 9 Deliverability | done | SPF/DKIM/DMARC, spam/bounce vs 0.3% line, hygiene, sunset |
| 10 Chat | done | shared `EmployeeChatView` (panel split, Spotlight/Finance unchanged); replies composed from the data, with actions |
| 11 Settings | done | provider picker by capability, secret input (never echoed), scopes, limits, autonomy, guardrails, sender + seeds, activity |
| States | done | skeletons per shape, `QueryErrorState`, not-connected on every tab but Settings, stale note > 36 h |
| Docs (Rule 11) | done | `lib/docs/content/email-marketing.ts` (11 sections), overview Klaviyo row, employees doc; `docs.test.ts` green |
| tsc / lint / test / build | done | `tsc` exit 0; ESLint 0 errors (3 earlier warnings); **210 files, 2,377 passed**; build 79 pages |
| Measured first paint and tab switch | not done | no signed-in session was available to this session; tab switches make no network request by construction (`ShallowLink`) |
| Manual checklist in a browser | not done | same reason — the owner's checklist above |

## Patches

- 2026-10-07: `tests/brand-name.test.ts` (SPEC-337) caught "Ecommerce FTE segments" written in
  four files; they now read `PRODUCT.short` / the docs' product name.
- 2026-10-07 — **Live on backend SPEC-354.** The preview is gone: `lib/mock/email-marketing.ts`,
  `features/email-marketing/preview-notice.tsx`, `services/email-marketing-chat.ts`,
  `features/email-marketing/chat/use-email-marketing-chat.ts` and
  `tests/email-marketing-preview.test.ts` are deleted, and the hub card comes from the backend
  roster (`withEmailMarketingPreview` removed from `lib/queries/employees.ts`).
  - **Reads** — every `emailMarketingQueries` loader is `api(emailMarketingPaths.x())`; new
    reads `checks(id)` (`GET /campaigns/{id}/checks`) and `discountCodes()`.
  - **Writes** — `services/email-marketing-actions.ts` calls the proxy, one route each; errors
    are the backend's own `ApiError` message (a guardrail block is 409
    `email_guardrails_blocked`).
  - **Contract changes in `types/email-marketing.ts`** — `Offer.code` (an existing Shopify code;
    ftes never creates one, so unique codes are no longer offered); throttled strategy is
    `percent` (Klaviyo's 1–50% of the audience an hour), not `perHour`; `EmailCampaign.source`
    and `lastError`; `Flow.key` nullable (a platform flow matching no lifecycle); `FlowStep`
    kind `other`; `FlowGap.flowId` (`missing-<key>` for an unbuilt flow); nullable
    `snapshotAt`, `takenAt`, `domain` and the hygiene counts; new `CampaignChecks`,
    `DiscountCode`, `KillSwitchResult`.
  - **Builder** — the recipient figure while editing is an honest upper bound (consented
    profiles of the chosen groups; the invented overlap and frequency-cap guesses are gone).
    Reaching Review saves the draft (`POST` then `PUT` the same id) and the pre-send panel draws
    the server's `checks`, so the panel, the button and the server cannot disagree; approve sends
    the typed count. `?edit=<id>` reopens a saved draft (Edit on a draft's page). Default
    audiences are backend segment keys, or the store's largest Klaviyo list; a campaign cannot
    mix segments and lists (the server refuses it). The offer step picks one of the store's
    Shopify codes. The store name is no longer written into subject lines or the footer.
  - **Plan** — accept / reject / move are one call each (`acceptSlot`/`rejectSlot`/`moveSlot`
    replaced by `moveProblem`); *Refresh the plan* added.
  - **Flows** — build by lifecycle key; the journey draws `other` steps; not-found is a real 404.
  - **Settings** — the connect form sends the key (checked against Klaviyo; nothing stored on a
    refusal); *Sync now*; a *Needs attention* state with the reason and *Check again*.
  - **Copy fixed to match the backend** — quiet hours are flagged at review (not deferred per
    customer); the sunset count is "no opens or clicks in 180 days" (it does not exclude buyers);
    DKIM "could not confirm" when not at Klaviyo's DNS names; audiences sync to a Klaviyo list.
  - **Chat** — `useEmployeeChat("email_marketing")` on the shared engine; an answer's
    `sources.actions` render as buttons (`answerActionsFrom`, in-app links only).
  - **Docs** — `lib/docs/content/email-marketing.ts`, the employees doc and the overview's
    Klaviyo row describe the live behaviour.
  - **Tests** — `tests/email-marketing-live.test.ts` (19): provider matrix, calendar and
    `moveProblem`, journey layout with `other`, builder defaults / bound / step problems /
    request body / edit round-trip, server-checks readiness, every query path, every write's
    method + path + body through a stubbed `fetch`, the server's refusal, and answer actions.
- 2026-10-07 — **Klaviyo's real constraints (backend SPEC-354 Patches).** Throttling is a pick
  from `THROTTLE_PERCENTS` (Klaviyo's 12 allowed rates), not a free number. A set-time send keeps
  the owner's wall clock with no zone (`wallClock`, `YYYY-MM-DDTHH:MM`) — it lands at that hour
  in each customer's timezone; a throttled start stays an absolute moment. Settings offers
  *Connect with the saved key* when the Integrations page already holds one (`keyOnFile`).
  The doc says the seed list is single opt-in and sizes are read nightly.

## Patches

- **2026-10-14: Campaigns tab — search and pagination.** On a store with many campaigns (Ace
  Rivington, 663) the Campaigns tab rendered them all in one list. It now keeps the status filter
  chips and adds a name search and client-side pagination (`CAMPAIGNS_PAGE_SIZE` = 20), all over
  the already-loaded list — a filter, search or page change redraws only the list, never the page
  or a request. The page is kept against the filter+search it belongs to and reads back as page 1
  when either changes (derived during render, no effect). Pure half: `filterCampaigns` in
  `lib/email-marketing.ts`, reusing `paginate`/`pageCount`/`clampPage` from `lib/catalog-pagination.ts`;
  tested in `tests/email-marketing.test.ts`.

- **2026-10-14: Audiences search/pagination and clean first-day empty states.**
  - Audiences: the platform's own lists and segments (Klaviyo can hold dozens) are now searched by
    name and paged twenty at a time over the already-loaded list (a search or page change redraws
    only that section); the ftes segments stay a single short list. Pure `filterByName` in
    `lib/email-marketing.ts`, reusing the catalog pagination helpers; tested.
  - Performance: before the first nightly report (a just-connected store), the tab shows one
    `EmptyPanel` ("No results yet") instead of a blank chart over empty rank lists and tables.
  - Deliverability and the Performance trend chart: an empty chart is replaced by a short
    "no sends measured yet" message, so neither reads as broken.
  - Content: the preview column is sticky so the editor/preview split leaves no large gap; the
    hero/product image squares are deliberate placeholders (images are not in the platform's API),
    and the templates and brand rules come from the backend and Brand Brain, never hardcoded.
