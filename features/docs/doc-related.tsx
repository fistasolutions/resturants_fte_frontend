import Link from "next/link";

import { docHref, relatedDocs } from "@/lib/docs";
import type { FeatureDoc } from "@/types/docs";

/** "Related" — sibling docs worth reading next, as cards with their taglines. */
export function DocRelated({ doc }: { doc: FeatureDoc }) {
  const related = relatedDocs(doc);
  if (related.length === 0) return null;
  return (
    <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {related.map((item) => (
        <li key={item.slug}>
          <Link
            href={docHref(item.slug)}
            className="block h-full rounded-card border border-border px-4 py-3 transition-colors hover:bg-muted"
          >
            <span className="block text-sm font-medium">{item.title}</span>
            <span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-muted-foreground">
              {item.tagline}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
