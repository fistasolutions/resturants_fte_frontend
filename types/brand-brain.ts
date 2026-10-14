/**
 * Brand Brain v2 view models (SPEC-263) — the shapes the eight sub-tabs render. The
 * facts and personas themselves keep the SPEC-108/111 `Fact` / `Persona` types in
 * `types/spotlight.ts`; these are the new surfaces around them.
 */

import type { Fact, ProvenanceSource } from "@/types/spotlight";

export type BrandBrainSection =
  | "coverage"
  | "review"
  | "files"
  | "facts"
  | "voice"
  | "guardrails"
  | "style-guide"
  | "personas"
  | "competitors";

/* ── Competitors (backend SPEC-280 / frontend SPEC-283) ────────────────────── */

export type CompetitorStatus = "pending" | "approved" | "rejected";
export type CompetitorOrigin = "agent" | "owner";

export interface Competitor {
  id: number;
  name: string;
  domain: string;
  website: string;
  status: CompetitorStatus;
  origin: CompetitorOrigin;
  ownerNote: string | null;
  /** The evidence sentence — counted overlap, or the honest "not measured". */
  why: string;
  overlapQueries: number | null;
  overlapPageTwo: number | null;
  categories: string[];
  priceMin: number | null;
  priceMax: number | null;
  shipping: string;
  returns: string;
  contentCadence: string;
  positioning: string;
  whereYouWin: string;
  gapTopics: string[];
  /** The gap topics that landed in the query bank as `competitor_gap` rows
   * (backend SPEC-286): the ones that map to a category the store sells. */
  gapsFiled: string[];
  pagesRead: string[];
  /** Why the last read of the site failed — null once a read succeeds. */
  readError: string | null;
  factId: number | null;
  createdAt: string | null;
  reviewedAt: string | null;
  lastReadAt: string | null;
}

export interface CompetitorRunStep {
  at: string;
  label: string;
  done?: boolean;
}

export interface CompetitorRun {
  id: number;
  kind: "find" | "read";
  competitorId: number | null;
  status: "running" | "done" | "failed";
  steps: CompetitorRunStep[];
  found: number;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
}

export interface CompetitorSummary {
  tracked: number;
  review: number;
  rejected: number;
  gapTopics: number;
  lastResearched: string | null;
  running: CompetitorRun | null;
  /** Whether a web-search provider is connected — overlap is measured only then. */
  webSearch: boolean;
  /** Which one (SPEC-282): "gemini" · "openai" · "google_cse" · null. */
  webSearchProvider: string | null;
}

export type CoverageStatus = "complete" | "partial" | "empty";

export interface CoverageSection {
  key: string;
  label: string;
  /** 0–100. */
  progress: number;
  status: CoverageStatus;
  /** Provenance chips behind the section — `onboarding` (docx), `file`, `measured`, … */
  sources: ProvenanceSource[];
  /** Approved facts whose confirmation is older than the freshness window. */
  stale: number;
}

export interface CoverageMissing {
  key: string;
  title: string;
  why: string;
  cta: string;
  /** The sub-tab that fixes it. */
  tab: BrandBrainSection;
}

export interface CoverageData {
  score: number;
  sections: CoverageSection[];
  missing: CoverageMissing[];
  counts: { approved: number; pending: number; empty: number };
  lastConfirmed: string;
  usage: { drafts30d: number; socialPosts30d: number; windowDays: number };
}

/** `research` — what the Brand Researcher read from the store itself (backend SPEC-347). */
export type SourceKind = "pdf" | "docx" | "xlsx" | "pptx" | "csv" | "txt" | "url" | "text" | "research";
export type SourceStatus = "extracting" | "ready" | "failed";

export interface BrandSource {
  id: number;
  kind: SourceKind;
  /** The file name / URL as given. */
  name: string;
  /** The owner's name for it (SPEC-267). */
  title: string;
  tags: string[];
  url: string | null;
  /** `facts` (extracted into pending facts) or `voice` (rows became samples). */
  role: "facts" | "voice";
  status: SourceStatus;
  factCount: number;
  /** Extracted facts still waiting for a decision. */
  pendingCount: number;
  /** What one document taught, beyond facts (SPEC-267). */
  personaCount: number;
  sampleCount: number;
  ruleCount: number;
  textChars: number;
  sizeBytes: number;
  contentType: string | null;
  /** True for uploads — the original can be downloaded. */
  hasFile: boolean;
  error: string | null;
  uploadedBy: string | null;
  uploadedAt: string | null;
  checkedAt: string | null;
  /** URL sources only: when the weekly re-read is due. */
  nextCheckAt: string | null;
}

/** `image` (backend SPEC-288) — the brand-safety block every image prompt ends with. */
export type RuleKind = "word_banned" | "word_required" | "claim" | "calendar" | "image" | "style";

/** A Style Guide section (backend SPEC-290). `null` for a word, claim or calendar rule. */
export type StyleSection =
  | "palette"
  | "light"
  | "composition"
  | "styling"
  | "typography"
  | "layout"
  | "safety";

export interface BrandRule {
  id: number;
  kind: RuleKind;
  section: StyleSection | null;
  label: string;
  detail: string | null;
  enabled: boolean;
  startsOn: string | null;
  endsOn: string | null;
  provenance: "owner" | "manual" | "file";
  sourceId: number | null;
}

export interface VoiceSample {
  id: number;
  text: string;
  channel: string | null;
  sourceId: number | null;
  onVoice: number | null;
  createdAt: string | null;
}

export interface VoiceRule {
  id: number;
  title: string;
  detail: string;
  enabled: boolean;
  provenance: "derived" | "manual" | "file";
  sourceId: number | null;
}

export interface VoiceData {
  samples: VoiceSample[];
  rules: VoiceRule[];
  minSamples: number;
}

export type VoiceHitKind = "banned" | "wrong_form" | "exclamation" | "price_claim";

export interface VoiceHit {
  kind: VoiceHitKind;
  text: string;
  note: string;
}

export interface VoiceCheckResult {
  score: number;
  verdict: "passes" | "revise" | "sent back";
  hits: VoiceHit[];
  findings: { ok: boolean; text: string }[];
  rewrite: string | null;
  /** False when the judge was unavailable and the score is the deterministic part alone. */
  judged: boolean;
}

export interface BrandBrainEvent {
  id: number;
  at: string | null;
  kind: string;
  detail: string;
  actor: string | null;
  refKind: string | null;
  refId: number | null;
}

/** One fact with its source and its own history (backend SPEC-273). */
export interface FactDetail {
  fact: Fact;
  source: BrandSource | null;
  events: BrandBrainEvent[];
}

/** One document with its own history (backend SPEC-273). */
export interface SourceDetail {
  source: BrandSource;
  events: BrandBrainEvent[];
}

/* ── The Style Guide's prompt and bench (backend SPEC-292) ─────────────────── */

export type StyleSurface = "social" | "hero";

export interface StylePrompt {
  surface: StyleSurface;
  /** Every character an image model is sent for this surface. */
  prompt: string;
  chars: number;
  rules: number;
  sections: { section: string; count: number }[];
  /** `custom` when the owner edited this surface's prompt (backend SPEC-293). */
  source: "rules" | "custom";
  updated_at: string | null;
  updated_by: string | null;
  /** Safety rules the text in force does not mention — a warning, never a veto. */
  missing_safety: string[];
}

export interface StyleTest {
  id: number;
  prompt: string;
  brief: string | null;
  surface: StyleSurface;
  productId: number | null;
  productTitle: string | null;
  rulesCount: number;
  createdAt: string | null;
}
