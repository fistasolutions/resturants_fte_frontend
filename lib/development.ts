/** Franchise development's pure half (frontend SPEC-395 / backend SPEC-416). */
import type { OpeningStage, ProspectStage } from "@/types/restaurant-os";

export const PROSPECT_STAGES: ProspectStage[] = ["inquiry", "qualified", "discovery_day", "approved", "signed", "lost"];
export const PROSPECT_LABELS: Record<ProspectStage, string> = {
  inquiry: "Inquiry",
  qualified: "Qualified",
  discovery_day: "Discovery day",
  approved: "Approved",
  signed: "Signed",
  lost: "Lost",
};
export const OPENING_STAGES: OpeningStage[] = ["site_search", "lease_signed", "permits", "build_out", "training", "open", "dropped"];
export const OPENING_LABELS: Record<OpeningStage, string> = {
  site_search: "Site search",
  lease_signed: "Lease signed",
  permits: "Permits",
  build_out: "Build-out",
  training: "Training",
  open: "Open",
  dropped: "Dropped",
};

/** The stages a prospect can be moved to by hand (signing has its own button). */
export function movableProspectStages(current: ProspectStage): ProspectStage[] {
  if (current === "signed") return [];
  return PROSPECT_STAGES.filter((s) => s !== "signed" && s !== current);
}

/** The stages an opening can be moved to by hand (opening has its own button). */
export function movableOpeningStages(current: OpeningStage): OpeningStage[] {
  if (current === "open") return [];
  return OPENING_STAGES.filter((s) => s !== "open" && s !== current);
}
