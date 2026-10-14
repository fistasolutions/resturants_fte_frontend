import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DOC_ANCHORS, formatUpdated } from "@/lib/docs";
import type { FeatureDoc } from "@/types/docs";

/**
 * The article's right rail (SPEC-229): "On this page" anchors and the quick facts
 * — route, sources, refresh cadence, last confirmed. Sticky on wide screens; the
 * article grid stacks it above the prose on narrow ones.
 */
export function DocRail({ doc }: { doc: FeatureDoc }) {
  return (
    <aside className="space-y-4 lg:sticky lg:top-6">
      <Card className="gap-3 px-4 py-4">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          Quick facts
        </p>
        <dl className="space-y-3 text-sm">
          <div>
            <dt className="text-xs text-muted-foreground">Open in app</dt>
            <dd>
              <Link
                href={doc.route}
                className="inline-flex items-center gap-1 font-mono text-xs font-medium text-primary underline decoration-primary/40 decoration-2 underline-offset-4 hover:decoration-primary"
              >
                {doc.route}
                <ArrowUpRight className="size-3" aria-hidden />
              </Link>
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Data sources</dt>
            <dd className="mt-1 flex flex-wrap gap-1">
              {doc.sources.map((source) => (
                <Badge key={source} variant="secondary">
                  {source}
                </Badge>
              ))}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Refresh</dt>
            <dd className="leading-relaxed">{doc.refresh}</dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Last confirmed against the app</dt>
            <dd>
              <time dateTime={doc.updated}>{formatUpdated(doc.updated)}</time>
            </dd>
          </div>
        </dl>
      </Card>

      <nav aria-label="On this page" className="hidden lg:block">
        <p className="mb-2 text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          On this page
        </p>
        <ul className="space-y-1 border-l border-border">
          {DOC_ANCHORS.map((anchor) => (
            <li key={anchor.id}>
              <a
                href={`#${anchor.id}`}
                className="-ml-px block border-l border-transparent py-1 pl-3 text-sm text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                {anchor.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
