/** Continuous Innovation (SPEC-253) — the shape `tools/build_ci_content.py` writes. */

export type CiKind = "engagement" | "weekly" | "daily";

export interface CiShot {
  route: string;
  caption: string;
  src: string;
  width: number;
  height: number;
}

/** One "what is inside it" line: `text` for the business view (identifiers scrubbed,
 * evidence sentences removed), `full` for the technical view. */
export interface CiLine {
  text: string;
  full: string;
  /** Nothing business-readable is left — the business view hides it. */
  technical: boolean;
}

export interface CiSection {
  n: string;
  title: string;
  sub: string;
  /** The sub line names specs and files — hidden in the business view. */
  subTechnical: boolean;
  ask: string;
  status: string;
  effort: string | null;
  inside: CiLine[];
  built: string;
  why: string;
  value: string;
  shots: CiShot[];
}

export interface CiPair {
  title: string;
  body: string;
  /** Names the machinery rather than the outcome — hidden in the business view. */
  technical: boolean;
}

export interface CiTier {
  name: string;
  change: string;
  why: string;
}

export interface CiPage {
  src: string;
  width: number;
  height: number;
}

export interface CiReport {
  id: string;
  kind: CiKind;
  period: string;
  /** ISO date the report covers up to — the feed and rail sort on it. */
  sortDate: string;
  /** The headline the card leads with. */
  hook: string;
  /** The report's own cover lede — the value memo. */
  memo: string;
  effort: string | null;
  views: string;
  areas: number;
  days: CiPair[];
  sections: CiSection[];
  tiers: CiTier[];
  next: CiPair[];
  cautions: CiPair[];
  /** Printed pages, for a report that exists only as a PDF. */
  pages: CiPage[];
}
