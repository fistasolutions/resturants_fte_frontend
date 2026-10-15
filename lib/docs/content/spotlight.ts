import { defineDoc } from "@/lib/docs/define";

export const spotlightDoc = defineDoc({
  slug: "spotlight",
  title: "Search Visibility",
  route: "/spotlight",
  area: "growth",
  tagline: "The brand-visibility engine — a cited Brand Brain, an SEO content pipeline that writes long-form articles, human approval, publishing to the storefront blog, and measured reach.",
  sources: ["Shopify", "Google Search Console", "AI model providers"],
  refresh: "Daily picks refresh nightly; Search Console reach syncs nightly at 04:00 UTC",
  updated: "2026-10-16",
  hero: "spotlight",
  heroCaption:
    "Search Visibility's Overview: the five-stage visibility pipeline, drafts awaiting review, published posts, reach and attributed revenue, recent activity and next best actions.",
  whatItIs: [
    "Search Visibility is the platform's organic-growth arm for search. It builds a knowledge base of the brand (the Brand Brain), maps what people search for in the store's category (the Inbound Engine), picks the best topics to write each day (Daily Picks), writes complete, long-form articles with an editorial hero image, routes each one through a human for approval, publishes the approved ones to the Shopify storefront blog, and then measures the organic reach they earn through Google Search Console.",
    "Every fact the Brand Brain holds is tagged with where it came from — onboarding, an uploaded file, measured from live data, AI research, or added by hand — and every draft is scored for search readiness before anyone reads it. Nothing is published without a human clicking Approve.",
  ],
  whyItMatters: [
    {
      title: "Content that answers real searches",
      body: "Topics come from a bank of clustered search queries mapped to customer personas, blended with what actually sells and earns margin — not from a brainstorm.",
    },
    {
      title: "Long-form, complete articles — not stubs",
      body: "Articles are written section by section with an outline, a writer per section and a critic that sends weak sections back, so a draft arrives finished, cited and on-brand.",
    },
    {
      title: "A human gate before the storefront",
      body: "Every draft waits in Needs review with its scorecard; Approve & publish is the only way it reaches the blog, and it can be refined or deleted first.",
    },
    {
      title: "Reach and revenue you can see",
      body: "Published posts report impressions, clicks and average position from Search Console, and sales attributed to visitors who read them.",
    },
  ],
  howItWorks: [
    "The Brand Brain is a living knowledge base with nine sub-tabs — Coverage, Review, Knowledge Base, Facts, Voice, Guardrails, Style Guide, Personas, Competitors. When a store connects for the first time and its brain holds nothing yet, it researches itself in nine steps that run together: it reads the store's description, pages, homepage, refund and shipping policies, newest blog posts and social links; reads what it sells; counts who buys (the figures are calculated, not written by the AI) and describes two to four customer types from them; writes a brand profile; learns the voice from the store's own writing; reads the reviews on its best-sellers' pages; reads the look from its own photos and brand colours; and finds the competitors. Every step says what it is doing as it does it, then what it found and how long it took — in Setup for a new company, or a toast in the top-right corner — and stays across pages and reloads; then everything waits on the Review tab. Feed it files and pages (size charts, policies, lookbooks, captions): an extractor turns them into cited facts that wait for your approval; the voice is learned from real brand copy; guardrails, word lists, a claims policy and the store's calendar dates gate every writer, and the Style Guide — palette, light, composition, styling, type, layout and brand safety — gates every generated picture; the facts the store proves about itself sit in Facts under the Measured filter; a coverage score says what is still missing and lists every recent change. Nothing reaches a writer until you approve it.",
    "Each employee has its own chat: Search Visibility's is the Chat tab, where the owner asks what to write next or says 'write about X' and the article starts there, with the thread showing the run and, when it is ready, a card that opens the draft. The chats are stored, apart from Glisp's.",
    "The Inbound Engine shows the query bank as topics, not rows: each topic joins its searches with the latest Search Console snapshot (monthly demand, best rank, the page-two search that would earn the most clicks from a page-one move) and with the drafts already written against it, so every topic carries one honest next action — Write this, Open draft or See reach. A Keyword Scout idea is filed under the topic it belongs to as a research angle, never as a topic of its own, and a re-worded idea is refused at intake; a topic an approved competitor publishes that the store does not is filed the same way, as a competitor gap named after that competitor, when it lands on a category the store sells; every search carries the day it entered the bank, and the Added window keeps earlier searches out of the current list. The intent templates stay under Advanced.",
    "Each night, Daily Picks scores candidate topics on demand, margin, catalog fit and brand fit — and, once Search Console has taken a store-wide snapshot, on striking distance: searches the store already ranks 8–25 for, weighted by the clicks a page-one move would add. Each pick explains its rank ('why this pick'); a striking-distance pick names the exact search it targets. Picks can be refreshed on demand.",
    "Generate draft runs the article pipeline in the background — outline, per-section writing, critic loop, hero image — and a progress toast follows you across the app; the draft survives leaving the page.",
    "A finished draft lands in Needs review with its quality scorecard (SEO, AEO, GEO, brand quality). Approve & publish posts it to the storefront blog; refine sends targeted edits back through the writer.",
    "Search Console syncs nightly; Published and Visibility show reach per post, and orders from visitors who read a post are attributed back to it.",
    "Money pages does the same for the catalog rather than the blog: it ranks the product and collection pages Google already shows and that already sell by what a properly written page would be worth, drafts the new title, meta description and description in your brand's voice, and leaves the pasting into Shopify to you \u2014 nothing in Search Visibility writes to your shop.",
    "Every Search Console pull also asks Google's URL Inspection API whether each published post is indexed, and stores the answer — so a post at zero impressions says whether it is indexed and waiting to rank, discovered but not crawled, or unknown to Google.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/spotlight?tab=overview",
      summary:
        "The pipeline at a glance — Foundation, Intelligence, Content, Approvals, Distribution — with progress per stage, KPI tiles, recent activity and next best actions.",
      details: [
        "KPI tiles: Brand DNA readiness, drafts in review, published posts, 28-day reach, revenue from blogs.",
        "Next best actions deep-link to the tab that needs you: review drafts, connect Search Console.",
      ],
      screen: "spotlight",
    },
    {
      title: "Chat",
      route: "/spotlight?tab=chat",
      summary:
        "Talk to Search Visibility as the employee it is: ask what to write next, ask about a topic, a pick or a draft, or tell it to write about something — it starts the article there and the thread shows the run until the draft is ready.",
      details: [
        "The rail on the left lists your chats with Search Visibility, newest first, with New chat at the top and delete on hover; the last one you opened is where the tab reopens. While the chats load, the rail and the thread show their skeletons in place; the frame around them never moves, and the welcome screen appears only for a chat that really is new. Under a wide screen the rail becomes a dropdown in the thread's header. Every chat is stored on the server, apart from Glisp's — a Search Visibility chat never appears in the Ask Glisp panel or the Chat page, and the other way round.",
        "Search Visibility answers from its own tools only — the query bank as topics, today's picks, the drafts, and whether an article is being written — and every figure it states came from one of them. The reply streams in with its progress phrases while the tools run; the composer waits until the answer is complete.",
        "Answers stream in at a steady pace, and you can edit a question to replace it and the answers after it. Each answer is the same answer card Glisp uses: records come as a table (a figure right-aligned), a ranking or trend can switch to a chart, the page that acts on the answer closes it as a button, and the receipt shows what was read and how fresh it is. Asked about topics, picks or drafts, it closes with the tab that holds them.",
        "Say 'write about …' and it starts the article in the background — the same pipeline as Write this — and the reply carries a card: the topic, the writer's step and word count as it goes, then Draft ready with Open full, which opens the draft page. One article at a time: when one is already running it says which, and starts nothing. Reopen the chat later and the card shows what became of the run.",
        "The four starters under the empty state: What should I write next? · Show me today's picks · Which topics sit on page two? · Write about … (which fills the box for you to finish).",
      ],
      screen: "spotlight-chat",
    },
    {
      title: "Brand Brain — Coverage",
      route: "/spotlight/brand-brain/coverage",
      summary:
        "The score of what the writers can rely on, what is still missing and where to add it, where the brain is used, and each section's progress with its sources.",
      details: [
        "A section counts as complete when it has an approved fact with a source and a confirmation younger than 90 days.",
        "'What is still missing' names the gap in plain words; each row opens the sub-tab that fixes it.",
        "Confirm now re-stamps every approved fact with today's date.",
        "Recent changes at the foot: the latest eight changes to the brain — uploads, extractions, approvals, edits, rule changes, samples, derivations, confirmations — who, when, from what, with Show all for the rest. (History was its own tab until 2026-09-21.)",
        "Brand Brain has its own sub-tab bar; switching a sub-tab loads only that section — the Search Visibility header, its tabs and this strip stay put.",
      ],
      screen: "spotlight-brand-brain",
    },
    {
      title: "Brand Brain — Review",
      route: "/spotlight/brand-brain/review",
      summary:
        "Everything the brand research found that still waits for you, grouped as the brain is — about your store, your customers, how you sound, words, your look and competitors — each with where it came from, and Approve all on top.",
      details: [
        "Research starts by itself right after a store's first sync, once, and only when the store's Brand Brain holds nothing but its starting point; a brain with anything of the owner's own is never researched automatically. Research again (or Research my brand) runs it on demand.",
        "While it runs, a toast in the top-right corner shows the six steps — reading your store, reading what you sell, writing your brand profile, learning how you talk, capturing your look, finding your competitors — what it is reading now, the percentage and the time; a step that cannot run says why and the rest carry on. When it finishes the toast says what was found and Review → opens this tab; opening it, or closing the toast, means it is not offered again. In a new (guided) workspace the same progress shows in Setup at the top right instead of a toast — as the line after the store's first sync, with what it is reading, its percentage and, at the end, a Review button.",
        "Each finding shows where it came from — your About page, your homepage, your Shopify store description, your catalogue — and has its own Approve, Edit (a fact's value, saved and approved at once) and Remove. A finding that differs from something already approved says what it would replace.",
        "Nothing here reaches a writer until it is approved: facts wait, customer types stay hidden, voice and word rules and colours stay switched off, competitors wait — exactly as an uploaded file's findings do. Approve all approves every one.",
        "Research again replaces the last research's undecided findings with new ones; what was already approved stays.",
      ],
    },
    {
      title: "Brand Brain — Knowledge Base",
      route: "/spotlight/brand-brain/files",
      summary:
        "The library of everything the brain was fed, opened with what needs you: four tiles, a status filter, one card per item with the four streams it taught, and a drop zone on the page. An item opens on its own page.",
      details: [
        "Four tiles: Needs you (the facts waiting for approval and how many items hold them), In the library (documents · notes · pages watched), What they taught (facts · personas · voice samples · rules), Coverage (the score, each section as a bar, the empty section named).",
        "The status segments — All · Needs review · Reading · Ready · Failed — with their counts, a type and a tag select, a search over titles and tags, and a sort (Needs review first · Newest · Name · Most taught).",
        "Drop a file on the page and the Add dialog opens on the upload door with it; Paste text and Add a web page open the other doors. The dialog still names a refused type (image, audio, video are coming soon).",
        "Each card: the type, the name, the file · size · added · by · tags, then four stream pills — Facts (with how many are still to review), Personas, Voice samples, Rules (from a document they arrive switched off) — and one status. Download and Re-check appear on hover; everything else is on the item's page.",
        "An item that is being read says Reading…; one that failed shows the reason and Re-check. A web page is Watched: re-read weekly, a changed value arrives as a conflict.",
      ],
      screen: "spotlight-brand-brain-files",
    },
    {
      title: "A Knowledge Base item",
      route: "/spotlight/brand-brain/files/[id]",
      summary: "One document on its own page with a breadcrumb: its details and actions, the four streams it taught as tabs, and its own history.",
      details: [
        "The header: name, file, size, added by whom and when, last read, tags — with Download original, Edit name & tags, Re-check and Remove. A document with facts waiting shows Approve all.",
        "Tabs, kept in the address: Facts (waiting first with Approve / Reject — a conflict shows the approved value and the document's, Replace or Keep current — then the decided ones linking to their page), Voice samples (remove any), Rules (each with its switch — from a document they arrive off), Personas (Confirm the ones the document defined).",
        "History lists only this item's events — added, read, re-checked, edited, removed.",
        "Remove keeps everything you already approved, confirmed or switched on.",
      ],
      screen: "spotlight-brand-brain-document",
    },
    {
      title: "Add to Knowledge Base",
      route: "/spotlight/brand-brain/files?add=1",
      summary: "The four doors — From text, Upload file, Enter URL, From external source — then the door's form with a name and tags.",
      details: [
        "The upload door shows every type as a tile: PDF, Doc, Sheet, Slides, CSV and Text are live; Image, Audio and Video say coming soon.",
        "External sources (Google Drive, SharePoint) are listed and marked coming soon — the door cannot submit.",
      ],
      screen: "spotlight-brand-brain-add-upload",
    },
    {
      title: "Brand Brain — Facts",
      route: "/spotlight/brand-brain/facts",
      summary:
        "Every fact the brain holds, opened with the decision you owe: four tiles, a filter, a section rail, and one line per fact with its source inline. A fact opens on its own page.",
      details: [
        "Four tiles: Needs a decision (pending and conflicts — Decide now filters to them), The brain holds (approved · switched off · measured live), Where they came from (onboarding · files · by hand), Freshness (newest approval and the oldest fact).",
        "Filters — Everything · Needs decision · From files · Switched off · Measured — with their counts, and a search over labels, values and section names. Measured is where the facts the analytics engine writes from the synced store live (average order, repeat share, categories, price range, top return reason, markets): read-only, refreshed on every read, a metric with no data omitted rather than invented. (Measured was its own tab until 2026-09-21; the old address lands on this filter.)",
        "The section rail lists every section with its count and a badge for what needs a decision; a click jumps to the group. An empty section says so — the writers have nothing to go on there.",
        "Each group names who reads it (blog, social, product pages, Glisp…) and folds. Each row is one line: the label, the source inline (the document · where in it · when approved, or Onboarding · date), the value; a coloured left edge marks pending, a conflict, or switched off.",
        "Actions sit on the row: Approve / Reject for a pending fact; Replace / Keep current for a conflict, shown as the approved value struck through and the document's beside it; Switch off / on and a menu with Delete for an approved one. Measured facts are read-only; rejected ones sit last with Restore.",
        "Every row leads with its state: a green tick is approved and read by the writers; an amber circle is waiting for you; a red triangle is a conflict; a grey circle is switched off.",
        "Press Select to tick several rows — the bar offers only what the selection can do (Approve / Reject for undecided facts, Switch off / on for approved ones, Delete) and says so; Esc clears. Keys: j / k move between rows, a approves, r rejects, Enter opens the fact.",
        "Add a fact by hand at the foot of any section except the measured proof points.",
      ],
      screen: "spotlight-brand-brain-facts",
    },
    {
      title: "A fact",
      route: "/spotlight/brand-brain/facts/[id]",
      summary: "One fact on its own page with a breadcrumb: the fact and its decision or Edit, where it was cited from, who uses it, its own history, and related facts.",
      details: [
        "An approved fact has Edit (label and value), Switch off / on and Delete; a pending one has Approve / Reject; a conflict shows the approved value and the document's with Replace / Keep; a rejected one has Restore.",
        "Cited from links to the Knowledge Base item and names where in it the fact was read; an onboarding fact says it was entered from the founding document; a measured one names its window.",
        "Who uses it lists the writers that read this section, and whether they read this fact today.",
        "History lists only this fact's events; Related facts are the others in its section.",
      ],
      screen: "spotlight-brand-brain-fact",
    },
    {
      title: "Brand Brain — Voice",
      route: "/spotlight/brand-brain/voice",
      summary:
        "The voice is learned from real brand copy and enforced on every draft: the next step and the gate first, then three numbered steps — samples in, rules derived, any draft checked.",
      details: [
        "Four tiles: Next step (add samples · derive the voice · voice derived with the rules on), Samples (from documents · pasted), Rules (on of total), The gate (80 passes · 60–79 revise · below 60 sent back · a banned word caps at 59).",
        "1 · Samples: paste a caption, a banner line, a product line — or they arrive from a document or a captions CSV on the Knowledge Base; each names where it came from. Three are enough.",
        "2 · Rules: Derive from samples asks the Brand Voice Analyst to write the rules every writer follows; each has a switch and says whether it was derived, edited, or came from a document (those arrive off).",
        "3 · Does this sound like us?: paste any draft and get a score out of 100 with a verdict, the findings — banned words, wrong forms, exclamation marks and price claims are checked before the judge — and a rewrite in the store's voice you can use.",
      ],
      screen: "spotlight-brand-brain-voice",
    },
    {
      title: "Brand Brain — Guardrails",
      route: "/spotlight/brand-brain/guardrails",
      summary:
        "The rules that gate the brand's WORDS, as switches: positioning guardrails, never-use and always-say word lists, the claims policy, and the religious calendar the writer plans around. Picture rules moved to the Style Guide.",
      details: [
        "Every writer receives the enabled rules with the brain; the voice checker tests any text against them.",
        "Every rule here is appended to every writing agent's instructions on the next run — the blog writer, the outliner, the section writer, the social writer, the planner and the analyst — and the critic that scores a draft grades against the same list, so a change reaches the output rather than only the tool.",
        "A never-use word is enforced twice: a request that demands one is refused before any spend, and a draft that contains one is capped at 59 on quality and sent back for a fix.",
        "Type a banned word and press Enter to add it; a required term names the wrong forms it replaces (e-mail, not email).",
        "Calendar rules carry dates or recur (every Friday); a dated rule reaches the writer within two weeks of its window.",
        "Word rules an uploaded document stated arrive switched off — turn them on to enforce them.",
      ],
      screen: "spotlight-brand-brain-guardrails",
    },
    {
      title: "Brand Brain — Style Guide",
      route: "/spotlight/brand-brain/style-guide",
      summary:
        "The prompt an image model is actually sent, the rules that compile into it — palette, light, composition, styling, type & logo, layout, brand safety — and a bench that renders one picture with today's rules.",
      details: [
        "The prompt panel shows the exact block the image model receives for the chosen surface (Social or Blog hero), read from the same call the generators make, with a copy button and a line saying how many rules and characters it carries.",
        "It is editable: type in it and press Save (or ⌘↵) and every picture from then on is generated with exactly that text — the panel then says Custom, with who changed it and when. Reset to the rules puts the composed block back, and the rules below are never touched, so nothing is lost. If your version stops mentioning a brand-safety rule, a line names it — a warning, not a block.",
        "Test it renders one picture with today's rules, using a real best-selling product and the same pipeline a blog header takes. The last five renders are kept; each tile opens the full picture and the full prompt it was made from, and can be removed.",
        "Seven cards of rules, in the order an image prompt reads them. Every enabled row is appended to every image prompt on the next generation — blog headers, social creative and carousels — with brand safety last, so a prohibition always wins.",
        "Palette also carries the anti-default (never drift to a generic golden-hour wash); Layout carries each surface's geometry — the blog hero's wide 2:1 banner crop and the social safe area.",
        "Switch a row off to relax it, re-word it to change what the picture does, or add your own. A section with nothing enabled falls back to the built-in direction, so a picture is never generated unguarded.",
        "This tab replaces the image rules that used to sit under Guardrails; those rows are here now, under Brand safety.",
      ],
      screen: "spotlight-brand-brain-style-guide",
    },
    {
      title: "Brand Brain — Personas",
      route: "/spotlight/brand-brain/personas",
      summary: "The audience cards, each with its source; a persona research proposed and nobody vouched for asks to be confirmed or deleted.",
      details: [
        "Confirm stamps the persona with today's date and makes it owner-sourced.",
        "Owner and manual personas edit in place; add a new one from the last card. A persona an uploaded document proposed waits here too — the writers see it only once confirmed.",
      ],
      screen: "spotlight-brand-brain-personas",
    },
    {
      title: "Brand Brain — Competitors",
      route: "/spotlight/brand-brain/competitors",
      summary: "Who the store is compared to: found by an agent from evidence or added by hand, read from their own sites into a profile, approved by you — and then a fact every writer positions against.",
      details: [
        "Four tiles: competitors tracked (approved), waiting for your review, the topics they cover that you don't (the content gap), and when the last research ran. Segments Approved · To review · Rejected are URL state (?view=), so back, forward and a shared link land on the same list; with no view in the URL the tab opens on To review while finds wait and nothing is approved yet, otherwise on Approved.",
        "Find competitors starts a background run and a toast in the top-right follows it step by step — reading your searches (the ones you sit on page two for and the ones that carry the store's own words first), who ranks beside you on each of them in your own market (Google Custom Search, Gemini grounding or OpenAI web search — whichever key is on a card; the evidence line names which), mass-market retailers and media sites set aside, reading each site (a site that cannot be read is dropped), writing the profiles — and ends in 'N competitors found — Review →'. With no search on any card the agent proposes candidates from your categories and every overlap reads 'not measured'. The toast follows you to other pages and comes back after a reload; the run is a row on the backend.",
        "Each card: the origin chip (Found by the agent / Added by you), the domain, categories and price band, why it competes, the profile on four axes read from its pages (price band, shipping, returns, content), 'Where you win' from your own approved facts, the topics they cover that you don't — once approved, the ones that landed in the query bank are marked and the line says how many of them were filed as topics, with a link to the Inbound Engine's Competitor gaps filter — and the pages read. To review: Approve · Reject (and Read again when the site could not be read). Approved: Open · Re-read now · Remove. Rejected: Restore.",
        "Add manually takes a name, a website and, optionally, why they compete in your words; the agent reads the site the same way and the profile waits in To review. A competitor opens on its own page with the breadcrumb (/competitors/<id>) — every axis, every gap topic, every page read, and the fact it became.",
        "Approving creates a fact in Facts › Competitors (the profile in one paragraph, with when it was read and from how many pages); the writers position against it, Coverage's Competitors section fills, and its gap topics are filed into the query bank as competitor gaps — each must land on a category the store sells, must not re-word a phrase already in the bank and must not carry a year; the rest are dropped, and the card says which. Rejecting a competitor withdraws its gaps. Approved sites are re-read once a week by the nightly job, which re-files the gaps. Nothing is a competitor until you approve it.",
      ],
      screen: "spotlight-brand-brain-competitors",
    },
    {
      title: "Inbound Engine",
      route: "/spotlight?tab=inbound",
      summary:
        "The query bank as topics: what people search for, what it is worth, where the store ranks, and what has been written — with one next action per topic.",
      details: [
        "A run line opens the tab: when the bank was last rebuilt, the Search Console window the ranks come from, the last day the Keyword Scout added anything (and how many ideas), and the bank's size — topics, searches, research angles.",
        "Four tiles follow: searches sitting on page two (ranks 8–25) and the clicks a page-one move would add, the monthly demand the topics hold (searches for the store by name are counted separately, not as content demand), how many topics are written or still open, and what is new since the last nightly rebuild.",
        "A search filed from a competitor's gap topics carries a 'Gap · <domain>' chip and sits under the category it belongs to, like a research angle; a topic made only of such searches reads 'Competitor gap'. The Competitor gaps segment lists them, and the bank's size line counts them.",
        "Every topic card shows its searches, its research angles, its monthly demand, its best rank in Google, the page-two search it would win with, when its newest search arrived, and its state — Not written, Draft in review or Published. Its searches are listed with rank, clicks, the day each entered the bank and its source (Search Console, Keyword Scout, derived from your catalog); a search that arrived since the last rebuild wears a 'new' chip. The page-two winner Search Console found is its own line even when the bank never held that phrase.",
        "One phrase, one home: a Keyword Scout idea sits inside the real topic it belongs to as a research angle (it still competes on its own in Daily Picks), and an idea that only re-words a phrase already in the bank is refused when the Scout proposes it. Google searches no category claimed sit under Other searches; people typing the store's name sit under Searches for the store by name, which is never a topic to write.",
        "Added — Today · 7 days · 30 days · All time — filters the searches by the day they entered the bank; the tab opens on 30 days, a topic's counts follow the window, a topic with nothing in the window leaves the list (the count beside the segments says how many), and a topic's list says how many earlier searches the window hides. Show narrows to page-two topics, Google demand, unwritten, topics with research angles or today's focus; the intent, persona and search boxes and the sort (opportunity, demand, newest, unwritten first, name) do the rest.",
        "Write this starts the article pipeline against the topic's best search; Open draft goes to the draft; See reach goes to Visibility. The rank and click figures come from the latest Search Console snapshot; a topic Google has never shown reads '—' rather than a guess. Keyword Scout and the intent templates sit under Advanced at the bottom of the tab, collapsed by default.",
      ],
      screen: "spotlight-inbound",
    },
    {
      title: "Daily Picks",
      route: "/spotlight?tab=daily-picks",
      summary:
        "Today's recommended topics, scored on demand, striking distance (when measured), margin, catalog and brand fit, with the products each would feature and a 'why this pick' explanation.",
      details: [
        "Demand and striking distance are scored on an absolute scale — 60 real searches count as real demand, not as nothing next to a 6,000-search topic — so the fit number on a card is the topic's own worth. A topic with no measured demand and no page-two ranking is an idea, not a pick; at most two picks come from one category, so one category never owns the day. Research picks are the exception: labelled, and limited to their own slots.",
        "A pick the store already ranks on page two for shows a Striking distance bar and a line naming the search — 'you rank #12 for …' — because that pick is a page-one move, not a cold start. A topic written recently ranks lower for a while and says so in its own tag; its fit is unchanged.",
        "A date dropdown opens any past day's picks; pick history feeds the next night's scoring.",
        "Each pick shows where it came from — measured Google demand, the catalog signal, the scout, or a competitor gap ('Competitor gap · <domain>': a topic that competitor publishes and the store does not). Scout finds and competitor gaps share the discovery slots: up to three of the ten, never the whole day.",
        "Refresh picks re-runs the researcher on demand.",
      ],
      screen: "spotlight-picks",
    },
    {
      title: "Why this pick",
      route: "/spotlight?tab=daily-picks",
      summary: "The scoring breakdown behind a single pick — demand, margin, catalog, brand fit — so a rank is never a black box.",
      details: [
        "Scores are computed by the backend; the explanation is written from those parts.",
      ],
      screen: "spotlight-why-pick",
    },
    {
      title: "Needs review",
      route: "/spotlight?tab=approvals",
      summary:
        "Drafts awaiting a decision. Open one to read it in the magazine layout with its hero image, table of contents, product gallery and quality scorecard.",
      details: [
        "Approve & publish sends it to the storefront blog; Refine asks the writer for specific changes; Delete removes it.",
        "The scorecard grades SEO, AEO (answer engines), GEO (generative engines) and brand quality.",
        "Before a word is planned, the writer reads what already ranks: the first page-one result for the keyword on an approved competitor's site. Its headings become the plan's brief — cover every theme with more specific, brand-grounded advice, add the template themes it misses (FAQ, sizing & fit, fabric & care, styling, occasions, shop the look), never copy, never name the competitor. The draft's side panel 'Written to beat' shows that page, what the plan covered and what it added; when no approved competitor ranks for the keyword, when its only page-one result is its homepage, or when web search is not connected, the panel is absent and the research trace says so in one line.",
        "A draft still being written streams in token by token with a progress bar.",
      ],
      screen: "spotlight-review",
    },
    {
      title: "Published",
      route: "/spotlight?tab=published",
      summary:
        "Three views: Live — every post on the storefront with its reach and attributed revenue — Unpublished — every post that was live and isn't, with when it left, why, and Publish again — and Worth rewriting, the posts already ranking for searches they were never written for.",
      details: [
        "Live: a blog-health strip counts genuinely live posts and the most recent publish; each card links to the live post and to its draft, with Unpublish and Delete from site. When nothing is live, the empty state says how many posts are unpublished and links to them.",
        "Unpublished: every post that left the live set, newest departure first — the span it was live ('Live Aug 29 – Sep 17 · 19 days'), the reason (You unpublished it · Hidden in Shopify admin · Gone from Shopify · Before this was recorded), what it earned while live, and two actions: Open draft and Publish again. Publish again re-shows the same Shopify article — never a second copy — and the post moves back to Live.",
        "Opening the Live view checks each post against Shopify: an article that is gone or hidden in Shopify admin is moved to Unpublished with that reason recorded.",
      ],
      screen: "spotlight-published",
    },
    {
      title: "Published › Unpublished",
      route: "/spotlight?tab=published",
      summary: "The posts that were live and aren't — when, why, what they earned, and one click to publish again.",
      details: [
        "Switching between Live and Unpublished is a view change over data already loaded — no navigation.",
      ],
      screen: "spotlight-unpublished",
    },
    {
      title: "Published › Worth rewriting",
      route: "/spotlight?tab=published",
      summary:
        "The cheapest wins in search: published posts already ranking on the bottom of page one or on page two for searches they were never written for, and one button that rewrites them.",
      details: [
        "Every Monday, Search Visibility reads what each live post actually ranks for over the last 28 days and keeps the answer. A post sitting between positions 8 and 20 for a search its own keyword and headings never covered is listed here, richest first — the page already exists, is indexed and is trusted, so a rewrite is the shortest route to more traffic.",
        "Each card names the post, what it was written for, and up to three of those searches with the position, the impressions and roughly how many more clicks a month a move onto the fold would earn. The figures are Google's, carried through untouched; the ordering is by those clicks.",
        "Rewrite runs the same writer the refine loop runs, told exactly which searches the article is missing: it keeps the title, the URL, the template and everything that works, and adds the depth those searches ask for. The draft is overwritten in place and returns to Needs review — nothing is republished, and you still approve it.",
        "One rewrite runs at a time, like any other generation, and the progress toast follows it across the app. When nothing is in the band the view says so — the scan looks again on Monday.",
      ],
      screen: "spotlight-published",
    },
    {
      title: "Money pages",
      route: "/spotlight?tab=money-pages",
      summary:
        "The product and collection pages Google already shows and that already sell, ranked by what a properly written page would be worth — and the copy to fix them, written for you to paste into Shopify.",
      details: [
        "A shop does not make money from articles; it makes money from product and collection pages, and most of those were never written for search at all. This tab reads what Google shows each of them for over 28 days, joins it to what that page has earned over the same 28 days, and ranks them by the two together — not by impressions, which is the list every SEO tool gives and the wrong one for a shop. The loud page nobody buys from sits below the quiet page everybody does.",
        "A page qualifies once Google has shown it at least 50 times in the window and it sits between positions 4 and 30. Above position 4 it has already won; past 30 it is not within reach of a rewrite.",
        "The money figure is a projection, and every row says what it rests on. A page that has had at least 20 search visits of its own in the window is priced at its own rate; every other page is priced at your shop's average — what your shop has actually earned from search, divided by all the search visits it had in the same 28 days. That average is why a collection can be priced at all: an order names the product it contains, never the collection it was browsed from, so a collection has no earnings of its own, but a visit to it is still worth what a visit to your shop is worth. If your shop has not had enough search traffic to work out a rate, pages say \u201cWorth unknown\u201d and are ranked on the traffic they would gain.",
        "Write it drafts a new search-result title, meta description and page description in your brand's voice, using the Brand Brain \u2014 the same voice, guardrails, banned words and claims policy every other writer follows. The draft opens beside what is live now, field by field, each with a Copy button and a character count against Google's limits.",
        "Search Visibility never changes your shop. The title and description go into the product's Search engine listing in Shopify and the page copy into its description editor, by you. \u201cI've pasted this in\u201d records that it is done and can be undone; nothing on this screen writes to Shopify at any point.",
        "Narrow the list with the filters — All pages, Products, Collections, No search copy, Drafted, Not drafted — each showing how many pages it holds before you pick it. The search box matches a page's name, its handle and the searches it ranks for, so you can look for a page by a phrase shoppers type rather than by what you called it. Sort by worth, by the visits a rewrite would gain, by impressions, or by position with the furthest-from-page-one first. Pages come twenty at a time.",
        "The list is read once a day and served from that read, so opening the tab repeatedly costs nothing, and filtering, searching, sorting and paging never send a request. When Search Console is not connected the tab says so and what connecting would give you.",
      ],
      screen: "spotlight-published",
    },
    {
      title: "Local pages",
      route: "/spotlight?tab=local-pages",
      summary:
        "Restaurant brands only: one page per branch on the brand's own site, the page a hungry person lands on from \u201cpizza delivery in <town>\u201d.",
      details: [
        "The tab appears only for a restaurant brand. It lists every branch that is not closed, with whether it has a page and whether that page is published; tiles count branches, pages written and pages published.",
        "Write (or Rewrite) has the writer draft the page from the branch's name, town and street, its hours, whether it delivers and does carryout, and the names of the dishes its guests ordered most in the last 30 days. It writes in the brand's voice from the Brand Brain and is never given a price or a sales figure. If the writer is unavailable, a plain page is written from the same facts and marked Plain. Write the missing pages drafts every branch without one, three at a time.",
        "Edit changes the headline, the intro, the search title (60 characters) and the search description (155 characters), with a counter on each. Rewriting a page returns it to Draft.",
        "Publish puts the page on the brand's site at /r/<brand>/<branch>; Unpublish takes it down. Only an open branch's page can be published. A franchise member sees and works on its own branches only.",
        "The public page shows the copy above the branch's own address with a directions link, phone, open now, delivery and carryout, the week's hours and up to eight favourites with their menu prices — all read from the branch when the page is served, so a page never shows a stale price or hour. It carries schema.org Restaurant markup for Google, and /r/<brand>/sitemap.xml lists every published page. /r/<brand> lists every location with an Order online button.",
        "A restaurant brand does not publish articles to a Shopify blog: that button answers that the brand publishes on its own site. This tab shipped before its capture exists; it gets its screen on the next capture run.",
      ],
    },
    {
      title: "The article on the storefront",
      route: "/spotlight?tab=published",
      summary: "What a published Search Visibility article looks like on the shop's own blog — hero image, structured sections, shop-the-look products.",
      details: [
        "Products in the article are real catalog items with live links.",
        "The article's Open Graph image and metadata are generated with it.",
      ],
      screen: "spotlight-blog-live",
    },
    {
      title: "Visibility",
      route: "/spotlight?tab=visibility",
      summary:
        "Organic reach from Google Search Console — impressions, clicks, average position, how many posts Google has indexed — the Published posts table with each post's index status, and the top search queries.",
      details: [
        "Until Search Console is connected the tab shows an honest empty state that links to Integrations; it never shows estimated numbers.",
        "Connect Google Search Console from the Integrations page (OAuth, read-only scope), then choose the property to read; the first pull starts at once.",
        "The Index column shows Google's verdict per post in Google's own words — Indexed (with the last crawl date), Discovered or Crawled but not indexed, Unknown to Google, Excluded — and a post that is not indexed carries an Inspect in Search Console link, where Request indexing lives. A callout above the table counts indexed posts and gives the next step for the most urgent state present.",
        "Below the posts, Page-two opportunities lists the searches the store already ranks 8–25 for, from the latest store-wide Search Console snapshot, ranked by the clicks a page-one move would add, each with the query-bank topic it maps to.",
      ],
      screen: "spotlight-visibility",
    },
  ],
  howToUse: [
    "Start on Brand Brain → Coverage. Add the size chart, the returns policy and a brand book to the Knowledge Base and approve what was extracted; add three pieces of real brand writing on Voice and derive the rules. The writer grounds every draft here.",
    "Open Daily Picks each morning. Read the 'why' behind the top picks and click Generate draft on the ones worth writing.",
    "Carry on with other work — the generation toast reports progress and finishes even if you leave the page.",
    "When a draft lands in Needs review, open it, read it in the magazine view, check the scorecard, and either Approve & publish, Refine with notes, or Delete.",
    "Check Published for reach and attributed revenue; connect Search Console under Integrations if Visibility is still empty.",
    "Use the Inbound Engine when you want to choose the topic yourself: open the page-two segment, read what each topic is worth, and click Write this on the one to win — or Keyword Scout to find new searches.",
  ],
  benefits: [
    "A steady stream of search-ready, on-brand articles without a content team.",
    "Topics chosen from real demand and real margin, not guesswork.",
    "Full editorial control: nothing goes live without approval.",
    "Reach and revenue per post, measured — so the effort is accountable.",
  ],
  goodToKnow: [
    "Publishing writes to the Shopify storefront blog — this is one of the platform's deliberate outbound actions and is always behind Approve & publish.",
    "Article and image generation are metered on AI Performance and subject to the budget guard; a reached ceiling pauses generation, never approvals.",
    "Search Console requires an OAuth connection made by a Google user with access to the property; until then Visibility and per-post reach stay empty by design.",
    "Image generation can use more than one vendor (OpenAI or Gemini) — chosen in Integrations → AI model.",
  ],
  related: ["employees", "social", "integrations", "ai", "products"],
});
