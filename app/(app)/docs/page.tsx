import type { Metadata } from "next";

import { DocsOverview } from "@/features/docs/docs-overview";

export const metadata: Metadata = { title: "Docs" };

/** `/docs` — the "Start here" overview. Static content; no data fetch. */
export default function DocsPage() {
  return <DocsOverview />;
}
