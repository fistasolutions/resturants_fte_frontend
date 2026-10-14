import type { PageLink } from "@/lib/integration-catalog";

/** The pages a connection feeds, as quiet chips — a count stands in for the rest. */
export function PowersChips({ powers, max = 3 }: { powers: PageLink[]; max?: number }) {
  const shown = powers.slice(0, max);
  const more = powers.length - shown.length;
  return (
    <span className="flex min-w-0 flex-wrap gap-1.5">
      {shown.map((page) => (
        <span key={page.href} className="rounded-md bg-muted px-2 py-0.5 text-xs whitespace-nowrap">
          {page.label}
        </span>
      ))}
      {more > 0 ? (
        <span className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground">+{more}</span>
      ) : null}
    </span>
  );
}
