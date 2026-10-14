import { defineDoc } from "@/lib/docs/define";

export const settingsDoc = defineDoc({
  slug: "settings",
  title: "Settings",
  route: "/settings",
  area: "platform",
  tagline:
    "Three groups of tabs: your store (connection, daily report, automatic sending, manager emails, watches), your organization (name, team, roles, branding, billing, audit log) and your own account (profile, password, where you're signed in).",
  sources: ["Platform configuration"],
  refresh: "Changes apply immediately; schedules reschedule their jobs live",
  updated: "2026-10-09",
  hero: "settings",
  heroCaption:
    "Settings → Store → General: the Shopify connection and the platform's status, under the Store, Organization and Account groups.",
  whatItIs: [
    "Settings is split into three groups, switched in the first row under the title: Store (what this store does on its own — its Shopify connection, the daily report, automatic sending, who each alert goes to, and your watches), Organization (the company — its name and calendar, the team and their roles, branding, billing and the audit log) and Account (you — your name, what your sidebar shows, your password and the devices you're signed in on). The second row shows the tabs of the group you're in, and every tab has its own address, so a refresh or a shared link lands on the same tab.",
    "You only see the tabs your role allows. An owner sees every tab; an admin everything but changing the plan; a manager the team, their watches and their own account; a social media manager their watches and their own account. Someone who opens a tab that isn't theirs is taken to their first one, and the server refuses the data regardless.",
  ],
  whyItMatters: [
    {
      title: "Alerts reach the right person",
      body: "Per-location manager routing means the Downtown list goes to the Downtown manager and the warehouse email to the warehouse — not to one inbox that forwards.",
    },
    {
      title: "Nobody has to remember to open the app",
      body: "With automatic sending on, the day's overdue, transfer, win-back, dead-inventory and store-traffic alerts go out on schedule — and every send is still logged and scored.",
    },
    {
      title: "Your plan and your people in one place",
      body: "Billing shows the plan, how much of this month's AI you have used (as a percentage, with a \"running low\" note as it fills), an Add AI credit button to buy extra AI for the month when you run low, and every invoice, and opens Stripe's own portal for the card; Team, Roles and the audit log show exactly who can do what, and who changed it.",
    },
  ],
  howItWorks: [
    "Each tab reads through the same client cache as every page: the first visit shows a skeleton shaped like the tab, and a revisit within a minute is instant. Only the tab body changes when you switch; the title and the tab bar stay put.",
    "The report schedule and the auto-send schedule are stored per store and applied to the scheduler in place — the job moves immediately, and the stored time is re-applied at boot. Times are picked from a list in 15-minute steps; a time saved earlier between steps stays exactly as it was.",
    "Manager emails are validated and stored per location and per team; a location without an address shows as Missing here and on every send page rather than being silently skipped.",
    "Billing reads the plan and the AI allowance from the platform and the invoices from Stripe. The card on file, receipts and cancellation open in Stripe's secure portal; a plan change goes through Stripe Checkout and comes back to the Billing tab.",
  ],
  sections: [
    {
      title: "Store → General",
      route: "/settings",
      summary:
        "The Shopify connection — the store's domain, Connected or Disconnected, the last sync and the sync schedule — and the system status (API Operational / Degraded / Down, data sync, version).",
      details: [
        "Reconnecting the store, or adding other systems, is done on Integrations; the panel links there.",
        "Your own name and signing out moved to the Account group.",
      ],
      screen: "settings",
    },
    {
      title: "Store → Daily report",
      route: "/settings/daily-report",
      summary: "The time the daily executive report is written, in the store's timezone, with the next run shown under it.",
      details: ["Until a time is chosen the report runs at the default time in UTC, and the row says so."],
      screen: "settings-daily-report",
    },
    {
      title: "Store → Automatic sending",
      route: "/settings/automatic-sending",
      summary:
        "Three schedules: the Morning Brief's alerts on a time you choose, the Monday report card to every store manager, and the Monday payable card to you — even if nobody opens the dashboard.",
      details: [
        "Automatic Brief sending is off by default; off means you press Send in the Morning Brief yourself. Each panel's footer states whether it is on and when it next runs.",
        "Monday report card: every store manager with an email gets their store's scoreboard for the week that just ended, Mondays 07:00 in the store's timezone. Preview one on Results → Managers.",
        "Monday payable card: what the business owes — past due, this week, this month — read straight from QuickBooks. Nothing is sent when nothing is owed.",
      ],
      screen: "settings-auto-sending",
    },
    {
      title: "Store → Manager notifications",
      route: "/settings/manager-notifications",
      summary:
        "The manager email for each location, and the warehouse manager, support lead and returns lead — each row saves on its own and shows Missing until it is set.",
      details: [
        "Each row validates the address and can be cleared.",
        "A send page that finds no recipient opens this tab with the exact row highlighted and focused; saving it takes you straight back to the message you were sending.",
        "Results → Managers shows who acts on what you send, and lists every store without an address here as 'No email set'.",
      ],
      screen: "settings-manager-notify",
    },
    {
      title: "Store → Watching",
      route: "/settings/watching",
      summary:
        "Every 'tell me when…' rule — what is watched, where the figure stands against the line, who is told, and when it last fired. New watch adds one by hand; Check now runs the check this minute.",
      details: [
        "A watch sits on a figure the platform already computes: return rate (one product or the store, from Loop Returns), revenue, revenue vs the period before, orders, units in stock, days of stock cover, best sellers running out within a week, paid orders waiting over 48 hours, best customers gone quiet, and script errors on a top-20 money page. It adds a line to cross (above or below), a period where the figure takes one, and who is told — the nudge on the Ask Glisp button, an email to you, the returns lead, the warehouse, the support lead or the store managers — never a number.",
        "The rule is checked on every sync (about every 15 minutes on the deployed host) and by Check now. It fires once when the line is crossed and re-arms only when the figure comes back inside, so nothing nags. Status reads Fired (when), Quiet (for how long) or Paused.",
        "Most watches start in chat: 'tell me when returns on Linen Shirt pass 20%' makes the analyst set one and confirm today's reading. Every member can keep their own watches.",
      ],
      screen: "settings-watching",
    },
    {
      title: "Organization → General",
      route: "/settings/organization",
      summary:
        "The organization's name (shown in the app, in emails and on invoices), your team's login link with Copy, the calendar year-on-year comparisons and holiday planning follow (Standard, or the Hebrew calendar), and a link to Billing.",
      details: [
        "Changing the name or the calendar needs permission to manage settings; everyone else sees the same values read-only. A change is recorded in the audit log.",
        "The login link's short name is fixed — it is the address your team already uses.",
        "The owner also sees Your data. Export everything downloads a ZIP of CSV files — every store's data, the members (name, email, role), plan history, the audit log and chats — with a README listing what was left out: passwords, keys and tokens are never exported. Tick “Include images, videos and files” to have every stored image, video and uploaded document in the ZIP too (each spreadsheet cell names its file); left unticked, they appear as their size only.",
        "Delete organization asks you to type the organization's name. From that moment nobody can sign in and every scheduled job stops; the plan is cancelled; after 30 days every store's data, member access and chat is erased for good, while billing history is kept with the name removed. A restore link — shown on screen and emailed to you — brings everything back until then; after restoring, you choose a plan again.",
      ],
    },
    {
      title: "Organization → Team",
      route: "/settings/team",
      summary:
        "The people in your organization — name, email, role, Active or Disabled, when they joined — how many of your plan's seats are used, the invitations still waiting, and Invite.",
      details: [
        "The header shows how many member seats are used of the number your plan includes — for example \"7 of 10 members · 3 seats left\" (the owner never counts). A pending invitation holds a seat. When every seat is in use, Invite is shown disabled with a link to upgrade your plan; a plan with unlimited seats just shows the member count.",
        "Invite takes an email and a role. The invitation lasts a week; when the platform could not send the email it says so, and the invitation still stands. Revoke stops the link working.",
        "Each row's menu offers only what you may do: Change role (to any role whose permissions you hold yourself — never Owner), Disable or Enable, Remove from organization, and — for the owner alone — Make owner, which hands the organization over and makes you an Admin.",
        "The activity log has its own tab now; Team links to it for roles that may see it.",
      ],
    },
    {
      title: "Organization → Roles",
      route: "/settings/roles",
      summary:
        "What each role can see and do: the list of roles with their member counts, and the permission grid for the one selected — one card per area, a checkbox per permission, and a checkbox for the whole area.",
      details: [
        "Built-in roles can be edited and reset to their default; the Owner role is everything, always, and cannot be edited.",
        "A role reaches every page, not only Settings: on any screen, a main action the role does not include (send, publish, approve, export, generate, sync, delete) is shown greyed out, with the reason when you point at it — which permission is missing, and to ask the owner or an admin — and a small action (an edit icon, a menu item) is not shown at all. Nothing that can be read is hidden. The server checks the same permissions on every request.",
        "New role starts empty; Duplicate starts from the selected role. A custom role can be deleted once nobody holds it.",
        "A permission you do not hold yourself is shown but cannot be ticked: you can only grant access you have.",
      ],
    },
    {
      title: "Organization → Branding",
      route: "/settings/branding",
      summary:
        "Your organization's logo in the app — one for light backgrounds, one for dark — its brand colour, and what your login page shows beside the sign-in form: one picture, one video, or a carousel of pictures.",
      details: [
        "Your team's login link sits at the top: the login page with your organization's short name (/login?org=…), with Copy and Open. Your logo, colour and login screen show only when someone opens that link; the plain login page is always the platform's own, so nobody on a shared computer sees which organization signed in last.",
        "Each logo is previewed on the surface it is for. PNG, JPEG or WebP up to 2 MB; with neither logo set, the ftes for Commerce mark stays.",
        "Brand colour: pick one of up to five colours suggested from your logo, or any colour with the picker or as a hex code (#rrggbb). A preview shows it in the light and dark themes before you save. Error, success, warning and chart colours never change.",
        "Login screen: choose Image (one picture up to 10 MB), Video (one MP4 or WebM up to 25 MB, with an optional poster) or Carousel (2 to 6 pictures). Remove returns your login page to the default.",
      ],
    },
    {
      title: "Organization → Billing & plan",
      route: "/settings/billing",
      summary:
        "Your plan — its name, price per store, the revenue band it is for, when it renews and since when you've been a customer — the AI allowance used this month, the videos and images your package includes this month and how many are used, and every invoice with its status and a link to view it.",
      details: [
        "Change plan shows the plans side by side. With payments set up it opens Stripe's secure checkout and brings you back here, where the new plan is confirmed; a cancelled checkout leaves the plan as it was.",
        "Manage in Stripe opens Stripe's customer portal to update the card, download receipts or cancel. It appears when the plan is paid through Stripe.",
        "The AI allowance bar shows what the platform's AI has used of what your plan includes, and when it resets; AI that ran on your own keys is listed separately and never counted. An organization whose AI is included in its agreement sees 'Included' instead.",
        "Videos & images this month shows each against your package: how many are used of how many, any extra the platform granted, and when they reset on the 1st. When the month's videos or images are used, a new one is refused with a message saying so — a video that fails to generate is given back, so it never uses one up. A package with no limit on a kind says 'No limit on your package'.",
        "Only roles that manage billing can change the plan or open the portal; roles that may view billing see the same page read-only.",
      ],
    },
    {
      title: "Organization → Audit log",
      route: "/settings/audit",
      summary:
        "Who changed what, newest first, in plain sentences with the date and time: invitations, role changes, disables and removals, role edits, plan changes and organization settings.",
      details: ["Show older loads the next page. It appears for roles that include seeing the activity log."],
    },
    {
      title: "Account → Profile",
      route: "/settings/profile",
      summary: "Your name as your team sees it — saved to your account and shown across the app — and the email you sign in with.",
      details: ["Only you can change your own name."],
    },
    {
      title: "Account → Sidebar",
      route: "/settings/sidebar",
      summary:
        "Switch off the sidebar pages you don't use, the employees under Digital Employees, and the tabs inside each page. Everything starts on; a page or tab you switch off disappears at once and stays gone until you switch it back on.",
      details: [
        "Each page has its own switch; a page with tabs shows how many it has — open it to switch tabs one by one. The employees sit indented under Digital Employees, each with its own tabs.",
        "Settings and the first tab of every page are always shown: Settings holds these switches, and a page opens on its first tab.",
        "Switching a page off greys its tabs and sub-pages but keeps their switches as you set them, so switching it back on brings everything back as it was.",
        "This only changes your own sidebar, in this browser — everyone else's stays as it is. A hidden page or tab still opens from a link, and while it is open its tab is drawn. Show everything puts it all back.",
        "In a new (guided) workspace the list also carries the company's choices. An owner or admin sees every page the company can use, including the ones that are off, with a line saying why: turned off for everyone, needs an integration, tucked away in a new workspace. Switching one on turns it on for everyone; if it needs an integration, that step joins Setup at the top right of every page (Setup opens by itself to show it) and the app's card appears on Integrations, and the page or tab opens on its connect screen until it is connected. Each tab asks for exactly the app it reads: switching Store Traffic on asks for V-Count for its store tabs and Microsoft Clarity for Website, and every row names its app (\"Needs iPacky\").",
        "When an owner or admin switches something off, a dialog asks: hide it for me only, or turn it off for everyone. Turning it off for everyone can also disconnect what it reads; if another page or employee reads the same system, the dialog names them first. Nothing is deleted either way.",
        "Other members keep their own switches. A page the company turned off shows as \"Off for the company. Ask an owner or admin.\" A page that waits for data no switch can create (Results before a first action, the location tabs before a second store) shows why, without a switch.",
      ],
    },
    {
      title: "Account → Security",
      route: "/settings/security",
      summary:
        "Change your password, see every device you're signed in on — which browser and system, when it was last active, with this device marked — sign any other one out, or sign out everywhere else at once, and sign out of this device.",
      details: [
        "Changing your password keeps you signed in here and signs every other device out. If you signed up with Google or Shopify you can set a password by leaving the current one empty.",
      ],
    },
  ],
  howToUse: [
    "Open Store → Manager notifications first and set an email for every location, the warehouse, support and returns — every send page depends on it.",
    "Set the daily report time under Store → Daily report; the next run is shown under it.",
    "Once you trust the Morning Brief's lists, switch on Store → Automatic sending and choose a send time.",
    "Invite your team under Organization → Team and give each person the role that matches their job; check Organization → Audit log for who changed access.",
    "Check Organization → Billing & plan for the next payment, the AI allowance and your invoices.",
    "Under Account → Sidebar, switch off the pages and tabs you never open so your sidebar shows only your work.",
    "Under Account → Security, sign out any device you don't recognise.",
  ],
  benefits: [
    "Every alert lands with the person who can act on it.",
    "A platform that runs its morning without anyone logging in.",
    "Each person sees only the settings their role allows.",
  ],
  goodToKnow: [
    "Credentials for integrations are entered on the Integrations page, not here.",
    "Automatic sending is off by default; enabling it registers a scheduled job that appears on the System page.",
    "Only the owner can export the organization's data or delete it. Two-step sign-in is not part of Settings yet.",
  ],
  related: ["integrations", "brief", "reports", "system"],
});
