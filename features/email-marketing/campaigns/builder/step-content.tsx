"use client";

import { StatusBadge } from "@/components/shared/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BlockEditor } from "@/features/email-marketing/block-editor";
import { EmailPreview } from "@/features/email-marketing/email-preview";
import { ProductPicker } from "@/features/email-marketing/product-picker";
import { VoiceCheckCard } from "@/features/email-marketing/voice-check-card";
import type { BuilderDraft } from "@/lib/email-builder";
import { scoreSubject } from "@/lib/email-marketing";
import { cn } from "@/lib/utils";
import type { AdviceBlock, CatalogProduct, ContentBlock, VoiceRules } from "@/types/email-marketing";

function scoreTone(score: number) {
  return score >= 80 ? "success" : score >= 60 ? "warning" : "destructive";
}

/** Step 4 — what the customer reads. Subject ideas scored by rules that hold everywhere plus
 * what wins for this store; the body as blocks; the brand-voice check on every word. */
export function StepContent({
  draft,
  catalog,
  voice,
  fromName,
  onChange,
  advice,
}: {
  draft: BuilderDraft;
  catalog: CatalogProduct[];
  voice: VoiceRules;
  fromName: string;
  /** SPEC-350: the advice block named for the store's trade. */
  advice?: AdviceBlock;
  onChange: (patch: Partial<Pick<BuilderDraft, "subject" | "previewText" | "blocks">>) => void;
}) {
  const live = scoreSubject(draft.subject, draft.previewText);
  const text = [draft.subject, draft.previewText, ...draft.blocks.flatMap((b) => [b.title, b.body])].join(". ");
  return (
    <div className="space-y-5">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Subject line ideas</legend>
        <p className="text-xs text-muted-foreground">Written from the goal and the products; scored for length, spam words, shouting and what has won for this store.</p>
        <ul className="space-y-1.5">
          {draft.variants.map((v) => {
            const chosen = draft.subject === v.subject;
            return (
              <li key={v.id}>
                <label className={cn("flex cursor-pointer items-start gap-3 rounded-lg border p-2.5 transition-colors", chosen ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50")}>
                  <input type="radio" name="subject" className="mt-1 accent-primary" checked={chosen} onChange={() => onChange({ subject: v.subject, previewText: v.preview })} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-medium">{v.subject}</span>
                    <span className="block text-xs text-muted-foreground">{v.preview}</span>
                  </span>
                  <StatusBadge tone={scoreTone(v.score)}>{v.score}</StatusBadge>
                </label>
              </li>
            );
          })}
        </ul>
      </fieldset>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="subject">Subject</Label>
          <Input id="subject" value={draft.subject} onChange={(event) => onChange({ subject: event.target.value })} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="preview-text">Preview text</Label>
          <Input id="preview-text" value={draft.previewText} onChange={(event) => onChange({ previewText: event.target.value })} />
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2 text-xs text-muted-foreground" role="status" aria-live="polite">
        <StatusBadge tone={scoreTone(live.score)}>Subject {live.score}</StatusBadge>
        <span className="min-w-0 flex-1">{live.notes.join(" ")}</span>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <p className="text-sm font-medium">Body</p>
          <BlockEditor
            blocks={draft.blocks}
            onChange={(blocks: ContentBlock[]) => onChange({ blocks })}
            productPicker={(block, update) => <ProductPicker catalog={catalog} selected={block.productIds ?? []} onChange={update} />}
            advice={advice}
          />
          <VoiceCheckCard text={text} rules={voice} />
        </div>
        <EmailPreview message={{ channel: "email", subject: draft.subject, previewText: draft.previewText, blocks: draft.blocks, templateId: null }} catalog={catalog} fromName={fromName} advice={advice} />
      </div>
    </div>
  );
}
