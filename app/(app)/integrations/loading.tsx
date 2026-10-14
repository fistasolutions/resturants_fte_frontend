import { Skeleton } from "@/components/ui/skeleton";

/** Content-only fallback (SPEC-232): the header is painted by the layout shell, so this
 * never draws a second one — the health strip, then the tabbed list (SPEC-328). */
export default function IntegrationsLoading() {
  return (
    <div className="space-y-6" aria-label="Loading integrations">
      <Skeleton className="h-36 rounded-2xl" />
      <div>
        <div className="flex gap-1 px-1 pt-1" aria-hidden>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-32 rounded-b-none" />
          ))}
        </div>
        <div className="folder-panel">
          <Skeleton className="h-9 max-w-md" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      </div>
    </div>
  );
}
