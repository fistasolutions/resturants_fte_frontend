"use client";

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { BlogDetail } from "@/features/spotlight/blog-detail";
import { useApiQuery } from "@/hooks/use-api-query";
import { ApiError } from "@/lib/api-error";
import { spotlightQueries } from "@/lib/queries/spotlight";
import { jsonLdScriptContent } from "@/lib/spotlight";

/** One Spotlight draft (SPEC-109/165), read from the client cache (SPEC-230). */
export function DraftPageView({ slug }: { slug: string }) {
  const draft = useApiQuery(spotlightQueries.draft(slug));

  if (draft.isPending) {
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-3/4" />
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </main>
    );
  }
  if (draft.isError) {
    const err = draft.error;
    const message =
      err instanceof ApiError && err.status === 404
        ? "This draft doesn't exist or has been removed."
        : err instanceof ApiError
          ? `Could not load this draft (${err.status}) — try refreshing.`
          : "Could not load this draft — check your connection and try again.";
    return (
      <main className="space-y-6 p-4 md:p-6">
        <Link
          href="/spotlight?tab=inbound"
          className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          Back to drafts
        </Link>
        <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
          {message}
        </div>
      </main>
    );
  }

  const data = draft.data;
  // Canonicalize the URL (SPEC-165 Patch). The backend resolves an id OR a
  // handle, which keeps old links alive — but an id entry point would otherwise
  // leave the reader sitting on `/draft/15`. Redirecting here normalizes EVERY
  // entry point instead of chasing each call site.
  if (data.handle && slug !== data.handle) {
    redirect(`/spotlight/draft/${data.handle}`);
  }

  // SPEC-124: schema.org JSON-LD (Article + FAQPage) so the in-app page is
  // machine-readable too. `<` is scrubbed to its unicode escape to prevent XSS.
  const jsonLd = jsonLdScriptContent(data.jsonLd ?? []);

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
      <BlogDetail draft={data} />
    </>
  );
}
