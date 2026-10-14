"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Building2, Check, Copy } from "lucide-react";

import { QueryErrorState } from "@/components/shared/query-error-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PanelHint,
  ReadOnlyValue,
  SaveStatus,
  SettingRow,
  SettingsPanel,
  type SaveState,
} from "@/features/settings/settings-panel";
import { OrganizationSkeleton } from "@/features/settings/settings-skeletons";
import { YourDataPanel } from "@/features/settings/your-data-panel";
import { useApiQuery } from "@/hooks/use-api-query";
import { useHydrated } from "@/hooks/use-hydrated";
import { nameProblem, type OrganizationSettings } from "@/lib/account-settings";
import { loginLink } from "@/lib/branding";
import { organizationQueries } from "@/lib/queries/organization";
import { teamQueries } from "@/lib/queries/team";
import { can, isOwnerAccess } from "@/lib/team";
import { updateOrganization } from "@/services/settings-actions";

type Calendar = OrganizationSettings["calendar"];

/**
 * Settings → Organization → General (SPEC-324 over backend SPEC-331): the organization's name,
 * its team login link and the calendar its comparisons follow. Editing needs `settings.manage`;
 * everyone else with `settings.view` reads the same panel.
 */
export function OrganizationTab() {
  const settings = useApiQuery(organizationQueries.settings());
  const access = useApiQuery(teamQueries.access());
  if (settings.isPending || access.isPending) return <OrganizationSkeleton />;
  if (settings.isError) {
    return <QueryErrorState error={settings.error} onRetry={() => void settings.refetch()} />;
  }
  const editable = access.data ? can(access.data, "settings.manage") : false;
  // SPEC-332: export and deletion are the owner's alone (the backend refuses anyone else).
  const owner = access.data ? isOwnerAccess(access.data) : false;
  return (
    <div className="space-y-6">
      <OrganizationPanel
        key={`${settings.data.name}|${settings.data.calendar}`}
        settings={settings.data}
        editable={editable}
        showBilling={access.data ? can(access.data, "billing.view") : false}
      />
      {owner ? <YourDataPanel organizationName={settings.data.name} /> : null}
    </div>
  );
}

function OrganizationPanel({
  settings,
  editable,
  showBilling,
}: {
  settings: OrganizationSettings;
  editable: boolean;
  showBilling: boolean;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const hydrated = useHydrated();
  const [name, setName] = useState(settings.name);
  const [calendar, setCalendar] = useState<Calendar>(settings.calendar);
  const [saved, setSaved] = useState({ name: settings.name, calendar: settings.calendar });
  const [state, setState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const dirty = name.trim() !== saved.name || calendar !== saved.calendar;
  const link = loginLink(settings.slug, hydrated ? window.location.origin : "");

  async function save() {
    const problem = nameProblem(name);
    if (problem) {
      setError(problem);
      setState("error");
      return;
    }
    setState("saving");
    setError(null);
    try {
      await updateOrganization({
        ...(name.trim() !== saved.name ? { name } : {}),
        ...(calendar !== saved.calendar ? { calendar } : {}),
      });
      setSaved({ name: name.trim(), calendar });
      setName(name.trim());
      setState("saved");
      await queryClient.invalidateQueries({ queryKey: organizationQueries.settings().queryKey });
      // The name and the calendar shape the whole app (the header, comparisons, holidays).
      router.refresh();
    } catch (failure) {
      setError(failure instanceof Error && failure.message ? failure.message : "Could not save.");
      setState("error");
    }
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <SettingsPanel
      title="Organization"
      icon={Building2}
      description="The company this workspace belongs to."
      footer={
        editable ? (
          <>
            <PanelHint>Changes apply to everyone in the organization.</PanelHint>
            <SaveStatus state={state} error={error} />
            <Button size="sm" onClick={() => void save()} disabled={!dirty || state === "saving"}>
              Save
            </Button>
          </>
        ) : (
          <PanelHint>Only someone who manages settings can change these.</PanelHint>
        )
      }
    >
      <SettingRow label="Name" htmlFor="organization-name" description="Shown in the app, in emails and on invoices.">
        {editable ? (
          <Input
            id="organization-name"
            value={name}
            maxLength={120}
            onChange={(e) => {
              setName(e.target.value);
              if (state !== "idle") setState("idle");
            }}
            className="w-full md:max-w-sm"
          />
        ) : (
          <ReadOnlyValue value={settings.name} />
        )}
      </SettingRow>
      <SettingRow label="Team login link" description="Your branded sign-in page. Share it with your team.">
        <span className="min-w-0 truncate rounded-md border border-border bg-muted/40 px-3 py-1.5 font-mono text-xs text-muted-foreground">
          {link}
        </span>
        <Button variant="outline" size="sm" onClick={() => void copy()} aria-label="Copy the login link">
          {copied ? <Check className="size-4 text-success" aria-hidden /> : <Copy className="size-4" aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </Button>
      </SettingRow>
      <SettingRow
        label="Calendar"
        htmlFor="organization-calendar"
        description="Which calendar year-on-year comparisons and holiday planning follow."
      >
        {editable ? (
          <Select
            value={calendar}
            onValueChange={(value) => {
              setCalendar(value as Calendar);
              if (state !== "idle") setState("idle");
            }}
          >
            <SelectTrigger id="organization-calendar" className="w-64">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectItem value="gregorian">Standard (Gregorian)</SelectItem>
              <SelectItem value="hebrew">Hebrew calendar (Jewish holidays)</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <ReadOnlyValue value={settings.calendar === "hebrew" ? "Hebrew calendar" : "Standard (Gregorian)"} />
        )}
      </SettingRow>
      {showBilling ? (
        <SettingRow label="Plan" description="Your plan, invoices and AI allowance.">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings/billing">View billing</Link>
          </Button>
        </SettingRow>
      ) : null}
    </SettingsPanel>
  );
}
