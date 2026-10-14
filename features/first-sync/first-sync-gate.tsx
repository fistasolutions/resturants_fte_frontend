"use client";

import { usePathname } from "next/navigation";
import { LoaderCircle } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { pageKey, pageLabel, pathReady } from "@/lib/first-sync";

import { useFirstSync } from "./first-sync-provider";

/**
 * Progressive reveal (SPEC-314): while the first sync runs, a page whose data has not landed
 * waits here calmly instead of showing empty tables or errors — and opens by itself the moment
 * its step finishes (the provider's state changes; this re-renders). Ungated pages pass through.
 */
export function FirstSyncGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { payload } = useFirstSync();
  if (pathReady(pathname, payload)) return <>{children}</>;
  return (
    <main className="flex flex-1 flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center gap-2 text-sm text-muted-foreground" role="status">
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
        Your {pageLabel(pageKey(pathname))} are still syncing — this page opens by itself when
        they land.
      </div>
      <div className="grid gap-4 md:grid-cols-3" aria-hidden>
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </div>
      <Skeleton className="h-64 rounded-2xl" aria-hidden />
    </main>
  );
}
