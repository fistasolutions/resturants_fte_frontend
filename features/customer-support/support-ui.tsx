"use client";

import Link from "next/link";
import {
  AtSign,
  BookOpen,
  CircleAlert,
  CircleCheck,
  CircleX,
  FileText,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  Smartphone,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";

import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { CheckResult, GuardrailCheck } from "@/lib/customer-support";
import { CHANNEL_LABELS } from "@/lib/helpdesk-providers";
import { cn } from "@/lib/utils";
import type { Channel, SourceChip } from "@/types/customer-support";

/**
 * The Customer Support Agent's small shared pieces (SPEC-346): channel marks, source chips,
 * the guardrail checklist, the action feedback line and the empty state. Tokens only.
 */

const CHANNEL_ICONS: Record<Channel, LucideIcon> = {
  email: Mail,
  chat: MessagesSquare,
  sms: Smartphone,
  facebook: MessageCircle,
  instagram: AtSign,
  whatsapp: MessageCircle,
  twitter: AtSign,
  phone: Phone,
  contact_form: FileText,
  help_center: BookOpen,
};

/** A channel's mark with its name for assistive tech (and visible with `label`). */
export function ChannelMark({ channel, label = false, className }: { channel: Channel; label?: boolean; className?: string }) {
  const Icon = CHANNEL_ICONS[channel];
  return (
    <span className={cn("inline-flex items-center gap-1 text-muted-foreground", className)} title={CHANNEL_LABELS[channel]}>
      <Icon className="size-3.5 shrink-0" aria-hidden />
      {label ? <span className="text-xs">{CHANNEL_LABELS[channel]}</span> : <span className="sr-only">{CHANNEL_LABELS[channel]}</span>}
    </span>
  );
}

/** Every fact the reply states, each a chip that opens what the tool returned and where. */
export function SourceChips({ sources }: { sources: SourceChip[] }) {
  if (sources.length === 0) {
    return <p className="text-xs text-muted-foreground">No sources — the reply states no fact from your data.</p>;
  }
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Sources for this reply">
      {sources.map((source) => (
        <li key={source.id}>
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex max-w-[16rem] items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground transition-colors outline-none hover:border-foreground/40 hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              >
                <span className="font-semibold text-foreground">{source.system}</span>
                <span className="truncate">{source.label}</span>
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 space-y-1 text-sm" align="start">
              <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{source.system}</p>
              <p className="font-medium text-foreground">{source.label}</p>
              <p className="text-muted-foreground">{source.fact}</p>
              {source.href ? (
                <Link href={source.href} prefetch={false} className="inline-block text-xs font-medium text-primary underline-offset-4 hover:underline">
                  Open it
                </Link>
              ) : null}
            </PopoverContent>
          </Popover>
        </li>
      ))}
    </ul>
  );
}

const CHECK_ICON: Record<CheckResult, { icon: LucideIcon; className: string; label: string }> = {
  pass: { icon: CircleCheck, className: "text-success", label: "Passes" },
  warn: { icon: TriangleAlert, className: "text-warning", label: "Warning" },
  block: { icon: CircleX, className: "text-destructive", label: "Blocks sending" },
};

/** The guardrail checks, blocks first — the same list `canSend` folds. */
export function CheckList({ checks, compact = false }: { checks: GuardrailCheck[]; compact?: boolean }) {
  const rank: Record<CheckResult, number> = { block: 0, warn: 1, pass: 2 };
  const ordered = [...checks].sort((a, b) => rank[a.result] - rank[b.result]);
  const shown = compact ? ordered.filter((check) => check.result !== "pass") : ordered;
  if (shown.length === 0) {
    return (
      <p className="flex items-center gap-1.5 text-xs text-success">
        <CircleCheck className="size-3.5" aria-hidden /> Every guardrail passes.
      </p>
    );
  }
  return (
    <ul className="space-y-1.5" aria-label="Guardrail checks">
      {shown.map((check) => {
        const meta = CHECK_ICON[check.result];
        const Icon = meta.icon;
        return (
          <li key={check.key} className="flex items-start gap-2 text-sm">
            <Icon className={cn("mt-0.5 size-4 shrink-0", meta.className)} aria-label={meta.label} />
            <span className="min-w-0">
              <span className="font-medium text-foreground">{check.label}</span>{" "}
              <span className="text-muted-foreground">{check.reason}</span>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

/** What the last write did, or why it did not. */
export function ActionFeedback({
  notice,
  error,
  onDismiss,
}: {
  notice: string | null;
  error: string | null;
  onDismiss: () => void;
}) {
  if (!notice && !error) return null;
  return (
    <div
      role={error ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2 rounded-xl border px-3 py-2 text-sm",
        error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-success/30 bg-success/5 text-foreground",
      )}
    >
      {error ? <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden /> : <CircleCheck className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />}
      <span className="min-w-0 flex-1">{error ?? notice}</span>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="rounded-md p-0.5 text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <X className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}

/** A purposeful empty state: what is missing and what to do next. */
export function EmptyNote({ icon: Icon, title, children }: { icon: LucideIcon; title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-10 text-center">
      <span className="grid size-10 place-items-center rounded-xl bg-muted text-muted-foreground" aria-hidden>
        <Icon className="size-4" />
      </span>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {children ? <div className="max-w-md text-sm text-muted-foreground">{children}</div> : null}
    </div>
  );
}

/** A label/value row inside the context panel. */
export function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-right text-foreground">{children}</span>
    </div>
  );
}
