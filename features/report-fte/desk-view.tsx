"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowRight, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { TemplateCard } from "@/features/report-fte/template-card";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { isGuided } from "@/lib/company-switches";
import { deskTemplates } from "@/lib/report-fte";
import { REPORT_FTE_BASE, composerHref } from "@/lib/report-fte-tabs";
import type { DeskData } from "@/types/report-fte";

interface Props {
  data: DeskData;
}

const DEFAULT_ASK =
  "Every Monday 7am, a returns report by brand for the buyer — return rate, top reasons, margin after returns, versus last year — as PDF to Sara and in the app.";

/**
 * Report FTE → Desk (SPEC-256; live since SPEC-285; the ask as a prompt since
 * SPEC-286; two things only since SPEC-289): the ask block with room above it, then
 * the templates at full width. What was delivered and what is scheduled live on the
 * Delivered tab, the employee's card on Profile — the owner wants nothing else here.
 * "Build it" moves to the Composer at once, which plans there.
 */
export function DeskView({ data }: Props) {
  const router = useRouter();
  const [ask, setAsk] = useState(DEFAULT_ASK);
  // SPEC-365: a guided workspace is offered only templates its connected data can run.
  const { visibility, connected } = useWorkspace();
  const offer = deskTemplates(data, isGuided(visibility), new Set(connected));

  /** Straight to the Composer (SPEC-286): the route paints its skeleton at once and
   * creates the run there — the Desk never waits on the backend. */
  function build() {
    router.push(composerHref(ask));
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="mx-auto w-full max-w-3xl pt-6 md:pt-10" aria-labelledby="report-fte-ask-title">
        <p className="text-center text-[10px] font-extrabold uppercase tracking-widest text-ai">Report Builder · your ask</p>
        <h2 id="report-fte-ask-title" className="mt-1 text-center text-2xl font-semibold tracking-tight text-foreground">
          What report do you need?
        </h2>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          Say it as you would to a person — what, for whom, how often, in which format.
        </p>
        <form
          className="mt-5 flex flex-col gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            build();
          }}
        >
          <label htmlFor="report-fte-ask" className="sr-only">
            Tell the Report Builder the report you want
          </label>
          <div className="rounded-2xl border border-border bg-card p-3 shadow-sm transition-colors focus-within:border-ai focus-within:ring-4 focus-within:ring-ai/10">
            <div className="flex items-start gap-3">
              <span aria-hidden className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-foreground text-background">
                <NotebookPen className="size-4" />
              </span>
              <Textarea
                id="report-fte-ask"
                value={ask}
                onChange={(e) => setAsk(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    build();
                  }
                }}
                placeholder="Every Monday 7am, a returns report by brand for the buyer — as PDF to sara@…"
                rows={3}
                className="min-h-16 resize-none border-0 bg-transparent px-0 py-1 text-base shadow-none focus-visible:ring-0 md:text-base"
              />
            </div>
            <div className="mt-2 flex items-center justify-between gap-3 border-t border-border pt-2">
              <p className="text-[11px] text-muted-foreground">
                <kbd className="rounded-sm border border-border bg-background px-1 font-sans text-[10px] font-semibold">Enter</kbd> to build ·{" "}
                <kbd className="rounded-sm border border-border bg-background px-1 font-sans text-[10px] font-semibold">Shift+Enter</kbd> for a new line
              </p>
              <Button type="submit" className="shrink-0 bg-ai text-ai-foreground hover:bg-ai/90">
                Build it
                <ArrowRight className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap justify-center gap-2" aria-label="Example asks">
            {data.exampleAsks.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => setAsk(example)}
                className="rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {example}
              </button>
            ))}
          </div>
        </form>
      </section>

      <Card className="gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-foreground">Templates</h2>
            <p className="text-xs text-muted-foreground">
              Each is a page the platform already has, as a reusable shape. Customise any of
              them, or start from the question box.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={`${REPORT_FTE_BASE}/templates`}>All {offer.total}</Link>
          </Button>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {offer.templates.map((template) => (
            <TemplateCard key={template.id} template={template} />
          ))}
        </div>
      </Card>
    </div>
  );
}
