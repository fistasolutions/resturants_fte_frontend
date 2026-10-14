/** The Brand Researcher (backend SPEC-347, frontend SPEC-341). */

export type ResearchStatus = "running" | "done" | "failed";
export type ResearchStepState = "waiting" | "running" | "done" | "failed" | "skipped";
export type ResearchTrigger = "auto" | "owner";

export interface ResearchStep {
  key: string;
  label: string;
  state: ResearchStepState;
  /** Running: what it is doing now. Finished: its result, or why it was skipped or failed. */
  detail: string;
  /** SPEC-367 (backend SPEC-376): when the step started and finished; null from an older backend. */
  startedAt: string | null;
  finishedAt: string | null;
}

export interface ResearchFound {
  facts: number;
  personas: number;
  voice: number;
  words: number;
  style: number;
  competitors: number;
}

export interface ResearchRun {
  id: number;
  trigger: ResearchTrigger;
  status: ResearchStatus;
  steps: ResearchStep[];
  progress: number;
  found: ResearchFound;
  competitorRunId: number | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  seenAt: string | null;
}

export interface ReviewFact {
  id: number;
  section: string;
  label: string;
  value: string;
  status: "pending" | "conflict";
  locator: string | null;
  /** The approved value a conflicting fact would replace. */
  replaces: string | null;
}

export interface ReviewPersona {
  id: number;
  name: string;
  role: string;
  description: string;
  tags: string[];
}

export interface ReviewVoiceRule {
  id: number;
  title: string;
  detail: string;
}

export interface ReviewWord {
  id: number;
  kind: "word_banned" | "word_required";
  label: string;
  detail: string | null;
}

export interface ReviewStyle {
  id: number;
  section: string | null;
  label: string;
  detail: string | null;
}

export interface ReviewCompetitor {
  id: number;
  name: string;
  domain: string;
  positioning: string;
  why: string;
}

export interface ResearchReview {
  facts: ReviewFact[];
  personas: ReviewPersona[];
  voiceRules: ReviewVoiceRule[];
  words: ReviewWord[];
  style: ReviewStyle[];
  competitors: ReviewCompetitor[];
  counts: ResearchFound & { total: number };
  run: ResearchRun | null;
}
