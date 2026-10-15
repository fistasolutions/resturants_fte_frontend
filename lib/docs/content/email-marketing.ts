import { defineDoc } from "@/lib/docs/define";

export const emailMarketingDoc = defineDoc({
  slug: "email-marketing",
  title: "Email Marketing Manager",
  route: "/email-marketing",
  area: "growth",
  tagline:
    "The email and SMS employee: plans, audiences, campaigns, flows and tests run through your own email platform — judged by the profit each send caused, not the revenue it claims.",
  sources: ["Klaviyo", "Shopify", "Brand Brain"],
  refresh: "Campaigns, flows and lists hourly; profiles daily; reports, holdout results and the plan nightly",
  updated: "2026-10-16",
  hero: "employees",
  heroCaption:
    "The Email Marketing Manager's overview and its eleven tabs.",
  whatItIs: [
    "Email Marketing Manager runs a store's email and SMS through the store's own email platform, starting with Klaviyo. Klaviyo stays the system of record and does the sending; this employee plans what to send, builds the audiences, writes and designs, creates campaigns and flows, tests, schedules and measures.",
    "It runs on the store's real Klaviyo account once Klaviyo is connected in Settings — with one click through Connect with Klaviyo, or with a pasted private key. Every read — the screens, the chat — comes from a local copy synced from Klaviyo, so opening a page never spends Klaviyo's rate limits. Anything that reaches Klaviyo — a test, a send, a flow, a list — happens only on an approval or an action you take, and is written to the activity log.",
  ],
  whyItMatters: [
    {
      title: "Profit per send, not revenue",
      body: "Every send shows its expected profit before you approve it, after product cost and any discount — so a 20%-off code on a thin-margin product is flagged as losing money before it goes.",
    },
    {
      title: "What the email caused",
      body: "Campaigns can hold out a control group. Results then show the sales the email caused, next to the revenue the email platform attributes to itself.",
    },
    {
      title: "It knows the store",
      body: "It never promotes a product at stockout risk, keeps bracketers and high-return customers out of discount sends, times reminders to each customer's own repeat clock, and writes in the Brand Brain's voice. It follows the store's own trade, from the Brand Brain's approved store type: a clothing store gets the fit-check flow and size advice; any other store gets neutral advice and no fit check.",
    },
    {
      title: "Nothing leaves without you",
      body: "The default is Approve to send. Guardrails bind every send, Autonomy decides how much it does on its own, and every action is logged.",
    },
  ],
  howItWorks: [
    "Each night the employee proposes the next four weeks from stock, margin, new products, each customer's repeat clock, the latest post and the flows that are missing; you accept, move or reject each slot (a rejection needs a reason). Refresh the plan proposes again now; a slot you decided is never touched.",
    "A campaign is built in seven steps — goal, audience, offer, content, test, schedule, review — with recipients, expected profit and the discount given away in view throughout.",
    "Reaching the review step saves the draft, and the server then counts exactly who it reaches — consented profiles only, less the protected groups, anyone over the weekly cap and the holdout — and runs the guardrail checks. The review shows that count, who is left out and why, the expected profit and its basis, the brand-voice score and the email on desktop and mobile. Approve stays disabled until every blocking check passes, and the server runs the same checks again on approve; over your audience threshold you type the recipient count.",
    "On approve the employee writes the consented recipients to a Klaviyo list, creates the template and the campaign, and sends or schedules it. The holdout never receives it; five days after the send, the store's own orders from both groups give the sales the email caused and the profit after product cost and the discount.",
    "Flows are built as drafts; turning one on is a separate approval. Results come from a nightly snapshot because Klaviyo limits how often reports can be read.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/email-marketing",
      summary: "The money strip, what needs you, the money left on the table, this week's plan and the last five things it did.",
      details: [
        "The strip: sales email caused in 30 days (with the share of the platform's attributed revenue), profit, revenue per recipient, list size and growth, and the unsubscribe and spam rates against healthy bands.",
        "Money left on the table lists missing or weak flows priced as profit per month — from how many customers did the flow's trigger last month in Klaviyo, a healthy revenue per recipient and the store's margin — each with how it was priced and a link to the flow.",
      ],
    },
    {
      title: "Plan",
      route: "/email-marketing?tab=plan",
      summary: "A month or week calendar of campaigns and flow changes, each with its reason, audience and expected profit.",
      details: [
        "Dashed slots are proposals; solid ones are accepted. Drag a slot to another day, or move it from its panel with the keyboard; past days take no slots. Before the first nightly run the calendar is empty — Refresh the plan fills it.",
        "Rejecting needs a reason of at least ten characters, so the next plan learns from it. Accepting does not send anything — the send still needs your approval.",
      ],
    },
    {
      title: "Campaigns",
      route: "/email-marketing?tab=campaigns",
      summary: "Every campaign with its status — draft, in review, scheduled, sending, sent, cancelled, failed — and its expected or actual profit; filter by status, search by name, and page through them twenty at a time (a filter, search or page change redraws only the list). New campaign opens the builder, shown to a role that manages email marketing.",
      details: [
        "The builder's seven steps: goal, audience (only profiles with email consent count; a campaign goes to ftes for Commerce segments or to Klaviyo lists, not both), offer (one of the store's existing Shopify codes — ftes reads Shopify and never creates a code, so unique per-customer codes are not offered; a code that takes a product under the margin floor blocks the send), content (scored subject ideas, blocks, the brand-voice check), test (variants and holdout), schedule (the best time for this audience, smart send time, a set time that lands at that hour in each customer's own timezone, throttled at one of Klaviyo's rates — from 1% to 50% of the audience an hour — or now; a time inside quiet hours is flagged), review and approve.",
        "Best time for this audience sends on the day you choose at the hour this audience orders most, in each customer's own timezone. A customer's best hour is the store-local hour of most of their orders in the last two years, counted only with at least two orders in that hour; the audience's hour is the most common one among at least 30 such members, or else the store's own busiest ordering hour. The choice says which — \"when most of this audience orders (from 1,240 customers)\" or \"when your store gets most orders\". Reaching the schedule step saves the draft so the server can read it; with too little order history the choice is shown disabled with the reason, and the hour is fixed when you approve.",
        "Picked for you is a block that shows each customer one product of their own: the product most often bought together with what they already bought (never one they have), in stock, with no stockout predicted in the next three weeks, and above your margin floor after the campaign's discount. It needs a fallback product, chosen in the block: anyone without a pick, and every test send, sees the fallback — so a test shows the fallback, not a customer's pick. Every pick is checked by the same guardrails as the rest of the send. The review lists what customers will be shown — the five most-picked products for this audience, each with how many customers get it — and on approve the picks are written to each recipient's Klaviyo profile; anyone that write does not reach sees the fallback.",
        "Send a test creates a [TEST] copy for the seed list in Klaviyo and sends it to those addresses only; Klaviyo has no separate test-send. The seed list is single opt-in and your seed addresses are subscribed when you save them, so the test reaches them without a confirmation email. A seed test is required before approve unless you switch that off in Settings. A test counts only for the version it tested — edit the campaign afterwards and the pre-send panel asks for a new test — and a second test cannot start while one is on its way.",
        "A send to a Klaviyo list counts toward the daily ceiling like any other. Because ftes cannot see who is on a Klaviyo list, the weekly cap is applied per list — a list that already had that many ftes sends this week blocks the send — and the panel warns that nobody is held out, so its real effect cannot be measured.",
        "A campaign's page shows the pre-send panel before it sends, Edit while it is a draft, Cancel send while it is scheduled, the reason if the last attempt failed, and once sent the results — attributed and caused revenue, profit, rates — with a one-sentence verdict. Campaigns built in Klaviyo appear too, with their results; they have no holdout, so what they caused is not measured.",
      ],
    },
    {
      title: "Flows",
      route: "/email-marketing?tab=flows",
      summary: "The lifecycle flows a store of its trade should run — fourteen for a clothing store, including fit check; thirteen for any other — with whether each exists in the platform, its status, revenue per recipient and a health verdict.",
      details: [
        "A flow's page draws its journey as a vertical diagram — trigger, waits, splits, messages. Open a message to preview and edit it.",
        "Build it as a draft writes the flow in Klaviyo without sending (Klaviyo allows about 100 new flows a day); Turn on asks for your approval, and approving it asks once more before the flow goes live. A flow the employee built starts as an outline — its name as the subject and its purpose as the body — so it cannot be turned on until you write its subject and body in Klaviyo. A flow whose trigger Klaviyo's API cannot set — a birthday, for example — says so and is built in Klaviyo. Editing a message changes its subject and preview text in Klaviyo. Each lifecycle flow can have its own autonomy level. The approval to turn a built flow on says what was built — a trigger, a short wait, 10% held out, one email — and gives the lifecycle's advice as advice, never as something the flow already does.",
        "Flows have no holdout, so the sales a flow caused are shown as — rather than estimated.",
      ],
    },
    {
      title: "Audiences",
      route: "/email-marketing?tab=audiences",
      summary: "ftes for Commerce's own segments — VIPs, going quiet, due to reorder, slipping, due a second order, bracketers (called multi-variant returners outside clothing) and more — next to the platform's lists and segments, each with its consent breakdown. The platform's lists (often dozens) are searched by name and paged twenty at a time; a search or page change redraws only that section.",
      details: [
        "Slipping holds repeat customers past their own reorder rhythm but not yet lost: each customer's rhythm is the average gap between their orders, and a customer is slipping once the time since their last order passes one and a half times that gap (or the gap plus a week, whichever is later), until three times the gap (or 60 days). Due a second order holds one-time customers at the point most customers come back — between the store's usual first-to-second-order gap and twice it; it stays empty until at least 20 customers have a second order to measure. Both can be chosen in a campaign and synced to Klaviyo like any segment, and the plan proposes a win-back to Slipping once it holds 25 customers.",
        "Sync to Klaviyo mirrors a segment's consented members onto a Klaviyo list — adding new ones and removing those who left — with the time of the last sync. Consent is read from Klaviyo and is never changed here; the only profiles ever subscribed are your own seed addresses.",
        "A restaurant brand sees Guest audiences first, built from its own orders: Came once (one order 14 to 60 days ago), Lapsed 30, 60 and 90+ days (two or more orders, last order in that band), Regulars (four or more orders in 90 days), Top spenders (the top 10% by spend over a year) and one audience per branch (guests who order most there). Each shows its guests, how many have an email and how many opted in on the brand's site.",
        "Send to Klaviyo gives each opted-in guest's Klaviyo profile its audiences, home branch and last order date, then keeps a Klaviyo list of the audience's guests who are already subscribed in Klaviyo. Nobody is subscribed here; the answer says how many opted in on your site are not yet subscribed in Klaviyo.",
      ],
    },
    {
      title: "Content",
      route: "/email-marketing?tab=content",
      summary: "Templates, a block editor, the catalog with margin and stock, the brand-voice check, reusable sections and the four-way preview.",
      details: [
        "Templates are written as HTML because the platform's drag-and-drop editor is not in its API. The brand rules come from the Brand Brain.",
      ],
    },
    {
      title: "Approvals",
      route: "/email-marketing?tab=approvals",
      summary: "Everything waiting for you, each send with its full pre-send panel: approve, edit, send back with a reason, or reject.",
      details: ["Keys: j and k move, a approves a flow, r rejects. A campaign is approved from its panel, where every check is shown."],
    },
    {
      title: "Performance",
      route: "/email-marketing?tab=performance",
      summary: "Campaigns and flows side by side — attributed and caused revenue, profit, RPR, CTR, CTOR, unsubscribes, spam, bounces — with the weekly trend, best and worst sends and subject-line learnings.",
      details: ["Every figure is from the nightly snapshot, with its time; a snapshot over 36 hours old is flagged. Before the first report runs (a just-connected store), the tab shows one clear \"no results yet\" panel rather than an empty chart and empty tables."],
    },
    {
      title: "Deliverability",
      route: "/email-marketing?tab=deliverability",
      summary: "SPF, DKIM and DMARC as public DNS shows them, spam and bounce rates against Gmail and Yahoo's bulk-sender limit, list hygiene and a sunset recommendation.",
      details: [
        "The sending domain is the from-email's domain, checked nightly. DKIM is looked for where Klaviyo publishes it; a branded sending domain set up elsewhere shows as could not confirm.",
        "List hygiene counts two segments the employee keeps in Klaviyo: opened or clicked in 90 days, and nothing in 180 days. Klaviyo gives list and segment sizes one at a time, so they are read nightly — the employee's own segments first, then your lists.",
      ],
    },
    {
      title: "Chat",
      route: "/email-marketing?tab=chat",
      summary: "The employee's own chat: ask about the plan, a send, a flow or deliverability; an answer closes with the page that acts on it.",
      details: ["It answers from the same figures the tabs show, with read-only tools: it never sends, builds or changes anything. Its threads are kept with your account, apart from Glisp's.", "Answers stream in at a steady pace, and you can edit a question to replace it and the answers after it. Each answer is the same answer card Glisp uses: records come as a table (a figure right-aligned), a ranking or trend can switch to a chart, the page that acts on the answer closes it as a button, and the receipt shows what was read and how fresh it is."],
    },
    {
      title: "Settings",
      route: "/email-marketing?tab=settings",
      summary: "The connection, autonomy, guardrails, sender and seed list, and the activity log.",
      details: [
        "Connect with Klaviyo is the one-click way in, shown when the platform has the Klaviyo app set up: you go to Klaviyo, press Allow, and come straight back to Settings, connected — nothing to copy. The sign-in is exchanged on the server, so no Klaviyo token ever reaches the browser, and cancelling on Klaviyo's screen changes nothing. Once signed in, the card says Connected with Klaviyo and lists, in words, what the sign-in may do there (read campaigns, build flows, subscribe your seed addresses and so on); what the employee may write follows exactly those granted permissions, with no probing. Disconnect revokes the sign-in at Klaviyo after a confirm; a private key saved on the Integrations page stays in force, and without one the employee is disconnected. A sign-in Klaviyo stops accepting shows as Needs attention with Reconnect with Klaviyo. Both buttons need Manage integrations.",
        "Connection with a key: pick the platform (Klaviyo now; Mailchimp, Omnisend, Shopify Email, HubSpot, Attentive and Postscript are named as coming) and paste a private key with the listed scopes — under Use a private API key instead when Connect with Klaviyo is offered, open already when a key is saved. A pasted key still works exactly as before, and when both exist the sign-in is used first. The key is checked against Klaviyo before anything is stored — a refused key stores nothing — then kept encrypted on the Integrations page. When the Integrations page already holds a Klaviyo key, Connect with the saved key uses it without pasting it again. Connecting also finds out what the key may write, and creates nothing in Klaviyo. The employee's helpers are made only when needed: the seed list when you first add seed addresses or send a test, and the engaged/unengaged segments the first night it counts engagement, so those figures arrive a night or two after connecting. An existing one with the same name is reused, never duplicated, and a read-only key never gets any. A key from a different Klaviyo account starts the helpers fresh: the old account's seed list, segments and synced lists are no longer used, they are made again in the new account when needed, and the activity log says the account changed. Your campaigns stay. A key without the subscribe scope (subscriptions:write) shows as partial: seed addresses are saved but not subscribed, and Send a test waits until the key has it. Sync now reads everything again; a missing read scope shows as Needs attention.",
        "Guardrails: emails per person per week, quiet hours, the audience size that needs a typed confirmation, the largest discount, the margin floor, groups never sent marketing, and the daily ceiling.",
        "There is no kill switch and no bar under the header: Autonomy is how much the employee does on its own. An employee paused before the switch was removed shows a Paused line at the top of Settings with Resume; resuming restarts nothing, and each send needs your approval again. A flow's page says when everything is paused and links here.",
        "Under the connection, the Connection card also says how old the reporting snapshot is (refreshed nightly, flagged once it is more than 36 hours old) and, for a read-only key or one missing some permissions, what the key cannot do, with a link to Integrations.",
      ],
    },
  ],
  howToUse: [
    "Start on Overview: build the most valuable missing flow first.",
    "Open Plan and accept or reject the proposed weeks.",
    "Review Approvals each morning; send a test before approving.",
    "Set your guardrails in Settings before switching any program to autopilot.",
  ],
  benefits: [
    "Fewer sends that lose money: discounts are priced against margin before they go.",
    "Honest results: the sales the email caused, not just what the platform claims.",
    "A full lifecycle program without building it by hand.",
  ],
  goodToKnow: [
    "A read-only Klaviyo key is fine: the employee still reads everything, plans and advises, and every button that would write to Klaviyo (send a test, approve and send, build or turn on a flow, sync an audience) is shown disabled with the reason beside it. A key missing only some permissions disables only what needs them. The access is checked again every night, so giving the key more access on Integrations unlocks the buttons by the next morning — or reconnect to see it at once.",
    "Only a Shopify discount code that already exists can go in an email; create a new one in Shopify and it appears here after the next sync.",
    "Autopilot sends a campaign by itself only when every check passes and the Klaviyo key may send; anything else waits for you.",
    "Klaviyo limits report reads to about 2 a minute and 225 a day, and new flows to about 100 a day; the screens say so where it matters.",
    "Klaviyo's own sending rules still apply: a verified sending domain, consent and account review.",
  ],
  related: ["employees", "customers", "spotlight", "ads", "integrations"],
});
