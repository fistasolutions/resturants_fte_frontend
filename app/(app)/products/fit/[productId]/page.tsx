import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";

import { FitStyleView } from "@/features/fit/fit-style-view";
import { fitQueries } from "@/lib/queries/fit";
import { getQueryClient } from "@/lib/query-client";
import { prefetch } from "@/lib/server-prefetch";

export const metadata: Metadata = { title: "Style fit" };
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ productId: string }>;
}

/** One style's fit and size guide (SPEC-306) — its own page, with the breadcrumb. */
export default async function Page({ params }: PageProps) {
  const id = Number((await params).productId);
  if (!Number.isInteger(id) || id <= 0) notFound();
  const queryClient = getQueryClient();
  prefetch(queryClient, fitQueries.style(id));
  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <FitStyleView productId={id} />
    </HydrationBoundary>
  );
}
