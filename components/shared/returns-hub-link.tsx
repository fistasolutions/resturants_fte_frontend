import Link from "next/link";
import { RotateCcw, ArrowRight } from "lucide-react";

/**
 * SPEC-154 — a single tokened cross-link from a returns *slice*
 * (`/orders/returns`, `/products/returns`, `/orders/returns-spike`) back to the
 * canonical Returns Analytics hub at `/returns`. Stateless: it never carries the
 * slice's query params onward. Reused so every slice points home the same way.
 */
export function ReturnsHubLink({ className }: { className?: string }) {
  return (
    <Link
      href="/returns"
      className={`inline-flex w-fit items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted ${className ?? ""}`}
    >
      <RotateCcw className="size-4 text-muted-foreground" aria-hidden />
      View full Returns Analytics
      <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
    </Link>
  );
}
