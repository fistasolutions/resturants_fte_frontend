"use client";

import { useState } from "react";
import Link from "next/link";
import { Activity, CalendarClock, Mail, Send, Store } from "lucide-react";

import { RoleButton } from "@/components/shared/role-gate";
import { StatusBadge, type StatusTone } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  PanelHint,
  ReadOnlyValue,
  SaveStatus,
  SettingRow,
  SettingsPanel,
  type SaveState,
} from "@/features/settings/settings-panel";
import { TimeSelect } from "@/features/settings/time-select";
import { useCan } from "@/hooks/use-can";
import { timeLabel } from "@/lib/time-options";
import { updateBriefAutoSend } from "@/services/brief-auto-send";
import { updateFinanceCard } from "@/services/finance-card";
import { updateManagerReportCard } from "@/services/manager-report-card";
import { updateReportSchedule } from "@/services/report-schedule";
import type {
  BriefAutoSendSchedule,
  FinanceCardSchedule,
  ManagerReportCardSchedule,
  ReportSchedule,
  StoreConnection,
  SystemStatus,
} from "@/types/store";
import { formatDate, formatNextRun, formatTime } from "@/utils/format";
import { PRODUCT } from "@/lib/product";

/**
 * Settings → Store (SPEC-324): the store's connection and status, the daily report, and the
 * scheduled sends — every one on the shared panel. Each saves through the same service it always
 * has, so nothing a store has saved is read or written differently.
 */

function message(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

// ── General ──────────────────────────────────────────────────────────────────

const API_STATUS: Record<SystemStatus["apiStatus"], { label: string; tone: StatusTone }> = {
  operational: { label: "Operational", tone: "success" },
  degraded: { label: "Degraded", tone: "warning" },
  down: { label: "Down", tone: "destructive" },
};

export function StoreConnectionPanel({ store, status }: { store: StoreConnection; status: SystemStatus }) {
  const active = store.status === "active";
  return (
    <SettingsPanel
      title="Shopify connection"
      icon={Store}
      description={`The store this workspace reads from. ${PRODUCT.short} only reads your store — it never changes orders, products or customers.`}
      action={
        <StatusBadge tone={active ? "success" : "destructive"}>{active ? "Connected" : "Disconnected"}</StatusBadge>
      }
      footer={
        <>
          <PanelHint>Reconnect, or add other systems, from Integrations.</PanelHint>
          <Button variant="outline" size="sm" asChild>
            <Link href="/integrations">Open Integrations</Link>
          </Button>
        </>
      }
    >
      <SettingRow label="Store" description={store.name}>
        <ReadOnlyValue value={store.domain} />
      </SettingRow>
      <SettingRow label="Last sync" description="Orders, products, customers and stock.">
        <ReadOnlyValue
          value={`${formatDate(status.lastSyncAt)} · ${formatTime(status.lastSyncAt)}`}
          source={status.syncSchedule}
        />
      </SettingRow>
    </SettingsPanel>
  );
}

export function SystemStatusPanel({ status }: { status: SystemStatus }) {
  const api = API_STATUS[status.apiStatus];
  return (
    <SettingsPanel title="System status" icon={Activity} description="How the platform is running right now.">
      <SettingRow label="API">
        <StatusBadge tone={api.tone}>{api.label}</StatusBadge>
      </SettingRow>
      <SettingRow label="Data sync">
        <ReadOnlyValue value={status.syncSchedule} />
      </SettingRow>
      <SettingRow label="Version">
        <ReadOnlyValue value={status.appVersion} />
      </SettingRow>
    </SettingsPanel>
  );
}

// ── Daily report ─────────────────────────────────────────────────────────────

export function DailyReportPanel({ schedule }: { schedule: ReportSchedule }) {
  const [time, setTime] = useState(schedule.time);
  const can = useCan();
  const gate = can("settings.manage");
  const [current, setCurrent] = useState(schedule);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty = time !== current.time;

  async function save() {
    setState("saving");
    setError(null);
    try {
      const updated = await updateReportSchedule(time);
      setCurrent(updated);
      setTime(updated.time);
      setState("saved");
    } catch (failure) {
      setError(message(failure, "Could not save the report time."));
      setState("error");
    }
  }

  return (
    <SettingsPanel
      title="Daily report"
      icon={CalendarClock}
      description="An executive summary of yesterday, written from your real numbers every morning."
      footer={
        <>
          <PanelHint>
            Next report: <span className="font-medium text-foreground">{formatNextRun(current.nextRunAt, current.timezone)}</span>
          </PanelHint>
          <SaveStatus state={state} error={error} />
          <RoleButton need="settings.manage" size="sm" onClick={() => void save()} disabled={!dirty || state === "saving"}>
            Save
          </RoleButton>
        </>
      }
    >
      <SettingRow
        label="Report time"
        htmlFor="settings-report-time"
        description={
          current.source === "custom"
            ? `In the store's timezone (${current.timezone}).`
            : `Running at the default ${timeLabel(current.time)} UTC. Pick a time in your store's timezone.`
        }
      >
        <TimeSelect
          id="settings-report-time"
          value={time}
          disabled={!gate.allowed}
          onChange={(value) => {
            setTime(value);
            if (state !== "idle") setState("idle");
          }}
          ariaLabel="Report time"
        />
      </SettingRow>
    </SettingsPanel>
  );
}

// ── Automatic sending ────────────────────────────────────────────────────────

const DEFAULT_SEND_TIME = "07:00";

export function BriefAutoSendPanel({ schedule }: { schedule: BriefAutoSendSchedule }) {
  const [enabled, setEnabled] = useState(schedule.enabled);
  const can = useCan();
  const gate = can("settings.manage");
  const [time, setTime] = useState(schedule.time || DEFAULT_SEND_TIME);
  const [current, setCurrent] = useState(schedule);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const dirty = enabled !== current.enabled || (enabled && time !== current.time);

  async function save() {
    setState("saving");
    setError(null);
    try {
      const updated = await updateBriefAutoSend(enabled, time);
      setCurrent(updated);
      setEnabled(updated.enabled);
      setTime(updated.time || DEFAULT_SEND_TIME);
      setState("saved");
    } catch (failure) {
      setError(message(failure, "Could not save the auto-send schedule."));
      setState("error");
    }
  }

  const status =
    current.enabled && current.nextRunAt
      ? `Sends at ${timeLabel(current.time)} ${current.timezone} — next ${formatNextRun(current.nextRunAt, current.timezone)}.`
      : "Off — you press Send in the Morning Brief yourself.";

  return (
    <SettingsPanel
      title="Automatic Brief sending"
      icon={Send}
      description="Send today's overdue, transfer, win-back, dead-inventory and store-traffic alerts on a schedule — even if nobody opens the dashboard."
      footer={
        <>
          <PanelHint>{status}</PanelHint>
          <SaveStatus state={state} error={error} />
          <RoleButton need="settings.manage" size="sm" onClick={() => void save()} disabled={!dirty || state === "saving"}>
            Save
          </RoleButton>
        </>
      }
    >
      <SettingRow label="Send automatically" htmlFor="brief-auto-send-enabled" description="Off by default. When on, emails go out without anyone reviewing them first.">
        <Switch
          id="brief-auto-send-enabled"
          checked={enabled}
          disabled={!gate.allowed}
          title={gate.reason ?? undefined}
          onCheckedChange={(checked) => {
            setEnabled(checked);
            if (state !== "idle") setState("idle");
          }}
        />
      </SettingRow>
      <SettingRow label="Send time" htmlFor="brief-auto-send-time" description={`In the store's timezone (${current.timezone}).`}>
        <TimeSelect
          id="brief-auto-send-time"
          value={time}
          disabled={!enabled || !gate.allowed}
          onChange={(value) => {
            setTime(value);
            if (state !== "idle") setState("idle");
          }}
          ariaLabel="Send time"
        />
      </SettingRow>
    </SettingsPanel>
  );
}

function WeeklyCardPanel({
  id,
  title,
  description,
  offLine,
  initial,
  save: persist,
}: {
  id: string;
  title: string;
  description: React.ReactNode;
  offLine: string;
  initial: ManagerReportCardSchedule | FinanceCardSchedule;
  save: (enabled: boolean) => Promise<ManagerReportCardSchedule | FinanceCardSchedule>;
}) {
  const [enabled, setEnabled] = useState(initial.enabled);
  const can = useCan();
  const gate = can("settings.manage");
  const [current, setCurrent] = useState(initial);
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setState("saving");
    setError(null);
    try {
      const updated = await persist(enabled);
      setCurrent(updated);
      setEnabled(updated.enabled);
      setState("saved");
    } catch (failure) {
      setError(message(failure, "Could not save this schedule."));
      setState("error");
    }
  }

  const status =
    current.enabled && current.nextRunAt
      ? `Every ${current.weekday} at ${timeLabel(current.time)} ${current.timezone} — next ${formatNextRun(current.nextRunAt, current.timezone)}.`
      : offLine;

  return (
    <SettingsPanel
      title={title}
      icon={Mail}
      description={description}
      footer={
        <>
          <PanelHint>{status}</PanelHint>
          <SaveStatus state={state} error={error} />
          <RoleButton need="settings.manage" size="sm" onClick={() => void save()} disabled={enabled === current.enabled || state === "saving"}>
            Save
          </RoleButton>
        </>
      }
    >
      <SettingRow label="Send every Monday" htmlFor={id} description={`${current.weekday}s at ${timeLabel(current.time)}, store time.`}>
        <Switch
          id={id}
          checked={enabled}
          disabled={!gate.allowed}
          title={gate.reason ?? undefined}
          onCheckedChange={(checked) => {
            setEnabled(checked);
            if (state !== "idle") setState("idle");
          }}
        />
      </SettingRow>
    </SettingsPanel>
  );
}

export function ManagerReportCardPanel({ schedule }: { schedule: ManagerReportCardSchedule }) {
  return (
    <WeeklyCardPanel
      id="manager-report-card-enabled"
      title="Monday report card"
      description={
        <>
          Every store manager with an email gets their store&apos;s scoreboard for the week that just ended.{" "}
          <Link href="/results" className="font-medium text-foreground underline-offset-4 hover:underline">
            Preview one on Results → Managers
          </Link>
        </>
      }
      offLine="Off — send a card by hand from Results → Managers when you want one."
      initial={schedule}
      save={updateManagerReportCard}
    />
  );
}

export function FinanceCardPanel({ schedule }: { schedule: FinanceCardSchedule }) {
  return (
    <WeeklyCardPanel
      id="finance-card-enabled"
      title="Monday payable card"
      description={
        <>
          What the business owes, every Monday morning: past due, this week, this month. Nothing is sent when nothing is owed.{" "}
          <Link href="/employees/finance" className="font-medium text-foreground underline-offset-4 hover:underline">
            See the same figures in Finance
          </Link>
        </>
      }
      offLine="Off — open Finance whenever you want the same figures."
      initial={schedule}
      save={updateFinanceCard}
    />
  );
}
