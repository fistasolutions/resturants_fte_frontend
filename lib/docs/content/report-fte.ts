import { defineDoc } from "@/lib/docs/define";

export const reportFteDoc = defineDoc({
  slug: "report-fte",
  title: "Report Builder",
  route: "/report-fte",
  area: "command",
  tagline:
    "One digital employee that builds any report from the same figures every page uses — on your schedule, with every number traced to the tool that produced it.",
  sources: ["The analytics engine's tools — the same 53 the analyst calls, in-process for the app and over MCP for Claude", "The FTE's own tables: templates, runs, schedules, deliveries", "The outcome you record on a delivered report"],
  refresh: "A run computes when you run it or when its schedule comes due (checked every 15 minutes); the narrative is the run's one AI call",
  updated: "2026-10-09",
  hero: "report-fte",
  heroCaption:
    "The Desk: the ask block, then six of the fourteen templates — nothing else.",
  whatItIs: [
    "Every page in the platform is a fixed report — figures the engine computes, laid out in a shape an engineer chose. The Report Builder is one digital employee that builds any report from those same figures: the owner says what he wants and for whom, the FTE shows the plan it understood, computes each section through the engine's tools, composes the tiles, tables, bars and narrative, and — once approved — delivers it as PDF, Excel, email or in-app, once or on a schedule. A new report is a template, not a page.",
    "A template is data: an ordered list of sections, each bound to one or more engine tools with its settings and a way to show it. A run calls those tools (three at a time), turns each tool's JSON into blocks with one formatter, and hands the composed figures — nothing else — to the narrator, whose sentences cite them. The same tools are served to Claude over MCP with a key you create on the MCP tools tab, so a report can be asked for from the app or from a conversation.",
  ],
  whyItMatters: [
    {
      title: "A report in minutes, not a page in a sprint",
      body: "The buyer's Monday returns report, the bookkeeper's tax pack, a one-off 'which codes lost money' — each is an ask or a template, not engineering.",
    },
    {
      title: "Every number defensible",
      body: "The trace beside the report lists the tool call behind every section with its measured time. A tool that fails leaves its section saying so and the run is marked as not fully grounded; nothing is estimated.",
    },
    {
      title: "An employee, not a feature",
      body: "It has a job description, an authority level it earns, a manager who signs, a shift, and one number it is judged on — reports acted on.",
    },
  ],
  howItWorks: [
    "Ask: the owner types the report he wants on the Desk, or opens a template and chooses Run now. Build it creates the run — the FTE routes the ask to the nearest template by its words, reads a period, a recipient's email and a cadence from it, and shows the plan: audience, period, delivery, and each section bound to the tool it will call. No AI is involved in the plan; the owner edits it.",
    "Compute and compose: Run the plan streams each section into the report as its tool returns, and the call into the trace with its arguments and measured time. The narrator — the run's one AI call — writes the closing paragraphs and one sentence under each section that asked for one, on the composed figures and nothing else. A failed tool becomes a sentence naming the failure.",
    "Approve and deliver: Approve & send renders the PDF and Excel the template asks for, emails them to the recipients on the plan (the status line says plainly when SMTP is not configured or no address is set) and records a delivery; Approve & schedule puts the template on its cadence at 'approve each' — a scheduled run waits on the Desk for a signature — until you switch it to 'sends alone'.",
    "Judge: opening a delivered report in the app stamps it opened; What did you decide? records the one line the scorecard counts as acted on. The Profile computes its tiles from those rows.",
  ],
  sections: [
    {
      title: "Desk",
      route: "/report-fte",
      summary:
        "Two things: the ask box with grounded example asks, and six of the fourteen templates underneath at full width.",
      details: [
        "Type the report you want in the ask block — what, for whom, how often, in which format (Enter builds, Shift+Enter breaks a line) — or pick an example ask. Build it moves to the Composer at once, which shows a report-shaped skeleton while the plan is built. An email address in the ask becomes the recipient; 'every Monday', 'monthly', '30 days', 'Excel' are read too.",
        "Each template card opens its editor; All 14 opens the gallery. What was delivered and what is scheduled live on the Delivered & scheduled tab; the employee's card and its scorecard on Profile.",
      ],
      screen: "report-fte",
    },
    {
      title: "Composer",
      route: "/report-fte/composer",
      summary:
        "Three columns: the plan the FTE understood, the report as it composes, and the tool-call trace beside the Deliver panel.",
      details: [
        "The plan on the left lists audience, period and delivery, then every section with the tool it calls and how it is shown; click any to open its parameters. Run the plan starts the tool calls. The plan and the right-hand column stay in place while the report scrolls.",
        "While it composes, every section stands as a skeleton of its kind (tiles, a table, bars, lines) and is replaced in place as its tool returns. The finished report is arranged as a document: In brief (the narrative's lead), Headline figures (every KPI block together), Charts, Tables, then What to do. The trace shows each call's arguments and measured time, and the narrator's tokens and cost. Open full shows the report on its own page.",
        "Approve & send and Approve & schedule unlock once the run is ready. Approve & send opens a dialog with the owner's address already chosen; Choose from Settings lists every address the store keeps — the owner, every member, the shop managers, each location's manager and the warehouse, support and returns addresses — and any other address can be typed in. Send emails the report with its PDF and Excel to exactly those people; a sent report can be sent again to more people.",
        "Approve & schedule opens a dialog: how often (Daily, Weekly or Monthly), the day (a weekday, or the 1st to the 28th), the time in the store's time zone, who it goes to (the same address picker), and when it runs — Send automatically (at each time it is rebuilt with the latest figures and emailed, then a notification says who it went to) or Ask me first (it is rebuilt and waits; a notification asks you to approve it). Also show it on the Daily Reports page lists each run there under its tab. The button then shows the schedule that was saved, for example 'Weekly · Wed 09:30 · 3 people'. A report has one schedule; saving again changes it.",
        "The status line is the backend's own — including an email that could not be sent and why (no mail server set up, for example). Download PDF / Excel are the run's files. A run reopened later shows the phase it is in, and a sent or scheduled run offers What did you decide?",
        "Ask for a change, under Deliver: tell the FTE how the report should change — 'only the top 10 brands', 'make it 30 days', 'drop the returns table', 'add refund reasons', 'focus the summary on MIRAGE'. The Report Editor changes the plan (which sections, their row limits, the period, the summary's focus) and never a figure; when something changed the plan runs again at once and the thread records what changed.",
      ],
      screen: "report-fte-composer",
    },
    {
      title: "Templates",
      route: "/report-fte/templates",
      summary:
        "All fourteen templates — the pages the platform already implies, as reusable shapes — filtered by cadence, plus Start from a question.",
      details: [
        "Daily, weekly, monthly, season and on-demand filters; each card shows its section and tool counts and when it runs. The fourteen built-ins are seeded once per store; a custom ask that you schedule becomes a fifteenth.",
        "In a new (guided) workspace, the Desk and this list offer only the templates your connected data can run: a template appears when at least one of its sections reads Shopify alone or an app you have connected. Support Week waits for Gorgias, Store League's traffic sections for V-Count, Warehouse Week for iPacky and Website Behaviour for Clarity or Search Console; connect the app and the template appears.",
        "Opening a template shows its editor: the ordered section list, each row bound to its tools with the binding line and a display type; a switch turns a section off without removing it. Save template writes it to the backend; Run now builds a run from it (saving first if you changed anything).",
        "Expand a row for its settings and the two per-section options — a sentence from the narrator under the section, and ✦ Explain links (recorded, not yet drawn). Add a section from the catalogue's tools; it binds to the report's period.",
      ],
      screen: "report-fte-editor",
    },
    {
      title: "History",
      route: "/report-fte/history",
      summary:
        "Every report the FTE has built — asked or scheduled — newest first, with its status, when, its figures, where it went, what was acted on and its AI cost.",
      details: [
        "Filter All · Delivered · Drafts & ready. A title opens the run in the Composer; the document icon opens the report on its own page once it has figures.",
        "Rename a report inline; Copy makes a new draft from the same plan so the original stays as it was delivered; Delete removes the run and its deliveries after a confirmation.",
        "The report page (/report-fte/reports/<id>) is the document at reading width with PDF and Excel, a way into the Composer, and the same Ask for a change chat; a change there re-runs the plan in the Composer.",
      ],
      screen: "report-fte-history",
    },
    {
      title: "Delivered & scheduled",
      route: "/report-fte/delivered",
      summary:
        "Every recurring report with the authority it runs under, what was sent and whether it was acted on, and the email a recipient receives.",
      details: [
        "Scheduled: report, runs, who (with 'awaiting your signature' when a run waits), formats, authority (Sends alone · Approve each · Off), last run; per row Approve each / Sends alone, Pause, Turn on and Edit. Pause every schedule is the kill switch.",
        "Delivered: report, kind (scheduled or asked), recipient, delivered and opened times, what you recorded as acted on, and the run's AI cost. A row opens its run in the Composer.",
        "What the recipient receives: the latest delivery's email — headline tiles, the narrative lead, the attachments — and the channels: in-app, PDF and Excel on, email on when SMTP is configured, Slack / WhatsApp not built. The PDF and Excel carry the report only; the trace of tool calls stays in the Composer.",
        "Notifications: the bell beside your name in the sidebar (and in the phone header) counts what is new — a scheduled report that sent itself and who it went to, one waiting for your approval (it opens that run in the Composer), or one that could not be built or emailed. Opening one marks it read; Mark all read clears the count. The inbox is shared by everyone in the store.",
      ],
      screen: "report-fte-delivered",
    },
    {
      title: "Profile",
      route: "/report-fte/profile",
      summary:
        "The five things a digital employee has: a job description, the authority ladder with its current rung, guardrails, the scorecard and the shift.",
      details: [
        "The ladder runs L0 Observe → L1 Propose → L2 Act on approval → L3 Act alone → L4 Own; the FTE is at level 2, and promotion is the owner's call — a schedule switched to 'sends alone' is that report at level 3. Nothing promotes itself.",
        "Guardrails with their live state: never calculates, never sends unapproved below level 3, a failed tool says so, spend metered per run, and the kill switch.",
        "The scorecard is the last 30 days from the FTE's own tables; 'its number' is reports acted on. The shift lists every live schedule and its authority.",
      ],
      screen: "report-fte-profile",
    },
  ],
  howToUse: [
    "Open Report Builder, read the Desk, and type the report you want as you would say it to a person — audience, period, format, cadence, an email if it should go to someone.",
    "Check the plan on the left of the Composer before you run it: the audience, the period and each section's tool are the contract.",
    "Run the plan; read the report and the trace together. Approve & send for a one-off; Approve & schedule to make it a habit — choose Ask me first until you trust it, then Send automatically.",
    "Edit a template's sections in the editor and Run now to see the change; the tool catalogue shows everything a section can bind to.",
    "Record what you decided on a delivered report, and watch Delivered & scheduled for what was opened and acted on — that is how the employee is judged.",
    "Come back to any report from History — reopen it, copy it into a new draft, or ask for a change in words.",
  ],
  benefits: [
    "Any report from the figures the platform already computes, without a page being built.",
    "A plan shown before anything runs, and a trace after — the report is explainable end to end.",
    "Approval and authority built in: nothing sends unsigned; a schedule earns 'sends alone' when you give it.",
    "Templates the owner edits himself, section by section — and the same tools available to Claude.",
  ],
  goodToKnow: [
    "The plan is deterministic: an ask is routed to a template by its words and only a period, an email and a cadence are read from it. A free-form ask that matches no template becomes a Custom report (headline numbers, channels, top products, a reading) you can extend in the editor. No AI plans the structure — that is deliberate.",
    "The Report Builder is a different employee from Glisp, the analyst in the Ask panel. Glisp answers questions; the Report Builder produces documents on a schedule. Narrative sections are written by the narrator on the composed figures and marked with the Glisp icon.",
    "The Daily Reports page keeps the executive report it has always produced; the Report Builder's Executive Report template is a separate run of the same figures.",
    "Email opens are not tracked; 'opened' means opened in the app. An email that could not be sent is recorded with its reason, never lost.",
    "The backend also serves the same tools over MCP for Claude, with keys issued from the API; there is no screen for it in this release.",
  ],
  related: ["employees", "reports", "results", "ai", "chat"],
});
