import "server-only";

import { mergeReports } from "@/lib/ci";
import { CI_REPORTS as GENERATED } from "@/lib/ci/content";
import { CI_RECENT_REPORTS } from "@/lib/ci/content-recent";

/** The Continuous Innovation reports (SPEC-253) — the first client's own build history. Server
 * only (SPEC-323): a page reads them here, after the `/ci` layout has checked the organization's
 * `ci` feature, so they can never be pulled into a client bundle. `content.ts` is generated
 * (`tools/build_ci_content.py`) and never hand-edited; `content-recent.ts` holds the reports
 * written from the record since Sep 26 (SPEC-369). This module is their only importer. */
export const CI_REPORTS = mergeReports(GENERATED, CI_RECENT_REPORTS);
