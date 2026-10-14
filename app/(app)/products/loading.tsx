import { Skeleton } from "@/components/ui/skeleton";

/**
 * Content-only skeleton for the Product Analyst tabs (SPEC-090). The header and
 * tab bar live in the persistent shell (`ProductShell`) and stay painted across
 * a tab switch, so this fallback fills only the content area below them — the tab
 * bar no longer blinks out on navigation.
 */
export default function ProductsLoading() {
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-24 rounded-2xl" />
        ))}
      </div>

      <Skeleton className="h-48 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
      <Skeleton className="h-96 rounded-2xl" />
    </>
  );
}
