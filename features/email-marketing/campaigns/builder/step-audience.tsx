"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import type { BuilderDraft, RecipientEstimate } from "@/lib/email-builder";
import { can } from "@/lib/email-providers";
import { PRODUCT } from "@/lib/product";
import { cn } from "@/lib/utils";
import type { Audience, EmailProviderKey } from "@/types/email-marketing";
import { formatNumber } from "@/utils/format";

function AudienceOption({
  audience,
  checked,
  onToggle,
  name,
  note,
}: {
  audience: Audience;
  checked: boolean;
  onToggle: () => void;
  name: string;
  note?: string;
}) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-2 rounded-lg border p-2 text-sm transition-colors", checked ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50")}>
      <input type="checkbox" name={name} className="mt-1 accent-primary" checked={checked} onChange={onToggle} />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium">{audience.name}</span>
          {audience.protective ? <StatusBadge tone="info">Protected</StatusBadge> : null}
        </span>
        <span className="block text-xs text-muted-foreground">
          {formatNumber(audience.consent.emailSubscribed)} can get email of {formatNumber(audience.size)} · {audience.description}
        </span>
        {note ? <span className="block text-xs text-warning">{note}</span> : null}
      </span>
    </label>
  );
}

/** Step 2 — who it goes to, and who is left out. Only profiles with email consent count,
 * and the estimate updates as groups are added or excluded. */
export function StepAudience({
  draft,
  audiences,
  estimate,
  provider,
  onChange,
}: {
  draft: BuilderDraft;
  audiences: readonly Audience[];
  estimate: RecipientEstimate;
  provider: EmailProviderKey;
  onChange: (patch: Pick<BuilderDraft, "audienceKeys" | "excludedKeys">) => void;
}) {
  const toggle = (list: string[], key: string) => (list.includes(key) ? list.filter((k) => k !== key) : [...list, key]);
  const fte = audiences.filter((a) => a.source === "fte" && !a.protective);
  const providerGroups = audiences.filter((a) => a.source !== "fte");
  const exclusions = audiences.filter((a) => a.source === "fte" && (a.protective || a.key === "discount-only"));
  const discounting = draft.offerKind === "discount";
  return (
    <div className="space-y-5">
      <p className="rounded-xl border border-border bg-muted/40 px-3 py-2 text-sm" role="status" aria-live="polite">
        Up to <span className="font-semibold tabular-nums">{formatNumber(estimate.recipients)}</span> recipients
        {estimate.exclusions.length > 0 ? ` — ${formatNumber(estimate.exclusions.reduce((s, e) => s + e.count, 0))} without email consent are left out` : ""}. The exact count, after overlaps, exclusions and the frequency cap, is on the review step.
      </p>
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">{PRODUCT.short} segments</legend>
        <p className="text-xs text-muted-foreground">Built from orders, margin, the repeat clock and returns — groups your email platform cannot make on its own.</p>
        <div className="grid gap-1.5 md:grid-cols-2">
          {fte.map((a) => (
            <AudienceOption key={a.key} audience={a} name="include" checked={draft.audienceKeys.includes(a.key)} onToggle={() => onChange({ audienceKeys: toggle(draft.audienceKeys, a.key), excludedKeys: draft.excludedKeys })} />
          ))}
        </div>
      </fieldset>
      {can(provider, "listsWrite") || can(provider, "segmentsCreate") ? (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Your email platform&rsquo;s lists and segments</legend>
          <p className="text-xs text-muted-foreground">A campaign goes to segments or to these, not both. The exclusions below cannot be applied to a platform list, so a discount goes to segments only.</p>
          <div className="grid gap-1.5 md:grid-cols-2">
            {providerGroups.map((a) => (
              <AudienceOption key={a.key} audience={a} name="include" checked={draft.audienceKeys.includes(a.key)} onToggle={() => onChange({ audienceKeys: toggle(draft.audienceKeys, a.key), excludedKeys: draft.excludedKeys })} />
            ))}
          </div>
        </fieldset>
      ) : null}
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Leave out</legend>
        <p className="text-xs text-muted-foreground">Protected groups are left out by your guardrails. Including one in a discount send blocks the send.</p>
        <div className="grid gap-1.5 md:grid-cols-2">
          {exclusions.map((a) => (
            <AudienceOption
              key={a.key}
              audience={a}
              name="exclude"
              checked={draft.excludedKeys.includes(a.key)}
              note={discounting && a.protective && !draft.excludedKeys.includes(a.key) ? "A discount would reach this group." : undefined}
              onToggle={() => onChange({ audienceKeys: draft.audienceKeys, excludedKeys: toggle(draft.excludedKeys, a.key) })}
            />
          ))}
        </div>
      </fieldset>
    </div>
  );
}
