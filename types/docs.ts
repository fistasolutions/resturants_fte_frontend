/**
 * In-app product documentation (SPEC-229).
 *
 * Every feature doc is one `FeatureDoc` — the same sections in the same order, so a
 * reader skims any of them the same way and a doc cannot be saved with a section
 * missing. The prose lives in `lib/docs/content/<slug>.ts`; this file is the contract
 * those files satisfy and root Rule 11 enforces.
 */

/** The seven area tabs on `/docs`, in bar order. */
export type DocAreaKey =
  | "start"
  | "command"
  | "merchandising"
  | "operations"
  | "customers"
  | "growth"
  | "platform";

export interface DocArea {
  key: DocAreaKey;
  label: string;
  /** One line under the area tab: what these features have in common. */
  summary: string;
}

/** A captured screen under `public/docs/`, keyed by file stem. */
export interface DocScreen {
  src: string;
  width: number;
  height: number;
}

/** A tab or sub-screen of the feature — one block under "Screens & tabs". */
export interface DocSection {
  title: string;
  /** In-app route of this tab/screen, where it has one of its own. */
  route?: string;
  /** What the reader sees there, in one or two sentences. */
  summary: string;
  /** What is on it — bullets, one fact each. */
  details: string[];
  /** Registry key of its capture; omitted when no capture exists yet. */
  screen?: string;
}

/** One business-value card: the problem, and what this feature changes about it. */
export interface DocValue {
  title: string;
  body: string;
}

export interface FeatureDoc {
  /** Route segment under `/docs/`. Matches the app route's first segment. */
  slug: string;
  /** Sidebar title, verbatim. */
  title: string;
  /** The app route the doc describes — the "Open in app" target. */
  route: string;
  area: DocAreaKey;
  /** One line under the title. */
  tagline: string;
  /** Where the data on this page comes from, as short labels. */
  sources: string[];
  /** How often what it shows is refreshed. */
  refresh: string;
  /** ISO date the doc was last confirmed against the app (root Rule 11). */
  updated: string;
  /** Landing screen's registry key. */
  hero: string;
  heroCaption: string;
  /** Plain-language paragraphs. */
  whatItIs: string[];
  /** 2–4 cards. */
  whyItMatters: DocValue[];
  /** The mechanism as ordered steps. */
  howItWorks: string[];
  /** One block per tab / sub-screen. */
  sections: DocSection[];
  /** Numbered tutorial. */
  howToUse: string[];
  /** Outcomes checklist. */
  benefits: string[];
  /** Limits, cadence, prerequisites, deliberate non-features. */
  goodToKnow: string[];
  /** Slugs of sibling docs worth reading next. */
  related: string[];
}
