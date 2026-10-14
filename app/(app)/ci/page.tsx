import type { Metadata } from "next";
import { Suspense } from "react";

import { PageSkeleton } from "@/components/shared/page-skeleton";
import { CiFeed } from "@/features/ci/ci-feed";
import { CI_REPORTS } from "@/lib/ci/reports";

export const metadata: Metadata = { title: "Continuous Innovation" };

/** The feed is server-only content (SPEC-253, SPEC-323) — no fetch, no cache, never in a client bundle.
 * The filters live in the URL, so the feed reads `useSearchParams` behind a boundary. */
export default function Page() {
  return (
    <Suspense fallback={<PageSkeleton blocks={3} />}>
      <CiFeed reports={CI_REPORTS} />
    </Suspense>
  );
}
