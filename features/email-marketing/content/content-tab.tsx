"use client";

import { useState } from "react";
import { BookOpen, LayoutTemplate } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { StatusBadge } from "@/components/shared/status-badge";
import { BlockEditor } from "@/features/email-marketing/block-editor";
import { EmailPreview } from "@/features/email-marketing/email-preview";
import { ProductPicker } from "@/features/email-marketing/product-picker";
import { CardGridSkeleton } from "@/features/email-marketing/skeletons";
import { VoiceCheckCard } from "@/features/email-marketing/voice-check-card";
import { useApiQuery } from "@/hooks/use-api-query";
import { providerInfo } from "@/lib/email-providers";
import { emailMarketingQueries } from "@/lib/queries/email-marketing";
import { relativeTime } from "@/lib/system-trace";
import { cn } from "@/lib/utils";
import type { ContentBlock, EmailContent, EmailWorkspace } from "@/types/email-marketing";

function Studio({ content, workspace }: { content: EmailContent; workspace: EmailWorkspace }) {
  const [templateId, setTemplateId] = useState(content.templates[0]?.id ?? "");
  const template = content.templates.find((t) => t.id === templateId) ?? content.templates[0];
  const [blocks, setBlocks] = useState<ContentBlock[]>(template?.blocks ?? []);
  const provider = providerInfo(workspace.connection.provider).name;
  const text = blocks.flatMap((b) => [b.title, b.body]).join(". ");

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="flex items-center gap-2 text-sm font-semibold"><LayoutTemplate className="size-4 text-muted-foreground" aria-hidden />Templates</h2>
        <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {content.templates.map((t) => (
            <li key={t.id}>
              <button
                type="button"
                aria-pressed={t.id === template?.id}
                onClick={() => {
                  setTemplateId(t.id);
                  setBlocks(t.blocks);
                }}
                className={cn("w-full rounded-xl border p-3 text-left outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring", t.id === template?.id ? "border-primary bg-primary/5" : "border-border bg-card hover:bg-muted/50")}
              >
                <span className="block text-sm font-medium">{t.name}</span>
                <span className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                  <StatusBadge tone={t.source === "fte" ? "ai" : "neutral"}>{t.source === "fte" ? "Ours" : provider}</StatusBadge>
                  updated {relativeTime(t.updatedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground">Templates are written as HTML into {provider} — its drag-and-drop editor is not in its API, so edit them here.</p>
      </section>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Edit: {template?.name}</h2>
          <BlockEditor
            blocks={blocks}
            onChange={setBlocks}
            productPicker={(block, update) => <ProductPicker catalog={content.catalog} selected={block.productIds ?? []} onChange={update} />}
            advice={content.adviceBlock}
          />
          <VoiceCheckCard text={text} rules={content.voice} />
          {content.latestPost ? (
            <div className="flex items-start gap-2 rounded-xl border border-border bg-card p-3 text-sm">
              <BookOpen className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
              <span>
                New from Search Visibility: <span className="font-medium">{content.latestPost.title}</span> ({relativeTime(content.latestPost.publishedAt)}). Add a Blog teaser block and it becomes this month&rsquo;s newsletter section.
              </span>
            </div>
          ) : null}
        </section>
        <section className="space-y-3 xl:sticky xl:top-4">
          <h2 className="text-sm font-semibold">Preview</h2>
          <EmailPreview message={{ channel: "email", subject: template?.name ?? "", previewText: "Template preview", blocks, templateId: template?.id ?? null }} catalog={content.catalog} fromName={workspace.sender.fromName} advice={content.adviceBlock} />
        </section>
      </div>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Reusable sections</h2>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
          {content.sections.map((s) => (
            <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1 px-4 py-3 text-sm">
              <StatusBadge tone="neutral">{s.kind}</StatusBadge>
              <span className="font-medium">{s.name}</span>
              <span className="min-w-0 flex-1 text-muted-foreground">{s.body}</span>
              <span className="text-xs text-muted-foreground">updated {relativeTime(s.updatedAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold">Brand rules every email follows</h2>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="rounded-xl border border-border bg-card p-3 text-sm">
            <p className="mb-1 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">Never use</p>
            <p>{content.voice.bannedWords.join(", ")}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-sm">
            <p className="mb-1 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">Claims that need proof</p>
            <p>{content.voice.claims.join(", ")}</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3 text-sm">
            <p className="mb-1 text-[10px] font-extrabold tracking-widest text-muted-foreground uppercase">Voice</p>
            <p>{content.voice.voiceNotes.join(" ")}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">These come from your Brand Brain (Search Visibility → Brand Brain); edit them there and every writer follows.</p>
      </section>
    </div>
  );
}

/** The content studio (SPEC-345): templates, a block editor, the catalog, the brand-voice
 * check, reusable sections and the four-way preview. */
export function ContentTab() {
  const content = useApiQuery(emailMarketingQueries.content());
  const workspace = useApiQuery(emailMarketingQueries.workspace());
  if (content.isPending || workspace.isPending) return <CardGridSkeleton cards={4} />;
  if (content.isError) return <QueryErrorState error={content.error} onRetry={() => void content.refetch()} />;
  if (workspace.isError) return <QueryErrorState error={workspace.error} onRetry={() => void workspace.refetch()} />;
  return <Studio content={content.data} workspace={workspace.data} />;
}
