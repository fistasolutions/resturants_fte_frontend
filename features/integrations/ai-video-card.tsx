"use client";

import { useState } from "react";
import { Check, Clapperboard, LoaderCircle, X } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCan } from "@/hooks/use-can";
import { clearVideoKey, setVideoKey, testVideoKey } from "@/services/ai-providers";
import type { AiProvidersOverview, AiTestResult, AiVideoCard as VideoCard } from "@/types/ai-providers";

const SOURCE_LABEL: Record<VideoCard["source"], string> = {
  database: "Own key",
  gemini: "Using your Gemini key",
  env: "From .env",
  unset: "Not configured",
};

interface AiVideoCardProps {
  video: VideoCard;
  onChange: (overview: AiProvidersOverview) => void;
}

/**
 * The one static video card (SPEC-238): Google Veo is the only video vendor, so
 * there is nothing to add or make default — only a key to set, test, or remove.
 * Without its own key it uses the Gemini key, and says so.
 */
export function AiVideoCard({ video, onChange }: AiVideoCardProps) {
  const can = useCan();
  const gate = can("ai.manage");
  const [apiKey, setApiKey] = useState("");
  const [busy, setBusy] = useState<"save" | "test" | "remove" | null>(null);
  const [test, setTest] = useState<AiTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(kind: NonNullable<typeof busy>, action: () => Promise<void>) {
    setBusy(kind);
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(err instanceof Error ? err.message : "The request failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-3" data-provider="veo">
      <div className="min-w-0">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <Clapperboard className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          Google Veo · video
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold whitespace-nowrap ${
              video.configured ? "bg-success/15 text-success" : "bg-warning/15 text-warning"
            }`}
          >
            {SOURCE_LABEL[video.source]}
          </span>
          <span className="min-w-0 truncate font-mono text-[10px] text-muted-foreground">{video.model}</span>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        The only video vendor, so it is always here. Leave the key empty to reuse the
        Gemini key.
      </p>

      <div className="mt-3 space-y-1">
        <Label htmlFor="ai-video-key" className="text-xs">
          API key
        </Label>
        <Input
          id="ai-video-key"
          type="password"
          autoComplete="off"
          spellCheck={false}
          placeholder={video.source === "database" ? "•••••••• (stored)" : "AIza…"}
          value={apiKey}
          disabled={!gate.allowed}
          title={gate.reason ?? undefined}
          onChange={(event) => {
            setApiKey(event.target.value);
            setTest(null);
          }}
        />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <RoleButton
          need="ai.manage"
          size="sm"
          disabled={!apiKey.trim() || busy !== null}
          onClick={() =>
            void run("save", async () => {
              onChange(await setVideoKey(apiKey.trim()));
              setApiKey("");
            })
          }
        >
          {busy === "save" ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : null}
          Save
        </RoleButton>
        <RoleButton
          need="ai.manage"
          variant="outline"
          size="sm"
          disabled={(!apiKey.trim() && !video.configured) || busy !== null}
          onClick={() =>
            void run("test", async () => {
              setTest(await testVideoKey(apiKey.trim() || undefined));
            })
          }
        >
          {busy === "test" ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : null}
          {busy === "test" ? "Testing…" : "Test"}
        </RoleButton>
        {video.source === "database" && (
          <RoleButton
            need="ai.manage"
            variant="ghost"
            size="sm"
            disabled={busy !== null}
            onClick={() =>
              void run("remove", async () => {
                onChange(await clearVideoKey());
              })
            }
          >
            Remove key
          </RoleButton>
        )}
      </div>
      {test && (
        <p
          role="status"
          className={`mt-2 flex items-center gap-1 text-[11px] ${test.ok ? "text-success" : "text-destructive"}`}
        >
          {test.ok ? <Check className="size-3 shrink-0" aria-hidden /> : <X className="size-3 shrink-0" aria-hidden />}
          {test.message}
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
