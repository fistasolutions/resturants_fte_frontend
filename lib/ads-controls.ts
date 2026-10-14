/**
 * Pure validation for the Performance Ads controls (SPEC-183).
 *
 * Lives in `lib/` so Vitest covers it — the components stay presentational, which is
 * how this repo satisfies "no component test runner exists yet" (root Rule 4).
 *
 * These are guards against operator slips on a page that configures money, not a
 * replacement for the backend's own validation. The backend rejects a negative cap at
 * its schema boundary regardless; this just says so before the round trip.
 */

export interface CampaignDraftInput {
  name: string;
  channel: string;
  objective: string;
  persona: string;
  offer: string;
  dailyCap: string;
  totalCap: string;
}

/** A field-keyed error map; empty means valid. */
export type ValidationErrors = Partial<Record<keyof CampaignDraftInput, string>>;

function parseMoney(value: string): number | null {
  const trimmed = value.trim();
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function validateCampaignDraft(input: CampaignDraftInput): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!input.name.trim()) errors.name = "Give the campaign a name.";
  if (!input.objective.trim()) errors.objective = "What is this campaign for?";
  if (!input.persona.trim()) errors.persona = "Who is it targeting?";
  if (!input.offer.trim()) errors.offer = "What is it promoting?";
  if (input.channel !== "meta" && input.channel !== "google") {
    errors.channel = "Pick Meta or Google.";
  }

  const daily = parseMoney(input.dailyCap);
  const total = parseMoney(input.totalCap);
  if (daily === null || daily <= 0) {
    // Zero is not "unlimited" — the backend treats an unset daily cap as "may not
    // spend", so a campaign created with 0 could never run.
    errors.dailyCap = "Set a daily cap above 0.";
  }
  if (total === null || total < 0) {
    errors.totalCap = "Set a total cap of 0 or more.";
  } else if (daily !== null && total > 0 && daily > total) {
    errors.totalCap = "The total cap cannot be lower than the daily cap.";
  }
  return errors;
}

export function isValid(errors: ValidationErrors): boolean {
  return Object.keys(errors).length === 0;
}

/** The monthly store ceiling. Zero is allowed and means "no ceiling configured" —
 * per-campaign caps still apply — so it is not an error, just permissive. */
export function validateMonthlyCap(value: string): string | null {
  const parsed = parseMoney(value);
  if (parsed === null) return "Enter an amount.";
  if (parsed < 0) return "A cap cannot be negative.";
  return null;
}
