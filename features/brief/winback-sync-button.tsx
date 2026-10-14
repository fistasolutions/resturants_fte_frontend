"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { useCan } from "@/hooks/use-can";
import { refusedBySync, winbackSyncGate } from "@/lib/winback-sync";
import { formatTime } from "@/utils/format";
import type { WinbackKlaviyoAccess, WinbackSendResult } from "@/types/brief";

interface WinbackSyncButtonProps {
  totalCandidates: number;
  initialSent: boolean;
  initialSentAt: string | null;
  /** What the Klaviyo key may do (backend SPEC-365); absent from an older backend. */
  klaviyo?: WinbackKlaviyoAccess;
}

class SyncRefusedError extends Error {
  constructor(
    message: string,
    readonly code: string | null,
  ) {
    super(message);
  }
}

function formatSentAt(iso: string): string {
  return formatTime(iso); // store (NY) time — SPEC-129
}

async function sendWinback(): Promise<WinbackSendResult> {
  const res = await fetch("/api/proxy/brief/winback/send", { method: "POST" });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    const message = body?.error?.message ?? `Could not send (${res.status}).`;
    throw new SyncRefusedError(message, body?.error?.code ?? null);
  }
  return body as WinbackSendResult;
}

/** Fires the Klaviyo sync for the FULL qualifying list, regardless of
 * which page or search term is currently displayed — pagination/search is
 * a display concern only (SPEC-047/053). */
export function WinbackSyncButton({
  totalCandidates,
  initialSent,
  initialSentAt,
  klaviyo,
}: WinbackSyncButtonProps) {
  const can = useCan();
  // The role's reason first (SPEC-358): a member who may not send never reads about the key.
  const role = can(["brief.manage", "messages.send"]);
  const gate = winbackSyncGate(klaviyo);
  const [sent, setSent] = useState(initialSent);
  const [sentAt, setSentAt] = useState(initialSentAt);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  // A refusal learned on click (the key's power was not known yet) holds like the gate does.
  const [refusal, setRefusal] = useState<string | null>(null);
  const blockedReason = role.reason ?? gate.reason ?? refusal;

  async function handleSend() {
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const result = await sendWinback();
      if (!result.klaviyo_synced) {
        setError(result.klaviyo_error ?? "Sync did not go through — try again.");
      } else {
        setSent(true);
        setSentAt(new Date().toISOString());
        setNotice(
          `Synced ${result.klaviyo_synced} customer${result.klaviyo_synced === 1 ? "" : "s"} to Klaviyo.`,
        );
      }
    } catch (e) {
      if (e instanceof SyncRefusedError && refusedBySync(e.code)) setRefusal(e.message);
      else setError(e instanceof Error ? e.message : "Could not send — try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {sent
            ? `Synced today${sentAt ? ` at ${formatSentAt(sentAt)}` : ""}.`
            : `${totalCandidates} customer${totalCandidates === 1 ? "" : "s"} ready to sync.`}
        </p>
        <Button
          onClick={handleSend}
          disabled={
            sent ||
            sending ||
            totalCandidates === 0 ||
            !role.allowed ||
            !gate.allowed ||
            refusal !== null
          }
        >
          {sent ? "Synced" : sending ? "Syncing…" : "Sync to Klaviyo"}
        </Button>
      </div>
      {blockedReason && !sent && <p className="text-sm text-muted-foreground">{blockedReason}</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}
      {notice && !error && <p className="text-sm text-success">{notice}</p>}
    </div>
  );
}
