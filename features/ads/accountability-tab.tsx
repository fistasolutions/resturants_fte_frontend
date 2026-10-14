import Link from "next/link";
import {
  ArrowRight,
  Ban,
  Gauge,
  Plug,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { capUtilizationTone, type CapTone } from "@/lib/ads";
import type {
  AccountabilityData,
  CampaignCapUtil,
  GuardrailEvent,
  GuardrailKind,
  LedgerRow,
} from "@/types/ads";
import { formatCurrency, formatDate } from "@/utils/format";

import { ChannelBadge } from "./ads-pills";

const BAR_TONE: Record<CapTone, string> = {
  healthy: "bg-success",
  nearing: "bg-warning",
  over: "bg-destructive",
};

const GUARDRAIL: Record<
  GuardrailKind,
  { label: string; className: string; Icon: typeof ShieldCheck }
> = {
  auto_pause: {
    label: "Auto-pause",
    className: "border-warning/30 bg-warning/10 text-warning",
    Icon: ShieldCheck,
  },
  cap_hit: {
    label: "Cap hit",
    className: "border-warning/30 bg-warning/10 text-warning",
    Icon: Gauge,
  },
  anomaly_halt: {
    label: "Anomaly halt",
    className: "border-destructive/30 bg-destructive/10 text-destructive",
    Icon: ShieldAlert,
  },
};

function SetupNudge() {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-card border border-warning/30 bg-warning/10 p-4">
      <Plug className="size-4 shrink-0 text-warning" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground">No spend runs through this page yet</p>
        <p className="text-xs text-muted-foreground">
          These gates and caps are a modeled control surface — no real spend is moved from
          here. Your real Meta ad account can be connected read-only on the Audit tab, to see
          and audit what it is spending today.
        </p>
      </div>
      <Link
        href="/ads?tab=audit"
        className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4"
      >
        Open Audit
        <ArrowRight className="size-3.5" aria-hidden />
      </Link>
    </div>
  );
}

function LedgerCard({ ledger }: { ledger: LedgerRow[] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Spend ledger</CardTitle>
        <p className="text-sm text-muted-foreground">
          Every charge, with the Shopify profit it&apos;s credited with.
        </p>
      </CardHeader>
      <CardContent className="px-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-4">Date</TableHead>
                <TableHead>Campaign</TableHead>
                <TableHead>Channel</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="pr-4 text-right">Attributed profit</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ledger.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="pl-4 whitespace-nowrap text-muted-foreground tabular-nums">
                    {formatDate(row.date)}
                  </TableCell>
                  <TableCell className="font-medium whitespace-normal text-foreground">
                    {row.campaign}
                  </TableCell>
                  <TableCell>
                    <ChannelBadge channel={row.channel} />
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatCurrency(row.amount)}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "pr-4 text-right font-medium tabular-nums",
                      row.attributedProfit >= 0 ? "text-success" : "text-destructive",
                    )}
                  >
                    {formatCurrency(row.attributedProfit)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}

function CapUtilizationCard({ rows }: { rows: CampaignCapUtil[] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Cap utilization</CardTitle>
        <p className="text-sm text-muted-foreground">
          How close each campaign is to its approved ceiling.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row) => {
          const pct = Math.min(Math.round(row.utilization * 100), 100);
          const tone = capUtilizationTone(row.utilization);
          return (
            <div key={row.id}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-medium text-foreground">{row.campaign}</span>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {formatCurrency(row.spent)} / {formatCurrency(row.cap)}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn("h-full rounded-full", BAR_TONE[tone])}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="w-9 shrink-0 text-right text-xs font-medium tabular-nums text-muted-foreground">
                  {pct}%
                </span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function GuardrailCard({ events }: { events: GuardrailEvent[] }) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <CardTitle>Guardrail log</CardTitle>
        <p className="text-sm text-muted-foreground">
          Automatic interventions — proof nothing runs unchecked.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => {
          const meta = GUARDRAIL[event.kind];
          const Icon = meta.Icon;
          return (
            <div key={event.id} className="flex gap-3 rounded-lg border border-border p-3">
              <span
                className={cn(
                  "flex size-8 shrink-0 items-center justify-center rounded-full border",
                  meta.className,
                )}
              >
                <Icon className="size-4" aria-hidden />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-foreground">{event.title}</p>
                  <span
                    className={cn(
                      "inline-flex h-5 items-center gap-1 rounded-4xl border px-2 text-[0.6875rem] font-medium",
                      meta.className,
                    )}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{event.detail}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

export function AccountabilityTab({ data }: { data: AccountabilityData }) {
  return (
    <div className="space-y-6">
      {!data.connected && <SetupNudge />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
        <LedgerCard ledger={data.ledger} />
        <div className="space-y-4">
          <CapUtilizationCard rows={data.capUtilization} />
        </div>
      </div>

      <GuardrailCard events={data.guardrails} />

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Ban className="size-3.5 shrink-0" aria-hidden />
        The AI has no unsupervised spend authority. It can only optimize within caps
        you&apos;ve approved — every launch and budget raise passes through Spend Gates.
      </p>
    </div>
  );
}
