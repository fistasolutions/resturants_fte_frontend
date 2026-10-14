"use client";

import { useState } from "react";
import { Check, LoaderCircle, Star, Trash2, X } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCan } from "@/hooks/use-can";
import { cardStatus, modelOptionsFor, providerLabel } from "@/lib/ai-providers";
import { deleteAiProvider, testAiProvider, updateAiProvider } from "@/services/ai-providers";
import type { AiProviderCard, AiProvidersOverview, AiTestResult } from "@/types/ai-providers";

const TONE: Record<"ok" | "warn" | "muted", string> = {
  ok: "bg-success/15 text-success",
  warn: "bg-warning/15 text-warning",
  muted: "bg-muted text-muted-foreground",
};

interface AiProviderRowProps {
  card: AiProviderCard;
  overview: AiProvidersOverview;
  onChange: (overview: AiProvidersOverview) => void;
}

/**
 * One provider card (SPEC-238): status, its model, the "Default for the whole
 * system" switch, Test and Delete. An env-only provider is read-only here — the
 * "Add provider" dialog is how it becomes a real card.
 */
export function AiProviderRow({ card, overview, onChange }: AiProviderRowProps) {
  const can = useCan();
  const gate = can("ai.manage");
  const [busy, setBusy] = useState<"model" | "default" | "test" | "delete" | null>(null);
  const [test, setTest] = useState<AiTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const status = cardStatus(card);
  const models = modelOptionsFor(card.provider, overview.catalog);
  const envOnly = card.source === "env";

  async function run<T>(kind: NonNullable<typeof busy>, action: () => Promise<T>): Promise<T | null> {
    setBusy(kind);
    setError(null);
    try {
      return await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The request failed.");
      return null;
    } finally {
      setBusy(null);
    }
  }

  return (
    <div
      className={`rounded-lg border bg-card p-3 ${card.is_default ? "border-primary/40" : ""} ${envOnly ? "opacity-80" : ""}`}
      data-provider={card.provider}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold">
            {providerLabel(card.provider)}
            {card.is_default && (
              <span className="inline-flex items-center gap-1 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                <Star className="size-2.5" aria-hidden />
                Default
              </span>
            )}
            {card.is_image_default && (
              <span className="rounded bg-ai/10 px-1.5 py-0.5 text-[10px] font-semibold text-ai">
                Images
              </span>
            )}
          </p>
          <span
            className={`mt-1 inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold ${TONE[status.tone]}`}
          >
            {status.label}
          </span>
        </div>
        {!envOnly && (
          <RoleGate need="ai.manage">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`Remove ${providerLabel(card.provider)}`}
                  disabled={busy !== null}
                >
                  <Trash2 aria-hidden />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove {providerLabel(card.provider)}?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The stored key is deleted.
                    {card.is_default
                      ? " This is the system default — every agent will fall back to the .env key until you choose another default."
                      : ""}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep it</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      void run("delete", async () => {
                        onChange(await deleteAiProvider(card.provider));
                      })
                    }
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </RoleGate>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <Label htmlFor={`ai-model-${card.provider}`} className="text-xs">
          Model
        </Label>
        <Select
          value={card.model}
          disabled={envOnly || busy !== null || !gate.allowed}
          onValueChange={(value) =>
            void run("model", async () => {
              onChange(await updateAiProvider(card.provider, { model: value }));
            })
          }
        >
          <SelectTrigger
            id={`ai-model-${card.provider}`}
            className="w-full"
            size="sm"
            title={gate.reason ?? undefined}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {models.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <Label htmlFor={`ai-default-${card.provider}`} className="text-xs">
          Default for the whole system
        </Label>
        <Switch
          id={`ai-default-${card.provider}`}
          size="sm"
          checked={card.is_default}
          disabled={envOnly || busy !== null || !gate.allowed}
          title={gate.reason ?? undefined}
          onCheckedChange={(checked) =>
            void run("default", async () => {
              onChange(await updateAiProvider(card.provider, { is_default: checked }));
            })
          }
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-2">
        <RoleButton
          need="ai.manage"
          variant="outline"
          size="sm"
          disabled={envOnly || busy !== null}
          onClick={() =>
            void run("test", async () => {
              const result = await testAiProvider(card.provider);
              setTest(result);
              // The server recorded the same result on the row — mirror it into the
              // cached overview so the pill agrees, without a second request.
              onChange({
                ...overview,
                providers: overview.providers.map((other) =>
                  other.provider === card.provider
                    ? {
                        ...other,
                        last_tested_at: new Date().toISOString(),
                        last_test_ok: result.ok,
                        last_test_message: result.message,
                      }
                    : other,
                ),
              });
            })
          }
        >
          {busy === "test" ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : null}
          {busy === "test" ? "Testing…" : "Test"}
        </RoleButton>
        {test && (
          <p
            role="status"
            className={`flex min-w-0 items-center gap-1 text-[11px] ${test.ok ? "text-success" : "text-destructive"}`}
          >
            {test.ok ? <Check className="size-3 shrink-0" aria-hidden /> : <X className="size-3 shrink-0" aria-hidden />}
            <span className="truncate">{test.message}</span>
          </p>
        )}
      </div>
      {card.last_test_message && !test && (
        <p className="mt-2 truncate text-[11px] text-muted-foreground" title={card.last_test_message}>
          Last test: {card.last_test_message}
        </p>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
