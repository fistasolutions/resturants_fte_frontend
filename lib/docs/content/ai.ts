import { defineDoc } from "@/lib/docs/define";

export const aiDoc = defineDoc({
  slug: "ai",
  title: "AI Performance",
  route: "/ai",
  area: "platform",
  tagline: "What the AI agents did, how reliably, how fast, and what it cost — every surface metered from the agents' own traces, with a budget guard you control.",
  sources: ["AI traces and spend ledger"],
  refresh: "Live — every agent run is recorded as it happens",
  updated: "2026-10-06",
  hero: "ai",
  heroCaption:
    "AI Performance: the four headline KPIs, every AI surface with runs, effort, typical speed, cost and verdict, what the agents reached for, runs worth a second look, and the budget guard.",
  whatItIs: [
    "AI Performance answers 'what did my AI employees do, and were they worth it?'. Every agent run in the platform — the daily report writer, the Morning Brief narrator, chat, Search Visibility's researchers and writers, Social's captions and creative, the forecasting analysts, page commentary — is captured as a trace: its steps, model turns, tool calls, duration and cost. The page turns those into per-surface KPIs and verdicts.",
    "Every figure is measured, none estimated. Cost per run, median (never mean) duration, failure rate and tool usage come from the trace records; where value cannot be attributed the page says so rather than inventing a number. The budget guard sets a monthly ceiling per surface or for the whole platform and is enforced before expensive runs start.",
  ],
  whyItMatters: [
    {
      title: "Reliability before cost",
      body: "Verdicts name the action in priority order — failing, slow, earning, cost per run — because a failing surface needs attention before anyone cares what it cost.",
    },
    {
      title: "Spend that cannot run away",
      body: "Ceilings are checked before an image, video or article is generated, not after the provider has billed it. Chat is never capped — someone is waiting on the answer.",
    },
    {
      title: "Anomalies explained, and traceable",
      body: "Runs unusual for their own surface are listed with the reason and link to a step-by-step trace, so a 90-second article never hides behind an average.",
    },
    {
      title: "Honest about the past",
      body: "Calls made before metering began are disclosed as unrecorded — a gap in measurement, never evidence they were free.",
    },
  ],
  howItWorks: [
    "The agent SDK's tracing hook records every run as a trace with its spans — agent turns, model generations with their token usage, tool calls — attributed to a surface derived from the agent's own name.",
    "Text spend is read from the generation spans; images and video open a span of their own at the vendor boundary, so nothing is double counted and no call site can forget to record.",
    "The page aggregates traces per surface for the chosen period: runs, model turns and tool calls per run, failure rate, median and p95 duration, cost per run and total, plus a verdict.",
    "Anomalies are runs unusual for their own surface — slower than the surface's median by a wide margin and above an absolute floor, or failed — each with a reason.",
    "The budget guard stores ceilings per surface or platform-wide; the check runs before images, video and Search Visibility articles, and a failed check allows the run so a database blip never stops the product.",
    "Trace detail older than 45 days is pruned nightly; the spend ledger is never pruned — it is the financial record.",
  ],
  sections: [
    {
      title: "How the agents performed",
      route: "/ai",
      summary: "Work done (runs, active surfaces, model turns), reliability (failure rate), typical speed (median across surfaces) and cost per run, for the selected period.",
      details: ["Periods: all time, last 90 days, last 30 days, this month."],
      screen: "ai-kpis",
    },
    {
      title: "Every AI surface",
      route: "/ai",
      summary: "One row per surface — Analysis, Content, Social, Communication, Forecasting, Operations — with runs, effort per run, typical duration, cost per run and total, value status and verdict; filter chips show counts.",
      details: [
        "Value is claimed only where it is genuinely traceable; otherwise the row says why not.",
        "A per-run cost below a cent renders with four decimals so it never reads as free.",
      ],
      screen: "ai-surfaces",
    },
    {
      title: "What the agents did",
      route: "/ai",
      summary: "The tools the agents reached for most, with call counts and typical duration, and the runs worth a second look — anomalies unusual for their own surface.",
      details: ["Each anomaly links to its trace at /ai/traces/[id]."],
      screen: "ai-anomalies",
    },
    {
      title: "Trace detail",
      route: "/ai/traces/[traceId]",
      summary: "Every step of one run in order, indented by parent span, so a critic loop or a multi-section article reads as a shape rather than a flat list.",
      details: ["Linked from anomalies here and from job runs on the System page."],
    },
    {
      title: "Budget guard",
      route: "/ai",
      summary: "Spending ceilings per surface or for the whole platform, per calendar month: create, edit the amount, pause or resume, delete.",
      details: [
        "Not optimistic: a ceiling that looks saved and is not is the exact failure the feature exists to prevent.",
        "A reached ceiling pauses images, video and article writing — never chat, never approvals.",
      ],
      screen: "ai-budget-guard",
    },
  ],
  howToUse: [
    "Open AI Performance. Read the four KPIs, then sort the surface table by verdict — failing or slow surfaces come first.",
    "Filter surfaces by category chip to focus on Content, Social or Forecasting.",
    "Open a 'run worth a second look' to see its trace step by step.",
    "Set a platform-wide monthly ceiling in the Budget guard, and per-surface ceilings for the expensive ones (video, images, articles).",
    "Pause a ceiling to stop that surface immediately; resume when ready.",
  ],
  benefits: [
    "A measured answer to whether the AI is reliable, fast and worth its cost.",
    "Spend bounded before it happens.",
    "Every run explainable down to its steps.",
  ],
  goodToKnow: [
    "Surfaces are derived from agent names; a new agent appears automatically under a slugified name until it is registered with a friendly label.",
    "Tokens show as zero on a box without provider keys — the wiring is proven, the tokens await the provider.",
    "Results answers a different question — did the messages we sent work — and lives on its own page.",
  ],
  related: ["system", "results", "chat", "spotlight", "social"],
});
