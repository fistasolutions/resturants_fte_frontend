import { defineDoc } from "@/lib/docs/define";

export const systemDoc = defineDoc({
  slug: "system",
  title: "System",
  route: "/system",
  area: "platform",
  tagline: "Did the platform actually run? Every scheduled job, its health judged against its own cadence, when it last succeeded, what it produced, and its full run history.",
  sources: ["Scheduler run ledger"],
  refresh: "Live — a run is visible while it is still running",
  updated: "2026-10-09",
  hero: "system",
  heroCaption:
    "The System page: headline counts (jobs watched, failing, stale, runs in 24h), then a card per scheduled job grouped by purpose and sorted worst first, each with health, cadence, last success and last output.",
  whatItIs: [
    "System is the page for the question every other page assumes: did last night's work happen? The platform runs more than twenty scheduled jobs — the Shopify sync, the integration syncs, the daily report, the Morning Brief, the forecasts, publishing, tax reports, housekeeping — and each execution is recorded with its status, timing, output and error.",
    "Health is judged per job against its own cadence: a 15-minute sync and a daily report cannot share a staleness threshold. A job that has never run is as loud as a failing one, because a job that never ran cannot fail and would otherwise look healthy; an integration that is off until configured is muted, because a permanent false alarm teaches people to ignore every alarm.",
  ],
  whyItMatters: [
    {
      title: "Silent failures are not silent",
      body: "Most jobs swallow their own errors so a bad run cannot kill the scheduler — which made a permanently broken job look identical to a healthy one. The run ledger ends that.",
    },
    {
      title: "Problems above the fold",
      body: "Cards are sorted worst first by the backend; a page whose problems are below the fold is a page nobody reads.",
    },
    {
      title: "The legally consequential jobs included",
      body: "The tax-report job, the Meta token refresh, the Clarity sync and the inventory reconciliation are on the page with everything else — not just the jobs that happen to log.",
    },
  ],
  howItWorks: [
    "Every job registration passes through a recorder that writes a run row when the job starts and finalises it when the job ends — status (success, error, skipped, running), start, finish, duration, what it produced, the error message, and the AI trace id where the job ran an agent.",
    "The recorder wraps at registration, not inside job bodies, so a new job cannot be added without a run record; a test builds the real scheduler and fails if one slips past.",
    "'Skipped' is its own state because the heavy-job gate skips on purpose; folding it into success would hide a starved job and folding it into error would cry wolf every fifteen minutes.",
    "The page reads the ledger: health per job from its last runs against its cadence, grouped by purpose (Data, Platform, Reporting, Foresight, Growth, Money, Housekeeping).",
    "One job serves new stores only: First sync, in the Platform group. When a store connects Shopify it pulls the last 30 days of orders, customers and discounts and the whole catalogue, then runs once each job that Shopify's data alone can fill, so the store's pages have figures on its first day. Each other integration runs its own first sync the moment it is connected. First sync checks every 5 minutes for a store waiting to start, and a store that already finished is never started again.",
    "The recorder never breaks the job it records and commits on its own session, so a running row is visible while the job is still in flight.",
  ],
  sections: [
    {
      title: "Job grid",
      route: "/system",
      summary: "Headline counts, then one card per job: title, purpose, cadence, health, last success and what the last run produced — grouped by purpose, worst first.",
      details: [
        "Health states: failing, never run, stale, running, ok, idle.",
        "Linked from the Morning Brief's integration-health panel.",
      ],
      screen: "system",
    },
    {
      title: "One job's run history",
      route: "/system/[jobId]",
      summary: "The job's own header, then its runs — status, started, duration, output, error — with status and window filters and server-side pagination; a row expands to the full error message.",
      details: ["A run that ran an agent links to its AI trace."],
      screen: "system-job-runs",
    },
    {
      title: "All runs",
      route: "/system/runs",
      summary: "The same table across every job — for 'what failed last night' rather than 'how is this one job' — filterable by job, status and window.",
      details: [],
      screen: "system-all-runs",
    },
    {
      title: "Dark theme",
      route: "/system",
      summary: "The same page in dark mode — every health tone is a semantic token, so the page reads identically in both themes.",
      details: [],
      screen: "system-dark",
    },
  ],
  howToUse: [
    "Open System after any night that looks wrong — a stale dashboard, a missing report, an empty brief.",
    "Read the headline counts; any failing, never-run or stale card is at the top of its group.",
    "Click the card to see its runs and the error message of the failed one.",
    "Use All runs with the status filter set to error for 'everything that failed last night'.",
    "Follow the trace link on an agent-running job to see what the AI did step by step.",
  ],
  benefits: [
    "A definitive answer to 'did it run' for every scheduled piece of the platform.",
    "Failures with their message, not a generic health light.",
    "Confidence that a quiet night was actually a good night.",
  ],
  goodToKnow: [
    "There is no re-run button by design: triggering a job is a mutation with real consequences (publishing posts to Meta, sending emails).",
    "A stack trace is never shown; only the error message, and only to signed-in users.",
    "'Idle' means off until configured — ads and social are idle until their credentials and settings exist.",
  ],
  related: ["ai", "brief", "integrations", "settings"],
});
