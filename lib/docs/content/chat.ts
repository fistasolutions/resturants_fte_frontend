import { defineDoc } from "@/lib/docs/define";

export const chatDoc = defineDoc({
  slug: "chat",
  title: "Chat with AI",
  route: "/chat",
  area: "command",
  tagline: "Ask the business analyst anything in plain English — from its own page or the Ask Glisp panel on any page. It answers from computed figures, streams live, and remembers every conversation.",
  sources: ["Shopify", "Gorgias", "Loop Returns", "iPacky", "V-Count"],
  refresh: "Answers read the latest 15-minute sync at the moment you ask",
  updated: "2026-10-08",
  hero: "chat",
  heroCaption:
    "A conversation with the analyst: the history rail on the left, an answer card that names what answered and what it read, source chips that open the records, and follow-up chips ready for the next question.",
  whatItIs: [
    "Chat with AI is a business analyst you can question directly: 'What sold best last week at my biggest store?', 'Which customers spent the most this year?', 'How fast is the support team resolving tickets?'. It reads the synced data through backend tools and explains what it finds.",
    "It never calculates. Every number in an answer came from a tool that ran a query in the analytics engine; the model's job is to choose the right tools and write the explanation. If something is not connected, it says so instead of guessing.",
  ],
  whyItMatters: [
    {
      title: "No more 'can you check a number for me'",
      body: "Anyone with access can ask the question themselves and get a figure computed the same way the dashboard computes it — not a recollection, not a spreadsheet someone built last quarter.",
    },
    {
      title: "Row-level answers, not just totals",
      body: "It can list specific orders, customers, products or tickets, because the tools it calls return rows from the database, not summaries.",
    },
    {
      title: "The answer comes first",
      body: "Every reply opens with a one-sentence direct answer, visibly promoted above the evidence — tables and detail follow, never precede.",
    },
    {
      title: "A conversation that survives the tab",
      body: "History is stored on your account, so a thread started on one device continues on another, a reply finishes even if you navigate away mid-stream, and the Ask Glisp panel reopens on the thread you were last in — after a reload, in a new tab, or on your phone.",
    },
  ],
  howItWorks: [
    "You type a question. The frontend streams it to the backend over a server-sent-events connection so words appear as they are produced.",
    "The analyst agent chooses from over forty typed tools — sales, products, customers, inventory, discounts, returns, support, warehouse, footfall — each of which runs a set-based query against the local database and returns already-computed figures.",
    "The model writes the reply from those tool results, leading with the direct answer; it cannot invent a figure because none of its tools accept one.",
    "After the answer is complete, a second short pass proposes four follow-up questions relevant to what was just discussed; they appear as chips under the reply.",
    "The whole exchange is saved to the conversation on your account and appears in the history rail.",
    "The Ask Glisp panel on every other page is the same analyst over the same history: it sends through the same connection, and a thread you start there appears in this page's rail.",
  ],
  sections: [
    {
      title: "The conversation",
      route: "/chat",
      summary:
        "Your question, then one answer card per reply: a header that names what answered and what it read, the answer with the conclusion promoted, source chips that open the records, and a footer of actions.",
      details: [
        "The header strip says 'Runtime · <model>' — the conversation's own choice or the system default, with the temperature when one was set — and carries a pill: 'Grounded · Shopify, Loop Returns' names the systems the analyst's tools actually read for this answer; 'Conversational · no records read' means no tool ran (a greeting, a clarification).",
        "Source chips under the answer are the things it is about — the page you asked from, a product, an order, a store — each opening its own screen. They come from the tools' own results, never from the prose, so a chip can only point at a record that exists.",
        "The footer: Copy (the Markdown), Read aloud (Glisp reads the answer in its own voice — the very voice of Talk to Glisp, from the provider card chosen for voice; tables become sentences; it starts speaking within a few seconds and the button becomes Stop while it speaks; it works on a phone because the audio is real audio, not the phone's built-in reader), Regenerate (re-asks the question as a new turn), and 👍 👎 on the right — one click stores your rating, a second click on the same clears it, and it is kept with the conversation.",
        "Status updates show while tools run, so a complex question never sits behind a blank spinner; the card appears with the first words and gains its chips and footer when the reply is complete.",
        "Hover your own question to copy or edit it. Editing works the way ChatGPT and Claude do: the edited question replaces that question and every answer after it, and the conversation continues from there — Glisp never sees the replaced turns. A question shows Edit once it has been saved, which is the moment it is sent.",
        "An answer is drawn at a steady reading pace as it arrives — tables included, row by row — rather than landing in bursts; the finished answer card takes its place when all of it is on screen.",
        "Long answers keep their Markdown formatting: headings, tables, bullet lists. A table sits in a bordered frame with a muted header and its figures right-aligned; a list the model wrote as bullets joined by | is shown as the table it should have been. A link to a page of the platform opens in place; only an outside link opens a new tab.",
        "The same answer card is every digital employee's chat turn, so an answer looks and behaves the same wherever it appears.",
      ],
      screen: "chat",
    },
    {
      title: "Follow-up chips",
      route: "/chat",
      summary:
        "Four suggested next questions generated from the last answer; on a fresh conversation, four starter prompts instead.",
      details: [
        "Chips are stored with the conversation, so returning to a thread shows its real follow-ups, not the generic starters.",
        "Clicking a chip sends it as your next message.",
      ],
    },
    {
      title: "History rail",
      route: "/chat",
      summary:
        "Every conversation on your account in three sections — Projects, Pinned, Chats — with New chat at the top. Each section has its own height and scrollbar, a count, and an empty state that says what it is for. Collapsible to give the conversation the full width.",
      details: [
        "Projects group chats about one thing — a supplier, a season, a problem. The + creates one: a name (up to 60 characters, unique on your account), a colour and an icon, so projects tell apart at a glance; every chat filed in a project carries its colour as a small dot. A project's menu offers New chat here, Rename · colour · icon, and Delete. Deleting a project keeps its chats — they move back under Chats.",
        "Click a project's name and you are in it: the row is highlighted, the composer says 'New chat in <project>', the New chat button at the top reads 'New chat · <project>', and anything you start — typing, a suggested prompt, dictation — is filed there until you press Leave project or open a chat that lives elsewhere. The small chevron folds and unfolds a project without entering it.",
        "Pinned holds the chats you pinned, newest pin first, with a pin icon on each. Chats holds everything else, grouped by day as before.",
        "Every chat row has a menu on hover (the chevron): Pin or Unpin, Move to project (any project, or No project), Delete. Long titles fade at the edge; hover for the full title.",
        "Conversations, projects and pins all persist on your account — not in the browser — so they follow your login and appear on every device.",
        "Selecting an old conversation restores its messages and chips.",
      ],
      screen: "chat-projects",
    },
    {
      title: "Answers that show, not tell",
      route: "/chat",
      summary:
        "When an answer's figures can be drawn — a ranking, a comparison, a trend — the answer card gets a small text ⇄ chart toggle at its top right. Chart view keeps the one-sentence takeaway and replaces the paragraph of numbers with the picture.",
      details: [
        "The chart is built by the platform from the exact numbers the analyst's tools returned for that answer — never from the reply's prose and never by the AI — so the bars and the sentence above them always agree. Rankings (top products, channels, categories, stores) become horizontal bars, top 8; 'this period vs last' becomes grouped bars per metric; revenue by day becomes a line. Under the chart one line names the tool it came from.",
        "The toggle appears only when there is something to draw; a greeting or a plain look-up has none. Your last choice is remembered in this browser (text is the default). Copy, Read aloud, Pin and the ratings always act on the full text, whichever view is showing.",
        "Works on this page and in the Ask Glisp panel, in both themes.",
      ],
      screen: "chat-answer-chart",
    },
    {
      title: "From answer to action",
      route: "/chat",
      summary:
        "When an answer's figures have a page that acts on them, the card ends with that button — Send overdue lists, Start win-back, Review reorders, Email the returns lead — opening the exact review or send flow.",
      details: [
        "The buttons come from the tools the analyst used for that answer, mapped to the platform's own review and send pages: overdue orders → Orders review, quiet best customers → Win-back, stock alerts → Inventory reorder, dead stock → Dead stock, returns backlog → the returns lead email, fixable returns → Product fixes, discounts → Discounts attention, packing → Warehouse, support → Team Performance, footfall → Store Traffic, margins → Product costs, tax → Sales & Tax. At most two per answer, in the order the analyst read them.",
        "A button that emails a manager (overdue lists, win-back, the returns lead, the warehouse, discounts) is the filled button; one that opens a review is outlined. Neither sends anything by itself — every flow still shows you exactly what will go, to whom, before anything leaves the platform.",
        "From the Ask Glisp panel the button closes the panel so the page is in view; the conversation is kept, so you can reopen it beside the review.",
        "An answer whose tools have no acting page — a revenue figure, a product look-up, a greeting — shows no button.",
      ],
      screen: "chat-answer-action",
    },
    {
      title: "Slash shortcuts",
      route: "/chat",
      summary:
        "Type / in the message box — here or in the Ask Glisp panel — and a menu of shortcuts opens: /revenue 30d, /stock, /top, /product Linen Shirt. Send, and the shortcut becomes the full question.",
      details: [
        "The menu opens the moment a message starts with / and narrows as you type: /re shows /revenue and /returns. ↑ ↓ move, Tab or Enter fills the shortcut, Esc closes the menu and leaves what you typed. Each row shows the shortcut, the argument it takes — [period], <product>, <store> — and what it will ask.",
        "Eighteen shortcuts cover the daily questions: /revenue, /orders, /top, /worst, /customers, /returns, /discounts, /support and /traffic take a period; /vip, /stock, /dead, /warehouse, /tax and /compare take none; /product and /store take a name; /help shows the list. Periods are today, yesterday, 7d, 30d and 90d — after you pick a period shortcut the menu offers the five as chips, and Enter with no period means the last 7 days. Any other period you type, such as last quarter, is passed through as written.",
        "On send the shortcut is expanded into the full question the analyst has a tool for — /revenue 30d becomes \"How is revenue for the last 30 days, and how does it compare to the period before?\" — and that question is what the thread shows, so the history reads the same whether you typed it in full or in three keystrokes. The answer is the same answer, with the same chart toggle, chips and action buttons.",
        "A /product or /store without a name does not send; the menu asks for the name. A /word that is not a shortcut is sent exactly as typed — the analyst is allowed to see it.",
      ],
      screen: "chat-slash",
    },
    {
      title: "Talk to Glisp",
      route: "/chat",
      summary:
        "Tap the glass sphere beside the mic (or Talk on the Ask Glisp pill on any page) and just talk, like a phone call: Glisp hears you as you speak, reads the store, and answers out loud within about a second of your last word — your words and its words on screen, every number still from the analytics engine.",
      details: [
        "Voice mode lives inside the surface you are in — no full-page takeover. In the Ask Glisp panel the thread and the message box crossfade into the voice stage, which fills the panel edge to edge; on the chat page only the conversation area becomes the stage while the history rail, the header and the message box stay. Under the orb sits the console — a glass frame the ball rests in, the stage showing through it: the state line between two small red lights (Listening… · Reading the store… · Speaking…), the waveform of whoever is speaking, and the words — yours as heard, Glisp's as spoken — in a box that scrolls after a few lines with no scrollbar. The mic in the frame's tab is Mute; the keyboard below its left corner brings typing back, End below its right corner hangs up; Esc does too. The sphere button in the message box switches text → voice and lights up while voice is on — the spoken turns are already in the thread as cards. On the chat page, typing and sending ends voice and sends the text.",
        "It opens the line and listens. The microphone streams as you speak — nothing is recorded and sent afterwards — and the line itself hears where your sentence ends; your words appear under the sphere the moment it has heard them. Glisp answers at once (\"Let me look\" while a tool reads the store, then the figure), and its words play the moment they are spoken; when it finishes it is listening again, so a conversation is just talking. Talk over Glisp to cut in: it stops mid-sentence and takes the new question. Mute pauses the microphone; End, the keyboard or Esc hangs up.",
        "The sphere is a dark glass marble lit from within — fog, dust and faint orbital rings inside, Glisp's red core at the heart, a bright rim and a highlight on the glass — sitting on a soft lavender stage in the light theme and deep violet in the dark, with its shadow beneath it. Its insides change with the line and cross-fade between four looks: at rest one slow ribbon drifts through the core; while you talk, braids of fine violet-to-blue filaments flow around it and a small waveform under the orb follows your voice; while a tool reads the store, the light spirals into the core with a ring and the tool's name underneath; while Glisp speaks, the filaments fan out from the core with every word over a wider waveform. Every movement is the real signal — your microphone, the reply's audio — never a decoration playing on its own.",
        "Every spoken turn lands in the conversation as ordinary cards — what you said as your message, the reply as an answer card with its grounded pill, chips, chart toggle, action buttons and trust footer — so nothing said out loud is lost. On the chat page the turn goes into the thread that is open; from the pill it goes into the panel's thread. Spoken answers are shorter and use plain words by design; the card carries exactly what was said.",
        "Under the hood it is a realtime speech model on one open line — OpenAI Realtime or Gemini Live, run by the OpenAI Agents SDK — with the same Glisp tools, rules and page context as chat, and the last typed turns of the thread so the call carries on from them. Which one speaks is the provider card chosen under Integrations → AI providers → Voice: OpenAI or Google Gemini (Anthropic has no speech models). The call's brain is that realtime model; the model you picked for typed chat is not used on the line. Without a voice card the sphere is disabled and says why. Nothing you say is kept beyond the words in the thread, and the minutes on the line are metered on the AI Performance page like every other AI spend.",
      ],
      screen: "chat-voice-sphere",
    },
    {
      title: "Ask by voice",
      route: "/chat",
      summary:
        "The microphone beside Send dictates into the box (press, speak, edit, send); Voice replies reads every answer back. For a real spoken conversation use the sphere next to it — Talk to Glisp.",
      details: [
        "Press the mic (or ⌥ Space while the message box has focus) and the box starts listening: the mic turns purple with a soft pulse, a Listening line shows the phrase still being recognised, and each confirmed phrase is added after whatever you had typed. Pause to finish, tap the mic to stop, or Esc to cancel — the text stays for you to edit or send.",
        "Voice replies is a switch next to the model pill. When it is on, each answer is read aloud the moment it finishes — the same Read aloud the answer card already has, so its speaker button shows the stop state and one click stops it. Sending a new question, or opening another conversation, stops any reading. The switch is remembered in this browser and is off by default.",
        "Dictation uses the browser's own speech recognition — Chrome, Edge and Safari have it (iPhone included); Firefox does not, so there the mic simply is not shown. Read aloud and Voice replies do not: they play Glisp's own voice from the platform, so they sound the same on every device. If the microphone is blocked in the browser's site settings, the box says so instead of failing silently.",
        "Nothing about dictation is stored or sent by the platform: only the text you end up sending reaches the analyst, exactly as if you had typed it.",
      ],
      screen: "chat-voice",
    },
    {
      title: "Pinned answers",
      route: "/chat",
      summary:
        "Pin the one reply in a long thread worth coming back to: it stays in a strip at the top of that conversation.",
      details: [
        "The pin sits in every answer card's footer, next to Regenerate, in the workspace and the Ask AI panel alike; a pinned card gets a faint accent border.",
        "The strip under the header lists each pinned answer by its first sentence, with a count; click one to scroll to it, or unpin it from the strip. Fold the strip with the chevron. It is absent when nothing is pinned.",
        "Pins are per conversation and persist on your account.",
      ],
    },
    {
      title: "Model and temperature",
      route: "/chat",
      summary:
        "The pill at the bottom-left of the message box (here and in the Ask Glisp panel) sets the model and temperature Glisp runs on for you — and it sticks: every chat, the panel, and after you sign in again, until you change it.",
      details: [
        "The list shows every model of every provider that has a key, grouped by provider, with the system default first; models of a provider without a key are shown locked. Picking one saves it on your account at once — the page and the panel update together. 'System default' clears the choice.",
        "Temperature runs from 0 (precise, repeatable) to the provider's ceiling — 1 for Anthropic, 2 for OpenAI and Gemini — in steps of 0.1; a temperature without a model applies to the default model. It is remembered the same way.",
        "Only Glisp follows your choice — the daily report, Search Visibility and every other agent keep the system default set on Integrations. If a provider's key is removed later, your choice can no longer be honoured: the platform answers on the system default and the picker shows the reason when you next open it.",
        "Every reply carries a small tag naming the model and temperature that answered, live while it streams and in history afterwards; a reply on the system default carries none.",
      ],
      screen: "chat-model-picker",
    },
    {
      title: "Ask Glisp from any page",
      summary:
        "A panel that slides in from the right on every page except this one: the Ask Glisp button at the bottom-right of the screen on desktop, the analyst icon in the top bar on a phone, or ⌘J / Ctrl+J anywhere.",
      details: [
        "The analyst knows where you asked from. Every question sent from the panel carries the page and tab you are on, the date range in your URL, and the product, order or store the page is about; the analyst uses that to pick its tools and filters, so 'why is this slipping?' on a product page is about that product and 'what changed?' on a 7-day view covers seven days. A page sitting on its default range sends none, and a period named in your question always wins.",
        "It also carries a map of the whole platform — every page and tab and what feeds it — so it can point you to the screen that already shows an answer, by name.",
        "A fresh panel offers four prompts chosen for the page you are on — Inventory asks about cover and reorders, Returns about reasons and backlog, Store Traffic about footfall and peak hours — and each one is a question the analyst has a tool for. On a page about one product, order or store the prompts are about that one thing. Pages without a matching tool show the four starters.",
        "The thread, your draft and a reply still streaming all survive closing the panel and moving between pages. The thread also survives a reload, a new tab and a different device: the account remembers the conversation you were last in, and the panel reopens on it, showing the thread's skeleton while it loads rather than the starters it is about to replace. New chat clears that memory, so a panel you deliberately emptied stays empty. Escape, the ✕, or clicking outside closes it.",
        "Open full workspace (the expand icon in the panel header) brings the same conversation to this page with it selected in the rail.",
        "The shortcut does nothing while you are typing in another field, and nothing on this page, where the workspace is already open.",
      ],
      screen: "chat-drawer",
    },
    {
      title: "Explain this (✦ on any figure)",
      route: "/dashboard",
      summary:
        "A small ✦ in the corner of every KPI card and verdict tile the analyst can verify. One click opens the Ask Glisp panel with the question about that figure written in the box, ready to send — read it, change it, or send it as it is.",
      details: [
        "The question is built from what the card shows — its label, value, change and caption — so the thread reads naturally later: 'Explain the \"Revenue\" figure on this page — it reads $12,345, +8% vs previous period. What is behind it, and what should I do about it?'. Nothing is sent until you press Send; sent as written, the question carries the card it came from.",
        "The analyst is told which card was pressed and that its figure came from the analytics engine for the page's own period. It fetches that figure again with the matching tool rather than trusting the card, then answers in a fixed order: what the figure is and whether it is good or bad, the two or three drivers behind it, one concrete next step.",
        "Explaining three cards in a row is one conversation, not three — each press joins the panel's current thread. If a reply is still streaming, the new question waits in the message box until you send it.",
        "The ✦ appears only where a backend tool can recompute the figure: Morning Brief, Dashboard (including the money cards), Orders review, Product and Inventory Analyst verdicts, Returns, Discounts, Team Performance, Store Traffic, Warehouse, Sales & Tax, Search Visibility visibility, Reports and Foresight › Profit Lens. AI Performance, System, Social, Ads and the Foresight forecast tiles have no ✦ — the analyst has no tool for those figures, so it would only be able to say it cannot check.",
      ],
      screen: "chat-explain",
    },
    {
      title: "Select anything, ask about it",
      route: "/dashboard",
      summary:
        "Highlight any text on any page — a table row, an alert, a product name, a sentence in a report — and a small 'Ask Glisp' bubble appears above it. Click it, or press ⌘J / Ctrl+J while the text is selected, and the question is drafted into the panel for you to send.",
      details: [
        "The highlighted text becomes the question, word for word: 'I highlighted this on the page: \"Andrea Jumper F6 · 100% return rate (30 days)\". What is it telling me, and what should I do about it?'. The analyst is told the text is the subject — a product name or SKU becomes its lookup, an order number an order, a figure something to fetch again from the analytics engine — and it explains it against the page's period and filters.",
        "The panel opens with the question drafted in its composer — nothing is sent until you press Enter or the send button, so you can read it, shorten it or add what you really want to know first; the highlighted text still travels with it as long as the drafted question is what you send. The same rule as ✦ Explain.",
        "The bubble never appears inside the Ask Glisp panel, inside a text field, on this page (the workspace is already open), or for selections shorter than three characters. Very long selections are cut to 500 characters. Escape, scrolling, or clicking elsewhere hides it.",
        "On a phone, the long-press selection shows the same bubble above the selection handles.",
      ],
      screen: "chat-select-ask",
    },
    {
      title: "A nudge on the button",
      route: "/dashboard",
      summary:
        "When a page has one figure worth a look, the Ask Glisp button carries a small dot and a card above it says what it is — one line, from the page's own numbers, with Explain and Not now.",
      details: [
        "Each page has one rule over a figure the platform already computes: the Dashboard nudges on today's revenue against the same hour yesterday (a swing of 25% or more); Orders on paid orders unshipped over 48 hours; Inventory and Foresight on best-sellers about to run out (else dead stock); Discounts on manual discounts that broke policy (else codes that won nobody new); Customers on best customers gone quiet; Product Analyst and Returns on returns for a reason you can fix. Money lines need at least $1,000 behind them. Pages without a rule — and pages with nothing above the line — show nothing.",
        "Explain opens the panel and asks the analyst about that figure straight away: the analyst fetches the number again with its tool and explains what moved it. Not now (or the ✕) puts the nudge away until the figure changes materially; the platform never nags about the same number twice.",
        "Inside the panel the same line sits at the top whatever thread is open, with its own Explain — on a phone, where there is no room for a card, that is where the nudge lives; the analyst icon in the top bar shows the dot.",
        "Nudges are hints, not live tickers: the platform refreshes each page's nudge every ten minutes. No AI is involved until you press Explain — the wording is a fixed sentence over the computed figure.",
        "A watch that has fired (Settings → Watching) uses the same card, headed Watchlist, on every page — not only the pages with a rule of their own — with an Open button to the page behind the figure. It comes first; the page's own nudge follows once it is put away.",
      ],
      screen: "chat-nudge",
    },
    {
      title: "The trust footer",
      route: "/chat",
      summary:
        "One quiet line under every grounded answer — how long ago each system was synced and how many tools ran — that opens into the receipt: each tool, what it was asked, and the exact figures it returned.",
      details: [
        "The dot is green when every system the answer read was synced within the last hour, amber when one is older (its label reads 'synced 3 h ago'), and grey when the figure is computed live with no sync behind it (the tax engine). Shopify's freshness is the oldest of its orders, products and customers syncs, so a lagging core resource is what you see.",
        "Click the line and the card opens in place: the last sync time and record count per system, then one numbered row per tool call — the tool's name, what it was asked ('period 30d · query Linen Shirt'), up to six figures it returned as chips, the system it read and the seconds it took. Nothing here comes from the prose: it is the run's own record, so every number in the sentences above can be matched to a chip below.",
        "Answers written before this footer existed show the line with the systems and tool count but no receipt; an answer that used no tools (a greeting, a clarification) shows nothing.",
        "The same information already feeds AI Performance and the System page; the footer puts it on the card, where the decision is made.",
      ],
      screen: "chat-trust",
    },
    {
      title: "Tell me when — the watchlist",
      route: "/chat",
      summary:
        "Say 'tell me when returns on Linen Shirt pass 20%' and the analyst sets a watch: the platform checks it on every sync and tells you on the button — and by email if you asked — the moment it trips.",
      details: [
        "Any 'tell me / warn me / let me know when …' becomes a watch. The analyst picks the figure (return rate, revenue, revenue vs the period before, orders, stock, days of cover, best sellers running out, orders waiting over 48 hours, quiet best customers), the direction and the line from your words, resolves the product when you name one (and asks which, when several match), and confirms with today's reading. The answer card ends with a Watching block: the rule, today's reading, when it is checked, who is told, and a link to Settings → Watching. /watch in the shortcut menu types it for you.",
        "Add 'and email the returns lead' (or the warehouse, support, the managers, or yourself) and the fired note also goes by email through the same Manager notifications addresses the supervision emails use. Without it, the nudge alone.",
        "When it fires, the card on the button reads the note — 'Linen Shirt return rate hit 23.1% — past your line of 20.0%; it was 14.2% when you set the watch.' Explain hands it to the analyst, who fetches the figure again and says what is behind it; Open goes to the page; Not now puts it away until it fires again.",
        "'What am I watching?' lists them; 'stop watching Linen Shirt' removes one. The checking, the note and the delivery never involve the AI — only the setting-up and the Explain do.",
      ],
      screen: "chat-watch",
    },
  ],
  howToUse: [
    "Open Chat with AI. On a new conversation, click a starter chip or type a question in your own words.",
    "Watch the answer stream in; the first sentence is the direct answer, the rest is the evidence. Check the pill in the card's header to see which systems it read, and click a chip to open the product, order or page it is about.",
    "Use the footer: copy the answer, have it read aloud, regenerate it, or rate it so the platform learns which answers land.",
    "Click a follow-up chip to go deeper, or type the next question yourself.",
    "Made a typo? Hover your question, click Edit, fix it and Send — the new question replaces the old one and everything after it.",
    "Prefer to talk? Press the mic beside Send and speak; switch on Voice replies to have every answer read back.",
    "See a button at the end of an answer — Send overdue lists, Start win-back, Review reorders? That is the page that acts on what the analyst just found; press it and you are in the review.",
    "Numbers easier as a picture? When the card shows the text ⇄ chart toggle at its top right, switch to the chart — the takeaway stays, the paragraph becomes bars or a line.",
    "Use the rail on the left to return to any earlier conversation, or New chat to start fresh. Group related chats with a project (the + next to Projects), pin the ones that matter from their ⋯ menu, and pin the answer worth keeping from its footer.",
    "On any other page, click Ask Glisp (bottom-right on desktop, the analyst icon in the top bar on a phone) or press ⌘J to open the analyst in a side panel without leaving what you were looking at; pick a suggested prompt or type your own.",
    "A number you do not understand? Click the ✦ in the corner of its card — the panel opens with that figure already asked about, and the answer names what moved it.",
    "Anything else — a row, an alert, a name — highlight it and click the Ask Glisp bubble that appears (or press ⌘J with it selected).",
    "See a dot on the Ask Glisp button? The card above it names the one figure worth a look on this page — Explain to hear why, Not now to put it away until it changes.",
    "Want to just talk? Tap the sphere beside the mic — or Talk on the Ask Glisp pill on any page — and speak; the panel or the conversation area turns into the voice view. Pause to send, talk over Glisp to interrupt, ✕ to go back to typing. Everything said lands in the thread as cards.",
    "Want a different brain? Click the model pill at the bottom-left of the message box and choose a model or a temperature — it stays your model in every chat and the panel until you change it, and each reply is tagged with what answered.",
    "Ask about anything connected: sales, products, customers, inventory, discounts, returns, support tickets, warehouse packing, store footfall.",
  ],
  benefits: [
    "Instant, trustworthy answers to ad-hoc questions without building a report — or leaving the page that raised the question.",
    "The same numbers as the dashboard, because it is the same engine.",
    "Explanations in plain language, with the supporting rows attached.",
    "A permanent, searchable record of what was asked and answered.",
  ],
  goodToKnow: [
    "The analyst only knows what is synced. If an integration is not configured it will say 'not connected' rather than answer — and the trust footer under each answer says how old the synced data was.",
    "Chat is never capped by the AI budget guard — a person is waiting on the answer — but every run is metered and visible on AI Performance.",
    "The Chat cannot change anything in Shopify or any other system; it is read-only by design.",
    "Very long answers are complete on screen before the follow-up chips arrive; the composer unlocks as soon as the answer is done.",
  ],
  related: ["dashboard", "reports", "ai"],
});
