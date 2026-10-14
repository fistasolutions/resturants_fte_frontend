import type { Metadata } from "next";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { TemplateEditorTab } from "@/features/report-fte/report-fte-tab-pages";
import { reportFteQueries } from "@/lib/queries/report-fte";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Template editor" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ templateId: string }>;
}

/** Report FTE → Templates → one template (SPEC-256). The Templates tab stays active. */
export default async function Page({ params }: PageProps) {
  const { templateId } = await params;
  const queryClient = getQueryClient();
  prefetch(queryClient, reportFteQueries.template(templateId));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <TemplateEditorTab templateId={templateId} />
    </HydrationBoundary>
  );
}
