import { Skeleton } from "@/components/ui/skeleton";

/**
 * Overview-tab skeleton (SPEC-085; SPEC-100 per-tab tailoring). The header + tab
 * bar live in the persistent shell, so this fills only the content: the four
 * verdict tiles + the AI verdict block — matching what Overview actually loads,
 * so there's no layout shift when the real content arrives.
 */
export default function InventoryOverviewLoading() {
  return (
    <>
      {Array.from({ length: 2 }, (_, row) => (
        <div key={row} className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ))}
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-72 rounded-2xl" />
    </>
  );
}
