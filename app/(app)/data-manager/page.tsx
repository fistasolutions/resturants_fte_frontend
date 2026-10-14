import type { Metadata } from "next";
import { Suspense } from "react";

import { DataManagerView } from "@/features/data-manager/data-manager-view";
import { DataManagerSkeleton } from "@/features/data-manager/skeleton";
import { DATA_MANAGER_TITLE } from "@/lib/data-manager";

export const metadata: Metadata = { title: DATA_MANAGER_TITLE };

/** Content only — the header and tabs live in the persistent shell (SPEC-232). The tab is read in
 * the browser and moved with shallow links (SPEC-301). */
export default function DataManagerPage() {
  return (
    <Suspense fallback={<DataManagerSkeleton />}>
      <DataManagerView />
    </Suspense>
  );
}
