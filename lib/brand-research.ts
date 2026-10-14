/**
 * The Brand Researcher's pure half (SPEC-341, backend SPEC-347): adapters, what the toast
 * says, and how the review is grouped. Rendering lives in `features/brand-brain/`.
 */
import type {
  ResearchFound,
  ResearchReview,
  ResearchRun,
  ResearchStep,
  ResearchStepState,
  ReviewFact,
} from "@/types/brand-research";

export const REVIEW_HREF = "/spotlight/brand-brain/review";

/* ── adapters ────────────────────────────────────────────────────────────── */

export interface ApiResearchRun {
  id: number;
  trigger: "auto" | "owner";
  status: "running" | "done" | "failed";
  steps: {
    key: string;
    label: string;
    state: ResearchStepState;
    detail?: string | null;
    started_at?: string | null;
    finished_at?: string | null;
  }[];
  progress: number;
  found: Partial<ResearchFound> | null;
  competitor_run_id: number | null;
  error: string | null;
  started_at: string | null;
  finished_at: string | null;
  seen_at: string | null;
}

export interface ApiResearchReview {
  facts: {
    id: number;
    section: string;
    label: string;
    value: string;
    status: "pending" | "conflict";
    locator: string | null;
    replaces: string | null;
  }[];
  personas: { id: number; name: string; role: string; description: string; tags: string[] }[];
  voice_rules: { id: number; title: string; detail: string }[];
  words: { id: number; kind: "word_banned" | "word_required"; label: string; detail: string | null }[];
  style: { id: number; section: string | null; label: string; detail: string | null }[];
  competitors: { id: number; name: string; domain: string; positioning: string; why: string }[];
  counts: Partial<ResearchFound> & { total?: number };
  run: ApiResearchRun | null;
}

const EMPTY_FOUND: ResearchFound = { facts: 0, personas: 0, voice: 0, words: 0, style: 0, competitors: 0 };

function adaptFound(raw: Partial<ResearchFound> | null | undefined): ResearchFound {
  return { ...EMPTY_FOUND, ...(raw ?? {}) };
}

export function adaptResearchRun(raw: ApiResearchRun): ResearchRun {
  return {
    id: raw.id,
    trigger: raw.trigger,
    status: raw.status,
    steps: raw.steps.map((s) => ({
      key: s.key,
      label: s.label,
      state: s.state,
      detail: s.detail ?? "",
      startedAt: s.started_at ?? null,
      finishedAt: s.finished_at ?? null,
    })),
    progress: Math.max(0, Math.min(100, Math.round(raw.progress))),
    found: adaptFound(raw.found),
    competitorRunId: raw.competitor_run_id,
    error: raw.error,
    startedAt: raw.started_at,
    finishedAt: raw.finished_at,
    seenAt: raw.seen_at,
  };
}

export function adaptResearchReview(raw: ApiResearchReview): ResearchReview {
  const found = adaptFound(raw.counts);
  return {
    facts: raw.facts.map((f) => ({ ...f })),
    personas: raw.personas.map((p) => ({ ...p, tags: [...p.tags] })),
    voiceRules: raw.voice_rules.map((r) => ({ ...r })),
    words: raw.words.map((w) => ({ ...w })),
    style: raw.style.map((s) => ({ ...s })),
    competitors: raw.competitors.map((c) => ({ ...c })),
    counts: { ...found, total: raw.counts.total ?? Object.values(found).reduce((a, b) => a + b, 0) },
    run: raw.run ? adaptResearchRun(raw.run) : null,
  };
}

/* ── the toast ───────────────────────────────────────────────────────────── */

function plural(n: number, one: string, many = `${one}s`): string {
  return `${n} ${n === 1 ? one : many}`;
}

/** "18 facts · 4 customer types · 6 voice rules · 3 competitors" — only what is there. */
export function foundSummary(found: ResearchFound): string {
  const parts = [
    found.facts ? plural(found.facts, "fact") : "",
    found.personas ? plural(found.personas, "customer type") : "",
    found.voice ? plural(found.voice, "voice rule") : "",
    found.words ? plural(found.words, "word rule") : "",
    found.style ? plural(found.style, "style note") : "",
    found.competitors ? plural(found.competitors, "competitor") : "",
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : "Nothing new to review";
}

export function foundTotal(found: ResearchFound): number {
  return found.facts + found.personas + found.voice + found.words + found.style + found.competitors;
}

export type ToastTone = "running" | "done" | "failed";

export interface ResearchToastView {
  tone: ToastTone;
  title: string;
  progress: number;
  /** The step being worked on, and its latest detail. */
  current: ResearchStep | null;
  steps: ResearchStep[];
  summary: string;
  canReview: boolean;
}

export function researchToastView(run: ResearchRun): ResearchToastView {
  const current = run.steps.find((s) => s.state === "running") ?? null;
  if (run.status === "failed") {
    return {
      tone: "failed",
      title: "Brand research stopped",
      progress: run.progress,
      current: null,
      steps: run.steps,
      summary: run.error ?? "The research stopped before it finished.",
      canReview: foundTotal(run.found) > 0,
    };
  }
  if (run.status === "done") {
    const total = foundTotal(run.found);
    return {
      tone: "done",
      title: total ? "Your brand is ready to review" : "Brand research finished",
      progress: 100,
      current: null,
      steps: run.steps,
      summary: foundSummary(run.found),
      canReview: total > 0,
    };
  }
  return {
    tone: "running",
    title: "Researching your brand",
    progress: run.progress,
    current,
    steps: run.steps,
    summary: runningSummary(run),
    canReview: false,
  };
}

/** SPEC-367: several steps run at once — their live lines joined, or the one step's. */
function runningSummary(run: ResearchRun): string {
  const running = run.steps.filter((s) => s.state === "running");
  if (running.length === 0) return "Starting";
  if (running.length === 1) return running[0].detail || running[0].label;
  return running.map((s) => s.detail || s.label).join(" · ");
}

const FINISHED_STATES: ReadonlySet<ResearchStepState> = new Set(["done", "skipped", "failed"]);

/** "4 of 9 done · 3 working" while it runs, else null (SPEC-367). */
export function stepPosition(run: ResearchRun): string | null {
  if (run.status !== "running") return null;
  const done = run.steps.filter((s) => FINISHED_STATES.has(s.state)).length;
  const working = run.steps.filter((s) => s.state === "running").length;
  const head = `${done} of ${run.steps.length} done`;
  return working ? `${head} · ${working} working` : head;
}

export interface ResearchLine {
  key: string;
  label: string;
  state: ResearchStepState;
  /** What it is doing (running), its result (done), why (skipped / failed); "" while waiting. */
  text: string;
  startedAt: string | null;
  finishedAt: string | null;
}

/** One line per step, in the backend's order (SPEC-367). */
export function researchLines(run: ResearchRun): ResearchLine[] {
  return run.steps.map((s) => ({
    key: s.key,
    label: s.label,
    state: s.state,
    text: s.state === "waiting" ? "" : s.detail,
    startedAt: s.startedAt,
    finishedAt: s.finishedAt,
  }));
}

/** A running step's time so far ("0:12"), a finished one's duration ("12s", "1m 05s"), or "". */
export function stepClock(
  step: { state: ResearchStepState; startedAt: string | null; finishedAt: string | null },
  nowMs: number,
): string {
  if (!step.startedAt) return "";
  const start = Date.parse(step.startedAt);
  if (Number.isNaN(start)) return "";
  if (step.state === "running") {
    const seconds = Math.max(0, Math.floor((nowMs - start) / 1000));
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
  }
  if (!step.finishedAt || !FINISHED_STATES.has(step.state)) return "";
  const end = Date.parse(step.finishedAt);
  if (Number.isNaN(end)) return "";
  const seconds = Math.max(0, Math.round((end - start) / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${String(seconds % 60).padStart(2, "0")}s`;
}

/* ── the review ──────────────────────────────────────────────────────────── */

export type ReviewGroupKey = "about" | "customers" | "voice" | "words" | "look" | "competitors";

export const REVIEW_GROUPS: { key: ReviewGroupKey; title: string; blurb: string }[] = [
  { key: "about", title: "About your store", blurb: "Who you are, what you sell, your policies." },
  { key: "customers", title: "Your customers", blurb: "The kinds of people who buy from you." },
  { key: "voice", title: "How you sound", blurb: "How your writing reads — the writers follow it." },
  { key: "words", title: "Words", blurb: "Words to use, and words never to use." },
  {
    key: "look",
    title: "Your look",
    blurb: "Colours, light, framing and how people are shown, from your store and its photos.",
  },
  { key: "competitors", title: "Competitors", blurb: "Stores you are compared with." },
];

/** Fact sections that belong to "How you sound" rather than "About your store". */
const VOICE_SECTIONS = new Set(["voice"]);

export function factGroup(fact: ReviewFact): ReviewGroupKey {
  return VOICE_SECTIONS.has(fact.section) ? "voice" : "about";
}

export function groupCount(review: ResearchReview, key: ReviewGroupKey): number {
  switch (key) {
    case "about":
      return review.facts.filter((f) => factGroup(f) === "about").length;
    case "customers":
      return review.personas.length;
    case "voice":
      return review.voiceRules.length + review.facts.filter((f) => factGroup(f) === "voice").length;
    case "words":
      return review.words.length;
    case "look":
      return review.style.length;
    case "competitors":
      return review.competitors.length;
  }
}

/** Where a finding came from, in plain words. */
export function sourceLabel(locator: string | null): string {
  if (!locator) return "From your store";
  const page = /^page:\s*(.+)$/i.exec(locator.trim());
  if (page) return `From your ${page[1]} page`;
  if (/^homepage$/i.test(locator.trim())) return "From your homepage";
  if (/description/i.test(locator)) return "From your Shopify store description";
  if (/catalog/i.test(locator)) return "From your catalogue";
  if (/product/i.test(locator)) return "From your products";
  if (/collection/i.test(locator)) return "From your collections";
  return `From ${locator}`;
}

/** The research's brand-colours row (backend `research.STYLE_LABEL`). */
export const BRAND_COLOURS_LABEL = "Brand colours from Shopify";

/** Where a "Your look" row came from (SPEC-367). */
export function lookSource(style: { label: string }): string {
  return style.label === BRAND_COLOURS_LABEL ? "From your Shopify brand settings" : "From your store's photos";
}

const LOOK_SECTIONS: Record<string, string> = {
  palette: "Palette",
  light: "Light",
  composition: "Composition",
  styling: "Styling",
  safety: "How people are shown",
};

/** A "Your look" row's subtitle — its Style Guide section as an owner reads it. */
export function lookSubtitle(section: string | null): string | undefined {
  return section ? LOOK_SECTIONS[section] : undefined;
}

/** A label as an owner reads it — "tone" → "Tone". */
export function displayLabel(label: string): string {
  const trimmed = label.trim();
  return trimmed ? trimmed.charAt(0).toUpperCase() + trimmed.slice(1) : trimmed;
}

export function wordKindLabel(kind: "word_banned" | "word_required"): string {
  return kind === "word_banned" ? "Never use" : "Always write it as";
}

/** The fact sections as owners read them. */
const SECTION_TITLES: Record<string, string> = {
  identity: "Identity",
  product: "Products",
  policy: "Policy",
  market: "Markets",
  calendar: "Calendar",
  competitor: "Competitor",
  guardrail: "Guardrail",
  proof_point: "Proof point",
  voice: "Voice",
};

export function factSectionTitle(section: string): string {
  return SECTION_TITLES[section] ?? section.charAt(0).toUpperCase() + section.slice(1);
}

/** Should the toast hide a competitor run? Only the one this research run follows. */
export function hidesCompetitorRun(research: ResearchRun | null, competitorRunId: number | null): boolean {
  return Boolean(research && competitorRunId !== null && research.competitorRunId === competitorRunId);
}
