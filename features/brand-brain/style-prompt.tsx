"use client";

import { useState } from "react";
import { AlertTriangle, Check, Copy, RotateCcw } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  isDirty,
  missingSafetyLine,
  promptSourceLabel,
  promptStats,
  sectionLine,
  SURFACES,
} from "@/lib/style-bench";
import { cn } from "@/lib/utils";
import type { StylePrompt, StyleSurface } from "@/types/brand-brain";

/**
 * The prompt an image model receives — and, since SPEC-298, the place to change it.
 *
 * Saving stores the text as this surface's own prompt: every generator then sends exactly
 * what is on screen, with nothing appended. Reset drops it and the Style Guide's rows
 * compile again, byte for byte. A version that drops a safety rule says so rather than
 * refusing — the rules are the owner's, and so is the decision to write his own.
 */
export function StylePromptPanel({
  preview,
  surface,
  onSurface,
  loading,
  saving,
  error,
  onSave,
  onReset,
}: {
  preview: StylePrompt | undefined;
  surface: StyleSurface;
  onSurface: (next: StyleSurface) => void;
  loading: boolean;
  saving: boolean;
  error: string | null;
  onSave: (text: string) => void;
  onReset: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const [typed, setTyped] = useState<string | null>(null);
  const inForce = preview?.prompt.trim() ?? "";

  // The panel follows the text in force until the owner starts typing; a surface switch
  // or a save/reset lands new text and the draft steps aside. Adjusted during render
  // (the React 19 pattern) rather than in an effect, so there is no second paint.
  const [lastInForce, setLastInForce] = useState(inForce);
  if (inForce !== lastInForce) {
    setLastInForce(inForce);
    setTyped(null);
  }
  const value = typed ?? inForce;
  const dirty = isDirty(value, preview);
  const missing = missingSafetyLine(preview?.missing_safety ?? []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Card className="gap-0 p-0" data-style-prompt data-style-source={preview?.source ?? "rules"}>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-5 py-3">
        <div className="flex items-baseline gap-2">
          <p className="text-sm font-semibold">The prompt</p>
          <p className="text-xs text-muted-foreground">{promptSourceLabel(preview)}</p>
        </div>
        <div className="flex items-center gap-2">
          <div role="tablist" aria-label="Surface" className="flex rounded-lg border border-border p-0.5">
            {SURFACES.map((s) => (
              <button
                key={s.key}
                type="button"
                role="tab"
                aria-selected={s.key === surface}
                title={s.hint}
                onClick={() => onSurface(s.key)}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  s.key === surface
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
          {preview?.source === "custom" && !dirty ? (
            <RoleButton
              need="brand_brain.manage"
              type="button"
              size="sm"
              variant="outline"
              disabled={saving}
              onClick={onReset}
              data-style-reset
            >
              <RotateCcw className="size-3.5" aria-hidden />
              <span className="ml-1.5">Reset to the rules</span>
            </RoleButton>
          ) : null}
          <Button type="button" size="sm" variant="outline" disabled={!preview} onClick={() => void copy()}>
            {copied ? <Check className="size-3.5" aria-hidden /> : <Copy className="size-3.5" aria-hidden />}
            <span className="ml-1.5">{copied ? "Copied" : "Copy"}</span>
          </Button>
        </div>
      </div>

      <Textarea
        value={loading && !preview ? "Reading the rules…" : value}
        onChange={(e) => setTyped(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey) && dirty) {
            e.preventDefault();
            onSave(value);
          }
          if (e.key === "Escape" && dirty) {
            e.preventDefault();
            setTyped(null);
          }
        }}
        spellCheck={false}
        disabled={saving || (loading && !preview)}
        aria-label={`The ${surface} image prompt`}
        className="scrollbar-subtle max-h-[28rem] min-h-72 resize-y rounded-none border-0 px-5 py-4 font-mono text-xs leading-relaxed shadow-none focus-visible:ring-0"
        data-style-prompt-body
      />

      {error ? <p className="px-5 pb-2 text-sm text-destructive">{error}</p> : null}
      {missing && !dirty ? (
        <p className="flex items-start gap-2 px-5 pb-2 text-xs leading-relaxed text-warning">
          <AlertTriangle className="mt-px size-3.5 shrink-0" aria-hidden />
          {missing}
        </p>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-5 py-2.5">
        <p className="text-xs text-muted-foreground">{promptStats(preview, typed ?? undefined)}</p>
        {dirty ? (
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="ghost" disabled={saving} onClick={() => setTyped(null)}>
              Revert
            </Button>
            <RoleButton need="brand_brain.manage" type="button" size="sm" disabled={saving || !value.trim()} onClick={() => onSave(value)} data-style-save>
              {saving ? "Saving…" : "Save"}
            </RoleButton>
          </div>
        ) : (
          <p className="text-xs text-muted-foreground tabular-nums">{sectionLine(preview)}</p>
        )}
      </div>
    </Card>
  );
}
