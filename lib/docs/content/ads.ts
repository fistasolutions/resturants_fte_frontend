import { defineDoc } from "@/lib/docs/define";

export const adsDoc = defineDoc({
  slug: "ads",
  title: "Paid Ads Manager",
  route: "/ads",
  area: "growth",
  tagline: "The AI media buyer's control room — profit-aware campaign proposals grounded in Shopify data, with human-gated spend, a monthly cap, a real kill switch and an audit ledger.",
  sources: ["Shopify"],
  refresh: "Proposals every morning at 05:30 UTC; guardrails every 15 minutes",
  updated: "2026-10-09",
  hero: "ads",
  heroCaption:
    "Paid Ads Manager overview: the budget strip with the monthly cap and kill switch, campaign KPIs, and the source-behaviour card explaining how spend decisions are made.",
  whatItIs: [
    "Paid Ads Manager is where paid campaigns are proposed, approved and kept accountable. The proposer looks at the store's own data — margin, stock, momentum — and drafts campaigns with a profit case. Nothing spends on its own: every launch and every budget raise is a gate you approve or reject, a monthly cap bounds the whole store, and a kill switch stops everything.",
    "It is a money-safety engine first. The backend that runs it contains no ad-platform client at all — Meta Ads and Google Ads remain on the roadmap — so today the page manages proposals, budgets, gates and the ledger, and cannot move real spend until a platform is connected with explicit sign-off.",
  ],
  whyItMatters: [
    {
      title: "Spend proposals with a profit case",
      body: "Campaigns are proposed from margin and stock, not from a click target — a product that only sells at a loss does not get an ad.",
    },
    {
      title: "Every dollar has an approver",
      body: "Launches and raises are gates. A gate not approved is a gate not spent, and the ledger shows who decided what and when.",
    },
    {
      title: "Hard limits that actually bind",
      body: "The monthly cap is checked on every approval and the kill switch is a backend state that survives a reload — not a toggle that forgets.",
    },
    {
      title: "Your real Meta ads, audited",
      body: "Connect your Meta ad account read-only and the Audit tab reads every campaign, ad set and ad with 90 days of results, then lists what is wasting money and what to do about each — it never changes or spends on an ad.",
    },
  ],
  howItWorks: [
    "You create a campaign as a draft — name, daily and total caps — from the Campaigns tab.",
    "Each morning the proposer job reviews drafts and live campaigns against margin, stock cover and momentum and raises spend requests as gates.",
    "Spend Gates lists every request with its reasoning; Approve or Reject records the decision. Approvals are checked against the store's monthly cap first.",
    "The guardrails job runs every 15 minutes: it enforces the cap and the kill switch, and pauses anything that would exceed them.",
    "Accountability keeps the ledger: every proposal, decision, cap change and kill-switch event with its actor and time.",
    "Separately, the Audit tab reads your real Meta ad account read-only and audits it; nothing there moves money.",
  ],
  sections: [
    {
      title: "Audit",
      route: "/ads?tab=audit",
      summary:
        "Your real Meta ad account, read-only: the figures, the findings with the spend at risk, and the campaign and ad tables.",
      details: [
        "Connect Meta Ads (here, or under Ads audit on Meta's card in Integrations — the same connection) opens Meta's consent for read access (ads_read) only — never permission to change ads. When the platform has no Meta app set up yet the button is shown disabled with that reason. You come back where you started, tick the ad accounts to audit, and only those are read: 90 days on the first read, then the last 7 days every 3 hours, as Meta restates recent days. Sync now reads at once; Disconnect removes the sign-in and everything read.",
        "The strip shows spend, purchases and revenue as Meta reports them, ROAS, cost per purchase, CTR, CPM, CPC, frequency and the video hook rate — and MER: your store's own net sales divided by ad spend, the blended number Meta's attribution cannot inflate. MER is shown only when the ad account and the store use the same currency.",
        "The findings come from fixed rules, highest severity and money first: spending with no purchases, returning less than it costs, cost per purchase well above the account, creative fatigue (frequency of 3 or more with click-through down a quarter week on week), click-through well below the account, a weak video hook, ad sets Meta reports as learning limited, and an account that tracks no purchases at all. Each says why it fired, the money involved and one thing to do. Spend at risk counts each ad once.",
        "Until Meta approves the app for ads_read, only ad accounts whose people have a role on the app can connect; the page says so when Meta refuses.",
      ],
    },
    {
      title: "Overview",
      route: "/ads?tab=overview",
      summary:
        "The budget strip (spend this month against the cap, kill switch), campaign KPIs and the source-behaviour card that explains the buyer's rules.",
      details: [
        "The strip prompts you to set a monthly cap when none exists — until then no ceiling binds.",
        "The kill switch is read from the backend; flipping it calls the backend and reports a failure without lying about the state.",
        "Between the click and the order (shown once Microsoft Clarity is connected): per traffic channel, Clarity's sessions and scroll beside the orders and revenue your own data attributes to that channel, with a verdict. Facebook and Instagram count as one channel, Meta; Klaviyo and mail apps count as Email; the names merged into a channel are listed under it. Your own website and direct visits are left out — they are not campaigns.",
      ],
      screen: "ads",
    },
    {
      title: "Campaigns",
      route: "/ads?tab=campaigns",
      summary: "Every campaign with its status, caps and spend; New campaign creates a draft.",
      details: [
        "A draft only goes live through an approved gate.",
        "Validation is strict: name required, caps non-negative, daily cap never above the total.",
      ],
      screen: "ads-campaigns",
    },
    {
      title: "New campaign",
      route: "/ads?tab=campaigns",
      summary: "The create dialog — name, daily cap, total cap — which saves a draft.",
      details: ["The copy states that a draft spends nothing until a gate is approved."],
      screen: "ads-new-campaign",
    },
    {
      title: "Creative",
      route: "/ads?tab=creative",
      summary: "Ad creative previews per campaign, in feed and story formats, built from product imagery.",
      details: ["Creative shares the image pipeline with Social Media Manager."],
      screen: "ads-creative",
    },
    {
      title: "Spend Gates",
      route: "/ads?tab=spend-gates",
      summary: "The approval queue: each proposed launch or raise with its reasoning, the amount, and Approve / Reject.",
      details: [
        "An approval that would breach the monthly cap is refused with the reason.",
        "Decisions are permanent and written to the ledger.",
      ],
      screen: "ads-spend-gates",
    },
    {
      title: "Monthly cap",
      route: "/ads",
      summary: "The inline control on the budget strip that sets the store-wide monthly ceiling every approval is checked against.",
      details: ["Setting it is itself a ledger event."],
      screen: "ads-monthly-cap",
    },
    {
      title: "Accountability",
      route: "/ads?tab=accountability",
      summary: "The audit ledger — every proposal, decision, cap change and kill-switch event, with actor and timestamp.",
      details: ["Filterable by event type; nothing on it can be edited or deleted."],
      screen: "ads-accountability",
    },
  ],
  howToUse: [
    "Set the monthly cap first, on the budget strip. Nothing should be approved against an unset ceiling.",
    "Create a campaign as a draft from the Campaigns tab with its daily and total caps.",
    "Wait for the morning proposer, or check Spend Gates for requests it has raised.",
    "Read each gate's reasoning and Approve or Reject it. Approvals are checked against the cap.",
    "If anything looks wrong, hit the kill switch on the strip — every campaign pauses and stays paused until each is approved again.",
    "Review Accountability to see the full decision history.",
  ],
  benefits: [
    "A paid channel that cannot spend without a human decision.",
    "Proposals tied to profit and stock, not to impressions.",
    "One ceiling for the store, enforced every 15 minutes.",
    "A complete audit trail for every dollar proposed or approved.",
  ],
  goodToKnow: [
    "No ad platform is connected in this version by design — Meta Ads and Google Ads are on the roadmap and require explicit owner sign-off before the backend may talk to them. A test in the backend fails if a platform client appears without it.",
    "Resuming after the kill switch does not relaunch anything: campaigns stay paused and each needs a fresh approval.",
    "The proposer and guardrails are scheduler jobs; their runs appear on the System page.",
  ],
  related: ["employees", "social", "spotlight", "system", "results"],
});
