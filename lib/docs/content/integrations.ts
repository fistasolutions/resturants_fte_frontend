import { defineDoc } from "@/lib/docs/define";

export const integrationsDoc = defineDoc({
  slug: "integrations",
  title: "Integrations",
  route: "/integrations",
  area: "platform",
  tagline:
    "Every app your store runs on, in one place: whether each connection is healthy, what needs you, what each app unlocks, one timeline of every sync and change, and what the platform runs for you.",
  sources: [
    "Shopify",
    "Gorgias",
    "Loop Returns",
    "Klaviyo",
    "iPacky",
    "V-Count",
    "Microsoft Clarity",
    "Google Search Console",
    "Meta",
    "QuickBooks Online",
    "AI model providers",
    "Email delivery",
  ],
  refresh: "Health is read on every visit and every 5 seconds while a sync runs; each app syncs on its own schedule",
  updated: "2026-10-12",
  hero: "integrations",
  heroCaption:
    "Integrations: connection health at the top, then every connected app with its status, last sync, its recent syncs and the pages it powers.",
  whatItIs: [
    "Integrations is where the store's other apps are connected, watched and fixed. The top of the page says how many apps are connected and how they are doing; anything that needs you appears right under it, with the reason in plain words and the one button that fixes it.",
    "Below that, four tabs: Connected (every connection with its status, last sync, its last 24 syncs and the pages it powers), Browse apps (every app by area, what each unlocks, and Connect), Activity (one timeline of every sync and every change anyone made) and Included in your plan (the AI, email and sign-in the platform runs for you). Each app also has its own page with an Overview, its Settings, its Sync history and its Permissions.",
  ],
  whyItMatters: [
    {
      title: "A broken connection is seen the day it breaks",
      body: "A sync that failed, a login about to expire, a company that needs signing in again, a sync that has gone quiet: each becomes a Needs you card with the fix, instead of a page that quietly stops filling.",
    },
    {
      title: "A wrong key never becomes a broken connection",
      body: "Connecting an app tries the login before anything is saved. A refused key is reported in plain words and the values stay in the form to fix.",
    },
    {
      title: "Each app says what it unlocks and what it may touch",
      body: "Every app lists the pages it powers, what it reads, and what the platform never does with it: everything is read-only, except the two things you ask for (posting approved posts to Meta, adding chosen customers to a Klaviyo list).",
    },
  ],
  howItWorks: [
    "The page reads one overview from the backend: for every connection, whether it is connected, its status, the reason when it needs you, and its last 24 syncs. The status rules are the backend's, in order: not connected; not set up on this server (Google, Meta or Intuit sign-in missing); needs attention (a company to reconnect, a property to choose, a missing list, a failed last sync, or no successful sync for too long); check soon (a login about to expire); syncing; first sync pending; healthy.",
    "A failure is described for the owner: the login was refused, the app asked us to slow down, the sync ran out of time, a setting is missing. The app's own error text only appears in the technical line of the timeline, never as the message.",
    "Connecting an app with a key has three steps: what you get, the values (with where to find them), then Test and connect. The test makes one read-only call with the values you typed. Only when it works is anything saved, encrypted, and then the first sync starts. Microsoft Clarity is the exception: it allows 10 reads a day, so its first sync is the check.",
    "Google Search Console, Meta and QuickBooks connect by signing in with the provider. Continue sends you to Google, Meta or Intuit, and you come back to that app's own Settings tab, where the result is shown. A sign-in only completes for the person, workspace and store that started it, within 10 minutes; otherwise nothing is connected and the result says why (the link expired, or it was started from another account or workspace) — start it again from the same page.",
    "Klaviyo and Gorgias can also connect with one click when the platform has their app set up: Connect with Klaviyo, or Connect with Gorgias after typing the part before .gorgias.com, sends you to the provider's own Allow screen and brings you back connected, with what the sign-in may do listed in words. Nothing is copied, the sign-in is stored encrypted and renewed automatically, and Disconnect revokes it at the provider. A pasted key still works, under Use a private API key instead or Use an API key instead, and a store that already has one keeps it. Gorgias's App Store opens the same page with your subdomain filled in, so installing from Gorgias goes straight to its Allow screen; pressing Deny on either screen says so and how to connect. If Gorgias stops accepting the sign-in, the card says Gorgias needs reconnecting with a Reconnect with Gorgias button.",
    "Meta's Settings tab has two parts. Posting is the Facebook Page and Instagram connection for Social Media Manager. Ads audit is the same connection as Paid Ads Manager's Audit tab: Connect Meta Ads, tick the ad accounts to read (nothing is read until one is ticked, and the card says so as a Needs you), Sync now, Change ad accounts, Open the audit, Disconnect. Meta's syncs are the ad-account reads, every 3 hours; with posting only, Meta has nothing to sync. When the platform has no Meta app set up yet the buttons are shown disabled with that reason.",
    "Sync now starts the app's own sync straight away (the one its schedule runs) and refuses to start a second while one is running. Shopify, Meta and Klaviyo have no Sync now: Shopify syncs every 15 minutes, Meta posts as they come due, and Klaviyo is used when you send a winback.",
    "Disconnect removes an app's saved login after you type its name; what it already synced stays. Google, Meta and QuickBooks disconnect from their own cards on their Settings tab; on Meta, posting and the Ads audit disconnect separately (the Ads audit also removes what it read from your ad accounts).",
    "Saved keys show as Saved. An owner can Reveal one (read-only, written to the audit log) or Replace it. Every save, reveal, sync request and disconnect is in the Activity tab's Changes.",
  ],
  sections: [
    {
      title: "Health and Needs you",
      route: "/integrations",
      summary:
        "How many apps are connected, a bar of how they are doing, and four tiles (All connected, Healthy, Syncing, Need you) that open the Connected tab filtered to them. Needs you lists each connection with a problem, its reason and its fix.",
      details: [
        "Reconnect and Renew login go to the provider's sign-in. Choose property and Open settings go to the app's Settings tab. Sync now retries a failed sync.",
        "A Shopify store that is disconnected is reconnected from Settings.",
      ],
      screen: "integrations",
    },
    {
      title: "Connected",
      route: "/integrations",
      summary:
        "Every connected app with its status, when it last synced, bars for its last 24 syncs (a failed one is taller and red), and the pages it powers. Filter by status, search, and choose List, Cards or By area.",
      details: [
        "Each row's menu has Sync now, Settings, Sync history and Disconnect.",
        "The store is always first, then what needs you.",
      ],
    },
    {
      title: "Browse apps",
      route: "/integrations?tab=browse",
      summary:
        "Every app by area (Store, Marketing, Support & returns, Operations, Finance, Search & traffic), what each unlocks, and Connect; apps already connected show their status and Manage. Coming soon lists apps that cannot be connected yet.",
      details: [
        "An app whose sign-in is not set up on this server says so instead of offering a button that would fail.",
        "In a new (guided) workspace, Browse apps lists only the apps the workspace uses: Shopify, what is connected, and what a page, tab or employee switched on needs. A line above them points to Settings → Sidebar, where switching on the page that needs another app adds it here and to Setup at the top right.",
        "Connecting any app starts its first sync straight away. Setup at the top right opens by itself and follows it: Syncing with a moving bar, then Synced. If you opened the app from Setup or from a page's connect screen, you are taken back to that page as soon as the sync is done; if the first sync fails, Setup says so and links back here to retry.",
        "Meta is one card with two jobs: posting the posts you approve (Social Media Manager) and reading your ad accounts for the Paid Ads Manager audit, read-only. Each asks Meta for its own permission, so each has its own sign-in on Meta's Settings tab.",
      ],
    },
    {
      title: "Activity",
      route: "/integrations?tab=activity",
      summary:
        "One timeline, newest first and grouped by day: every sync with its result, rows and duration, and every change anyone made (saved settings, revealed keys, sync requests, disconnections) with who made it.",
      details: [
        "Show Everything, Problems or Changes, for all apps or one.",
        "A failed sync opens to its technical detail and, when the app needs you, the fix.",
      ],
    },
    {
      title: "Included in your plan",
      route: "/integrations?tab=included",
      summary:
        "What the platform runs for the store: Glisp and the AI employees (with this month's AI use against the plan's allowance), email delivery, the Shopify app with its read-only permissions, and the Google, Meta and Intuit sign-ins.",
      details: [
        "Use your own AI key opens the AI provider cards: add a key, pick its model, test it, and choose the default for text, images and voice. AI that runs on your own key is billed by your provider and does not count toward the allowance.",
        "Send from your own mail server opens the mail server settings with Test. Without it, emails go out through the platform's mail server under your store's name.",
        "The AI meter is shown to members who can see billing or AI performance.",
      ],
      screen: "integrations-ai-providers",
    },
    {
      title: "An app's own page",
      route: "/integrations/gorgias",
      summary:
        "Overview (last sync, last run, rows, problems in 7 days, a chart of the last syncs, and the pages it powers), Settings, Sync history and Permissions (what it reads, what is never done, who can change it).",
      details: [
        "Settings for a key app: its fields, each saved key with Reveal and Replace, Test connection on what you typed, a save bar when something changed, and Disconnect. Daily sync times are in the store's own time.",
        "Settings for Google Search Console, Meta and QuickBooks Online are their own cards: the account, the property or companies, Sync now and Disconnect. QuickBooks lists each company with when it was last read and its own Disconnect; one that needs signing in again is named, never hidden behind a green badge. With two or more companies, Disconnect all removes every one after you type DISCONNECT. The card also says which currency Finance reports in and the exchange rate behind any other currency.",
        "Microsoft Clarity's page also shows its sync progress and how many of its 10 daily reads are left.",
      ],
    },
  ],
  howToUse: [
    "Open Integrations and read the health strip. If anything is under Needs you, press its button.",
    "To add an app, open Browse apps (or press Connect an app), choose it, and follow the three steps. For Google, Meta and QuickBooks, sign in with the account that owns the property, page or company.",
    "Open an app to see its syncs, change its settings, test its login, or disconnect it.",
    "Use Activity's Problems view to see every failed sync, and Changes to see who changed what.",
  ],
  benefits: [
    "One screen that says what is connected and whether it works.",
    "Logins that are tested before they are saved and never shown without a logged reveal.",
    "Honest coverage: what is connected, what needs you, and what is not available yet.",
  ],
  goodToKnow: [
    "Klaviyo, Gorgias and Loop are approved extensions of the original one-store, Shopify-only scope; each is used for exactly the purpose its page describes.",
    "Google Search Console access must be granted on the property to the Google user who connects it.",
    "A QuickBooks company can be connected to one organization only. If another organization already has it, the connect is refused with that reason and nothing is read; disconnect it there first. Disconnecting a company never cuts off another store that still uses it.",
    "Microsoft Clarity offers no sign-in; its token is made in Clarity by an admin, and the Clarity tag must be on the storefront before any sync returns data.",
    "Integration syncs do nothing while an app is not connected. That is on purpose, and the System page shows them as idle.",
  ],
  related: ["settings", "system", "spotlight", "social", "team-performance"],
});
