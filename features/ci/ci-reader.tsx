"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { RichText } from "@/features/ci/rich-text";
import { CI_DETAIL_KEY, hiddenCount, KIND_LABEL, reportsByMonth, sectionAnchor, tocFor, visibleLines, visiblePairs } from "@/lib/ci";
import type { CiReport, CiSection } from "@/lib/ci/types";
import { cn } from "@/lib/utils";
import { PRODUCT } from "@/lib/product";

const LABEL = "text-[10px] font-semibold tracking-widest text-muted-foreground uppercase";

/* The toggle's store: localStorage behind `useSyncExternalStore`, so the server renders
 * the business view and the browser reads its own choice without a state-in-effect. */
const DETAIL_EVENT = "ci:technical-detail";
function readDetail(): boolean {
  try {
    return window.localStorage.getItem(CI_DETAIL_KEY) === "1";
  } catch {
    return false;
  }
}
function subscribeDetail(onChange: () => void): () => void {
  window.addEventListener("storage", onChange);
  window.addEventListener(DETAIL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(DETAIL_EVENT, onChange);
  };
}
function toggleTechnical(on: boolean): void {
  try {
    window.localStorage.setItem(CI_DETAIL_KEY, on ? "1" : "0");
  } catch {
    /* private mode — the switch simply stays where it was */
  }
  window.dispatchEvent(new Event(DETAIL_EVENT));
}

function DateRail({ reports, current }: { reports: CiReport[]; current: string }) {
  return (
    <nav aria-label="Reports by date" className="space-y-3">
      <p className={cn(LABEL, "px-2")}>By date</p>
      {reportsByMonth(reports).map((g) => (
        <div key={g.month}>
          <p className={cn(LABEL, "px-2 pb-1")}>{g.month}</p>
          <ul className="space-y-0.5">
            {g.reports.map((r) => {
              const on = r.id === current;
              return (
                <li key={r.id}>
                  <Link
                    href={`/ci/${r.id}`}
                    aria-current={on ? "page" : undefined}
                    className={cn(
                      "block rounded-lg px-2.5 py-2 text-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
                      on ? "bg-foreground text-background" : "hover:bg-accent",
                    )}
                  >
                    <span className="block font-medium">{r.kind === "engagement" ? "Engagement" : r.period.replace(/^\w+day, /, "")}</span>
                    <span className={cn("mt-0.5 block text-[11px] leading-snug", on ? "text-background/70" : "text-muted-foreground")}>{r.hook}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Toc({ report, active }: { report: CiReport; active: string }) {
  return (
    <nav aria-label="In this report" className="space-y-2">
      <p className={cn(LABEL, "px-2")}>In this report</p>
      <ul className="space-y-0.5">
        {tocFor(report).map((t) => (
          <li key={t.id}>
            <a
              href={`#${t.id}`}
              className={cn(
                "flex gap-2 rounded-lg px-2 py-1.5 text-[13px] leading-snug outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                active === t.id ? "font-semibold text-foreground" : "text-muted-foreground",
              )}
            >
              <span className="w-5 shrink-0 text-[11px] font-bold text-brand tabular-nums">{t.n}</span>
              {t.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function Shot({ shot }: { shot: CiSection["shots"][number] }) {
  return (
    <figure className="m-0">
      <figcaption className="mb-2 flex flex-wrap items-baseline gap-2 text-xs">
        <code className="rounded border border-border bg-muted px-1.5 py-0.5 font-mono text-[11px] text-foreground">{shot.route}</code>
        <span className="text-muted-foreground">
          <RichText text={shot.caption} />
        </span>
      </figcaption>
      <Image
        src={shot.src}
        alt={shot.caption ? shot.caption.replace(/<[^>]+>/g, "") : shot.route}
        width={shot.width}
        height={shot.height}
        sizes="(min-width: 1280px) 720px, 100vw"
        className="w-full rounded-xl border border-border"
      />
    </figure>
  );
}

function Section({ s, technical }: { s: CiSection; technical: boolean }) {
  const lines = visibleLines(s.inside, technical);
  return (
    <section id={sectionAnchor(s)} className="scroll-mt-6 border-t border-border pt-6" data-ci-section>
      <h2 className="flex items-baseline gap-3 text-lg font-semibold tracking-tight">
        <span className="text-[13px] font-bold text-brand tabular-nums">{s.n}</span>
        <span className="flex-1">
          <RichText text={s.title} />
        </span>
        {s.effort ? <span className="text-xs font-normal text-muted-foreground tabular-nums">{s.effort}</span> : null}
      </h2>
      {s.sub && (technical || !s.subTechnical) ? (
        <p className="mt-1 pl-9 text-[13px] text-muted-foreground italic">
          <RichText text={s.sub} />
        </p>
      ) : null}
      {s.ask ? (
        <div className="mt-4 flex flex-wrap items-start justify-between gap-3 rounded-lg border border-l-[3px] border-border border-l-brand bg-muted/40 px-4 py-3">
          <div>
            <p className={LABEL}>What you asked for</p>
            <p className="mt-1 text-sm font-semibold">
              <RichText text={s.ask} />
            </p>
          </div>
          {s.status ? (
            <span className="rounded-md bg-success/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-success uppercase">{s.status}</span>
          ) : null}
        </div>
      ) : null}
      {s.built || s.why || s.value ? (
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            ["What we built", s.built, false],
            ["Why it matters", s.why, false],
            ["The value it delivers", s.value, true],
          ]
            .filter(([, text]) => Boolean(text))
            .map(([k, text, value]) => (
              <div
                key={k as string}
                className={cn("rounded-xl border border-border p-4 text-[13px] leading-relaxed", value && "border-success/30 bg-success/5")}
              >
                <p className={cn(LABEL, "mb-2")}>{k as string}</p>
                <RichText text={text as string} />
              </div>
            ))}
        </div>
      ) : null}
      {lines.length > 0 ? (
        <div className="mt-4">
          <p className={cn(LABEL, "border-b border-foreground pb-1.5")}>What is inside it</p>
          <ul className="divide-y divide-border">
            {lines.map((line, i) => (
              <li key={i} className="flex gap-3 py-2 text-[13px] leading-relaxed text-muted-foreground">
                <span className="font-bold text-brand" aria-hidden>
                  —
                </span>
                <RichText text={line} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {s.shots.length > 0 ? (
        <div className="mt-5 space-y-5">
          {s.shots.map((shot) => (
            <Shot key={shot.src} shot={shot} />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function Pairs({ id, title, sub, rows }: { id: string; title: string; sub: string; rows: { title: string; body: string }[] }) {
  if (rows.length === 0) return null;
  return (
    <section id={id} className="scroll-mt-6 border-t border-border pt-6" data-ci-section>
      <h2 className="flex items-baseline gap-3 text-lg font-semibold tracking-tight">
        <span className="text-[13px] font-bold text-brand">→</span>
        {title}
      </h2>
      <p className="mt-1 pl-7 text-[13px] text-muted-foreground italic">{sub}</p>
      <div className="mt-4 space-y-3">
        {rows.map((r) => (
          <div key={r.title} className="rounded-xl border border-border p-4">
            <p className="text-sm font-semibold">
              <RichText text={r.title} />
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
              <RichText text={r.body} />
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * The reader (SPEC-253): three columns — the date rail, the report as the PDF prints
 * it, and its contents with the visible section highlighted. Stacks on a phone.
 */
export function CiReader({ reports, report }: { reports: CiReport[]; report: CiReport }) {
  const [active, setActive] = useState<string>(tocFor(report)[0]?.id ?? "");
  // SPEC-253 Patches: the business view is the default — the owner reads /ci as the
  // CEO. "Technical detail" is a per-browser convenience, never sent anywhere.
  const technical = useSyncExternalStore(subscribeDetail, readDetail, () => false);
  const hidden = hiddenCount(report);

  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-ci-section]"));
    if (nodes.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: "-10% 0px -75% 0px" },
    );
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, [report.id]);

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_240px]">
      {/* The card clips its rounded corners; the scroller inside it keeps the thin
          scrollbar within the curve instead of running straight past it. */}
      <Card className="gap-0 self-start overflow-hidden p-0 lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)]">
        <div className="scrollbar-subtle max-h-[inherit] overflow-auto p-3 lg:max-h-[calc(100vh-2rem)]">
          <DateRail reports={reports} current={report.id} />
        </div>
      </Card>

      <article className="min-w-0">
        <Card className="gap-0 p-6 md:p-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/ci"
              className="inline-flex w-fit items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-xs font-semibold outline-none transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              All reports
            </Link>
            {hidden > 0 ? (
              <label className="inline-flex items-center gap-2 text-xs text-muted-foreground">
                <Switch id="ci-technical" checked={technical} onCheckedChange={toggleTechnical} aria-label="Show technical detail" />
                <span>
                  Technical detail
                  {!technical ? <span className="tabular-nums">{` · ${hidden} lines hidden`}</span> : null}
                </span>
              </label>
            ) : null}
          </div>
          <p className={LABEL}>
            {KIND_LABEL[report.kind]} · {report.period}
          </p>
          <h1 className="mt-2 font-heading text-3xl leading-tight tracking-wide">{report.hook}</h1>
          <p className="mt-3 text-[15px] leading-relaxed">
            <RichText text={report.memo} />
          </p>
          <dl className="mt-5 mb-2 flex flex-wrap gap-x-8 gap-y-3 border-t-2 border-foreground pt-3">
            {[
              ["Prepared for", PRODUCT.name],
              ["Effort", report.effort ?? "—"],
              ["Captured", report.views],
              ["Source", "Live app"],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className={LABEL}>{k}</dt>
                <dd className="m-0 text-sm font-semibold">{v}</dd>
              </div>
            ))}
          </dl>

          {report.days.length > 0 ? (
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {report.days.map((d) => (
                <div key={d.title}>
                  <p className="text-sm font-semibold">
                    <RichText text={d.title} />
                  </p>
                  <p className="mt-1 border-l-2 border-brand pl-3 text-[13px] leading-relaxed text-muted-foreground">
                    <RichText text={d.body} />
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-8 space-y-8">
            {report.sections.map((s) => (
              <Section key={s.n + s.title} s={s} technical={technical} />
            ))}

            {report.pages.length > 0 ? (
              <section id="pages" className="scroll-mt-6 border-t border-border pt-6" data-ci-section>
                <h2 className="flex items-baseline gap-3 text-lg font-semibold tracking-tight">
                  <span className="text-[13px] font-bold text-brand">→</span>The printed report
                </h2>
                <p className="mt-1 pl-7 text-[13px] text-muted-foreground italic">
                  This report was delivered before its generator was kept; these are its pages as printed.
                </p>
                <div className="mt-4 space-y-3">
                  {report.pages.map((p, i) => (
                    <Image
                      key={p.src}
                      src={p.src}
                      alt={`Page ${i + 1}`}
                      width={p.width}
                      height={p.height}
                      sizes="(min-width: 1280px) 720px, 100vw"
                      className="w-full rounded-lg border border-border"
                    />
                  ))}
                </div>
              </section>
            ) : null}

            {report.tiers.length > 0 ? (
              <section id="before-after" className="scroll-mt-6 border-t border-border pt-6" data-ci-section>
                <h2 className="flex items-baseline gap-3 text-lg font-semibold tracking-tight">
                  <span className="text-[13px] font-bold text-brand">→</span>Before and after, measured
                </h2>
                <div className="mt-4 divide-y divide-border">
                  {report.tiers.map((t) => (
                    <div key={t.name} className="grid gap-1 py-3 md:grid-cols-[1fr_260px] md:gap-6">
                      <div>
                        <p className="text-sm font-semibold">
                          <RichText text={t.name} />
                        </p>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          <RichText text={t.why} />
                        </p>
                      </div>
                      <p className="text-[13px] font-medium tabular-nums">
                        <RichText text={t.change} />
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ) : null}

            <Pairs id="next" title="Where this leaves us" sub="What follows from this report, and what needs a decision." rows={visiblePairs(report.next, technical)} />
            <Pairs id="rules" title="The rules behind the work" sub="Why the numbers above can be trusted." rows={visiblePairs(report.cautions, technical)} />
          </div>
        </Card>
      </article>

      <Card className="hidden gap-0 self-start overflow-hidden p-0 xl:sticky xl:top-4 xl:block xl:max-h-[calc(100vh-2rem)]">
        <div className="scrollbar-subtle overflow-auto p-3 xl:max-h-[calc(100vh-2rem)]">
          <Toc report={report} active={active} />
        </div>
      </Card>
    </div>
  );
}
