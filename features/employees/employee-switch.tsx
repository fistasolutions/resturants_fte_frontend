"use client";

import { useId, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { RoleGate } from "@/components/shared/role-gate";
import { Switch } from "@/components/ui/switch";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { useCan } from "@/hooks/use-can";
import { integrationHref, integrationName } from "@/lib/disclosure";
import { switchState } from "@/lib/employee-switch";
import { setEmployeeActive } from "@/services/employees-actions";

/** Who may switch employees: the backend's policy for `PUT /employees/{key}/active`. */
const SWITCH_NEED = "settings.manage";

export interface EmployeeSwitchModel {
  /** A switch is drawn at all: guided organizations only (SPEC-359). */
  switchable: boolean;
  /** The member's role may flip it (Rule 13). */
  canSwitch: boolean;
  /** What the card shows: the click's value while the layout refreshes, then the workspace's. */
  active: boolean;
  /** The integration it still needs, when on and not ready. */
  missing: string | null;
  busy: boolean;
  error: string | null;
  toggle: (next: boolean) => void;
}

/**
 * One employee's switch (SPEC-359). The state is the workspace's (`visibility.employees`); a
 * click shows its value at once, writes it, and refreshes the layout so the sidebar, the access
 * gate and the to-dos follow. A failure puts the switch back and says why.
 */
export function useEmployeeSwitch(employeeKey: string): EmployeeSwitchModel {
  const { visibility } = useWorkspace();
  const can = useCan();
  const router = useRouter();
  const state = switchState(visibility, employeeKey);
  const [chosen, setChosen] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [refreshing, startRefresh] = useTransition();

  const toggle = (next: boolean) => {
    setChosen(next);
    setError(null);
    setSaving(true);
    setEmployeeActive(employeeKey, next)
      .then(() => startRefresh(() => router.refresh()))
      .catch((cause: unknown) => {
        setChosen(null);
        setError(cause instanceof Error ? cause.message : "Couldn't change the employee.");
      })
      .finally(() => setSaving(false));
  };

  // While the write and the layout refresh run, the click's value shows; once the refreshed
  // workspace arrives it speaks again.
  const busy = saving || refreshing;
  const shown = busy && chosen !== null ? chosen : state.active;
  return {
    switchable: state.switchable,
    canSwitch: can(SWITCH_NEED).allowed,
    active: shown,
    missing: shown ? state.missing : null,
    busy,
    error,
    toggle,
  };
}

/** The Active switch on a card — a secondary control, so a role without the permission does not
 * see it at all (Rule 13: `RoleGate`). It sits above the card's stretched link. */
export function EmployeeSwitch({ name, model }: { name: string; model: EmployeeSwitchModel }) {
  const id = useId();
  if (!model.switchable) return null;
  return (
    <RoleGate need={SWITCH_NEED}>
      <span className="relative z-10 flex items-center gap-2">
        <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
          Active
        </label>
        <Switch
          id={id}
          checked={model.active}
          disabled={model.busy}
          onCheckedChange={model.toggle}
          aria-label={`${name} active`}
        />
      </span>
    </RoleGate>
  );
}

/** What an on-but-not-ready employee still needs, as its own link above the card's link. */
export function ConnectRow({ integration }: { integration: string }) {
  return (
    <Link
      href={integrationHref(integration)}
      className="relative z-10 flex items-center justify-between gap-3 rounded-xl border border-info/30 bg-info/10 px-3 py-2 text-sm font-medium text-info transition-colors outline-none hover:bg-info/15 focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span className="truncate">Connect {integrationName(integration)}</span>
      <ChevronRight className="size-4 shrink-0" aria-hidden />
    </Link>
  );
}
