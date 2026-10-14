import Link from "next/link";
import { ArrowRight, KeyRound, Palette, Plug, UsersRound, BriefcaseBusiness } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { PlanPicker } from "@/features/pricing/plan-picker";
import type { PaymentMode, PlanCard } from "@/lib/onboarding";
import { howItStarts, INCLUDED, pricingChips } from "@/lib/pricing";
import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";

const ICONS = [
  <Plug key="apps" className="size-5" aria-hidden />,
  <GlispIcon key="glisp" className="size-5" />,
  <BriefcaseBusiness key="ftes" className="size-5" aria-hidden />,
  <UsersRound key="team" className="size-5" aria-hidden />,
  <Palette key="brand" className="size-5" aria-hidden />,
  <KeyRound key="ai" className="size-5" aria-hidden />,
];

/** Square-cornered, like the marketing site's buttons. */
const BUTTON =
  "inline-flex h-11 items-center justify-center gap-2 rounded-sm px-5 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-showcase-band focus-visible:ring-offset-2";

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <p className={cn("font-mono text-xs tracking-widest text-showcase-muted uppercase", className)}>
      [ {children} ]
    </p>
  );
}

/**
 * The pricing page (SPEC-320; one card on a red band since SPEC-326) in the marketing site's identity: paper and honeycomb, the display
 * serif, mono labels, brand red for accents and the closing band, square buttons. Every sentence
 * is true of the product today; the prices come from the backend.
 */
export function PricingView({
  plans,
  payment,
  signedIn,
  marketingUrl,
}: {
  plans: PlanCard[] | null;
  /** SPEC-321: what is said about cards follows the payment mode in force. */
  payment: PaymentMode;
  signedIn: boolean;
  marketingUrl: string;
}) {
  const stripe = payment.provider === "stripe";
  return (
    <>
      <main>
        {/* SPEC-326: one card on the brand's red band — choose the revenue, the price follows. */}
        <section className="border-b border-showcase-border">
          <div className="bg-showcase-band text-showcase-band-foreground">
            <div className="mx-auto max-w-6xl px-4 pt-14 pb-36 text-center md:px-8 md:pt-20 md:pb-40">
              <p className="font-mono text-xs tracking-widest text-showcase-band-muted uppercase">[ Pricing ]</p>
              <h1 className="mx-auto mt-5 max-w-3xl font-display text-5xl leading-none tracking-tight text-balance md:text-7xl">
                Priced by your size. Nothing held back.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-showcase-band-muted md:text-lg">
                One plan per revenue band. Every feature in every plan.
              </p>
            </div>
          </div>
          <div className="relative mx-auto -mt-28 max-w-6xl px-4 pb-14 md:-mt-32 md:px-8 md:pb-20">
            {plans && plans.length > 0 ? (
              <PlanPicker plans={plans} signedIn={signedIn} />
            ) : (
              <div className="mx-auto max-w-3xl rounded-3xl bg-showcase-card p-8 shadow-xl">
                <p className="font-medium">Plans are unavailable right now.</p>
                <p className="mt-1 text-sm text-showcase-muted">
                  You can still create your account — you choose your plan during setup.
                </p>
                <Link href="/signup" prefetch={false} className={cn(BUTTON, "mt-6 bg-showcase-foreground text-showcase")}>
                  Get started
                </Link>
              </div>
            )}
            <ul className="mt-8 flex flex-wrap justify-center gap-2 text-xs">
              {pricingChips(stripe).map((chip) => (
                <li key={chip} className="rounded-sm border border-showcase-border bg-showcase-card px-3 py-1.5 font-mono tracking-wide">
                  {chip}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-24">
          <Label>Every plan includes</Label>
          <h2 className="mt-4 max-w-2xl font-display text-4xl leading-none tracking-tight md:text-5xl">
            Everything, whichever plan you choose.
          </h2>
          <ul className="mt-10 grid gap-px overflow-hidden rounded-xl border border-showcase-border bg-showcase-border sm:grid-cols-2 lg:grid-cols-3">
            {INCLUDED.map((item, i) => (
              <li key={item.title} className="flex flex-col gap-3 bg-showcase-card p-6">
                <span className="flex size-10 items-center justify-center rounded-lg border border-showcase-border">
                  {ICONS[i]}
                </span>
                <span className="font-medium">{item.title}</span>
                <span className="text-sm leading-relaxed text-showcase-muted">{item.body}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="border-y border-showcase-border bg-showcase-card">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-8 md:py-20">
            <Label>How it starts</Label>
            <ol className="mt-8 grid gap-8 md:grid-cols-3">
              {howItStarts(stripe).map((step, i) => (
                <li key={step.title} className="space-y-2">
                  <span className="font-mono text-sm text-showcase-band">0{i + 1}</span>
                  <p className="font-display text-3xl leading-none tracking-tight">{step.title}</p>
                  <p className="text-sm leading-relaxed text-showcase-muted">{step.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="bg-showcase-band text-showcase-band-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-end md:justify-between md:px-8 md:py-20">
            <div>
              <p className="font-mono text-xs tracking-widest text-showcase-band-muted uppercase">[ {PRODUCT.descriptor} ]</p>
              <p className="mt-4 font-display text-5xl leading-none tracking-tight md:text-6xl">
                Your whole store, on one screen.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <Link
                href={signedIn ? "/" : "/signup"}
                prefetch={false}
                className={cn(BUTTON, "bg-showcase-band-foreground text-showcase-band hover:bg-showcase-band-muted")}
              >
                {signedIn ? "Open the app" : "Get started"}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              {signedIn ? null : (
                <Link href="/login" prefetch={false} className="text-sm font-medium underline-offset-4 hover:underline">
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-8 text-sm text-showcase-muted md:px-8">
        <span>{PRODUCT.name} · {PRODUCT.tagline}</span>
        <nav aria-label="Legal" className="flex gap-5">
          <a href={`${marketingUrl}/privacy`} className="hover:text-showcase-foreground">Privacy</a>
          <a href={`${marketingUrl}/terms`} className="hover:text-showcase-foreground">Terms</a>
          <a href={`${marketingUrl}/security`} className="hover:text-showcase-foreground">Security</a>
        </nav>
      </footer>
    </>
  );
}
