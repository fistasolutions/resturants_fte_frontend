import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content-only skeleton for the Gorgias workspace tabs (SPEC-094). The header,
 * date picker, and tab bar live in the persistent shell (`GorgiasShell` via
 * layout.tsx) and stay painted across a tab switch, so this Suspense fallback
 * fills only the tab body below them — navigation commits instantly and shows a
 * skeleton while the route's data loads, instead of hanging on the old tab.
 */
export default function TeamPerformanceLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-96 rounded-2xl" />
    </div>
  );
}
