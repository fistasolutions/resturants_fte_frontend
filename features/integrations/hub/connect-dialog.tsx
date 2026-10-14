"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Clock, ExternalLink, LoaderCircle, ShieldCheck } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppLogo } from "@/features/integrations/hub/app-logo";
import { FieldInput } from "@/features/integrations/hub/field-input";
import { signInNeed, useHub } from "@/features/integrations/hub/hub-context";
import { GorgiasConnectForm } from "@/features/integrations/gorgias-oauth";
import { KlaviyoConnectButton } from "@/features/integrations/klaviyo-oauth";
import { useApiQuery } from "@/hooks/use-api-query";
import { useCan } from "@/hooks/use-can";
import { ApiError } from "@/lib/api-error";
import { canConnectWithGorgias } from "@/lib/gorgias-connect";
import { APPS, AREAS, type IntegrationApp, type IntegrationKey } from "@/lib/integration-catalog";
import { canConnectWithKlaviyo, KLAVIYO_INTEGRATIONS_RETURN } from "@/lib/klaviyo-connect";
import { integrationQueries } from "@/lib/queries/integrations";
import { cn } from "@/lib/utils";
import { updateIntegrationSettings } from "@/services/integration-config";
import { syncIntegration, testIntegration } from "@/services/integration-hub-actions";

type Stage = "idle" | "running" | "done" | "failed" | "skipped";

interface Progress {
  test: Stage;
  save: Stage;
  sync: Stage;
  error: string | null;
}

const START: Progress = { test: "idle", save: "idle", sync: "idle", error: null };

function initialValues(app: IntegrationApp): Record<string, string> {
  return Object.fromEntries([...(app.fields ?? []), ...(app.secrets ?? [])].map((f) => [f.key, ""]));
}

/**
 * Connecting an app that is not connected (SPEC-328). A key app goes what-you-get → the
 * values → test and connect: the login is TRIED before anything is saved, so a wrong key
 * never becomes a broken connection. An OAuth app hands off to the provider's sign-in.
 */
export function ConnectDialog({ appKey, onClose }: { appKey: IntegrationKey | null; onClose: () => void }) {
  const app = appKey ? APPS[appKey] : null;
  return (
    <Dialog open={app !== null} onOpenChange={(open) => (open ? undefined : onClose())}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-lg">
        {app ? (
          app.kind === "key" ? (
            <KeyConnect key={app.key} app={app} onClose={onClose} />
          ) : (
            <SignInConnect key={app.key} app={app} />
          )
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function Header({ app, step }: { app: IntegrationApp; step?: number }) {
  return (
    <div className="space-y-4 px-6 pt-6">
      <DialogHeader className="flex-row items-center gap-3 space-y-0 text-left">
        <AppLogo src={app.logo} />
        <div className="min-w-0">
          <DialogTitle>Connect {app.name}</DialogTitle>
          <DialogDescription>{AREAS[app.area]} · about a minute</DialogDescription>
        </div>
      </DialogHeader>
      {step ? (
        <div className="flex gap-1.5" aria-label={`Step ${step} of 3`}>
          {[1, 2, 3].map((i) => (
            <span key={i} className={cn("h-1 flex-1 rounded-full", i <= step ? "bg-foreground" : "bg-muted")} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function WhatYouGet({ app }: { app: IntegrationApp }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-2 rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
        <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
        <span>
          <span className="font-semibold">Unlocks</span> {app.unlocks}
        </span>
      </div>
      <div className="space-y-2">
        <p className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">What we read</p>
        <ul className="space-y-1.5 text-sm">
          {app.reads.map((line) => (
            <li key={line} className="flex gap-2">
              <Check className="mt-0.5 size-4 shrink-0 text-success" aria-hidden />
              {line}
            </li>
          ))}
        </ul>
      </div>
      <p className="flex items-start gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="mt-0.5 size-4 shrink-0" aria-hidden />
        {app.sends ? `What we change: ${app.sends}` : `Read-only. We never change anything in ${app.name}.`}
      </p>
    </div>
  );
}

function StageLine({ stage, label }: { stage: Stage; label: string }) {
  return (
    <li className={cn("flex items-center gap-2.5 text-sm", stage === "idle" && "text-muted-foreground")}>
      {stage === "running" ? (
        <LoaderCircle className="size-4 animate-spin" aria-hidden />
      ) : stage === "done" ? (
        <Check className="size-4 text-success" aria-hidden />
      ) : stage === "failed" ? (
        <CircleAlert className="size-4 text-destructive" aria-hidden />
      ) : (
        <Clock className="size-4" aria-hidden />
      )}
      {label}
    </li>
  );
}

function KeyConnect({ app, onClose }: { app: IntegrationApp; onClose: () => void }) {
  const { refresh } = useHub();
  const can = useCan();
  const gate = can("integrations.manage");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(app));
  const [progress, setProgress] = useState<Progress>(START);
  const provider = app.provider;
  const canSync = app.key !== "klaviyo" && app.key !== "clarity";
  // SPEC-371: Klaviyo offers its one-click sign-in first when the platform has the app set up.
  // The hub's overview is already cached on every page that opens this dialog.
  const overview = useApiQuery(integrationQueries.overview(), {
    enabled: app.key === "klaviyo" || app.key === "gorgias",
  });
  const appOAuth = overview.data?.integrations.find((i) => i.key === app.key)?.oauth;
  const klaviyoSignIn = app.key === "klaviyo" && canConnectWithKlaviyo(appOAuth);
  // SPEC-372: Gorgias's sign-in needs the store's subdomain, so its form sits in the body.
  const gorgiasSignIn = app.key === "gorgias" && canConnectWithGorgias(appOAuth);
  const signIn = klaviyoSignIn || gorgiasSignIn;
  const required = [...(app.fields ?? []).filter((f) => f.type !== "time"), ...(app.secrets ?? [])];
  const complete = required.every((f) => values[f.key]?.trim());
  const finished = progress.test === "done" && progress.save === "done" && progress.sync !== "running" && progress.sync !== "idle";

  async function run() {
    if (!provider) return;
    setStep(3);
    setProgress({ ...START, test: "running" });
    const typed = Object.fromEntries(Object.entries(values).filter(([, v]) => v.trim()));
    try {
      const result = await testIntegration(app.key, typed);
      if (result.ok === false) {
        setProgress({ ...START, test: "failed", error: result.message ?? `${app.name} refused this login.` });
        return;
      }
      setProgress((p) => ({ ...p, test: "done", save: "running" }));
      await updateIntegrationSettings(provider, typed);
      setProgress((p) => ({ ...p, save: "done", sync: canSync ? "running" : "skipped" }));
      if (canSync) {
        try {
          await syncIntegration(app.key);
          setProgress((p) => ({ ...p, sync: "done" }));
        } catch {
          // Saved and working; the schedule picks it up even when the first nudge is refused.
          setProgress((p) => ({ ...p, sync: "skipped" }));
        }
      }
      refresh();
    } catch (error) {
      const text = error instanceof ApiError ? error.message : "Something went wrong. Try again.";
      setProgress((p) => ({
        ...p,
        test: p.test === "running" ? "failed" : p.test,
        save: p.save === "running" ? "failed" : p.save,
        error: text,
      }));
    }
  }

  return (
    <>
      <Header app={app} step={step} />
      <div className="max-h-[60vh] space-y-4 overflow-y-auto px-6 py-5">
        {step === 1 && klaviyoSignIn ? (
          <p className="text-sm">
            Connect with one click: press Allow on Klaviyo&apos;s screen and you come straight back, connected. Nothing to
            copy.
          </p>
        ) : null}
        {step === 1 && gorgiasSignIn ? (
          <GorgiasConnectForm note="Connect with one click: press Allow on Gorgias's screen and you come straight back, connected. Nothing to copy." />
        ) : null}
        {step === 1 ? <WhatYouGet app={app} /> : null}
        {step === 1 && signIn ? (
          <p className="text-sm text-muted-foreground">
            Prefer a key?{" "}
            <button
              type="button"
              className="rounded-sm font-medium text-foreground underline underline-offset-4 outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setStep(2)}
            >
              {gorgiasSignIn ? "Use an API key instead" : "Use a private API key instead"}
            </button>
          </p>
        ) : null}
        {step === 2 ? (
          <form
            id={`connect-${app.key}`}
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (complete && gate.allowed) void run();
            }}
          >
            {[...(app.fields ?? []), ...(app.secrets ?? [])].map((field) => {
              const secret = (app.secrets ?? []).includes(field);
              return (
                <FieldInput
                  key={field.key}
                  id={`connect-${app.key}-${field.key}`}
                  field={field}
                  secret={secret}
                  placeholder={secret ? "Paste it here" : undefined}
                  value={values[field.key] ?? ""}
                  onChange={(value) => setValues((prev) => ({ ...prev, [field.key]: value }))}
                />
              );
            })}
            <p className="text-xs text-muted-foreground">
              Keys are stored encrypted. Only an owner can reveal one, and every reveal is logged.
            </p>
            {app.help?.length ? (
              <details className="rounded-lg border bg-muted/40 px-3 py-2.5 text-sm">
                <summary className="cursor-pointer font-medium">Where do I find this?</summary>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-muted-foreground">
                  {app.help.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ol>
              </details>
            ) : null}
          </form>
        ) : null}
        {step === 3 ? (
          finished ? (
            <div className="flex flex-col items-center gap-2 py-4 text-center" role="status">
              <span className="grid size-12 place-items-center rounded-full bg-success/12 text-success">
                <Check className="size-6" aria-hidden />
              </span>
              <p className="text-base font-semibold">{app.name} is connected</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                {progress.sync === "done"
                  ? `The first sync is running. ${app.unlocks} fills in over the next few minutes.`
                  : app.key === "clarity"
                    ? "Clarity's first sync starts now. Store Traffic fills in once it finishes."
                    : `${app.unlocks} is ready to use.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4" aria-live="polite">
              <ul className="space-y-3">
                <StageLine stage={progress.test} label="Checking the login" />
                <StageLine stage={progress.save} label="Saving it, encrypted" />
                {canSync ? <StageLine stage={progress.sync} label="Starting the first sync" /> : null}
              </ul>
              {progress.error ? (
                <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-sm">
                  {progress.error}
                </p>
              ) : null}
            </div>
          )
        ) : null}
      </div>
      <DialogFooter className="mx-0 mb-0 border-t bg-muted/40 px-6 py-4">
        {step === 1 && klaviyoSignIn ? (
          <>
            <Button variant="ghost" className="sm:mr-auto" onClick={onClose}>
              Cancel
            </Button>
            <KlaviyoConnectButton returnPath={KLAVIYO_INTEGRATIONS_RETURN} />
          </>
        ) : null}
        {step === 1 && gorgiasSignIn ? (
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        ) : null}
        {step === 1 && !signIn ? (
          <>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => setStep(2)}>
              Continue
              <ArrowRight className="size-4" aria-hidden />
            </Button>
          </>
        ) : null}
        {step === 2 ? (
          <>
            <Button variant="ghost" className="sm:mr-auto" onClick={() => setStep(1)}>
              <ArrowLeft className="size-4" aria-hidden />
              Back
            </Button>
            <RoleButton need="integrations.manage" type="submit" form={`connect-${app.key}`} disabled={!complete}>
              Test and connect
            </RoleButton>
          </>
        ) : null}
        {step === 3 && finished ? (
          <>
            <Button variant="ghost" asChild>
              <Link href={`/integrations/${app.key}`} onClick={onClose}>
                Open {app.name}
              </Link>
            </Button>
            <Button onClick={onClose}>Done</Button>
          </>
        ) : null}
        {step === 3 && !finished ? (
          progress.error ? (
            <Button
              variant="outline"
              onClick={() => {
                setProgress(START);
                setStep(2);
              }}
            >
              <ArrowLeft className="size-4" aria-hidden />
              Fix the values
            </Button>
          ) : (
            <Button disabled>
              <LoaderCircle className="size-4 animate-spin" aria-hidden />
              Connecting…
            </Button>
          )
        ) : null}
      </DialogFooter>
    </>
  );
}

function SignInConnect({ app }: { app: IntegrationApp }) {
  const { signIn } = useHub();
  const [going, setGoing] = useState(false);
  const vendor = app.vendor ?? app.name;
  return (
    <>
      <Header app={app} />
      <div className="space-y-4 px-6 py-5">
        <p className="text-sm">
          You go to {vendor} to sign in, then come straight back to {app.name}&apos;s page here.
        </p>
        <WhatYouGet app={app} />
      </div>
      <DialogFooter className="mx-0 mb-0 border-t bg-muted/40 px-6 py-4">
        <RoleButton
          need={signInNeed(app.key)}
          disabled={going}
          onClick={async () => {
            setGoing(true);
            await signIn(app.key);
            setGoing(false);
          }}
        >
          {going ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
          Continue to {vendor}
          <ExternalLink className="size-4" aria-hidden />
        </RoleButton>
      </DialogFooter>
    </>
  );
}
