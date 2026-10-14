"use client";

import { useState } from "react";
import { Check, LoaderCircle, Plus, X } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCan } from "@/hooks/use-can";
import { addableProviders, modelOptionsFor } from "@/lib/ai-providers";
import { addAiProvider, testAiProvider } from "@/services/ai-providers";
import type { AiProvidersOverview, AiTestResult, AiTextProvider } from "@/types/ai-providers";

interface AddProviderDialogProps {
  overview: AiProvidersOverview;
  onSaved: (overview: AiProvidersOverview) => void;
}

/**
 * "Add provider" (SPEC-238): provider dropdown → key → model → Test → Save. The key
 * is tested with the typed value before anything is stored, and it never comes back
 * from the server once saved.
 */
export function AddProviderDialog({ overview, onSaved }: AddProviderDialogProps) {
  const can = useCan();
  const gate = can("ai.manage");
  const [open, setOpen] = useState(false);
  const [provider, setProvider] = useState<AiTextProvider>("openai");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState<string>("");
  const [testing, setTesting] = useState(false);
  const [test, setTest] = useState<AiTestResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const providers = addableProviders(overview.providers);
  const models = modelOptionsFor(provider, overview.catalog);
  const chosenModel = model || models[0]?.value || "";
  const replaces = providers.find((option) => option.value === provider)?.replaces ?? false;

  function reset() {
    setProvider("openai");
    setApiKey("");
    setModel("");
    setTest(null);
    setError(null);
  }

  function changeProvider(next: AiTextProvider) {
    setProvider(next);
    setModel("");
    setTest(null);
  }

  async function handleTest() {
    setTesting(true);
    setError(null);
    try {
      setTest(await testAiProvider(provider, apiKey.trim()));
    } catch (err) {
      setError(err instanceof Error ? err.message : "The test failed.");
    } finally {
      setTesting(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const next = await addAiProvider({ provider, apiKey: apiKey.trim(), model: chosenModel });
      onSaved(next);
      setOpen(false);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the provider.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" disabled={!gate.allowed} title={gate.reason ?? undefined}>
          <Plus className="size-3.5" aria-hidden />
          Add provider
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add an AI provider</DialogTitle>
          <DialogDescription>
            Paste the provider&apos;s API key. It is encrypted before it is stored and is
            never shown again. Test it first if you like.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="add-provider-provider">Provider</Label>
            <Select value={provider} onValueChange={(value) => changeProvider(value as AiTextProvider)}>
              <SelectTrigger id="add-provider-provider" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {providers.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                    {option.replaces ? " · already added" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {replaces && (
              <p className="text-xs text-muted-foreground">
                Saving will replace the key already stored for this provider.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-provider-key">API key</Label>
            <Input
              id="add-provider-key"
              type="password"
              autoComplete="off"
              spellCheck={false}
              placeholder="sk-…"
              value={apiKey}
              onChange={(event) => {
                setApiKey(event.target.value);
                setTest(null);
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="add-provider-model">Model</Label>
            <Select value={chosenModel} onValueChange={setModel}>
              <SelectTrigger id="add-provider-model" className="w-full">
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
            <p className="text-xs text-muted-foreground">
              The model this provider uses whenever it is the system default.
            </p>
          </div>

          {test && (
            <p
              role="status"
              className={`flex items-start gap-1.5 text-xs ${test.ok ? "text-success" : "text-destructive"}`}
            >
              {test.ok ? (
                <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              ) : (
                <X className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              )}
              {test.message}
            </p>
          )}
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <RoleButton
            need="ai.manage"
            type="button"
            variant="outline"
            disabled={!apiKey.trim() || testing || saving}
            onClick={handleTest}
          >
            {testing ? (
              <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
            ) : null}
            {testing ? "Testing…" : "Test connection"}
          </RoleButton>
          <RoleButton
            need="ai.manage"
            type="button"
            disabled={!apiKey.trim() || !chosenModel || saving || testing}
            onClick={handleSave}
          >
            {saving ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : null}
            {saving ? "Saving…" : "Save provider"}
          </RoleButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
