import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { DocScreen } from "@/features/docs/doc-screen";
import { DocSection } from "@/features/docs/doc-section";
import { DocSteps } from "@/features/docs/doc-steps";
import { DOC_AREAS, docHref, docsForArea } from "@/lib/docs";
import {
  CONNECTED_SYSTEMS,
  FIRST_TEN_MINUTES,
  OVERVIEW_CONVENTIONS,
  OVERVIEW_FLOW,
  OVERVIEW_INTRO,
  OVERVIEW_PRINCIPLES,
  OVERVIEW_SCREENS,
} from "@/lib/docs/overview";
import { navItems } from "@/lib/navigation";

/** The sidebar icon for a doc, looked up by the route it documents. */
function iconFor(route: string) {
  return navItems.find((item) => item.href === route)?.icon ?? null;
}

/**
 * `/docs` — the "Start here" overview (SPEC-229): what the platform is, the
 * three principles, how it works end to end, the connected systems, the
 * conventions every page shares, the first ten minutes, and the index of every
 * feature doc by area.
 */
export function DocsOverview() {
  return (
    <div className="max-w-5xl space-y-12">
      <header className="max-w-3xl space-y-3">
        <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
          {OVERVIEW_INTRO.eyebrow}
        </p>
        <h1 className="font-heading text-3xl tracking-wide">{OVERVIEW_INTRO.title}</h1>
        {OVERVIEW_INTRO.paragraphs.map((paragraph) => (
          <p key={paragraph} className="text-sm leading-relaxed text-foreground/90">
            {paragraph}
          </p>
        ))}
      </header>

      <DocSection id="principles" title="Three rules every page obeys">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {OVERVIEW_PRINCIPLES.map((principle, index) => (
            <Card key={principle.title} className="gap-2 px-5 py-4">
              <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                Rule {index + 1}
              </p>
              <p className="text-sm font-semibold">{principle.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{principle.body}</p>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection id="how-it-works" title="How it works, end to end" lead="From a connected system to a measured decision.">
        <ol className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {OVERVIEW_FLOW.map((step, index) => (
            <li key={step.title} className="relative rounded-card border border-border px-4 py-3">
              <span className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
                Step {index + 1}
              </span>
              <p className="mt-1 text-sm font-semibold">{step.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{step.body}</p>
            </li>
          ))}
        </ol>
      </DocSection>

      <DocSection id="screens" title="What you will see" lead="Sign in, and the page every day starts on.">
        <div className="max-w-3xl space-y-6">
          {OVERVIEW_SCREENS.map((item) => (
            <DocScreen key={item.screen} screen={item.screen} title={item.title} caption={item.caption} />
          ))}
        </div>
      </DocSection>

      <DocSection id="connected-systems" title="Connected systems" lead="What each one feeds, and where it shows up.">
        <div className="overflow-x-auto rounded-card border border-border">
          <table className="w-full min-w-[40rem] text-sm">
            <thead className="bg-muted/50 text-left text-xs text-muted-foreground">
              <tr>
                <th scope="col" className="px-4 py-2 font-medium">System</th>
                <th scope="col" className="px-4 py-2 font-medium">Feeds</th>
                <th scope="col" className="px-4 py-2 font-medium">Pages</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CONNECTED_SYSTEMS.map((system) => (
                <tr key={system.name} className="align-top">
                  <td className="px-4 py-2.5 font-medium whitespace-nowrap">{system.name}</td>
                  <td className="px-4 py-2.5 leading-relaxed text-foreground/90">{system.feeds}</td>
                  <td className="px-4 py-2.5 leading-relaxed text-muted-foreground">{system.pages}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DocSection>

      <DocSection id="conventions" title="Conventions you will see everywhere">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {OVERVIEW_CONVENTIONS.map((convention) => (
            <Card key={convention.title} className="gap-2 px-5 py-4">
              <p className="text-sm font-semibold">{convention.title}</p>
              <p className="text-sm leading-relaxed text-muted-foreground">{convention.body}</p>
            </Card>
          ))}
        </div>
      </DocSection>

      <DocSection id="first-ten-minutes" title="Your first ten minutes" lead="A reading order for a first session.">
        <DocSteps steps={FIRST_TEN_MINUTES.map((step) => `${step.title} — ${step.body}`)} />
      </DocSection>

      <DocSection id="features" title="Every feature, by area" lead="One doc per sidebar destination. Each follows the same shape: what it is, why it matters, how it works, screens, how to use, benefits, good to know.">
        <div className="space-y-8">
          {DOC_AREAS.filter((area) => area.key !== "start").map((area) => {
            const docs = docsForArea(area.key);
            return (
              <div key={area.key} className="space-y-3">
                <div>
                  <h3 className="text-base font-semibold">{area.label}</h3>
                  <p className="text-sm text-muted-foreground">{area.summary}</p>
                </div>
                <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {docs.map((doc) => {
                    const Icon = iconFor(doc.route);
                    return (
                      <li key={doc.slug}>
                        <Link
                          href={docHref(doc.slug)}
                          className="group flex h-full flex-col gap-2 rounded-card border border-border px-4 py-3 transition-colors hover:bg-muted"
                        >
                          <span className="flex items-center gap-2 text-sm font-medium">
                            {Icon && <Icon className="size-4 text-muted-foreground" aria-hidden />}
                            {doc.title}
                            <ArrowRight
                              className="ml-auto size-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                              aria-hidden
                            />
                          </span>
                          <span className="line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                            {doc.tagline}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      </DocSection>
    </div>
  );
}
