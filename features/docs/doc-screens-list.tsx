import Link from "next/link";
import { ArrowUpRight, ImageOff } from "lucide-react";

import { DocScreen } from "@/features/docs/doc-screen";
import { sectionAnchor } from "@/lib/docs";
import type { DocScreenKey } from "@/lib/docs/screens";
import type { DocSection } from "@/types/docs";

/** Dynamic segments (`/orders/[id]`) are not navigable; only a concrete route
 * gets an "Open" link. */
function isConcreteRoute(route: string): boolean {
  return !route.includes("[");
}

/**
 * "Screens & tabs" — one block per tab or sub-screen of the feature: title, its
 * route, what it shows, the details, and its capture where one exists. A tab
 * with no capture yet says so in a muted note rather than showing an empty frame
 * (SPEC-229).
 */
export function DocScreensList({ sections }: { sections: DocSection[] }) {
  return (
    <div className="space-y-10">
      {sections.map((section) => {
        const anchor = sectionAnchor(section.title);
        return (
          <article key={anchor} id={anchor} aria-labelledby={`${anchor}-heading`} className="scroll-mt-24 space-y-3">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h3 id={`${anchor}-heading`} className="text-base font-semibold">
                {section.title}
              </h3>
              {section.route &&
                (isConcreteRoute(section.route) ? (
                  <Link
                    href={section.route}
                    className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {section.route}
                    <ArrowUpRight className="size-3" aria-hidden />
                  </Link>
                ) : (
                  <span className="font-mono text-xs text-muted-foreground">{section.route}</span>
                ))}
            </div>
            <p className="text-sm leading-relaxed text-foreground/90">{section.summary}</p>
            {section.details.length > 0 && (
              <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
                {section.details.map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            )}
            {section.screen ? (
              <DocScreen
                screen={section.screen as DocScreenKey}
                title={section.title}
                caption={section.summary}
              />
            ) : (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <ImageOff className="size-3.5" aria-hidden />
                No capture of this screen yet — the next capture run will add one.
              </p>
            )}
          </article>
        );
      })}
    </div>
  );
}
