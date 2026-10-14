"use client";


import { Button } from "@/components/ui/button";
import { BotAvatar } from "@/features/chat/bot-avatar";
import type { SuggestedPrompt } from "@/types/chat";
import { GlispIcon } from "@/components/shared/glisp-icon";

interface ChatEmptyStateProps {
  userName: string;
  prompts: SuggestedPrompt[];
  disabled: boolean;
  onPrompt: (prompt: string) => void;
}

/** Purposeful empty state for a fresh conversation: intro + suggested prompts. */
export function ChatEmptyState({
  userName,
  prompts,
  disabled,
  onPrompt,
}: ChatEmptyStateProps) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 p-6 text-center">
      <BotAvatar className="size-16 rounded-card" />
      <div className="max-w-md space-y-1.5">
        <h2 className="font-heading text-2xl tracking-wide">
          👋 Hello {userName}, how can I help?
        </h2>
        <p className="text-sm text-muted-foreground">
          Ask me anything about your store performance, products, customers,
          and inventory. Every number I give comes from your store&apos;s
          analytics.
        </p>
      </div>
      <div className="grid w-full max-w-lg gap-2 sm:grid-cols-2">
        {prompts.map((prompt) => (
          <Button
            key={prompt.id}
            variant="outline"
            disabled={disabled}
            onClick={() => onPrompt(prompt.label)}
            className="h-auto items-start justify-start gap-2 px-3 py-2.5 text-left text-sm whitespace-normal hover:border-foreground/25"
          >
            <GlispIcon
              className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              aria-hidden
            />
            {prompt.label}
          </Button>
        ))}
      </div>
    </div>
  );
}
