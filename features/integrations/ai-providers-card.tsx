"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { AddProviderDialog } from "@/features/integrations/add-provider-dialog";
import { AiProviderRow } from "@/features/integrations/ai-provider-row";
import { AiVideoCard } from "@/features/integrations/ai-video-card";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { imageDefaultOptions, modelLabel, providerLabel, usingEnvDefault, voiceDefaultOptions } from "@/lib/ai-providers";
import { integrationQueries } from "@/lib/queries/integrations";
import { updateAiProvider } from "@/services/ai-providers";
import type { AiProvidersOverview, AiTextProvider } from "@/types/ai-providers";
import { GlispIcon } from "@/components/shared/glisp-icon";

/**
 * The AI providers section of the Integrations page (SPEC-238; backend
 * SPEC-245): one card per key the owner has added, one default for the whole
 * system, the image default, and the single static video card. Every write
 * returns the whole overview and is written straight into the cache — no
 * refetch, no flicker.
 */
export function AiProvidersCard({ embedded = false }: { embedded?: boolean } = {}) {
  const queryClient = useQueryClient();
  const query = useApiQuery(integrationQueries.aiProviders());
  const can = useCan();
  const gate = can("ai.manage");
  const [imageError, setImageError] = useState<string | null>(null);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  function replace(overview: AiProvidersOverview) {
    queryClient.setQueryData(integrationQueries.aiProviders().queryKey, overview);
  }

  if (query.isPending) {
    return (
      <Card className="gap-3 px-4 py-4 md:col-span-2 xl:col-span-3">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </Card>
    );
  }
  if (query.isError) {
    return (
      <Card className="gap-2 px-4 py-4 md:col-span-2 xl:col-span-3">
        <p className="text-sm font-semibold">AI providers</p>
        <p className="text-sm text-destructive">Couldn&apos;t load the AI providers.</p>
      </Card>
    );
  }

  const overview = query.data;
  const imageOptions = imageDefaultOptions(overview.providers);
  const voiceOptions = voiceDefaultOptions(overview.providers);
  const envDefault = usingEnvDefault(overview);
  // Inside another card (Integrations → Included, SPEC-328) it draws no border of its own.
  const Shell = embedded ? "div" : Card;

  return (
    <Shell
      className={cn("flex flex-col gap-4", !embedded && "px-4 py-4 md:col-span-2 xl:col-span-3")}
      data-testid="ai-providers"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <GlispIcon className="size-4 text-ai" aria-hidden />
            AI providers
          </p>
          <p className="text-[10px] font-medium tracking-widest text-muted-foreground uppercase">
            Text · images · video
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add the providers you hold keys for. One is the default for every agent in
            the platform; Chat can still pick any of them per conversation.
          </p>
        </div>
        <AddProviderDialog overview={overview} onSaved={replace} />
      </div>

      <div className="rounded-lg border bg-muted/40 px-3 py-2 text-xs">
        <span className="text-muted-foreground">System default: </span>
        <span className="font-medium">
          {overview.default ? modelLabel(overview.default) : "none"}
        </span>
        {overview.default && (
          <span className="text-muted-foreground"> · {overview.default}</span>
        )}
        {envDefault && (
          <span className="ml-2 inline-flex items-center gap-1 rounded bg-warning/15 px-1.5 py-0.5 text-[10px] font-semibold text-warning">
            <AlertTriangle className="size-3" aria-hidden />
            from .env — add a provider and switch it on to take control
          </span>
        )}
      </div>

      {overview.providers.length === 0 ? (
        <p className="rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
          No providers added yet. Add OpenAI, Anthropic or Google Gemini to start.
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {overview.providers.map((card) => (
            <AiProviderRow key={card.provider} card={card} overview={overview} onChange={replace} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-lg border bg-card p-3">
          <p className="text-sm font-semibold">Image generation</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Only OpenAI and Gemini can generate images; Anthropic never appears here.
          </p>
          <div className="mt-3 space-y-1">
            <Label htmlFor="ai-image-default" className="text-xs">
              Default for images
            </Label>
            <Select
              value={overview.image_default ?? ""}
              disabled={imageOptions.length === 0 || !gate.allowed}
              onValueChange={(value) => {
                setImageError(null);
                void updateAiProvider(value as AiTextProvider, { is_image_default: true })
                  .then(replace)
                  .catch((err: unknown) =>
                    setImageError(err instanceof Error ? err.message : "Could not save."),
                  );
              }}
            >
              <SelectTrigger id="ai-image-default" className="w-full" size="sm" title={gate.reason ?? undefined}>
                <SelectValue
                  placeholder={
                    imageOptions.length === 0 ? "Add OpenAI or Gemini first" : "Choose a provider"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {imageOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {overview.image_default && overview.image_default_source === "env" && (
              <p className="text-[11px] text-muted-foreground">From .env until you choose one.</p>
            )}
            {imageError && (
              <p role="alert" className="text-xs text-destructive">
                {imageError}
              </p>
            )}
          </div>
        </div>
        <div className="rounded-lg border bg-card p-3" data-voice-default>
          <p className="text-sm font-semibold">Voice</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Talk to Glisp speaks with OpenAI or Gemini — whichever card you choose. The brain
            stays the text default; Anthropic has no speech models.
          </p>
          <div className="mt-3 space-y-1">
            <Label htmlFor="ai-voice-default" className="text-xs">
              Default for voice
            </Label>
            <Select
              value={overview.voice_default ?? ""}
              disabled={voiceOptions.length === 0 || !gate.allowed}
              onValueChange={(value) => {
                setVoiceError(null);
                void updateAiProvider(value as AiTextProvider, { is_voice_default: true })
                  .then(replace)
                  .catch((err: unknown) =>
                    setVoiceError(err instanceof Error ? err.message : "Could not save."),
                  );
              }}
            >
              <SelectTrigger id="ai-voice-default" className="w-full" size="sm" title={gate.reason ?? undefined}>
                <SelectValue
                  placeholder={
                    voiceOptions.length === 0 ? "Add OpenAI or Gemini first" : "Choose a provider"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {voiceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {overview.voice_default && (
              <p className="text-[11px] text-muted-foreground">
                {overview.voice_source === "env"
                  ? `From .env (${providerLabel(overview.voice_default)}) until you choose one.`
                  : `${providerLabel(overview.voice_default)} is speaking.`}
              </p>
            )}
            {voiceError && (
              <p role="alert" className="text-xs text-destructive">
                {voiceError}
              </p>
            )}
          </div>
        </div>
        <AiVideoCard video={overview.video} onChange={replace} />
      </div>
    </Shell>
  );
}
