import { defineDoc } from "@/lib/docs/define";

export const employeesDoc = defineDoc({
  slug: "employees",
  title: "Digital Employees",
  route: "/employees",
  area: "growth",
  tagline: "The four AI employees as one team — who is working, who is waiting on you, who has never been given a job — and the door to each of them.",
  sources: [
    "Search Visibility",
    "Social Media Manager",
    "Paid Ads Manager",
    "Report Builder",
    "QuickBooks Online (read-only)",
    "Scheduler run ledger",
  ],
  refresh: "Live — read when the page opens; every figure is the employee's own",
  updated: "2026-10-09",
  hero: "employees",
  heroCaption:
    "The Digital Employees hub: one line about the team, then a card per employee — its character on a stage, role, status chip, what it needs from you, three figures, and the last thing it did. Each card opens that employee on its own page.",
  whatItIs: [
    "Digital Employees is the team page for the platform's four AI employees: Search Visibility (search content), Social Media Manager (organic social), Paid Ads Manager (media buying) and the Report Builder (reporting) — plus the Customer Support Agent (customer conversations through Gorgias) and the Email Marketing Manager (email and SMS through the store's own Klaviyo account). It replaced their four sidebar rows with one, so the sidebar is shorter and the team is seen together instead of one at a time.",
    "The fifth employee, Accounts Payable, lives at /employees/finance: it reads every connected QuickBooks Online company and keeps one consolidated view of every unpaid bill, because QuickBooks itself can never add separate company files together. It connects to each company from its own page, reads them hourly, and in nine tabs says what is late, what to pay this week, whether each company's bank covers it, which bills look wrong — and what it has been worth.",
    "Each employee is drawn as a character with the tool of its trade — Search Visibility with a telescope, Social Media Manager with a megaphone, Paid Ads Manager with an archery target, the Report Builder with a clipboard and a pen, the Email Marketing Manager with an envelope whose letter rises when you hover, the Customer Support Agent with a headset and a speech bubble whose dots type. The faces follow your pointer around the page, wear the employee's status (a raised hand when it needs you, worried brows when a job failed, closed eyes when it has never been given a job), and get to work when you hover or focus the card: the beam sweeps, hearts float, the arrow hits the bullseye, the clipboard writes itself.",
    "Each card is an employee record, not a launcher: a status the backend derives from that employee's own scheduled jobs and approvals, a Needs-you row that opens the exact tab waiting for a decision, three figures read from the employee's own page, and the last thing it did. Clicking a card opens the employee at its usual address — /spotlight, /social, /ads, /report-fte — with a breadcrumb back to the team.",
  ],
  whyItMatters: [
    {
      title: "One glance, four employees",
      body: "Who is working, who is waiting on a signature, who has never been given a job — answered once, on one page, before opening any of them.",
    },
    {
      title: "Nothing moved",
      body: "Every employee keeps its URL, its tabs and its deep links (nudges, e-mails, the analyst's page context). The hub is a front door, not a new home.",
    },
    {
      title: "A shorter sidebar",
      body: "Four rows became one. The five employees are listed right under the Digital Employees row, open on every page, so any of them is one click away; the current employee is highlighted, and the chevron folds the list away for the rest of the visit.",
    },
  ],
  howItWorks: [
    "One read serves the page: the backend asks each employee's own service for its figures — Search Visibility's overview, the social post counts, the ads budget, the Report Builder's runs and deliveries — and the scheduler ledger for the health of the jobs that employee runs on. Nothing is computed on the hub itself.",
    "Status follows five rules in order: never given a job → Not started; its last job failed → Needs attention; approvals waiting → Needs you; a job overdue against its own cadence → Idle; otherwise → Working. Job health is the System page's, never re-derived here.",
    "A Needs-you row links to the tab where the decision is made — Search Visibility's Review, Social Media Manager's Approvals, Paid Ads Manager's Spend gates, the Report Builder's Delivered & scheduled. A Not-started card shows the set-up action instead.",
    "The three figures are the employee's own numbers (published this month, posts created, live campaigns, reports delivered in 30 days, and so on), formatted the way the rest of the app formats them; an ads cap that was never set says 'Not set', never '$0'.",
    "The footer is the last thing the employee did where its page records one (a draft, a delivery, a ledger entry), otherwise its last scheduled run with that run's health and age.",
    "The characters are drawn in the app's own colours and move only in response to you: the eyes follow the pointer, and a card's hover or keyboard focus wakes its character and runs its prop. Nothing animates on page load beyond a slow blink, and a system 'reduce motion' preference stills all of it.",
  ],
  sections: [
    {
      title: "Accounts Payable",
      route: "/employees/finance",
      summary:
        "The accounts-payable employee across your QuickBooks companies, on its own page under the hub, in nine tabs: Overview · Value · Bills · Payment run · Aging · Vendors · Cash · Chat · Profile. A/R and P&L are shown as coming next and are not built.",
      details: [
        "Connect QuickBooks opens Intuit, where you pick one company and approve read access; each company connects once, so three sets of books are three connections. Every hour each company's open bills, the bills and bill payments of the last 13 months, its vendors and payment terms, and its bank accounts' book balances are read; Sync now reads them immediately.",
        "Overview opens on the morning note — one paragraph, written by rules rather than AI, about the most urgent thing (a company short for the week, a possible duplicate, a discount about to lapse) with links to act on it — then the money strip (owed · past due · due in 7 and 30 days · cash in the bank · left after this week), one card per company saying whether its bank balance covers the week's late and due bills with a cushion, three queues (Pay now · Due this week · Needs a look), aging, and what changed since yesterday.",
        "Value is what Finance has been worth, month by month, and the ledger behind it. Every early-pay discount and possible duplicate it flags is recorded when first seen, and decided later from the books themselves: a discount is kept when the bill is paid inside the window (marked as checked by the amount when the payment was smaller than the bill), missed when it is paid after; a duplicate is stopped when one copy is removed before payment, and counted as paid twice when both are paid. Money kept this way is shown as from your books. Review time, paying on time and late fees are estimates built on five assumptions — an hour's cost, review hours per company, what idle cash earns, the late-fee rate and how often vendors charge it — each shown with its source and labelled as a benchmark or our own estimate, and a manager can change them. The two kinds are never added into one figure without both being named.",
        "Value also shows what is at stake now (open discounts, uncaught duplicates, late fees accruing on past-due bills), Before Finance — the year before the first connection, read once and kept: discounts missed, bills probably paid twice (same vendor, amount and bill number or date, listed to check with the vendor), cash paid early and late fees — and fraud figures from the FBI and AFP as context, never added to a total. A manager can mark a finding Not a problem with a reason (a cleared duplicate stops flagging both copies and returns to the payment run) and restore it later. With no company connected the tab shows a sample business under a notice, and nothing can be changed.",
        "Bills is the whole payable in one table: saved views, filters for company, vendor, status and age, a search, sortable columns, grouping by company, vendor or age with subtotals, a totals row, and pages of 25. The view lives in the address, so a filtered list can be sent as a link.",
        "Four checks flag bills, all computed in the backend: a possible duplicate (same vendor and amount in the same company within 14 days — the later one is marked as the second copy — or the same vendor, amount and bill number entered in two different companies, which QuickBooks cannot see across its files), an unusual amount (more than 2.5× the vendor's typical bill), a new vendor (first seen in the last 30 days), and an early-pay discount that can still be taken.",
        "Payment run proposes what to pay through this Sunday, next Friday, or 30 days: late bills first, then discounts worth taking, then what falls due — each company paying from its own bank balance, with the balance left after each ticked bill. A suspected second copy starts unticked with the reason. Copy list puts the ticked bills on the clipboard; paying still happens in QuickBooks.",
        "Aging is the company-by-band grid (each cell opens those bills), how concentrated the payable is in its biggest vendors, a vendor-by-band grid, and the trend of owed and past due from one snapshot a day — the line starts on the day the snapshots began and grows from there.",
        "Vendors lists every vendor across the companies — owed, past due, next due, terms, typical bill, and days to pay and on-time rate measured from bills actually paid. A vendor opens on its own page with the breadcrumb: its split by company, its open bills and its payments.",
        "Cash projects 13 weeks for one company or all of them: today's book balance, plus each week the store's average weekly takings (gross revenue of the matched location over the last 8 weeks), minus the bills that fall due, with this week carrying the late ones. Weeks below the cushion are marked. Payroll, rent and other spending not entered as bills are not in it, and the page says so.",
        "Chat is Accounts Payable's own conversation: it answers from the same figures — the summary, the bills, the payment run, the vendors, the cash outlook and the value statement — and can only read; it never pays, approves or edits anything. Asked what it has saved, it gives the money from the books first and names the estimates as estimates. Answers stream in at a steady pace, and you can edit a question to replace it and the answers after it. Each answer is the same answer card Glisp uses: records come as a table (a figure right-aligned), a ranking or trend can switch to a chart, the page that acts on the answer closes it as a button, and the receipt shows what was read and how fresh it is. A payment run comes as a table in the order to pay, with Open the payment run under it.",
        "Profile is the job description, what it may and may never do, its scorecard (bills paid and on time, discounts offered, taken and missed) and the books it reads with when each was last read. The Monday card, when switched on, goes to the owner of the organization and adds what was kept that month.",
        "A bill opens on its own page with the breadcrumb: why it is flagged in a sentence, its line items, what has been paid against it, the vendor's other open bills, and a link to that transaction in QuickBooks — which opens in whichever company the browser is signed into.",
        "Every figure is in the store's currency. A company that keeps its books in another currency is converted at QuickBooks' own exchange rate for that day, the bill keeps its original amount (shown under the converted one, \"CAD 12,400.00 at 0.7342\"), and the QuickBooks line on the Overview names each rate used. If QuickBooks has no rate for a currency, that company is left out of every total — never added unconverted — and the Overview asks for a rate (Set rate, 1 CAD = ? USD); the next read includes it, and a QuickBooks rate replaces yours as soon as one exists.",
        "Late, due this week and discount deadlines follow the store's own time zone, so a bill turns late at midnight on the owner's calendar.",
        "Reads QuickBooks and never writes to it — enforced by a test that fails the build if a write is introduced. Disconnecting a company (the × beside its name, or Disconnect on its Integrations card) revokes the access and removes everything read from it here — bills, payments, bank balances and Finance findings — and the Before Finance baseline is rebuilt from the companies still connected. With two or more companies, Disconnect all removes every one after you type DISCONNECT. Nothing in QuickBooks changes.",
      ],
    },
    {
      title: "The team",
      route: "/employees",
      summary: "A line about the team (how many need you, need attention, or have not started), then four cards in the order Search Visibility, Social Media Manager, Paid Ads Manager, Report Builder.",
      details: [
        "A whole card is one click that opens the employee; the Needs-you or Set-up row inside it is its own click that opens the exact tab.",
      ],
      screen: "employees",
    },
  ],
  howToUse: [
    "Open Digital Employees from the sidebar. Read the team line first: it says how many items are waiting on you.",
    "On a card marked Needs you, click the highlighted row — it lands on the tab holding the decision, not on the employee's overview.",
    "On a card marked Not started, click the set-up action (Brand Brain, Content Studio, a first campaign, a first report ask) to give that employee its first job.",
    "Click anywhere else on a card to open the employee itself; use the 'Digital Employees' breadcrumb above its header to come back to the team.",
    "A card marked Needs attention names the job that failed; open System to read the run and its error.",
    "In a new workspace, each card carries an Active switch (owners and admins). Search Visibility and Report Builder start on. Switch another on and it joins the sidebar at once; if it needs an integration, its card shows Connect and Setup at the top right of every page lists it, with a progress bar, until that integration is connected. Switched off, the card is dimmed and the employee leaves the sidebar.",
  ],
  benefits: [
    "The state of every AI employee is one page away, with the decision each one is waiting for a single click from it.",
    "Three fewer sidebar rows without losing a single URL, tab or deep link.",
    "Every number on the hub is the same number the employee's own page shows — there is no second calculation to drift.",
  ],
  goodToKnow: [
    "Statuses are derived when the page loads, from the scheduler ledger and each employee's own tables; there is no stored 'employee status' to go stale.",
    "If one employee's tables cannot be read (during a database migration, say), its card says 'Could not read' with dashes for its figures and the other three are unaffected — the page never fails as a whole.",
    "On a touch screen there is no pointer to follow, so the faces look straight ahead; everything else on the card works the same.",
    "Paid Ads Manager counts as an employee even though no ad platform is connected: its campaigns, caps, gates and kill switch are real, and its spend proposals wait for your approval like any other employee's work.",
    "The hub's only write is the Active switch, which decides which employees work for the store. Approving, publishing, sending and launching all happen on the employee's own page, exactly as before.",
    "A job that runs regardless of whether the employee has started (the ads guardrails, for instance) can show a recent run on a Not-started card — the run is real, the employee still has no campaign.",
  ],
  related: ["spotlight", "social", "ads", "report-fte", "system"],
});
