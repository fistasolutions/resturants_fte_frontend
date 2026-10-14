"use client";

import { PauseCircle, Play } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { useEmailMarketingActions } from "@/features/email-marketing/use-email-marketing-actions";
import { setKillSwitch } from "@/services/email-marketing-actions";
import type { EmailWorkspace } from "@/types/email-marketing";
import { formatTime } from "@/utils/format";

/**
 * Shown only while the employee is paused (SPEC-375 patch): the owner removed the kill switch, so
 * nothing on screen pauses it any more — Autonomy is the control. A store paused before that must
 * still be able to resume, so this one line appears with Resume and nothing else.
 */
export function PausedNotice({ workspace }: { workspace: EmailWorkspace }) {
  const actions = useEmailMarketingActions();
  const kill = workspace.killSwitch;
  if (!kill.active) return null;
  return (
    <div className="space-y-2">
      <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
        <PauseCircle className="size-4 shrink-0" aria-hidden />
        <p className="min-w-0 flex-1 font-medium">
          Paused{kill.at ? ` since ${formatTime(kill.at)}` : ""}: nothing is sent. Resuming restarts nothing — each send needs your approval again.
        </p>
        <RoleButton
          need="email_marketing.manage"
          size="sm"
          variant="outline"
          disabled={actions.busy !== null}
          onClick={() => void actions.run("kill", () => setKillSwitch(false, "Resumed"))}
        >
          <Play aria-hidden />
          Resume
        </RoleButton>
      </div>
      {actions.error ? (
        <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actions.error}
        </p>
      ) : null}
    </div>
  );
}
