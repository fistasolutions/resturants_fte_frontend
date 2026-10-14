"use client";

import { useId, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, PanelLeft, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useNavPrefs } from "@/features/navigation/nav-prefs-provider";
import { SettingsPanel } from "@/features/settings/settings-panel";
import { TurnOffDialog } from "@/features/settings/turn-off-dialog";
import { useWorkspace } from "@/features/workspace/workspace-provider";
import { useCan } from "@/hooks/use-can";
import {
  isGuided,
  listedItems,
  pageUnit,
  tabUnit,
  type UnitSwitch,
} from "@/lib/company-switches";
import { connectionsLabel, visibleItems } from "@/lib/disclosure";
import { lockedTabs, type Visibility } from "@/lib/guided-view";
import { hubChildren, sidebarItems } from "@/lib/navigation";
import { hiddenCount, navPrefsTree, type PrefsNode, type PrefsTab } from "@/lib/nav-tab-registry";
import { cn } from "@/lib/utils";
import { setEmployeeActive } from "@/services/employees-actions";
import { setPageEnabled } from "@/services/workspace-actions";

/** Turning a page, tab or employee on for everyone is a company setting (backend SPEC-368). */
const COMPANY_NEED = "settings.manage";

interface Notice {
  tone: "info" | "error";
  text: string;
}

/** What a row's switch does for this member (SPEC-360). */
interface RowSwitch {
  /** The company layer, in a guided organization; null shows today's personal switch alone. */
  unit: UnitSwitch | null;
  /** The owner or an admin: their switch can turn a row on for everyone. */
  company: boolean;
}

/**
 * Account → Sidebar (SPEC-338; two layers since SPEC-360).
 *
 * In a guided organization each row carries the company's switch too: an owner or admin turns a
 * page, tab or employee on for everyone (anything it needs to connect joins the setup checklist
 * at the top right and its card appears on Integrations), and turning one off asks "hide it for
 * me only" or "turn it off for everyone". Every other member keeps today's personal switches, and
 * sees why a row the company turned off is missing. A full organization (FOC) sees today's page,
 * unchanged.
 */
export function SidebarPrefsView() {
  const workspace = useWorkspace();
  const router = useRouter();
  const can = useCan();
  const [, startRefresh] = useTransition();
  const { hidden, setShown, showAll } = useNavPrefs();
  const [notice, setNotice] = useState<Notice | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [turningOff, setTurningOff] = useState<{ unit: UnitSwitch; id: string } | null>(null);

  const visibility = isGuided(workspace.visibility) ? workspace.visibility : null;
  const company = visibility !== null && can(COMPANY_NEED).allowed;

  const tree = useMemo(() => {
    if (!visibility) {
      return navPrefsTree(
        visibleItems(sidebarItems, workspace.navigation),
        (href) => visibleItems(hubChildren(href), workspace.navigation),
        hidden,
      );
    }
    // Guided: every row the role may open, on or off, so an off one can be turned back on.
    return navPrefsTree(
      listedItems(sidebarItems, workspace.navigation),
      (href) => listedItems(hubChildren(href), workspace.navigation),
      hidden,
      // A tab with no data and no switch (locations, POS, history) is not listed.
      (href, key) => {
        const lock = lockedTabs(visibility, href)[key];
        return Boolean(lock) && !tabUnit(visibility, href, key).switchable && lock.reason !== "awaiting_connection";
      },
    );
  }, [visibility, workspace.navigation, hidden]);
  const off = tree.reduce((sum, node) => sum + (node.shown ? 0 : 1) + hiddenCount(node), 0);

  const refresh = () => startRefresh(() => router.refresh());

  const turnOn = async (unit: UnitSwitch, id: string) => {
    setBusy(unit.unit);
    setNotice(null);
    try {
      if (unit.kind === "employee") await setEmployeeActive(unit.unit, true);
      else await setPageEnabled(unit.unit, true);
      setShown(id, true);
      const missing = unit.integrations.filter((key) => !workspace.connected.includes(key));
      setNotice({
        tone: "info",
        text:
          missing.length === unit.integrations.length && missing.length > 0
            ? `${unit.label} is on for everyone. Connect ${connectionsLabel(missing)} from Setup at the top right to fill it.`
            : `${unit.label} is on for everyone.`,
      });
      refresh();
    } catch (cause) {
      setNotice({ tone: "error", text: cause instanceof Error ? cause.message : "Couldn't turn it on." });
    } finally {
      setBusy(null);
    }
  };

  const onToggle = (id: string, unit: UnitSwitch | null, next: boolean) => {
    if (next) {
      if (unit && unit.state === "off") {
        if (company && unit.switchable) void turnOn(unit, id);
        return;
      }
      setShown(id, true);
      return;
    }
    if (company && unit && unit.kind !== "locked" && unit.state !== "off") {
      setTurningOff({ unit, id });
      return;
    }
    setShown(id, false);
  };

  const switchFor = (unit: UnitSwitch | null): RowSwitch => ({ unit, company });

  return (
    <SettingsPanel
      title="Sidebar navigation"
      icon={PanelLeft}
      description={
        company
          ? "Turn pages on or off for your company, or hide them just for you. Anything a page needs to connect appears in Setup at the top right, and its card on Integrations."
          : "Switch off the pages and tabs you don't use. Only your sidebar in this browser changes — everyone else's stays as it is, and a hidden page still opens from a link."
      }
      action={
        <Button size="sm" variant="outline" disabled={off === 0} onClick={showAll}>
          <RotateCcw aria-hidden />
          Show everything
        </Button>
      }
      footer={
        <p className="text-xs text-muted-foreground">
          {off === 0 ? "Nothing hidden for you." : `${off} hidden for you.`}
        </p>
      }
    >
      {notice ? (
        <p
          role={notice.tone === "error" ? "alert" : "status"}
          className={cn(
            "mx-5 mt-3 rounded-lg px-3 py-2 text-sm sm:mx-6",
            notice.tone === "error" ? "bg-destructive/10 text-destructive" : "bg-info/10 text-info",
          )}
        >
          {notice.text}
        </p>
      ) : null}
      <ul className="divide-y divide-border">
        {tree.map((node) => (
          <li key={node.id} className="px-5 py-3 sm:px-6">
            <PageRow
              node={node}
              parentShown
              visibility={visibility}
              busy={busy}
              switchFor={switchFor}
              onToggle={onToggle}
            />
          </li>
        ))}
      </ul>
      {visibility && turningOff ? (
        <TurnOffDialog
          unit={turningOff.unit}
          visibility={visibility}
          connected={workspace.connected}
          onHideForMe={() => setShown(turningOff.id, false)}
          onDone={(text) => {
            setNotice({ tone: "info", text });
            refresh();
          }}
          onClose={() => setTurningOff(null)}
        />
      ) : null}
    </SettingsPanel>
  );
}

function RowNote({ unit, company }: RowSwitch) {
  if (!unit?.note) return null;
  const text =
    unit.state === "off" && unit.switchable && !company
      ? "Off for the company. Ask an owner or admin."
      : unit.note;
  return <span className="block truncate text-xs font-normal text-muted-foreground">{text}</span>;
}

/** The switch, or — for a row this member cannot turn on — nothing (its note says why). */
function RowControl({
  id,
  checked,
  disabled,
  size,
  row,
  busy,
  onChange,
}: {
  id: string;
  checked: boolean;
  disabled: boolean;
  size?: "sm";
  row: RowSwitch;
  busy: boolean;
  onChange: (next: boolean) => void;
}) {
  const offForGood = row.unit?.state === "off" && !(row.company && row.unit.switchable);
  if (offForGood) return null;
  return <Switch id={id} size={size} checked={checked} disabled={disabled || busy} onCheckedChange={onChange} />;
}

function PageRow({
  node,
  parentShown,
  visibility,
  busy,
  switchFor,
  onToggle,
}: {
  node: PrefsNode;
  parentShown: boolean;
  visibility: Visibility | null;
  busy: string | null;
  switchFor: (unit: UnitSwitch | null) => RowSwitch;
  onToggle: (id: string, unit: UnitSwitch | null, next: boolean) => void;
}) {
  const [open, setOpen] = useState(false);
  const switchId = useId();
  const tabsId = useId();
  const unit = visibility ? pageUnit(visibility, node.href, node.title) : null;
  const row = switchFor(unit);
  const companyOn = unit?.state !== "off";
  const active = parentShown && node.shown && companyOn;
  const tabs = visibility ? tabsWithUnits(visibility, node) : node.tabs.map((tab) => ({ tab, unit: null }));
  const tabsOff = tabs.filter(({ tab, unit: t }) => !tab.shown || t?.state === "off").length;

  return (
    <div>
      <div className="flex min-h-9 items-center gap-3">
        <node.icon className={cn("size-4 shrink-0 text-muted-foreground", !active && "opacity-50")} aria-hidden />
        <label
          htmlFor={switchId}
          className={cn("min-w-0 flex-1 text-sm font-medium", !active && "text-muted-foreground")}
        >
          <span className="block truncate">{node.title}</span>
          <RowNote {...row} />
        </label>
        {tabs.length > 0 ? (
          <button
            type="button"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-controls={tabsId}
            className="flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
          >
            {tabs.length} tabs
            {tabsOff > 0 ? <span className="text-foreground">· {tabsOff} off</span> : null}
            <ChevronRight aria-hidden className={cn("size-3.5 transition-transform duration-150", open && "rotate-90")} />
          </button>
        ) : null}
        {node.locked ? <span className="shrink-0 text-xs text-muted-foreground">Always shown</span> : null}
        <RowControl
          id={switchId}
          checked={node.shown && companyOn}
          disabled={node.locked || !parentShown}
          row={row}
          busy={busy !== null && busy === unit?.unit}
          onChange={(next) => onToggle(node.id, unit, next)}
        />
      </div>

      {open ? (
        <ul id={tabsId} aria-label={`${node.title} tabs`} className="mt-2 grid gap-x-6 gap-y-1 pl-7 sm:grid-cols-2 lg:grid-cols-3">
          {tabs.map(({ tab, unit: tabSwitch }, index) => (
            <TabRow
              key={tab.id}
              tab={tab}
              opensHere={visibility ? index === firstOn(tabs) : tab.locked}
              disabled={!active}
              row={switchFor(tabSwitch)}
              busy={busy !== null && busy === tabSwitch?.unit}
              onChange={(next) => onToggle(tab.id, tabSwitch, next)}
            />
          ))}
        </ul>
      ) : null}

      {node.children.length > 0 ? (
        <ul aria-label={`${node.title} pages`} className="mt-2 ml-2 space-y-1 border-l border-border pl-4">
          {node.children.map((child) => (
            <li key={child.id}>
              <PageRow
                node={child}
                parentShown={active}
                visibility={visibility}
                busy={busy}
                switchFor={switchFor}
                onToggle={onToggle}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

interface TabWithUnit {
  tab: PrefsTab;
  unit: UnitSwitch | null;
}

function tabsWithUnits(visibility: Visibility, node: PrefsNode): TabWithUnit[] {
  return node.tabs.map((tab) => ({ tab, unit: tabUnit(visibility, node.href, tab.id.split(":")[1]) }));
}

/** The tab the page opens on: its first tab the company has on. It cannot be hidden for oneself. */
function firstOn(tabs: TabWithUnit[]): number {
  return tabs.findIndex(({ unit }) => unit?.state !== "off");
}

function TabRow({
  tab,
  opensHere,
  disabled,
  row,
  busy,
  onChange,
}: {
  tab: PrefsTab;
  opensHere: boolean;
  disabled: boolean;
  row: RowSwitch;
  busy: boolean;
  onChange: (next: boolean) => void;
}) {
  const id = useId();
  const companyOn = row.unit?.state !== "off";
  // The tab the page opens on cannot be hidden for oneself; an owner may still turn it off for
  // everyone (the page then opens on its next tab).
  const personalOnly = !row.company || !row.unit;
  const locked = opensHere && personalOnly;
  return (
    <li className="flex min-h-8 items-center justify-between gap-3 rounded-lg px-2">
      <label htmlFor={id} className={cn("min-w-0 text-sm", (disabled || !companyOn) && "text-muted-foreground")}>
        <span className="block truncate">
          {tab.label}
          {opensHere ? <span className="ml-1.5 text-xs text-muted-foreground">· opens here</span> : null}
        </span>
        <RowNote {...row} />
      </label>
      <RowControl
        id={id}
        size="sm"
        checked={(tab.shown || locked) && companyOn}
        disabled={locked || disabled}
        row={row}
        busy={busy}
        onChange={onChange}
      />
    </li>
  );
}
