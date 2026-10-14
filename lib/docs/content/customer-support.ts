import { defineDoc } from "@/lib/docs/define";

export const customerSupportDoc = defineDoc({
  slug: "customer-support",
  title: "Customer Support Agent",
  route: "/customer-support",
  area: "customers",
  tagline:
    "An AI employee that answers and resolves customer conversations through your own helpdesk — Gorgias first — with the real order, shipment, return, fit, stock and margin behind every reply, and nothing sent without your approval unless you switch a topic to autopilot.",
  sources: ["Gorgias", "Shopify", "Loop Returns", "Fit Intelligence", "Inventory", "Brand Brain"],
  refresh: "Every 15 minutes, right after the Gorgias sync; your decisions take effect at once",
  updated: "2026-10-14",
  hero: "employees",
  heroCaption:
    "The Customer Support Agent's overview: the money strip, what needs you, why customers are writing, and what the agent did last.",
  whatItIs: [
    "The Customer Support Agent works your support inbox. It reads each new ticket, files it under a topic, looks up the order, the shipment, the return and the customer's history, and drafts the reply in your brand's voice on the channel the customer used. It tags, prioritises, assigns, snoozes and closes, and when a ticket should go to a person it hands it over with a three-line summary and the next step, so nobody has to re-read the thread.",
    "Your helpdesk stays the inbox and does the sending; the agent is the brain. It knows what a helpdesk's own automation cannot: the real return — from Loop Returns when it is connected, otherwise from the refunds recorded in Shopify — which way each style fits and what size customers exchange to (for a clothing store), real stock, whether an order is late against your own handling time, the customer's value and health, and the order's true margin before any goodwill is offered.",
    "It works on your real Gorgias account — the same connection as on Integrations. It reads the tickets the Gorgias sync brings in every 15 minutes, and it writes to Gorgias only what you allow: replies you approve (or, on a topic you switch to autopilot, replies that pass every guardrail), internal notes, and ticket updates. It never writes to Shopify or Loop.",
  ],
  whyItMatters: [
    {
      title: "Answers from the truth, not a template",
      body: "\"Where is my refund?\" gets the return's real state — Loop's when it is connected, otherwise the refunds Shopify recorded; \"when is it back?\" gets real stock — and when no restock date is visible, it says so instead of inventing one.",
    },
    {
      title: "You see why before anything goes",
      body: "Every draft shows a source for each fact, its confidence and why, the brand-voice score and any banned words, and the cost of any offer against the order's margin. Send is disabled by the same guardrails it lists.",
    },
    {
      title: "Tickets become fixes",
      body: "Recurring problems turn into fixes with an owner and a money figure — a size chart that reads small, a warehouse over its handling time, a policy two pages disagree on — each linked to the page where the fix is made.",
    },
    {
      title: "Measured like a team member",
      body: "First response, resolution, one-touch, reopens, CSAT and hand-offs, side by side with your human agents, so you can see where it earns its place and where it should hand over.",
    },
  ],
  howItWorks: [
    "You connect Gorgias once — on Integrations or in this page's Settings, which is the same connection — and set how far the agent may go: Suggest (where it starts — it only watches), Draft, Approve to send or Autopilot, overall and per topic. Nothing is drafted and nothing is written to your helpdesk until you choose Draft or above.",
    "Each new ticket is filed under one of fourteen topics, and flagged when it carries a sensitive subject: a chargeback, a legal threat, an allergic reaction or injury, harassment or press. Size and fit is a topic for clothing stores only; in any other trade those questions are filed as product questions, and the fit checks are left out.",
    "Before it drafts, the agent reads what the topic's playbook says to check — the order and its fulfilment state, the return (Loop's when it is connected, otherwise Shopify's refunds), the fit verdict for a clothing store, stock, the customer's value and history, Brand Brain's policies.",
    "It writes the reply in your brand's voice, with a source for every fact, and prices any goodwill offer against the order's margin under your ceilings.",
    "Every guardrail is checked; a reply waits in Approvals for one click unless its topic is on autopilot and every guardrail passes. Sensitive subjects, angry customers, VIPs (if you choose) and languages it does not answer go to a person with a summary.",
    "Anything that would change an order in Shopify or start a return is prepared with every detail for a person to do there — in Loop Returns when it is connected, otherwise in Shopify. The product is read-only toward both.",
    "Every action it takes in your helpdesk is written to the activity log. To stop it acting on its own, set its Autonomy to Suggest on Settings.",
    "When the Customer Support Agent is switched off on Digital Employees, it pauses: its 15-minute run skips your store, so nothing new is filed, drafted or sent until it is switched back on.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/customer-support",
      summary: "The shift at a glance: the money strip, what needs you, why customers are writing, and the last five things the agent did.",
      details: [
        "The strip: tickets in 24 hours and 7 days, the share resolved by the agent, first-response and resolution time and CSAT — each agent against your team — and the revenue at risk in open tickets.",
        "Revenue at risk is the same figure Team Performance uses: the lifetime value of customers whose ticket is unanswered, over 24 hours or unhappy, each customer counted once. It is an association, not predicted lost revenue.",
        "Hours saved is shown with its basis: the tickets the agent resolved times the team's handle time.",
        "Needs you lists replies waiting for approval, hand-offs, SLA breaches and failed sends, each opening the Inbox or Approvals filtered to them.",
      ],
    },
    {
      title: "Inbox",
      route: "/customer-support?tab=inbox",
      summary: "The live queue in three panes — queue, conversation, context — stacked on a phone.",
      details: [
        "Queues: needs approval, auto-answered, handed off, waiting on customer, snoozed, closed, spam — shown as tags with their counts, all visible. Sort by revenue at risk, SLA or newest; 25 tickets a page. j and k move through the page. Switching a queue, the sort or the page changes only the list: the open conversation and the context stay put, and hovering a queue tag loads it ahead.",
        "Each message reads like an email client: the new words first, with the earlier exchange ('On … wrote:', 'Am … schrieb', quoted lines, signatures) folded behind Show earlier messages, where each earlier email is its own card with who sent it, their address and when. Repeated lines from the email's conversion to text are dropped, store footers and signatures fold behind a small ··· button, and the map links mail apps add to addresses are left out. An order email reads as a receipt: billing and shipping addresses as small cards side by side, the items as a table with quantity and total, and the subtotal, shipping, discount (with its code) and total underneath, the total in bold. Links are links — a long tracking URL shows as a short chip with its site — and attachments show as chips with a thumbnail for images, each opening the file. Nothing in a message can make the page scroll sideways.",
        "The conversation shows every channel with its mark, internal notes drawn as notes, and each reply's send state — Queued until the helpdesk confirms it Sent, or Failed with Retry, because helpdesks send asynchronously.",
        "Under the thread: the agent's draft with Send, Edit, Hand off and Internal note — or your own reply box when there is no draft. Editing re-checks Brand Brain's banned words as you type.",
        "Actions the product may not take — a refund, a cancellation, an address change, a re-ship, a discount code, starting a return — appear as Prepared for you to do, with every detail, Do this in Shopify or Loop Returns (a return is started in Shopify when Loop is not connected), and Mark done. Each is labelled Needs an owner decision to automate. A role that may not mark one done sees Mark done disabled with the reason beside it, and the same for Retry on a failed send.",
        "The context panel: the customer's value, VIP status, health and earlier tickets; the order, the location it ships from, and whether it is late against your handling time (set in Settings → Hours & SLAs); the return — Loop's when it is connected, otherwise the refunds recorded in Shopify; the fit verdict per item for a clothing store; stock; an ordering pattern described as behaviour, never an accusation; suggested macros.",
      ],
    },
    {
      title: "Approvals",
      route: "/customer-support?tab=approvals",
      summary: "Every reply waiting for you, twenty a page, filtered and sorted as you like; the focused one opens the full pre-send panel.",
      details: [
        "Filters across the top: confidence as tags (All, High, Medium, Low), topic and channel — each with how many replies it holds — a search by customer, email or subject, and the sort (oldest, newest, lowest confidence, highest customer value). Previous and Next move twenty at a time. Every choice is in the URL, so back and forward work and a link opens exactly this view; changing one only changes the list, never the page.",
        "The panel shows the customer's message — read the same way as the Inbox: new words first, earlier emails folded, links as links, orders as receipts — what the agent found, a source chip for every fact, its confidence and reasons, the brand-voice score and banned words, any offer's cost against the order's margin, the channel, and every guardrail.",
        "Approve, Edit, Send back (with a reason of ten characters or more) or Reject, which hands the ticket to the person or team mapped to its topic.",
        "Keys: j / k move, a approves, e edits, b sends back, r rejects — never while typing. a and r act only on a reply you chose with j / k or a click; a always asks before it sends, showing the reply and who it goes to.",
        "Bulk approval appears only for topics you marked bulk-safe, and only for replies whose every guardrail passes with autopilot-level confidence.",
      ],
    },
    {
      title: "Topics & playbooks",
      route: "/customer-support?tab=topics",
      summary: "The fourteen kinds of ticket, busiest first, each with its volume, autonomy, confidence, CSAT and resolution rate and the facts it checks.",
      details: [
        "Set each topic's autonomy or let it follow the agent; topics you made never-automatic stop at Draft. Mark a topic bulk-safe to allow bulk approval.",
        "Playbook & test bench opens a side panel: the steps, the data it must check, what it may offer, when it must hand off, and the tone — then replay a real past ticket to read the reply it would write today next to what was sent then.",
      ],
    },
    {
      title: "Knowledge",
      route: "/customer-support?tab=knowledge",
      summary: "What the agent may say and where each answer came from, with stale and conflicting answers first.",
      details: [
        "Brand Brain's approved policy and product facts (shipping, returns, warranty, sizing) and your Gorgias macros, each with its source, when it was last checked and how often a macro is used. Help-centre articles are not read yet.",
        "Conflicts are paired — the returns window saying 30 days in one place and 14 in another — so the fix is obvious.",
        "Questions it could not answer, with Add an answer: it becomes a pending Brand Brain fact or a draft macro, used only once approved.",
        "Your helpdesk's own automation rules, read-only, with a warning where one would fight the agent — an auto-reply that answers first, for example.",
      ],
    },
    {
      title: "Insights",
      route: "/customer-support?tab=insights",
      summary: "Recurring problems turned into fixes, each with an owner, the money at stake and its basis, and a link to where the fix is made.",
      details: [
        "Kinds: size and fit for a clothing store (to Product Analyst → Fit), damage by carrier or warehouse and late orders by location (to Warehouse), policy confusion with the page to rewrite and products most written about (to Search Visibility or Product Analyst).",
        "Money is never added up across insights, because two insights can describe the same tickets.",
        "Every contact reason across the whole team stays in Team Performance → Voice of Customer.",
      ],
    },
    {
      title: "Performance",
      route: "/customer-support?tab=performance",
      summary: "The agent measured with the same figures as your human agents, with the trend, the best and worst topics, and the snapshot time.",
      details: [
        "First response, resolution, one-touch resolution, reopens and CSAT — agent against team, with a verdict — plus the share it handed off.",
        "A 14-day trend of CSAT or first response, agent and team.",
        "Best and worst topics by accuracy, and a row per person beside the agent. The human team's full detail is Team Performance.",
      ],
    },
    {
      title: "Chat",
      route: "/customer-support?tab=chat",
      summary: "The agent's own chat: ask what customers are angry about, ask for a policy reply, or why a figure moved.",
      details: [
        "Answers stream in at a steady pace, and you can edit a question to replace it and the answers after it. Each answer is the same answer card Glisp uses: records come as a table (a figure right-aligned), a ranking or trend can switch to a chart, the page that acts on the answer closes it as a button, and the receipt shows what was read and how fresh it is. Its buttons open the Inbox filtered, a playbook or Insights.",
        "It answers from its own figures and never sends anything from the chat — a reply reaches a customer only through Approvals or the Inbox.",
      ],
    },
    {
      title: "Settings",
      route: "/customer-support?tab=settings",
      summary: "Connection, autonomy, guardrails, hours and SLAs, the hand-off map and the activity log.",
      details: [
        "There is no kill switch and no bar under the header: Autonomy is how much the agent does on its own, and Suggest means it sends nothing. An agent paused before the switch was removed shows a Paused line at the top of Settings with Resume, which returns it to its level.",
        "Connection: the helpdesk picker — Gorgias today; Zendesk, Freshdesk, Re:amaze, Help Scout, Intercom, Kustomer, Richpanel and Shopify Inbox shown as coming — and Gorgias's connection, which is Integrations' own: the same Connect Gorgias dialog that tests the key before saving, and once connected the same form with saved keys shown as Saved, never echoed. OAuth is shown as coming for the public app. Connect Gorgias needs a role that manages integrations; any other role sees it disabled, with the reason.",
        "Guardrails: what is never answered automatically, the anger line for a hand-off, VIP handling, the goodwill ceilings and margin floor, the autopilot confidence floor, replies per ticket, languages, Brand Brain's banned words (edited in Brand Brain), and the sign-off. Chargebacks, legal threats, injuries, harassment, press and the Wholesale topic are always handled by a person and cannot be switched off.",
        "Hours & SLAs: opening hours, the handling time — how many days an order may wait before it ships, a whole number from 1 to 30, 2 until you change it — and a first-response target per channel, which the SLA clock counts against. The agent calls an unshipped order late once it has waited longer than the handling time. All three save together.",
        "The hand-off map: who receives each kind of ticket. The activity log: every action in your helpdesk, by the agent, a person or a rule, with a link to the ticket.",
      ],
    },
  ],
  howToUse: [
    "Connect Gorgias — on Integrations, or in Settings → Connection here. It is one connection.",
    "In Settings, check the guardrails: the subjects never answered automatically, the goodwill ceiling and margin floor, and the languages it may answer in.",
    "Switch the agent to Approve to send in Settings — it starts on Suggest and drafts nothing until you do. Work Approvals for a few days with j, k and a, editing or sending back what is wrong.",
    "Open a topic's playbook, replay a few past tickets on the test bench, and switch that one topic to autopilot when its replies need no edits.",
    "Read Insights each week and send each fix to the page that owns it.",
  ],
  benefits: [
    "Replies grounded in the real order, return, fit and stock — never a promised date nobody can see.",
    "Every fact sourced and every guardrail visible before a reply goes.",
    "Goodwill priced against the order's margin, under your ceiling.",
    "Clean hand-offs: a three-line summary and the next step, in your helpdesk.",
    "Recurring tickets turned into product, page and policy fixes with a money figure.",
  ],
  goodToKnow: [
    "Replying through Gorgias is an outbound action the owner approved on 2026-10-07. The agent starts on Suggest and drafts nothing until you switch it on; at Approve to send nothing reaches a customer without a click, except on topics you switch to autopilot — and then only when every guardrail passes at or above the confidence floor.",
    "The agent drafts a ticket once per new customer message, up to eight tickets every 15 minutes. If it cannot write (no AI provider, a refused call) the ticket says why and is not retried until the customer writes again or you ask for a draft.",
    "The Gorgias API key's user must be allowed to create messages and edit tickets; if it is not, the send says so and the reply is kept, marked Failed, with Retry.",
    "Changing an order in Shopify and starting a return (in Loop Returns, or Shopify without Loop) are out of scope: the agent prepares them for a person. Automating them needs an owner decision.",
    "Gorgias limits an API key to 40 requests every 20 seconds; when it asks us to slow down, a note on the page says how late new tickets arrived.",
    "The page says when Gorgias last synced and warns when that was over two hours ago.",
    "Built to take other helpdesks: every screen asks what the helpdesk can do, never which helpdesk it is.",
  ],
  related: ["team-performance", "employees", "returns", "customers", "warehouse"],
});
