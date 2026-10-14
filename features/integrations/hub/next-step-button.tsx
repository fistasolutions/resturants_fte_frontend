"use client";

import Link from "next/link";
import { LoaderCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useHub } from "@/features/integrations/hub/hub-context";
import { APPS, type IntegrationKey } from "@/lib/integration-catalog";
import { detailHref, nextStep } from "@/lib/integration-hub";
import type { HubConnection } from "@/types/integrations";

/** The one button that fixes what a connection's reason says (SPEC-328). */
export function NextStepButton({
  connection,
  appKey,
  size = "sm",
}: {
  connection: HubConnection;
  appKey: IntegrationKey;
  size?: "sm" | "default";
}) {
  const { signIn, syncNow, starting } = useHub();
  const step = nextStep(connection);
  if (!step) return null;
  const primary = connection.status === "attention";
  if (step.kind === "settings" || (step.kind === "signin" && appKey === "shopify")) {
    // The store reconnects from Settings → General, where its connection lives.
    const href = appKey === "shopify" ? "/settings" : detailHref(appKey, "settings");
    return (
      <Button asChild size={size} variant={primary ? "default" : "outline"}>
        <Link href={href}>{step.label}</Link>
      </Button>
    );
  }
  if (step.kind === "sync") {
    const busy = starting.has(appKey);
    return (
      <Button
        size={size}
        variant={primary ? "default" : "outline"}
        disabled={busy}
        onClick={() => void syncNow(appKey, APPS[appKey].name)}
      >
        {busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : null}
        {step.label}
      </Button>
    );
  }
  return (
    <Button size={size} variant={primary ? "default" : "outline"} onClick={() => void signIn(appKey)}>
      {step.label}
    </Button>
  );
}
