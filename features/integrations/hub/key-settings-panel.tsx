"use client";

import { useState } from "react";
import { Check, CircleAlert, Eye, EyeOff, LoaderCircle, Lock, Trash2 } from "lucide-react";

import { RoleButton, RoleGate } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldInput } from "@/features/integrations/hub/field-input";
import { useHub } from "@/features/integrations/hub/hub-context";
import { useCan } from "@/hooks/use-can";
import { ApiError } from "@/lib/api-error";
import type { FieldSpec, KeyProvider } from "@/lib/integration-catalog";
import { cn } from "@/lib/utils";
import { revealIntegrationSecret, updateIntegrationSettings } from "@/services/integration-config";
import { disconnectIntegration, testIntegration } from "@/services/integration-hub-actions";
import type { ProviderSettings, TestResult } from "@/types/integrations";

type TestState = { kind: "idle" } | { kind: "running" } | { kind: "done"; result: TestResult };

function savedValues(fields: FieldSpec[], settings: ProviderSettings): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, settings.fields[f.key]?.value ?? ""]));
}

function TestOutcome({ state }: { state: TestState }) {
  if (state.kind !== "done") return null;
  const { result } = state;
  if (result.ok === true) {
    return (
      <span role="status" className="inline-flex items-center gap-1.5 text-sm font-medium text-success">
        <Check className="size-4" aria-hidden />
        It works · answered in {result.latencyMs} ms
      </span>
    );
  }
  return (
    <span
      role={result.ok === false ? "alert" : "status"}
      className={cn("inline-flex items-center gap-1.5 text-sm", result.ok === false ? "text-destructive" : "text-muted-foreground")}
    >
      <CircleAlert className="size-4 shrink-0" aria-hidden />
      {result.message}
    </span>
  );
}

/**
 * A key app's Settings (SPEC-328): its fields, each saved key as "Saved" with Reveal and
 * Replace (SPEC-302), Test connection on whatever is typed, a save bar when something
 * changed, and — for a connection — Disconnect, confirmed by typing its name.
 */
export function KeySettingsPanel({
  provider,
  testKey,
  name,
  fields,
  secrets,
  settings,
  canDisconnect,
  startDisconnect = false,
  onDisconnected,
  embedded = false,
  children,
}: {
  provider: KeyProvider;
  /** The hub key the test endpoint takes (`smtp` for the mail server). */
  testKey: string;
  name: string;
  fields: FieldSpec[];
  secrets: FieldSpec[];
  settings: ProviderSettings;
  canDisconnect: boolean;
  startDisconnect?: boolean;
  onDisconnected?: () => void;
  /** Inside another card: no border or title of its own. */
  embedded?: boolean;
  children?: React.ReactNode;
}) {
  const { refresh } = useHub();
  const can = useCan();
  const gate = can("integrations.manage");
  const [current, setCurrent] = useState(settings);
  const [values, setValues] = useState(() => savedValues(fields, settings));
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [replacing, setReplacing] = useState<ReadonlySet<string>>(new Set());
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [shown, setShown] = useState<ReadonlySet<string>>(new Set());
  const [revealing, setRevealing] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "success" | "error"; text: string } | null>(null);
  const [test, setTest] = useState<TestState>({ kind: "idle" });
  const [confirming, setConfirming] = useState(startDisconnect);
  const [confirmText, setConfirmText] = useState("");
  const [disconnecting, setDisconnecting] = useState(false);

  const saved = savedValues(fields, current);
  const typedSecrets = Object.fromEntries(Object.entries(drafts).filter(([, v]) => v.trim()));
  const changedFields = Object.fromEntries(
    Object.entries(values).filter(([key, value]) => value !== saved[key]),
  );
  const dirty = Object.keys(changedFields).length > 0 || Object.keys(typedSecrets).length > 0;

  function edit(next: () => void) {
    next();
    setMessage(null);
    setTest({ kind: "idle" });
  }

  function discard() {
    setValues(saved);
    setDrafts({});
    setReplacing(new Set());
    setMessage(null);
    setTest({ kind: "idle" });
  }

  async function toggleReveal(key: string) {
    if (shown.has(key)) {
      setShown((prev) => new Set([...prev].filter((k) => k !== key)));
      return;
    }
    if (key in revealed) {
      setShown((prev) => new Set(prev).add(key));
      return;
    }
    setRevealing(key);
    try {
      const value = await revealIntegrationSecret(provider, key);
      if (value !== null) {
        setRevealed((prev) => ({ ...prev, [key]: value }));
        setShown((prev) => new Set(prev).add(key));
      }
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not read that value." });
    } finally {
      setRevealing(null);
    }
  }

  async function runTest() {
    setTest({ kind: "running" });
    try {
      const result = await testIntegration(testKey, { ...changedFields, ...typedSecrets });
      setTest({ kind: "done", result });
    } catch (error) {
      setTest({
        kind: "done",
        result: {
          ok: false,
          latencyMs: null,
          code: "failed",
          message: error instanceof ApiError ? error.message : "Could not run the test. Try again.",
        },
      });
    }
  }

  async function save() {
    setSaving(true);
    setMessage(null);
    try {
      const updated = await updateIntegrationSettings(provider, { ...changedFields, ...typedSecrets });
      const next = updated[provider];
      setCurrent(next);
      setValues(savedValues(fields, next));
      setDrafts({});
      setReplacing(new Set());
      setRevealed({});
      setShown(new Set());
      setMessage({ tone: "success", text: "Saved. The next sync uses the new settings." });
      refresh();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof Error ? error.message : "Could not save. Try again." });
    } finally {
      setSaving(false);
    }
  }

  async function disconnect() {
    setDisconnecting(true);
    try {
      await disconnectIntegration(testKey);
      refresh();
      onDisconnected?.();
    } catch (error) {
      setMessage({ tone: "error", text: error instanceof ApiError ? error.message : "Could not disconnect. Try again." });
      setDisconnecting(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <section className={cn("flex flex-col gap-4", !embedded && "rounded-2xl border bg-card p-5 shadow-xs")}>
        {embedded ? null : <h3 className="text-sm font-semibold">Connection</h3>}
        <div className={cn("grid gap-4 sm:grid-cols-2", embedded && "lg:grid-cols-3")}>
          {fields.map((field) => (
            <FieldInput
              key={field.key}
              id={`${provider}-${field.key}`}
              field={field}
              value={values[field.key] ?? ""}
              onChange={(value) => edit(() => setValues((prev) => ({ ...prev, [field.key]: value })))}
            />
          ))}
          {secrets.map((field) => {
            const status = current.secrets[field.key];
            const inputId = `${provider}-${field.key}`;
            const configured = Boolean(status?.configured);
            const platform = status?.source === "env";
            if (!configured || replacing.has(field.key)) {
              return (
                <div key={field.key} className="flex min-w-0 flex-col gap-1.5">
                  <Label htmlFor={inputId}>{field.label}</Label>
                  <Input
                    id={inputId}
                    type="password"
                    autoComplete="off"
                    spellCheck={false}
                    className="font-mono"
                    placeholder={configured ? "Paste the new value" : "Paste it here"}
                    value={drafts[field.key] ?? ""}
                    disabled={!gate.allowed}
                    title={gate.reason ?? undefined}
                    onChange={(event) => {
                      const value = event.target.value;
                      edit(() => setDrafts((prev) => ({ ...prev, [field.key]: value })));
                    }}
                  />
                  <p className="text-xs text-muted-foreground">Stored encrypted. It is never shown on this page again.</p>
                </div>
              );
            }
            const isShown = shown.has(field.key);
            return (
              <div key={field.key} className="flex min-w-0 flex-col gap-1.5">
                <Label id={`${inputId}-label`}>{field.label}</Label>
                <div
                  aria-labelledby={`${inputId}-label`}
                  className="flex h-9 min-w-0 items-center gap-1 rounded-[10px] border bg-muted/40 pr-1 pl-3"
                >
                  <Lock className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate pl-1.5 font-mono text-xs",
                      isShown ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {isShown ? revealed[field.key] : platform ? "Provided by the platform" : "••••••••••••••"}
                  </span>
                  {platform ? null : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      aria-pressed={isShown}
                      disabled={revealing === field.key}
                      onClick={() => void toggleReveal(field.key)}
                    >
                      {revealing === field.key ? (
                        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
                      ) : isShown ? (
                        <EyeOff className="size-3.5" aria-hidden />
                      ) : (
                        <Eye className="size-3.5" aria-hidden />
                      )}
                      {isShown ? "Hide" : "Reveal"}
                    </Button>
                  )}
                  <RoleGate need="integrations.manage">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => edit(() => setReplacing((prev) => new Set(prev).add(field.key)))}
                    >
                      {platform ? "Use your own" : "Replace"}
                    </Button>
                  </RoleGate>
                </div>
                <p className="text-xs text-muted-foreground">
                  {isShown ? "Revealed for you only. The reveal is written to the audit log." : "Saved"}
                </p>
              </div>
            );
          })}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <RoleButton need="integrations.manage" type="button" variant="outline" size="sm" disabled={test.kind === "running"} onClick={() => void runTest()}>
            {test.kind === "running" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            {test.kind === "running" ? "Testing…" : "Test connection"}
          </RoleButton>
          <TestOutcome state={test} />
        </div>
        {message && !dirty ? (
          <p
            role={message.tone === "error" ? "alert" : "status"}
            className={cn("text-sm", message.tone === "error" ? "text-destructive" : "text-success")}
          >
            {message.text}
          </p>
        ) : null}
      </section>

      {children}

      {canDisconnect ? (
        <section className="flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-card p-5">
          <h3 className="text-sm font-semibold text-destructive">Disconnect {name}</h3>
          <p className="text-sm text-muted-foreground">
            We stop syncing and delete the saved login. What {name} already synced stays. You can connect again at
            any time.
          </p>
          {confirming ? (
            <div className="flex flex-col gap-3">
              <div className="flex max-w-sm flex-col gap-1.5">
                <Label htmlFor={`${provider}-confirm`}>
                  Type <span className="font-semibold">{name}</span> to confirm
                </Label>
                <Input
                  id={`${provider}-confirm`}
                  autoComplete="off"
                  value={confirmText}
                  onChange={(event) => setConfirmText(event.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <RoleButton
                  need="integrations.manage"
                  type="button"
                  variant="destructive"
                  size="sm"
                  disabled={confirmText.trim() !== name || disconnecting}
                  onClick={() => void disconnect()}
                >
                  {disconnecting ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
                  Disconnect
                </RoleButton>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setConfirming(false);
                    setConfirmText("");
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <RoleButton need="integrations.manage" type="button" variant="outline" size="sm" className="text-destructive" onClick={() => setConfirming(true)}>
                <Trash2 className="size-4" aria-hidden />
                Disconnect…
              </RoleButton>
            </div>
          )}
        </section>
      ) : null}

      {dirty ? (
        <div
          role="region"
          aria-label="Unsaved changes"
          className="sticky bottom-4 z-10 flex flex-wrap items-center gap-3 rounded-2xl bg-foreground py-3 pr-3 pl-5 text-background shadow-lg"
        >
          <span className="flex-1 text-sm">
            {message?.tone === "error" ? message.text : "You have unsaved changes"}
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="text-background hover:bg-background/15 hover:text-background"
            onClick={discard}
          >
            Discard
          </Button>
          <RoleButton
            need="integrations.manage"
            type="button"
            size="sm"
            className="bg-background text-foreground hover:bg-background/90"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
            Save changes
          </RoleButton>
        </div>
      ) : null}
    </div>
  );
}
