"use client";

import { CheckCircle2, CircleAlert, ShieldX } from "lucide-react";
import { CartesianGrid, Line, LineChart, ReferenceLine, XAxis, YAxis } from "recharts";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { buttonVariants } from "@/components/ui/button";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
import { EmLink } from "@/features/email-marketing/em-link";
import { ListSkeleton } from "@/features/email-marketing/skeletons";
import { useApiQuery } from "@/hooks/use-api-query";
import { band, emailTabHref, formatRate, RATE_BANDS, snapshotAge } from "@/lib/email-marketing";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { cn } from "@/lib/utils";
import type { AuthStatus } from "@/types/email-marketing";
import { formatNumber, formatTime } from "@/utils/format";

const CONFIG: ChartConfig = {
  spam: { label: "Spam rate %", color: "var(--chart-2)" },
  bounce: { label: "Bounce rate %", color: "var(--chart-1)" },
};

function Auth({ name, status, detail }: { name: string; status: AuthStatus; detail: string }) {
  const Icon = status === "pass" ? CheckCircle2 : status === "unknown" ? CircleAlert : ShieldX;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-3">
      <Icon className={cn("mt-0.5 size-5 shrink-0", status === "pass" ? "text-success" : status === "unknown" ? "text-warning" : "text-destructive")} aria-hidden />
      <div>
        <p className="text-sm font-semibold">{name}: {status === "pass" ? "passing" : status === "unknown" ? "could not confirm" : status === "missing" ? "missing" : "failing"}</p>
        <p className="text-xs text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

/** Deliverability (SPEC-345, backend SPEC-354): the sending domain's SPF, DKIM and DMARC as
 * public DNS shows them (read nightly), spam and bounce trends from the platform's reports
 * against Gmail and Yahoo's bulk-sender thresholds, list hygiene from the engaged/unengaged
 * segments the employee keeps in the platform, and a sunset recommendation. */
export function DeliverabilityTab() {
  const d = useApiQuery(emailMarketingQueries.deliverability());
  if (d.isPending) return <ListSkeleton rows={5} />;
  if (d.isError) return <QueryErrorState error={d.error} onRetry={() => void d.refetch()} />;
  const h = d.data;
  const latest = h.weeks[h.weeks.length - 1];
  const engaged = h.engaged ?? 0;
  const unengaged = h.unengaged ?? 0;
  const counted = h.engaged !== null && h.unengaged !== null;
  const engagedShare = engaged + unengaged > 0 ? (engaged / (engaged + unengaged)) * 100 : 0;
  const rows = h.weeks.map((w) => ({ week: new Date(`${w.week}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }), spam: w.spamRate, bounce: w.bounceRate }));
  const spamBand = latest ? band("spam", latest.spamRate) : "good";

  return (
    <div className="space-y-6">
      <p className={cn("text-xs", h.takenAt && snapshotAge(h.takenAt).stale ? "text-warning" : "text-muted-foreground")}>
        {h.takenAt ? `Checked ${formatTime(h.takenAt)}` : "Not checked yet — the first check runs tonight"}
        {h.domain ? ` for ${h.domain}.` : ". Set a from-email in Settings so the sending domain can be checked."}
      </p>
      <div className="grid gap-3 md:grid-cols-3">
        <Auth name="SPF" status={h.spf} detail="Says which servers may send as your domain." />
        <Auth name="DKIM" status={h.dkim} detail={h.dkim === "unknown" ? "Not found at the platform's usual DNS names — check your branded sending domain in the platform." : "Signs each email so it cannot be altered on the way."} />
        <Auth name="DMARC" status={h.dmarc} detail={h.dmarcPolicy === "p=none" ? "Set to p=none (monitor only). It meets Gmail and Yahoo's rule; p=quarantine also stops others spoofing your domain." : `Policy ${h.dmarcPolicy ?? "not set"}.`} />
      </div>
      <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-wrap items-baseline gap-2">
          <h2 className="text-sm font-semibold">Spam and bounces, weekly</h2>
          {latest ? (
            <span className={cn("text-xs", spamBand === "bad" ? "text-destructive" : spamBand === "warn" ? "text-warning" : "text-muted-foreground")}>
              Last week: {formatRate(latest.spamRate)} spam, {formatRate(latest.bounceRate)} bounced, {formatNumber(latest.delivered)} delivered
            </span>
          ) : null}
        </div>
        {rows.length === 0 ? (
          <div className="grid h-[220px] place-items-center rounded-xl border border-dashed border-border text-center text-sm text-muted-foreground">
            <p className="max-w-sm px-4">No sends measured yet — spam and bounce rates appear here after the first nightly report reads the platform.</p>
          </div>
        ) : (
          <ChartContainer config={CONFIG} className="h-[220px] w-full">
            <LineChart data={rows} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} fontSize={11} />
              <YAxis tickLine={false} axisLine={false} width={36} fontSize={11} unit="%" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ReferenceLine y={RATE_BANDS.spam.bad} stroke="var(--destructive)" strokeDasharray="4 4" label={{ value: "Gmail/Yahoo spam limit 0.3%", fontSize: 10, position: "insideTopRight", fill: "var(--muted-foreground)" }} />
              <Line dataKey="spam" type="monotone" stroke="var(--color-spam)" strokeWidth={2} dot={false} />
              <Line dataKey="bounce" type="monotone" stroke="var(--color-bounce)" strokeWidth={2} dot={false} />
            </LineChart>
          </ChartContainer>
        )}
        <p className="text-xs text-muted-foreground">Gmail and Yahoo require bulk senders to stay under 0.3% spam complaints and recommend under 0.1%.</p>
      </section>
      <div className="grid gap-3 md:grid-cols-2">
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">List hygiene</h2>
          <div className="flex h-2 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span className="bg-success" style={{ width: `${engagedShare}%` }} />
          </div>
          {counted ? (
            <>
              <p className="text-sm">{formatNumber(engaged)} opened or clicked in 90 days · {formatNumber(unengaged)} nothing in 180</p>
              <p className="text-xs text-muted-foreground">Sending to people who never open teaches inboxes to file you as spam.</p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Not counted yet — the platform counts the engaged and unengaged segments after they are created.</p>
          )}
        </section>
        <section className="space-y-2 rounded-2xl border border-border bg-card p-4">
          <h2 className="text-sm font-semibold">Sunset recommendation</h2>
          <p className="text-sm">
            {h.sunsetCandidates !== null
              ? `Stop emailing the ${formatNumber(h.sunsetCandidates)} profiles who have not opened or clicked in 180 days — after one last check-in from a sunset flow.`
              : "Once the unengaged segment is counted, this says how many profiles to stop emailing."}
          </p>
          <EmLink href={emailTabHref("flows")} className={buttonVariants({ size: "sm", variant: "outline" })}>Open the flows</EmLink>
        </section>
      </div>
    </div>
  );
}
