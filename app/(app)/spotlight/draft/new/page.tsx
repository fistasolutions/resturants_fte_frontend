import { Suspense } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import type { Metadata } from "next";

import { BlogDraftStreaming } from "@/features/spotlight/blog-draft-streaming";

export const metadata: Metadata = { title: "Search Visibility · Writing draft" };
export const dynamic = "force-dynamic";

interface NewDraftPageProps {
  searchParams: Promise<{ query_id?: string; keyword?: string }>;
}

/**
 * Live "new draft" surface (SPEC-115 Patches). A thin server page that reads the
 * generation input from the URL — `?query_id=<id>` or `?keyword=<text>` — and
 * hands it to the client streaming component, which opens the SSE stream on
 * mount and renders the article body live (identical to the refine loop), then
 * `router.replace`s onto the real saved draft when `draft_id` arrives.
 *
 * The client component is wrapped in `<Suspense>` (Next 16). Reading
 * `searchParams` here (a server prop) avoids a client `useSearchParams()` and
 * its extra boundary.
 */
export default async function NewDraftPage({ searchParams }: NewDraftPageProps) {
  const { query_id, keyword } = await searchParams;

  const parsedId = query_id != null ? Number(query_id) : NaN;
  const hasQueryId = Number.isInteger(parsedId) && parsedId > 0;
  const trimmedKeyword = typeof keyword === "string" ? keyword.trim() : "";

  if (!hasQueryId && !trimmedKeyword) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Link
          href="/spotlight?tab=inbound"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to Inbound Engine
        </Link>
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
          Nothing to write — pick a query from the Inbound Engine and choose
          &ldquo;Generate draft.&rdquo;
        </div>
      </main>
    );
  }

  return (
    <Suspense>
      <BlogDraftStreaming
        queryId={hasQueryId ? parsedId : undefined}
        keyword={hasQueryId ? undefined : trimmedKeyword}
      />
    </Suspense>
  );
}
