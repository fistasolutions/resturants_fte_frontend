"use client";

import { PauseCircle, Play } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { useSupportActions } from "@/features/customer-support/use-support-actions";
import { AUTONOMY_META } from "@/lib/customer-support";
import { setKillSwitch } from "@/services/customer-support-actions";
import type { SupportWorkspace } from "@/types/customer-support";
import { formatTime } from "@/utils/format";

/**
 * Shown only while the agent is paused (SPEC-375 patch): the owner removed the kill switch, so
 * nothing on screen pauses it any more — Autonomy is the control. A store paused before that must
 * still be able to resume, so this one line appears with Resume and nothing else.
 */
export function PausedNotice({ workspace }: { workspace: SupportWorkspace }) {
  const actions = useSupportActions();
  const kill = workspace.killSwitch;
  if (!kill.active) return null;
  return (
    <div role="status" className="flex flex-wrap items-center gap-3 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 text-sm text-warning">
      <PauseCircle className="size-4 shrink-0" aria-hidden />
      <p className="min-w-0 flex-1 font-medium">
        Paused{kill.at ? ` since ${formatTime(kill.at)}` : ""}: the agent only suggests and writes nothing to customers. Resume returns it to{" "}
        {AUTONOMY_META[workspace.autonomy].label}.
      </p>
      <RoleButton
        need="team_performance.manage"
        size="sm"
        variant="outline"
        disabled={actions.busy !== null}
        onClick={() => void actions.run("kill", () => setKillSwitch(false))}
      >
        <Play aria-hidden />
        Resume
      </RoleButton>
    </div>
  );
}
