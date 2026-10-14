import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DocChecklist } from "@/features/docs/doc-checklist";
import { DocNotes } from "@/features/docs/doc-notes";
import { DocPager } from "@/features/docs/doc-pager";
import { DocRail } from "@/features/docs/doc-rail";
import { DocRelated } from "@/features/docs/doc-related";
import { DocScreen } from "@/features/docs/doc-screen";
import { DocScreensList } from "@/features/docs/doc-screens-list";
import { DocSection } from "@/features/docs/doc-section";
import { DocSteps } from "@/features/docs/doc-steps";
import { DocValueCards } from "@/features/docs/doc-value-cards";
import { getDocArea } from "@/lib/docs";
import type { DocScreenKey } from "@/lib/docs/screens";
import type { FeatureDoc } from "@/types/docs";

/**
 * One feature doc, in the fixed section order every doc shares (SPEC-229):
 * header → hero → what it is → why it matters → how it works → screens & tabs →
 * how to use → benefits → good to know → related → pager. A right rail carries
 * the anchors and quick facts on wide screens.
 */
export function DocArticle({ doc }: { doc: FeatureDoc }) {
  const area = getDocArea(doc.area);

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_16rem]">
      <article className="min-w-0 max-w-3xl space-y-12">
        <header className="space-y-4">
          <div className="space-y-2">
            <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
              {area.label}
            </p>
            <h1 className="font-heading text-3xl tracking-wide">{doc.title}</h1>
            <p className="text-base leading-relaxed text-muted-foreground">{doc.tagline}</p>
          </div>
          <Button asChild variant="outline" size="sm">
            <Link href={doc.route}>
              Open {doc.title} in the app
              <ArrowUpRight aria-hidden />
            </Link>
          </Button>
          <DocScreen
            screen={doc.hero as DocScreenKey}
            title={doc.title}
            caption={doc.heroCaption}
            priority
          />
        </header>

        <DocSection id="what-it-is" title="What it is">
          <div className="space-y-3">
            {doc.whatItIs.map((paragraph) => (
              <p key={paragraph} className="text-sm leading-relaxed text-foreground/90">
                {paragraph}
              </p>
            ))}
          </div>
        </DocSection>

        <DocSection id="why-it-matters" title="Why it matters" lead="The problem, and what this changes about it.">
          <DocValueCards values={doc.whyItMatters} />
        </DocSection>

        <DocSection
          id="how-it-works"
          title="How it works"
          lead="Where the data comes from, what the backend computes, what the AI does, and what you do."
        >
          <DocSteps steps={doc.howItWorks} />
        </DocSection>

        <DocSection id="screens" title="Screens & tabs" lead="Every tab and sub-screen, with its capture.">
          <DocScreensList sections={doc.sections} />
        </DocSection>

        <DocSection id="how-to-use" title="How to use it" lead="A walkthrough, in order.">
          <DocSteps steps={doc.howToUse} />
        </DocSection>

        <DocSection id="benefits" title="Benefits">
          <DocChecklist items={doc.benefits} />
        </DocSection>

        <DocSection id="good-to-know" title="Good to know" lead="Limits, cadence, prerequisites, and what it deliberately does not do.">
          <DocNotes notes={doc.goodToKnow} />
        </DocSection>

        <DocSection id="related" title="Related">
          <DocRelated doc={doc} />
        </DocSection>

        <DocPager slug={doc.slug} />
      </article>

      <DocRail doc={doc} />
    </div>
  );
}
