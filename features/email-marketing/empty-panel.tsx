import type { LucideIcon } from "lucide-react";

/** One clean empty state for an Email Marketing tab that has no data yet (SPEC-345 patch
 * 2026-10-14) — so a just-connected store reads as "nothing yet, here is why", never a blank
 * chart or a row of empty boxes. */
export function EmptyPanel({ icon: Icon, title, children }: { icon?: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="grid place-items-center gap-2 rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
      {Icon ? <Icon className="size-8 text-muted-foreground" aria-hidden /> : null}
      <p className="text-sm font-semibold">{title}</p>
      {children ? <p className="max-w-md text-sm text-muted-foreground">{children}</p> : null}
    </div>
  );
}
