/** Shared error card for the Store Traffic tabs (SPEC-112) — a fetch failure
 * degrades to this instead of crashing the page. */
export function TrafficError() {
  return (
    <div className="rounded-card border border-destructive/30 bg-destructive/5 p-6 text-sm text-muted-foreground">
      We couldn&apos;t load store traffic right now. Try again shortly.
    </div>
  );
}
