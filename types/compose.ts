/** Shared draft-preview-confirm-send contract (SPEC-066; backend SPEC-062).
 * `attachment` is null for content that isn't a table (e.g. a single
 * dead-inventory alert). */
export interface ComposeAttachment {
  columns: string[];
  rows: (string | number)[][];
}

/** One location's row in the bulk "Send All Remaining" review.
 * `location_id` (backend SPEC-242) is the settings key a missing recipient
 * deep-links to; null only for the overdue "unattributed" bucket. */
export interface ComposeLocation {
  location_id: number | null;
  name: string;
  recipient: string | null;
  row_count: number;
  attachment: ComposeAttachment;
}

export interface ComposeDraft {
  subject: string;
  body: string;
  generated_by: "ai" | "fallback" | "skipped";
  recipient: string | null;
  /** The recipient's location when the page itself only knows the order
   * (discount review, backend SPEC-242). Absent on store-level flows. */
  location_id?: number | null;
  locations: ComposeLocation[];
  attachment: ComposeAttachment | null;
  summary: Record<string, unknown>;
}

/** One past send's actual content (SPEC-064; recipient/attachment added
 * backend SPEC-066, click-to-view frontend SPEC-071) — shown in the
 * compose page's history sidebar.
 * `location_name` is optional since some history endpoints (dead-inventory)
 * key by product+location instead. `recipient` is the location's *current*
 * manager email, not necessarily who received this specific historical
 * send (never persisted per-send). `attachment` is null when none was
 * stored (always the case for dead-inventory history). */
export interface ComposeHistoryItem {
  id: number;
  subject: string | null;
  body: string | null;
  sent_at: string;
  location_name?: string;
  recipient: string | null;
  attachment: ComposeAttachment | null;
  [key: string]: unknown;
}
