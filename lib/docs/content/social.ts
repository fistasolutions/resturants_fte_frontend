import { defineDoc } from "@/lib/docs/define";

export const socialDoc = defineDoc({
  slug: "social",
  title: "Social Media Manager",
  route: "/social",
  area: "growth",
  tagline: "The organic social manager — it turns the catalog into posts, reels and carousels in the brand voice, plans the week, routes everything through you, publishes to Meta, and measures what it earned.",
  sources: ["Shopify", "Meta (Instagram / Facebook)", "AI model providers"],
  refresh: "Weekly plan drafted Mondays 03:15 UTC; publishing every 15 minutes; Meta insights nightly",
  updated: "2026-10-06",
  hero: "social",
  heroCaption:
    "Social Media Manager's Overview: the Plan → Create → Approve → Publish → Measure pipeline, posts created and awaiting approval, the data-picked 'what to post next', and recent activity.",
  whatItIs: [
    "Social Media Manager is a digital social-media manager for the store's own channels. It reads the catalog and the sales data to decide what deserves a post — best-seller momentum, a new drop, dead stock to clear — then generates the creative (an editorial image, a 16-second reel, a spoken UGC-style video, or a multi-slide carousel) and a caption with hashtags per platform, in the brand voice defined in the Brand Brain.",
    "Every post waits for a human. You can approve and schedule it, refine the caption or art direction, swap in your own photo, download the assets and post by hand, or mark it as posted. With Meta connected, approved posts publish on schedule and their reach and engagement flow back in.",
  ],
  whyItMatters: [
    {
      title: "Posts grounded in what is actually selling",
      body: "The pick comes from live Shopify signals — momentum, margin, stock — with the reason stated on the card, so the feed sells the right products at the right moment.",
    },
    {
      title: "Creative without a studio",
      body: "Product photos become editorial images, reels, UGC-style videos and carousels, each in the channel's native format, with versions you can compare and delete.",
    },
    {
      title: "Always through you",
      body: "Nothing publishes without approval. Manual-first mode lets you download and post yourself while the automation stays out of the way.",
    },
    {
      title: "A week planned, not a day improvised",
      body: "The weekly planner drafts the slate on Monday from occasions, launches and sales signals; you adjust the board and add slots to empty days.",
    },
  ],
  howItWorks: [
    "The Content Studio groups the catalog into commerce-signal categories (best-sellers, new drops, clear-stock, seasonal occasions) with full-catalog search; picking a product starts a per-platform generation.",
    "Text agents write the caption and hashtags per platform from the Brand Brain's voice, guardrails and personas; captions are editable and can be refined with a note.",
    "Media agents produce the creative: an art director for images, a video director for 16-second reels animated from the post's still, a UGC director for a written persona speaking to camera, and a carousel director for multi-slide stories. Progress toasts track each job; versions sit in a rail beside the preview.",
    "The weekly planner agent runs every Monday and fills the calendar from the occasions engine (multi-market holidays and seasons), launches and sales momentum; it auto-schedules in automatic mode and only proposes in manual-first mode.",
    "Approvals: Approve & schedule picks the publish moment; with Meta connected the publish job posts it at that time through a signed, expiring public image link; Mark as posted records a manual post instead.",
    "Meta insights sync nightly into Performance — reach, engagement and per-post results — with 'not reported' kept distinct from zero.",
  ],
  sections: [
    {
      title: "Overview",
      route: "/social?tab=overview",
      summary:
        "The pipeline and its progress, post counts by state, the data-picked next post with its reason and platform, and the activity feed.",
      details: [
        "'Manager on duty' status line summarises where the week stands.",
        "'What to post next' opens the product directly in the Content Studio.",
      ],
      screen: "social",
    },
    {
      title: "Content Studio",
      route: "/social?tab=content-studio",
      summary:
        "The creation screen: a category rail and product browser on the left, the per-platform post with its creative, caption and versions on the right, and the weekly plan board.",
      details: [
        "Categories are commerce signals — best-seller momentum, new drops, clear dead stock, occasions — plus full-catalog search.",
        "Generate an image, a reel, a UGC video or a carousel; each runs in the background with its own progress toast, and two jobs can run at once.",
        "Captions are editable per platform; Refine sends a note to the writer. Download, copy caption and upload-your-own-photo are one click.",
        "The version rail keeps every generated creative; unwanted versions can be deleted.",
      ],
      screen: "social-studio",
    },
    {
      title: "Calendar",
      route: "/social?tab=calendar",
      summary:
        "The week and month view of planned, scheduled and published posts, with the weekly plan history and '+ Add post' on empty days.",
      details: [
        "Drag-free, click-driven: pick a slot, choose the product and platform, schedule.",
        "Weekly plans are kept, so last week's slate is reviewable beside this week's.",
      ],
      screen: "social-calendar",
    },
    {
      title: "Approvals",
      route: "/social?tab=approvals",
      summary:
        "Every post awaiting a decision, with inline Approve & schedule, refine, reject, and — in manual-first mode — Mark as posted.",
      details: [
        "Approving sets the publish moment; the post shows its external post id once live, or its publish error if Meta rejected it.",
        "Posts approved without a connected channel stay 'ready to post by hand'.",
      ],
      screen: "social-approvals",
    },
    {
      title: "Performance",
      route: "/social?tab=performance",
      summary:
        "Reach, engagement and top posts from Meta insights, and the attributed revenue from tracked links.",
      details: [
        "Metrics Meta did not report render as 'not reported', never as zero.",
        "Each post links to its live permalink and to its detail page.",
      ],
      screen: "social-performance",
    },
  ],
  howToUse: [
    "Connect Meta under Integrations if you want automatic publishing; otherwise work in manual-first mode and post by hand.",
    "Open Content Studio, pick a category (or search the catalog) and choose a product. Review the suggested angle and reason.",
    "Generate the creative you want — image, reel, UGC video or carousel — and let the toast report progress while you keep working.",
    "Edit or refine the caption per platform. Compare versions in the rail; delete the ones you do not want.",
    "Go to Approvals. Approve & schedule the post (or Mark as posted after posting it yourself).",
    "Use the Calendar to see the week, add posts to empty days, and review the Monday plan the planner drafted.",
    "Read Performance after a few days to see reach, engagement and attributed revenue per post.",
  ],
  benefits: [
    "A consistent posting cadence driven by sales signals, not by whoever remembers to post.",
    "Native creative per channel from the photos you already have.",
    "Approval and a full history of every post, version and publish attempt.",
    "Measured reach and revenue, so the channel is accountable like every other page.",
  ],
  goodToKnow: [
    "Publishing to Meta is one of the platform's deliberate outbound actions: it only happens for posts you approved, at the time you scheduled, and every attempt is logged with its result.",
    "Video generation is the most expensive AI unit the platform buys and is gated by the budget guard on AI Performance; images and text are metered too.",
    "The public image link Meta fetches is signed, expires, and is scoped to one post — it is the only route in the product outside the authenticated API.",
    "Meta's token is refreshed nightly at 02:30 UTC; a failed refresh shows on the Integrations card and on the System page.",
  ],
  related: ["employees", "spotlight", "ads", "integrations", "ai"],
});
