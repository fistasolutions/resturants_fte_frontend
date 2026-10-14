"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2 } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { VoiceChecker } from "@/features/brand-brain/voice-checker";
import { useCan } from "@/hooks/use-can";
import {
  sampleSourceLine,
  sourceTitleMap,
  voiceSummary,
} from "@/lib/brand-brain";
import { brandBrainQueries } from "@/lib/queries/brand-brain";
import { cn } from "@/lib/utils";
import {
  addVoiceSample,
  deleteVoiceSample,
  deriveVoice,
  updateVoiceRule,
} from "@/services/brand-brain-actions";
import type { BrandSource, VoiceData } from "@/types/brand-brain";
import { formatNumber } from "@/utils/format";

function Tile({
  label,
  value,
  sub,
  className,
  children,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <Card className={cn("gap-1 p-4", className)}>
      <p className="text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
        {label}
      </p>
      <p className="text-lg font-bold tracking-tight">{value}</p>
      {sub ? <p className="text-xs text-muted-foreground">{sub}</p> : null}
      {children}
    </Card>
  );
}

function StepHeader({
  n,
  title,
  hint,
  right,
}: {
  n: number;
  title: string;
  hint: string;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-border bg-muted/40 px-4 py-2.5">
      <span className="grid size-5 place-items-center rounded-full bg-foreground text-[10px] font-bold text-background">
        {n}
      </span>
      <p className="text-[13px] font-bold">{title}</p>
      <p className="text-xs text-muted-foreground">{hint}</p>
      {right ? <span className="ml-auto">{right}</span> : null}
    </div>
  );
}

/**
 * Brand Brain → Voice (SPEC-263, redesigned under SPEC-274): the next step and the
 * gate first, then the three steps in order — real samples in, rules derived from
 * them, any draft checked against them.
 */
export function VoiceView({
  data,
  sources,
  onChanged,
}: {
  data: VoiceData;
  sources: BrandSource[];
  onChanged: () => void;
}) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const gate = useCan()("brand_brain.manage");
  const titles = useMemo(() => sourceTitleMap(sources), [sources]);
  const summary = voiceSummary(data);
  const voiceKey = brandBrainQueries.voice().queryKey;

  // A switch flips in place: the cached voice read is patched at once and only that
  // row is busy — nothing above or beside it re-renders, and no read is re-run.
  async function toggleRule(id: number, enabled: boolean) {
    setError(null);
    setBusy(`rule-${id}`);
    queryClient.setQueryData<VoiceData>(voiceKey, (cur) =>
      cur
        ? {
            ...cur,
            rules: cur.rules.map((r) => (r.id === id ? { ...r, enabled } : r)),
          }
        : cur,
    );
    try {
      await updateVoiceRule(id, { enabled });
    } catch (e) {
      queryClient.setQueryData<VoiceData>(voiceKey, (cur) =>
        cur
          ? {
              ...cur,
              rules: cur.rules.map((r) =>
                r.id === id ? { ...r, enabled: !enabled } : r,
              ),
            }
          : cur,
      );
      setError(
        e instanceof Error
          ? e.message
          : "Couldn't save the switch — try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function run(key: string, action: () => Promise<unknown>) {
    setError(null);
    setBusy(key);
    try {
      await action();
      onChanged();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Something went wrong — try again.",
      );
    } finally {
      setBusy(null);
    }
  }

  const deriveButton = (
    <RoleButton
      need="brand_brain.manage"
      size="sm"
      variant={summary.step === "derive" ? "default" : "outline"}
      className="h-7"
      disabled={summary.needed > 0 || busy !== null}
      onClick={() => void run("derive", deriveVoice)}
    >
      <GlispIcon className="size-3.5" aria-hidden />
      {busy === "derive"
        ? "Deriving…"
        : summary.rules
          ? "Re-derive from samples"
          : "Derive from samples"}
    </RoleButton>
  );

  return (
    <div className="space-y-4 pb-16">
      <section
        aria-label="Voice summary"
        className="grid grid-cols-2 gap-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr]"
      >
        <Tile
          label="Next step"
          className={cn(
            summary.step !== "ready" && "border-l-4 border-l-warning",
          )}
          value={
            summary.step === "samples"
              ? `Add ${formatNumber(summary.needed)} more ${summary.needed === 1 ? "sample" : "samples"}`
              : summary.step === "derive"
                ? `Derive the voice from ${formatNumber(summary.samples)} samples`
                : `Voice derived · ${formatNumber(summary.rulesOn)} ${summary.rulesOn === 1 ? "rule" : "rules"} on`
          }
          sub={
            summary.step === "samples"
              ? "Three pieces of real brand writing are enough — a caption, a banner, a product line."
              : summary.step === "derive"
                ? "The Brand Voice Analyst reads the samples and writes the rules every writer follows."
                : "Every blog and social draft is checked against these before you see it. Paste one below to try."
          }
        >
          {summary.step === "derive" ? (
            <div className="mt-2">{deriveButton}</div>
          ) : null}
        </Tile>
        <Tile
          label="Samples"
          value={formatNumber(summary.samples)}
          sub={`${formatNumber(summary.fromFiles)} from documents · ${formatNumber(summary.pasted)} pasted`}
        />
        <Tile
          label="Rules"
          value={`${formatNumber(summary.rulesOn)} of ${formatNumber(summary.rules)} on`}
          sub={
            summary.rules
              ? "switch any off; edit on the row"
              : "none derived yet"
          }
        />
        <Tile
          label="The gate"
          value="80 · 60 · 59"
          sub="≥ 80 passes · 60–79 revise · below 60 sent back · a banned word caps at 59 whatever the judge says"
        />
      </section>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <Card className="gap-0 overflow-hidden p-0">
            <StepHeader
              n={1}
              title="Samples"
              hint="the voice is learned from these, not typed"
            />
            <form
              className="space-y-2 border-b border-border px-4 py-3"
              onSubmit={(e) => {
                e.preventDefault();
                const text = draft.trim();
                if (text.length < 12) return;
                void run("add", () => addVoiceSample(text, "manual")).then(() =>
                  setDraft(""),
                );
              }}
            >
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Paste a caption, a banner line, an email you love — real brand writing."
                aria-label="New voice sample"
                className="min-h-16"
                disabled={!gate.allowed}
              />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {summary.needed > 0
                    ? `${formatNumber(summary.needed)} more to derive the voice.`
                    : "Enough to derive the voice."}
                </p>
                <RoleButton
                  need="brand_brain.manage"
                  type="submit"
                  size="sm"
                  variant="outline"
                  className="h-7"
                  disabled={busy !== null || draft.trim().length < 12}
                >
                  <Plus className="size-3.5" aria-hidden /> Add sample
                </RoleButton>
              </div>
            </form>
            {data.samples.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No samples yet. Three pieces of writing you love are enough — or
                drop a captions CSV on the Knowledge Base.
              </p>
            ) : (
              <ul className="max-h-[22rem] divide-y divide-border overflow-y-auto scrollbar-subtle">
                {data.samples.map((s) => (
                  <li
                    key={s.id}
                    className="group flex items-start justify-between gap-3 px-4 py-2.5 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="leading-relaxed">“{s.text}”</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {sampleSourceLine(s, titles)}
                      </p>
                    </div>
                    <RoleGate need="brand_brain.manage">
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        aria-label="Remove sample"
                        className="opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                        disabled={busy !== null}
                        onClick={() =>
                          void run(`del-${s.id}`, () => deleteVoiceSample(s.id))
                        }
                      >
                        <Trash2
                          className="size-3.5 text-muted-foreground"
                          aria-hidden
                        />
                      </Button>
                    </RoleGate>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <div id="voice-check">
            <VoiceChecker
              hasRules={data.rules.some((r) => r.enabled)}
              step={3}
            />
          </div>
        </div>

        <div className="space-y-4">
          <Card className="gap-0 overflow-hidden p-0">
            <StepHeader
              n={2}
              title="Rules"
              hint="what every writer follows"
              right={deriveButton}
            />
            {data.rules.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                No rules yet. Derive them from the samples — the writer then
                follows them and the checker scores against them.
              </p>
            ) : (
              <ul className="max-h-[44rem] divide-y divide-border overflow-y-auto scrollbar-subtle">
                {data.rules.map((r) => (
                  <li
                    key={r.id}
                    className={cn(
                      "flex items-start justify-between gap-3 px-4 py-2.5",
                      !r.enabled && "opacity-50",
                    )}
                  >
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold">
                        {r.title}
                        <span className="ml-2 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                          {r.provenance === "manual"
                            ? "edited"
                            : r.provenance === "file"
                              ? "from a document"
                              : "derived"}
                        </span>
                      </p>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {r.detail}
                      </p>
                    </div>
                    <Switch
                      checked={r.enabled}
                      disabled={busy === `rule-${r.id}` || !gate.allowed}
                      title={gate.reason ?? undefined}
                      aria-label={`${r.title} — ${r.enabled ? "on" : "off"}`}
                      onCheckedChange={(enabled) =>
                        void toggleRule(r.id, enabled)
                      }
                    />
                  </li>
                ))}
              </ul>
            )}
          </Card>
          {error ? <p className="text-xs text-destructive">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
