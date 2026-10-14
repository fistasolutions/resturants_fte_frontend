/**
 * Phase-1 mock fixtures for Social Growth (SPEC-110; root CLAUDE.md Rule 6
 * exception). Realistic Example Store content — an occasion-wear apparel
 * brand. Replaced by the real catalog / creative-generation / platform-insights
 * APIs in a later backend phase; components never import this file directly,
 * they go through `services/social.ts`.
 */
import type {
  ApprovalsData,
  CalendarData,
  ContentStudioData,
  OverviewData,
  PerformanceData,
} from "@/types/social";

export const mockOverview: OverviewData = {
  pipeline: [
    {
      id: "plan",
      name: "Plan",
      description:
        "Pick what to feature from live Shopify signals — best-sellers, new drops, dead stock to clear.",
      progress: 100,
      status: "complete",
    },
    {
      id: "create",
      name: "Create",
      description:
        "Template each product photo into feed, story, and square creative with a brand-voice caption.",
      progress: 68,
      status: "in_progress",
    },
    {
      id: "approve",
      name: "Approve",
      description: "Route every post through a human before anything goes live.",
      progress: 40,
      status: "in_progress",
    },
    {
      id: "publish",
      name: "Publish",
      description: "Schedule approved posts to each channel at its best time.",
      progress: 22,
      status: "in_progress",
    },
    {
      id: "measure",
      name: "Measure",
      description:
        "Attribute reach, engagement, and sales back to each post once channels are connected.",
      progress: 0,
      status: "not_started",
    },
  ],
  kpis: [
    { id: "followers", label: "Followers", value: "48.6K", delta: 4.2, hint: "Across 4 channels" },
    { id: "reach", label: "Reach · 28d", value: "312K", delta: 18.9, hint: "Accounts reached" },
    { id: "engagement", label: "Engagement rate", value: "4.8%", delta: 0.6, hint: "Likes + saves + comments" },
    { id: "scheduled", label: "Posts scheduled", value: "14", delta: 27.3, hint: "Next 7 days" },
    { id: "revenue", label: "Attributed revenue", value: "$9.4K", delta: 22.5, hint: "Trailing 28 days (estimated)" },
  ],
  nextPost: {
    productName: "LegallyRed Wrap Dress",
    reason: "best_seller",
    reasonDetail: "Up 38% in units this week and low on sizes — ride the momentum before it sells through.",
    channel: "instagram",
    persona: "The Statement Dresser",
    href: "/social?tab=content-studio",
  },
  activity: [
    {
      id: "a1",
      kind: "plan",
      title: "Picked LegallyRed Wrap Dress to feature next",
      detail: "Best-seller momentum · +38% units this week",
      timestamp: "2026-08-11T08:30:00Z",
    },
    {
      id: "a2",
      kind: "create",
      title: "Generated 3 creatives for “Coastline Midi”",
      detail: "Feed 4:5, Story 9:16, Square 1:1 · The Event Planner",
      timestamp: "2026-08-11T07:15:00Z",
    },
    {
      id: "a3",
      kind: "approval",
      title: "Awaiting your approval: LegallyRed Wrap Dress reel",
      detail: "Instagram · story 9:16 · est. reach 18.4K",
      timestamp: "2026-08-10T17:05:00Z",
    },
    {
      id: "a4",
      kind: "publish",
      title: "Scheduled “Gilded Hour Gown” to TikTok",
      detail: "Fri 6:00 PM · square 1:1",
      timestamp: "2026-08-10T15:40:00Z",
    },
    {
      id: "a5",
      kind: "measure",
      title: "Connect Instagram to measure real reach",
      detail: "Attribution is estimated until a channel is linked",
      timestamp: "2026-08-09T06:00:00Z",
    },
  ],
};

export const mockContentStudio: ContentStudioData = {
  products: [
    {
      id: "p-legallyred",
      name: "LegallyRed Wrap Dress",
      category: "Midi dresses",
      priceLabel: "$168",
      imageUrl: null,
      reason: "best_seller",
      reasonDetail:
        "#1 seller this week, up 38% in units — and sizes S/M are running low. Feature it while demand is hot.",
      suggested: true,
      postId: null,
      hasImage: false,
      imageConcept: null,
      creative: {
        persona: "The Statement Dresser",
        pillar: "Fit confidence",
        frames: [
          { format: "feed", headline: "The dress that does the talking" },
          { format: "story", headline: "Selling fast — S & M low" },
          { format: "square", headline: "Wrap. Cinch. Own the room." },
        ],
        captionVariants: [
          {
            id: "c1",
            angle: "Confident",
            body: "Some dresses whisper. This one walks in first. The LegallyRed Wrap is cut to cinch exactly where you want it and skim everywhere you don't — no safety pins, no second-guessing. Sizes S and M are going fast. You know what to do.",
          },
          {
            id: "c2",
            angle: "Playful",
            body: "Objection: you don't own this yet. Overruled. The LegallyRed Wrap is our most-loved dress for a reason — that true-wrap fit that actually stays put through dinner, dancing, and the group photo everyone reposts.",
          },
          {
            id: "c3",
            angle: "Editorial",
            body: "A study in red. The wrap silhouette, reimagined with a weighted tie that holds its shape from first pour to last dance. Made for the woman who'd rather be remembered than comfortable — and somehow manages both.",
          },
        ],
        hashtags: ["#ExampleStore", "#WrapDress", "#OccasionWear", "#RedDress", "#EventStyle"],
      },
    },
    {
      id: "p-coastline",
      name: "Coastline Midi",
      category: "Midi dresses",
      priceLabel: "$148",
      imageUrl: null,
      reason: "new_drop",
      reasonDetail:
        "Landed 3 days ago in the late-summer edit — introduce it while it's fresh and fully stocked in every size.",
      suggested: false,
      postId: null,
      hasImage: false,
      imageConcept: null,
      creative: {
        persona: "The Event Planner",
        pillar: "Occasion styling",
        frames: [
          { format: "feed", headline: "New in: Coastline Midi" },
          { format: "story", headline: "Just dropped" },
          { format: "square", headline: "Garden-party approved" },
        ],
        captionVariants: [
          {
            id: "c1",
            angle: "Welcoming",
            body: "New arrival, meet your next three weekends. The Coastline Midi is the garden-ceremony, rooftop-shower, brunch-that-turns-into-dinner dress — breathable, block-heel friendly, and packs without a wrinkle. In stock in every size, for now.",
          },
          {
            id: "c2",
            angle: "Practical-chic",
            body: "The math on the Coastline Midi: one dress, four events, zero “I have nothing to wear” texts. Fresh off the truck and ready for your calendar.",
          },
        ],
        hashtags: ["#ExampleStore", "#NewArrival", "#MidiDress", "#WeddingGuest", "#SummerToFall"],
      },
    },
    {
      id: "p-gilded",
      name: "Gilded Hour Gown",
      category: "Evening gowns",
      priceLabel: "$248",
      imageUrl: null,
      reason: "best_seller",
      reasonDetail:
        "Consistent top-3 gown for gala season with a 4.9-star fit rating — a reliable performer to keep in rotation.",
      suggested: false,
      postId: null,
      hasImage: false,
      imageConcept: null,
      creative: {
        persona: "The Statement Dresser",
        pillar: "Black-tie confidence",
        frames: [
          { format: "feed", headline: "Golden hour, all night" },
          { format: "story", headline: "Gala-ready" },
          { format: "square", headline: "Floor-length, photo-ready" },
        ],
        captionVariants: [
          {
            id: "c1",
            angle: "Confident",
            body: "Black-tie doesn't have to mean borrowed. The Gilded Hour Gown drapes like liquid, photographs like a dream, and has a 4.9-star fit rating from women who don't hand those out easily. Save it — gala season is closer than you think.",
          },
          {
            id: "c2",
            angle: "Editorial",
            body: "A gown for the moment the lights dim and the room turns. Bias-cut, floor-grazing, and quietly certain of itself. This is the one you keep, not the one you rent.",
          },
        ],
        hashtags: ["#ExampleStore", "#BlackTie", "#EveningGown", "#GalaSeason", "#OccasionWear"],
      },
    },
    {
      id: "p-marigold",
      name: "Marigold Slip Dress",
      category: "Slip dresses",
      priceLabel: "$118",
      imageUrl: null,
      reason: "dead_stock",
      reasonDetail:
        "62 units sitting 90+ days across sizes — a styled post can clear inventory without a markdown.",
      suggested: false,
      postId: null,
      hasImage: false,
      imageConcept: null,
      creative: {
        persona: "The Event Planner",
        pillar: "Re-wearability",
        frames: [
          { format: "feed", headline: "The re-wear MVP" },
          { format: "story", headline: "Style it 3 ways" },
          { format: "square", headline: "One slip, endless looks" },
        ],
        captionVariants: [
          {
            id: "c1",
            angle: "Warm",
            body: "The most-worn dress in your closet you don't own yet. Bare for the summer wedding, layered under a blazer for the office, cardigan-and-boots for fall — the Marigold Slip earns its hanger three seasons a year.",
          },
          {
            id: "c2",
            angle: "Practical-chic",
            body: "Cost-per-wear enthusiasts, this one's for you. One marigold slip, three outfits, zero effort. Swipe for the style-it-three-ways breakdown.",
          },
        ],
        hashtags: ["#ExampleStore", "#SlipDress", "#StyleItThreeWays", "#CostPerWear", "#Rewearable"],
      },
    },
    {
      id: "p-starlet",
      name: "Starlet Sequin Midi",
      category: "Party dresses",
      priceLabel: "$188",
      imageUrl: null,
      reason: "new_drop",
      reasonDetail:
        "Just added to the holiday-party preview — build early interest before the December rush.",
      suggested: false,
      postId: null,
      hasImage: false,
      imageConcept: null,
      creative: {
        persona: "The Statement Dresser",
        pillar: "Occasion styling",
        frames: [
          { format: "feed", headline: "Sequins, incoming" },
          { format: "story", headline: "Holiday preview" },
          { format: "square", headline: "Catch the light" },
        ],
        captionVariants: [
          {
            id: "c1",
            angle: "Playful",
            body: "Consider this your holiday-party save-the-date. The Starlet Sequin Midi just landed and it catches every light in the room — which is, frankly, the entire point. First look before the December rush.",
          },
          {
            id: "c2",
            angle: "Confident",
            body: "December has plans for you. The Starlet Sequin Midi — fully lined so the sparkle stays outside, hand-sewn sequins that won't shed on the dance floor. New in, and it won't stay in stock.",
          },
        ],
        hashtags: ["#ExampleStore", "#SequinDress", "#HolidayParty", "#NewArrival", "#PartySeason"],
      },
    },
    {
      id: "p-boardroom",
      name: "Boardroom Blazer Dress",
      category: "Workwear",
      priceLabel: "$158",
      imageUrl: null,
      reason: "dead_stock",
      reasonDetail:
        "48 units aging past 90 days as the season turned — reframe it for autumn work events to move stock.",
      suggested: false,
      postId: null,
      hasImage: false,
      imageConcept: null,
      creative: {
        persona: "The Event Planner",
        pillar: "Re-wearability",
        frames: [
          { format: "feed", headline: "Desk to dinner" },
          { format: "story", headline: "The 9-to-9 dress" },
          { format: "square", headline: "Power, tailored" },
        ],
        captionVariants: [
          {
            id: "c1",
            angle: "Confident",
            body: "The dress that takes a meeting and closes the night. The Boardroom Blazer is sharp enough for the 9 a.m. review and polished enough for the work gala after — structured shoulders, real pockets, zero compromise.",
          },
          {
            id: "c2",
            angle: "Practical-chic",
            body: "Autumn work events, sorted. One tailored blazer dress, add heels for the gala or flats for the pitch. Fewer decisions, more presence.",
          },
        ],
        hashtags: ["#ExampleStore", "#BlazerDress", "#Workwear", "#DeskToDinner", "#OfficeStyle"],
      },
    },
  ],
};

const TRACKED_BASE =
  "https://examplestore.com/products";
const utm = (slug: string, channel: string) =>
  `${TRACKED_BASE}/${slug}?utm_source=${channel}&utm_medium=social&utm_campaign=social-growth`;

export const mockCalendar: CalendarData = {
  // Two scheduled (dated) posts + two approved (undated, ready-to-schedule) posts
  // in one list — the live `/social/calendar` shape (SPEC-131).
  posts: [
    {
      id: "cp1",
      productName: "LegallyRed Wrap Dress",
      channel: "instagram",
      status: "scheduled",
      persona: "The Statement Dresser",
      pillar: "Fit confidence",
      imageUrl: null,
      scheduledFor: "2026-08-12",
      trackedLink: utm("legallyred-wrap-dress", "instagram"),
    },
    {
      id: "cp2",
      productName: "Coastline Midi",
      channel: "tiktok",
      status: "scheduled",
      persona: "The Event Planner",
      pillar: "Occasion styling",
      imageUrl: null,
      scheduledFor: "2026-08-14",
      trackedLink: utm("coastline-midi", "tiktok"),
    },
    {
      id: "cp3",
      productName: "Gilded Hour Gown",
      channel: "instagram",
      status: "approved",
      persona: "The Statement Dresser",
      pillar: "Black-tie confidence",
      imageUrl: null,
      scheduledFor: null,
      trackedLink: utm("gilded-hour-gown", "instagram"),
    },
    {
      id: "cp4",
      productName: "Marigold Slip Dress",
      channel: "facebook",
      status: "approved",
      persona: "The Event Planner",
      pillar: "Re-wearability",
      imageUrl: null,
      scheduledFor: null,
      trackedLink: null,
    },
  ],
};

export const mockApprovals: ApprovalsData = {
  featured: {
    id: "ap1",
    productName: "LegallyRed Wrap Dress",
    channel: "instagram",
    format: "story",
    persona: "The Statement Dresser",
    pillar: "Fit confidence",
    estimatedReach: 18400,
    submittedAt: "2026-08-10T17:05:00Z",
    caption:
      "Some dresses whisper. This one walks in first. The LegallyRed Wrap is cut to cinch exactly where you want it and skim everywhere you don't — no safety pins, no second-guessing. Sizes S and M are going fast. You know what to do.",
    hashtags: ["#ExampleStore", "#WrapDress", "#OccasionWear", "#RedDress", "#EventStyle"],
    imageUrl: null,
    hasImage: false,
  },
  queue: [
    {
      id: "ap2",
      productName: "Coastline Midi",
      channel: "tiktok",
      format: "story",
      persona: "The Event Planner",
      pillar: "Occasion styling",
      estimatedReach: 12200,
      submittedAt: "2026-08-10T15:20:00Z",
      caption:
        "New arrival, meet your next three weekends. The Coastline Midi is the garden-ceremony, rooftop-shower, brunch-that-turns-into-dinner dress — breathable and packs without a wrinkle.",
      hashtags: ["#ExampleStore", "#NewArrival", "#MidiDress", "#WeddingGuest"],
      imageUrl: null,
      hasImage: false,
    },
    {
      id: "ap3",
      productName: "Marigold Slip Dress",
      channel: "instagram",
      format: "feed",
      persona: "The Event Planner",
      pillar: "Re-wearability",
      estimatedReach: 9600,
      submittedAt: "2026-08-10T13:45:00Z",
      caption:
        "The most-worn dress in your closet you don't own yet. Bare for the wedding, layered under a blazer for the office, cardigan-and-boots for fall — three seasons a year.",
      hashtags: ["#ExampleStore", "#SlipDress", "#StyleItThreeWays", "#Rewearable"],
      imageUrl: null,
      hasImage: false,
    },
    {
      id: "ap4",
      productName: "Boardroom Blazer Dress",
      channel: "facebook",
      format: "feed",
      persona: "The Event Planner",
      pillar: "Re-wearability",
      estimatedReach: 6100,
      submittedAt: "2026-08-10T10:10:00Z",
      caption:
        "The dress that takes a meeting and closes the night. Structured shoulders, real pockets, zero compromise — desk to dinner without a costume change.",
      hashtags: ["#ExampleStore", "#BlazerDress", "#DeskToDinner", "#Workwear"],
      imageUrl: null,
      hasImage: false,
    },
  ],
};

export const mockPerformance: PerformanceData = {
  // The live `/social/performance` shape (SPEC-131). Attribution is empty and
  // platformConnected is false — exercising the honest zero states.
  funnel: { generated: 24, inReview: 6, approved: 12, scheduled: 5, published: 0 },
  byChannel: [
    { channel: "instagram", count: 9 },
    { channel: "tiktok", count: 6 },
    { channel: "facebook", count: 3 },
    { channel: "pinterest", count: 2 },
  ],
  contentMix: [
    { reason: "best_seller", count: 11 },
    { reason: "new_drop", count: 7 },
    { reason: "dead_stock", count: 6 },
  ],
  attribution: {
    windowDays: 90,
    attributedOrders: 0,
    attributedRevenue: 0,
    topPosts: [],
  },
  engagement: {
    measuredPosts: 0,
    totals: {
      reach: null,
      impressions: null,
      likes: null,
      comments: null,
      saves: null,
      shares: null,
    },
    topPosts: [],
  },
  platformConnected: false,
};
