/**
 * Phase-1 mock fixtures for Spotlight (SPEC-109; root CLAUDE.md Rule 6
 * exception). Realistic Example Store content — an occasion-wear apparel
 * brand. Replaced by the real research / content / Search-Console APIs in a
 * later backend phase; components never import this file directly, they go
 * through `services/spotlight.ts`.
 */
import type { ApprovalsData, InboundData } from "@/types/spotlight";

// The Overview tab is served live from the backend rollup (SPEC-120); its mock
// was removed. `mockInbound` / `mockApprovals` remain as Vitest fixtures.

export const mockInbound: InboundData = {
  queries: [
    { id: "q1", keyword: "what to wear to a fall wedding 2026", monthlyVolume: 2400, persona: "The Event Planner", intent: "informational", cluster: "Wedding guest" },
    { id: "q2", keyword: "fall wedding guest dresses", monthlyVolume: 5400, persona: "The Event Planner", intent: "commercial", cluster: "Wedding guest" },
    { id: "q3", keyword: "how to find your true dress size online", monthlyVolume: 1300, persona: "The Statement Dresser", intent: "informational", cluster: "Fit & sizing" },
    { id: "q4", keyword: "midi dress for a gala", monthlyVolume: 880, persona: "The Statement Dresser", intent: "commercial", cluster: "Black-tie" },
    { id: "q5", keyword: "black tie optional outfit women", monthlyVolume: 1900, persona: "The Statement Dresser", intent: "informational", cluster: "Black-tie" },
    { id: "q6", keyword: "graduation dress ideas", monthlyVolume: 3600, persona: "The Milestone Gifter", intent: "informational", cluster: "Milestones" },
    { id: "q7", keyword: "bridesmaid dresses that can be worn again", monthlyVolume: 720, persona: "The Event Planner", intent: "commercial", cluster: "Wedding party" },
    { id: "q8", keyword: "example store dresses", monthlyVolume: 390, persona: "The Statement Dresser", intent: "navigational", cluster: "Brand" },
  ],
  assets: [
    { id: "as1", title: "What to wear to a fall wedding 2026", channel: "blog", status: "in_review", seoScore: 88, targetKeyword: "what to wear to a fall wedding 2026", persona: "The Event Planner", updatedAt: "2026-08-11T07:05:00Z" },
    { id: "as2", title: "Find your true dress size online", channel: "blog", status: "in_review", seoScore: 82, targetKeyword: "how to find your true dress size online", persona: "The Statement Dresser", updatedAt: "2026-08-10T16:40:00Z" },
    { id: "as3", title: "Black-tie optional, decoded", channel: "blog", status: "drafting", seoScore: 64, targetKeyword: "black tie optional outfit women", persona: "The Statement Dresser", updatedAt: "2026-08-11T05:12:00Z" },
    { id: "as4", title: "5 dresses your bridesmaids will re-wear", channel: "linkedin", status: "in_review", seoScore: 71, targetKeyword: "bridesmaid dresses that can be worn again", persona: "The Event Planner", updatedAt: "2026-08-10T14:00:00Z" },
    { id: "as5", title: "The graduation dress edit", channel: "blog", status: "researching", seoScore: 41, targetKeyword: "graduation dress ideas", persona: "The Milestone Gifter", updatedAt: "2026-08-11T03:30:00Z" },
    { id: "as6", title: "5 black-tie looks that photograph beautifully", channel: "blog", status: "published", seoScore: 91, targetKeyword: "black tie dress photos", persona: "The Statement Dresser", updatedAt: "2026-08-08T12:00:00Z" },
  ],
};

export const mockApprovals: ApprovalsData = {
  featured: {
    id: "as1",
    title: "What to wear to a fall wedding 2026",
    targetKeyword: "what to wear to a fall wedding 2026",
    persona: "The Event Planner",
    channel: "blog",
    wordCount: 1480,
    seoScore: 88,
    publishTarget: "examplestore.com/journal",
    estimatedReach: 2400,
    excerpt:
      "Invitation says “fall wedding” and your calendar says three of them? Here's how to look considered — never over- or under-dressed — from a rustic vineyard afternoon to a black-tie ballroom, with pieces you'll actually re-wear.",
    sections: [
      { heading: "Read the invitation like a stylist", summary: "Decoding dress codes from “festive” to “black tie optional”." },
      { heading: "The vineyard & garden ceremony", summary: "Midi silhouettes, warm autumn tones, block heels that survive grass." },
      { heading: "The evening ballroom", summary: "Floor-length and rich fabrics — how to keep it photograph-ready." },
      { heading: "Re-wearable picks under $200", summary: "Three Example Store dresses that work past wedding season." },
    ],
  },
  queue: [
    { id: "as2", title: "Find your true dress size online", channel: "blog", seoScore: 82, persona: "The Statement Dresser", submittedAt: "2026-08-10T16:40:00Z" },
    { id: "as4", title: "5 dresses your bridesmaids will re-wear", channel: "linkedin", seoScore: 71, persona: "The Event Planner", submittedAt: "2026-08-10T14:00:00Z" },
    { id: "as3", title: "Black-tie optional, decoded", channel: "blog", seoScore: 64, persona: "The Statement Dresser", submittedAt: "2026-08-11T05:12:00Z" },
  ],
};
