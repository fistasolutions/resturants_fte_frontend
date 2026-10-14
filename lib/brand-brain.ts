/**
 * Brand Brain v2 — pure, unit-testable logic (SPEC-263): the sub-tab vocabulary,
 * the adapters from the backend's snake_case, and the small helpers the section
 * views share. No JSX, no fetching.
 */

import type {
  BrandBrainEvent,
  BrandBrainSection,
  BrandRule,
  StyleSection,
  StyleTest,
  BrandSource,
  CoverageData,
  CoverageMissing,
  CoverageSection,
  CoverageStatus,
  RuleKind,
  SourceKind,
  VoiceCheckResult,
  VoiceData,
  VoiceHit,
  VoiceSample,
} from "@/types/brand-brain";
import type { Fact, FactSection, ProvenanceSource } from "@/types/spotlight";

/** The nine sub-tabs, in bar order (SPEC-281, SPEC-283, SPEC-295, SPEC-341 — Review). The URL
 * segment IS the key. */
export const BRAND_BRAIN_SECTIONS = [
  "coverage",
  "review",
  "files",
  "facts",
  "voice",
  "guardrails",
  "style-guide",
  "personas",
  "competitors",
] as const satisfies readonly BrandBrainSection[];

const SECTION_LABELS: Record<BrandBrainSection, string> = {
  coverage: "Coverage",
  review: "Review",
  files: "Knowledge Base",
  facts: "Facts",
  voice: "Voice",
  guardrails: "Guardrails",
  "style-guide": "Style Guide",
  personas: "Personas",
  competitors: "Competitors",
};

/** The two tabs folded away on 2026-09-21 (SPEC-281): Measured lives in Facts under
 * its filter, History in Coverage's Recent changes. Old links keep working. */
export const LEGACY_SECTION_REDIRECTS: Record<string, string> = {
  measured: "/spotlight/brand-brain/facts?filter=measured",
  history: "/spotlight/brand-brain/coverage",
};

export function brandBrainSectionLabel(section: BrandBrainSection): string {
  return SECTION_LABELS[section];
}

export function isBrandBrainSection(value: string | undefined): value is BrandBrainSection {
  return (BRAND_BRAIN_SECTIONS as readonly string[]).includes(value ?? "");
}

export const BRAND_BRAIN_ROOT = "/spotlight/brand-brain";

export function brandBrainHref(section: BrandBrainSection): string {
  return `${BRAND_BRAIN_ROOT}/${section}`;
}

/* ── Adapters ─────────────────────────────────────────────────────────────── */

export interface ApiCoverage {
  score: number;
  sections: { key: string; label: string; progress: number; status: string; sources: string[]; stale: number }[];
  missing: { key: string; title: string; why: string; cta: string; tab: string }[];
  counts: { approved: number; pending: number; empty: number };
  last_confirmed: string;
  usage: { drafts_30d: number; social_posts_30d: number; window_days: number };
}

export interface ApiBrandSource {
  id: number;
  kind: string;
  name: string;
  title?: string;
  tags?: string[];
  url: string | null;
  role: string;
  status: string;
  fact_count: number;
  pending_count?: number;
  persona_count?: number;
  sample_count?: number;
  rule_count?: number;
  text_chars: number;
  size_bytes?: number;
  content_type?: string | null;
  has_file?: boolean;
  error: string | null;
  uploaded_by: string | null;
  uploaded_at: string | null;
  checked_at: string | null;
  next_check_at?: string | null;
}

export interface ApiBrandRule {
  id: number;
  kind: string;
  section?: string | null;
  label: string;
  detail: string | null;
  enabled: boolean;
  starts_on: string | null;
  ends_on: string | null;
  provenance: string;
  source_id?: number | null;
}

export interface ApiVoice {
  samples: {
    id: number;
    text: string;
    channel: string | null;
    source_id: number | null;
    on_voice: number | null;
    created_at: string | null;
  }[];
  rules: { id: number; title: string; detail: string; enabled: boolean; provenance: string; source_id?: number | null }[];
  min_samples: number;
}

export interface ApiVoiceCheck {
  score: number;
  verdict: string;
  hits: { kind: string; text: string; note: string }[];
  findings: { ok: boolean; text: string }[];
  rewrite: string | null;
  judged: boolean;
}

export interface ApiBrandBrainEvent {
  id: number;
  at: string | null;
  kind: string;
  detail: string;
  actor: string | null;
  ref_kind: string | null;
  ref_id: number | null;
}

/** Backend provenance names → the chip vocabulary (mirrors `lib/adapters.ts`). */
export function sourceChip(provenance: string): ProvenanceSource {
  switch (provenance) {
    case "owner":
      return "onboarding";
    case "measured":
    case "research":
    case "file":
      return provenance;
    default:
      return "manual";
  }
}

function coverageStatus(value: string): CoverageStatus {
  return value === "complete" || value === "partial" ? value : "empty";
}

export function adaptCoverage(raw: ApiCoverage): CoverageData {
  return {
    score: raw.score,
    sections: raw.sections.map<CoverageSection>((s) => ({
      key: s.key,
      label: s.label,
      progress: s.progress,
      status: coverageStatus(s.status),
      sources: s.sources.map(sourceChip),
      stale: s.stale,
    })),
    missing: raw.missing.map<CoverageMissing>((m) => ({
      key: m.key,
      title: m.title,
      why: m.why,
      cta: m.cta,
      tab: isBrandBrainSection(m.tab) ? m.tab : "files",
    })),
    counts: raw.counts,
    lastConfirmed: raw.last_confirmed,
    usage: {
      drafts30d: raw.usage.drafts_30d,
      socialPosts30d: raw.usage.social_posts_30d,
      windowDays: raw.usage.window_days,
    },
  };
}

const SOURCE_KINDS: readonly SourceKind[] = ["pdf", "docx", "xlsx", "pptx", "csv", "txt", "url", "text"];

export function adaptBrandSource(raw: ApiBrandSource): BrandSource {
  return {
    id: raw.id,
    kind: SOURCE_KINDS.includes(raw.kind as SourceKind) ? (raw.kind as SourceKind) : "txt",
    name: raw.name,
    title: raw.title ?? raw.name,
    tags: raw.tags ?? [],
    url: raw.url,
    role: raw.role === "voice" ? "voice" : "facts",
    status: raw.status === "ready" || raw.status === "failed" ? raw.status : "extracting",
    factCount: raw.fact_count,
    pendingCount: raw.pending_count ?? 0,
    personaCount: raw.persona_count ?? 0,
    sampleCount: raw.sample_count ?? 0,
    ruleCount: raw.rule_count ?? 0,
    textChars: raw.text_chars,
    sizeBytes: raw.size_bytes ?? 0,
    contentType: raw.content_type ?? null,
    hasFile: raw.has_file ?? !["url", "text"].includes(raw.kind),
    error: raw.error,
    uploadedBy: raw.uploaded_by,
    uploadedAt: raw.uploaded_at,
    checkedAt: raw.checked_at,
    nextCheckAt: raw.next_check_at ?? null,
  };
}

const RULE_KINDS: readonly RuleKind[] = [
  "word_banned",
  "word_required",
  "claim",
  "calendar",
  "image",
  "style",
];

const STYLE_SECTION_KEYS: readonly StyleSection[] = [
  "palette",
  "light",
  "composition",
  "styling",
  "typography",
  "layout",
  "safety",
];

function isStyleSection(value: string | null | undefined): value is StyleSection {
  return !!value && (STYLE_SECTION_KEYS as readonly string[]).includes(value);
}

export function adaptBrandRule(raw: ApiBrandRule): BrandRule {
  return {
    id: raw.id,
    kind: RULE_KINDS.includes(raw.kind as RuleKind) ? (raw.kind as RuleKind) : "claim",
    section: isStyleSection(raw.section) ? raw.section : null,
    label: raw.label,
    detail: raw.detail,
    enabled: raw.enabled,
    startsOn: raw.starts_on,
    endsOn: raw.ends_on,
    provenance: raw.provenance === "manual" || raw.provenance === "file" ? raw.provenance : "owner",
    sourceId: raw.source_id ?? null,
  };
}

export interface ApiStyleTest {
  id: number;
  prompt: string;
  brief: string | null;
  surface: string;
  product_id: number | null;
  product_title: string | null;
  rules_count: number;
  created_at: string | null;
}

export function adaptStyleTest(raw: ApiStyleTest): StyleTest {
  return {
    id: raw.id,
    prompt: raw.prompt,
    brief: raw.brief,
    surface: raw.surface === "hero" ? "hero" : "social",
    productId: raw.product_id,
    productTitle: raw.product_title,
    rulesCount: raw.rules_count,
    createdAt: raw.created_at,
  };
}

export function adaptVoice(raw: ApiVoice): VoiceData {
  return {
    samples: raw.samples.map((s) => ({
      id: s.id,
      text: s.text,
      channel: s.channel,
      sourceId: s.source_id,
      onVoice: s.on_voice,
      createdAt: s.created_at,
    })),
    rules: raw.rules.map((r) => ({
      id: r.id,
      title: r.title,
      detail: r.detail,
      enabled: r.enabled,
      provenance: r.provenance === "manual" || r.provenance === "file" ? r.provenance : "derived",
      sourceId: r.source_id ?? null,
    })),
    minSamples: raw.min_samples,
  };
}

export function adaptVoiceCheck(raw: ApiVoiceCheck): VoiceCheckResult {
  const kinds: VoiceHit["kind"][] = ["banned", "wrong_form", "exclamation", "price_claim"];
  return {
    score: raw.score,
    verdict: raw.verdict === "passes" || raw.verdict === "revise" ? raw.verdict : "sent back",
    hits: raw.hits.map((h) => ({
      kind: kinds.includes(h.kind as VoiceHit["kind"]) ? (h.kind as VoiceHit["kind"]) : "banned",
      text: h.text,
      note: h.note,
    })),
    findings: raw.findings,
    rewrite: raw.rewrite,
    judged: raw.judged,
  };
}

export function adaptBrandBrainEvent(raw: ApiBrandBrainEvent): BrandBrainEvent {
  return {
    id: raw.id,
    at: raw.at,
    kind: raw.kind,
    detail: raw.detail,
    actor: raw.actor,
    refKind: raw.ref_kind,
    refId: raw.ref_id,
  };
}

/* ── Helpers the views share ──────────────────────────────────────────────── */

/** The token class for a coverage score or a section's progress. */
export function coverageTone(pct: number): "success" | "warning" | "destructive" {
  if (pct >= 100) return "success";
  if (pct > 0) return "warning";
  return "destructive";
}

export function sourceKindLabel(kind: SourceKind): string {
  return { pdf: "PDF", docx: "DOC", xlsx: "XLS", pptx: "PPT", csv: "CSV", txt: "TXT", url: "URL", text: "TEXT", research: "AUTO" }[kind];
}

/** Facts grouped by section, in the brain's reading order; empty sections omitted. */
export const FACT_SECTION_ORDER: readonly FactSection[] = [
  "identity",
  "voice",
  "guardrail",
  "product",
  "policy",
  "competitor",
  "market",
  "calendar",
  "proof_point",
];

const FACT_SECTION_LABELS: Record<FactSection, string> = {
  identity: "Identity",
  voice: "Voice",
  guardrail: "Guardrails",
  proof_point: "Proof points & measured",
  product: "Products & sizing",
  policy: "Policies",
  calendar: "Calendar",
  competitor: "Competitors",
  market: "Markets",
};

export function factSectionLabel(section: FactSection): string {
  return FACT_SECTION_LABELS[section];
}

export function groupFactsBySection(facts: Fact[]): { section: FactSection; facts: Fact[] }[] {
  return FACT_SECTION_ORDER.map((section) => ({
    section,
    facts: facts.filter((f) => (f.section ?? "identity") === section),
  })).filter((g) => g.facts.length > 0);
}

/** Facts still waiting for a decision — the count on the Files tab and the Facts tab. */
export function pendingCount(facts: Pick<Fact, "status">[]): number {
  return facts.filter((f) => f.status === "pending" || f.status === "conflict").length;
}

/** The rules of one kind, in their stored order. */
export function rulesOfKind(rules: BrandRule[], kind: RuleKind): BrandRule[] {
  return rules.filter((r) => r.kind === kind);
}

/** Wrong forms a required term replaces, as a list ("Shabbat, Sabbath" → two). */
export function wrongForms(rule: BrandRule): string[] {
  return (rule.detail ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

/** True while any source is still being read — the Files tab polls until none is. */
export function anyExtracting(sources: Pick<BrandSource, "status">[]): boolean {
  return sources.some((s) => s.status === "extracting");
}

/** Split `text` into plain and highlighted runs around every hit, for rendering. */
export function highlightHits(text: string, hits: VoiceHit[]): { text: string; hit: boolean }[] {
  const needles = [...new Set(hits.filter((h) => h.kind !== "exclamation").map((h) => h.text))]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (needles.length === 0) return [{ text, hit: false }];
  const pattern = new RegExp(needles.map((n) => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"), "gi");
  const runs: { text: string; hit: boolean }[] = [];
  let last = 0;
  for (const match of text.matchAll(pattern)) {
    const at = match.index ?? 0;
    if (at > last) runs.push({ text: text.slice(last, at), hit: false });
    runs.push({ text: match[0], hit: true });
    last = at + match[0].length;
  }
  if (last < text.length) runs.push({ text: text.slice(last), hit: false });
  return runs;
}

/** Owner-readable wording of a history event kind. */
export function eventKindLabel(kind: string): string {
  const labels: Record<string, string> = {
    source_added: "Source added",
    source_ready: "Extracted",
    source_failed: "Extraction failed",
    source_deleted: "Source removed",
    fact_approved: "Approved",
    fact_rejected: "Rejected",
    fact_edited: "Edited",
    fact_added: "Added",
    fact_deleted: "Deleted",
    rule_added: "Rule added",
    rule_changed: "Rule changed",
    rule_deleted: "Rule removed",
    sample_added: "Sample added",
    sample_deleted: "Sample removed",
    voice_derived: "Voice derived",
    persona_confirmed: "Persona confirmed",
    persona_deleted: "Persona deleted",
    confirmed: "Brain confirmed",
  };
  return labels[kind] ?? kind.replace(/_/g, " ");
}

/* ── Facts, redesigned (SPEC-274) ───────────────────────────────────────── */

export const sourceHref = (id: number): string => `${BRAND_BRAIN_ROOT}/files/${id}`;
export const factHref = (id: number): string => `${BRAND_BRAIN_ROOT}/facts/${id}`;

/** True for the pages that own their header and breadcrumb under the shells. */
export function isBrandBrainDetailPath(pathname: string): boolean {
  return /^\/spotlight\/brand-brain\/(files|facts|competitors)\/\d+\/?$/.test(pathname);
}

export type FactFilter = "all" | "wait" | "file" | "off" | "measured";

export const FACT_FILTERS: { key: FactFilter; label: string }[] = [
  { key: "all", label: "Everything" },
  { key: "wait", label: "Needs decision" },
  { key: "file", label: "From files" },
  { key: "off", label: "Switched off" },
  { key: "measured", label: "Measured" },
];

export function factNeedsDecision(f: Pick<Fact, "status">): boolean {
  return f.status === "pending" || f.status === "conflict";
}

export function matchesFactFilter(f: Fact, filter: FactFilter): boolean {
  switch (filter) {
    case "wait":
      return factNeedsDecision(f);
    case "file":
      return f.source === "file";
    case "off":
      return f.enabled === false;
    case "measured":
      return f.source === "measured";
    default:
      return true;
  }
}

/** Token search over label, value and the section name. */
export function filterFacts(facts: Fact[], filter: FactFilter, query: string): Fact[] {
  const q = query.trim().toLowerCase();
  return facts.filter((f) => {
    if (!matchesFactFilter(f, filter)) return false;
    if (!q) return true;
    const hay = `${f.label} ${f.value} ${factSectionLabel(f.section ?? "identity")}`.toLowerCase();
    return q.split(/\s+/).every((t) => hay.includes(t));
  });
}

export interface FactsSummary {
  total: number;
  approved: number;
  pending: number;
  conflict: number;
  off: number;
  measured: number;
  rejected: number;
  onboarding: number;
  file: number;
  manual: number;
  /** ISO of the newest and the oldest confirmation among approved facts. */
  newestApproval: string | null;
  oldestFact: string | null;
}

export function factsSummary(facts: Fact[]): FactsSummary {
  const s: FactsSummary = { total: 0, approved: 0, pending: 0, conflict: 0, off: 0, measured: 0, rejected: 0, onboarding: 0, file: 0, manual: 0, newestApproval: null, oldestFact: null };
  for (const f of facts) {
    if (f.status === "rejected") {
      s.rejected += 1;
      continue;
    }
    s.total += 1;
    if (f.source === "measured") s.measured += 1;
    else if (f.source === "file") s.file += 1;
    else if (f.source === "onboarding") s.onboarding += 1;
    else s.manual += 1;
    if (f.status === "pending") s.pending += 1;
    else if (f.status === "conflict") s.conflict += 1;
    else {
      s.approved += 1;
      if (f.enabled === false) s.off += 1;
      if (f.confirmedAt) {
        if (!s.newestApproval || f.confirmedAt > s.newestApproval) s.newestApproval = f.confirmedAt;
        if (!s.oldestFact || f.confirmedAt < s.oldestFact) s.oldestFact = f.confirmedAt;
      }
    }
  }
  return s;
}

export function filterCounts(facts: Fact[]): Record<FactFilter, number> {
  const live = facts.filter((f) => f.status !== "rejected");
  return {
    all: live.length,
    wait: live.filter((f) => matchesFactFilter(f, "wait")).length,
    file: live.filter((f) => matchesFactFilter(f, "file")).length,
    off: live.filter((f) => matchesFactFilter(f, "off")).length,
    measured: live.filter((f) => matchesFactFilter(f, "measured")).length,
  };
}

export interface SectionStat {
  section: FactSection;
  label: string;
  count: number;
  pending: number;
}

/** Every section in order, with its live count and how many need a decision. */
export function sectionStats(facts: Fact[]): SectionStat[] {
  return FACT_SECTION_ORDER.map((section) => {
    const rows = facts.filter((f) => (f.section ?? "identity") === section && f.status !== "rejected");
    return { section, label: factSectionLabel(section), count: rows.length, pending: rows.filter(factNeedsDecision).length };
  });
}

/** Which writers read each section — the platform's own map, not data. */
export const SECTION_USERS: Record<FactSection, string[]> = {
  identity: ["every writer", "Glisp"],
  voice: ["blog", "social", "Glisp"],
  guardrail: ["every writer"],
  product: ["blog", "social", "product pages", "Glisp"],
  policy: ["Glisp", "product pages"],
  competitor: ["blog", "social"],
  market: ["blog", "Glisp"],
  calendar: ["blog", "social", "the weekly planner"],
  proof_point: ["blog", "product pages", "Glisp"],
};

/** "Founding document · p.4 · approved Sep 18" / "Onboarding · Aug 11" / "Measured live". */
export function factSourceLine(
  f: Fact,
  sourceTitles: ReadonlyMap<number, string>,
  formatDate: (iso: string) => string,
): { name: string; detail: string } {
  const when = f.confirmedAt ? formatDate(f.confirmedAt) : null;
  if (f.source === "measured") return { name: "Measured from the store", detail: f.sourceNote ?? "" };
  if (f.source === "file") {
    const name = (f.sourceId != null && sourceTitles.get(f.sourceId)) || "A document";
    const parts = [f.sourceLocator, f.status === "conflict" ? "conflicts with the approved value" : f.status === "pending" ? "pending" : when ? `approved ${when}` : null].filter(Boolean);
    return { name, detail: parts.join(" · ") };
  }
  const name = f.source === "onboarding" ? "Onboarding" : f.source === "research" ? "AI research" : "Added by hand";
  const state = f.status === "pending" ? "pending" : f.status === "rejected" ? "rejected" : "approved";
  return { name, detail: when ? `${state} ${when}` : state };
}

/** What a selection can actually do (SPEC-274): decide only what is undecided,
 * switch only what is approved — never offer Approve to an approved fact. */
export interface BulkOptions {
  decide: number;
  approvedOn: number;
  approvedOff: number;
  total: number;
}

export function bulkOptions(facts: Fact[], ids: ReadonlySet<number>): BulkOptions {
  const picked = facts.filter((f) => f.id != null && ids.has(f.id));
  return {
    total: picked.length,
    decide: picked.filter(factNeedsDecision).length,
    approvedOn: picked.filter((f) => f.status === "approved" && f.enabled !== false).length,
    approvedOff: picked.filter((f) => f.status === "approved" && f.enabled === false).length,
  };
}

/** The approved value a conflict would replace, from its note. */
export function conflictCurrentValue(f: Pick<Fact, "status" | "sourceNote">): string | null {
  if (f.status !== "conflict" || !f.sourceNote) return null;
  return f.sourceNote.replace(/^Conflicts with the approved value:\s*/i, "").trim() || null;
}

/** Up to `n` other live facts of the same section. */
export function relatedFacts(fact: Fact, facts: Fact[], n = 4): Fact[] {
  return facts.filter((f) => f.id != null && f.id !== fact.id && f.status !== "rejected" && (f.section ?? "identity") === (fact.section ?? "identity")).slice(0, n);
}

export function sourceTitleMap(sources: Pick<BrandSource, "id" | "title">[]): Map<number, string> {
  return new Map(sources.map((s) => [s.id, s.title]));
}

/* ── Voice, redesigned (SPEC-274 Patches) ───────────────────────────────── */

export interface VoiceSummary {
  samples: number;
  fromFiles: number;
  pasted: number;
  rules: number;
  rulesOn: number;
  /** How many more samples until the voice can be derived (0 when enough). */
  needed: number;
  /** The one thing to do next. */
  step: "samples" | "derive" | "ready";
}

export function voiceSummary(data: Pick<VoiceData, "samples" | "rules" | "minSamples">): VoiceSummary {
  const fromFiles = data.samples.filter((s) => s.sourceId != null).length;
  const needed = Math.max(0, data.minSamples - data.samples.length);
  const rulesOn = data.rules.filter((r) => r.enabled).length;
  return {
    samples: data.samples.length,
    fromFiles,
    pasted: data.samples.length - fromFiles,
    rules: data.rules.length,
    rulesOn,
    needed,
    step: needed > 0 ? "samples" : data.rules.length === 0 ? "derive" : "ready",
  };
}

/** "Founding document" / "Pasted" / "Captions CSV" for a sample's source line. */
export function sampleSourceLine(s: Pick<VoiceSample, "sourceId" | "channel">, titles: ReadonlyMap<number, string>): string {
  if (s.sourceId != null) return titles.get(s.sourceId) ?? "A document";
  return s.channel && s.channel !== "manual" && s.channel !== "file" ? s.channel : "Pasted by you";
}
