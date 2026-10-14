import { CheckCircle2 } from "lucide-react";

/** The Decisions panel's empty state — a flat success-tinted block inside the panel
 * (SPEC-231), not a card of its own. */
export function NoDecisionsState() {
  return (
    <div className="space-y-2 bg-success/5 px-4 py-6 text-center">
      <div className="flex justify-center">
        <CheckCircle2 className="size-8 text-success" aria-hidden />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold">All clear — no decisions needed today</p>
        <p className="mx-auto max-w-sm text-sm text-muted-foreground">
          No unfulfilled orders, no inventory imbalances, and no dormant VIPs require
          your attention right now. Check back tomorrow.
        </p>
      </div>
    </div>
  );
}
