"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ChevronDown, GripVertical, LoaderCircle, Play, Plus, Search } from "lucide-react";

import { GlispIcon } from "@/components/shared/glisp-icon";
import { StatusBadge } from "@/components/shared/status-badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useReportFteActions } from "@/features/report-fte/use-report-fte-actions";
import { CADENCE_LABEL } from "@/lib/report-fte";
import { REPORT_FTE_BASE, composerRunHref } from "@/lib/report-fte-tabs";
import { cn } from "@/lib/utils";
import type { SectionSuggestion, TemplateData, TemplateSectionDef } from "@/types/report-fte";

const FIELD = "text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground";

/**
 * Report FTE → Templates → editor (SPEC-256). The template as the owner edits it:
 * an ordered list of sections, each bound to one tool with its parameters and a
 * way to show it; report settings; the add-a-section picker. Everything is local
 * state until "Save template" — the one write, which the actions hook will carry to
 * the backend.
 */
export function TemplateEditorView({ data }: { data: TemplateData }) {
  const router = useRouter();
  const actions = useReportFteActions();
  const [sections, setSections] = useState<TemplateSectionDef[]>(data.template.sections);
  const [open, setOpen] = useState<string | null>(data.template.sections[2]?.id ?? null);
  const [approval, setApproval] = useState(data.template.approvalBeforeSend);
  const [auto, setAuto] = useState(data.template.sendAutomatically);
  const [search, setSearch] = useState("");
  const [saved, setSaved] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<"save" | "run" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    if (busy) return;
    setBusy("save");
    setError(null);
    try {
      const result = await actions.saveTemplate(data.template.id, {
        sections,
        approvalBeforeSend: approval,
        sendAutomatically: auto,
      });
      setSections(result.template.sections);
      setSaved(`Saved · ${result.template.sections.length} sections · runs ${result.template.runs}`);
      setDirty(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Saving the template failed.");
    } finally {
      setBusy(null);
    }
  }

  async function runNow() {
    if (busy) return;
    setBusy("run");
    setError(null);
    try {
      if (dirty) {
        await actions.saveTemplate(data.template.id, { sections, approvalBeforeSend: approval, sendAutomatically: auto });
        setDirty(false);
      }
      const run = await actions.createRun({ templateId: data.template.id });
      router.push(composerRunHref(run.runId));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Starting the run failed.");
      setBusy(null);
    }
  }

  function patch(id: string, change: Partial<TemplateSectionDef>) {
    setSections((prev) => prev.map((s) => (s.id === id ? { ...s, ...change } : s)));
    setDirty(true);
    setSaved(null);
  }

  function remove(id: string) {
    setSections((prev) => prev.filter((s) => s.id !== id));
    setDirty(true);
    setSaved(null);
  }

  function add(suggestion: SectionSuggestion) {
    // A stable local id from the list itself — the backend keeps it unless it collides.
    const id = `new-${suggestion.tool}-${sections.length + 1}`;
    setSections((prev) => [
      ...prev,
      {
        id,
        title: suggestion.title,
        tools: [suggestion.tool],
        binding: "period = the report's period",
        viz: suggestion.viz,
        on: true,
        params: [
          { label: "Period", value: "the report's period" },
          { label: "Show as", value: suggestion.viz },
        ],
        settings: { period: "$period" },
        narrative: false,
        explainLinks: false,
      },
    ]);
    setOpen(id);
    setDirty(true);
    setSaved(null);
  }

  const suggestions = data.suggestions.filter(
    (s) => !search.trim() || `${s.tool} ${s.description} ${s.title}`.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="text-xs text-muted-foreground">
            <Link href={`${REPORT_FTE_BASE}/templates`} className="hover:text-foreground">
              Templates
            </Link>{" "}
            / {data.template.name}
          </nav>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold text-foreground">{data.template.name}</h2>
            <StatusBadge tone="neutral">{CADENCE_LABEL[data.template.cadence]}</StatusBadge>
          </div>
          <p className="text-xs text-muted-foreground">
            {data.template.runs} · {data.template.recipients} · {sections.length} sections
            {data.template.lastDelivered ? ` · last delivered ${data.template.lastDelivered}` : " · never delivered"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" disabled={busy !== null} onClick={() => void runNow()}>
            {busy === "run" ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden /> Planning…
              </>
            ) : (
              <>
                <Play className="size-4" aria-hidden /> Run now
              </>
            )}
          </Button>
          <Button size="sm" disabled={!dirty || busy !== null} onClick={() => void save()}>
            {busy === "save" ? "Saving…" : "Save template"}
          </Button>
        </div>
      </div>
      {error ? (
        <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {error}
        </p>
      ) : null}
      {saved ? (
        <p role="status" className="rounded-lg border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
          {saved}
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <ol className="flex flex-col gap-2" aria-label="Sections">
          {sections.map((section, index) => {
            const isOpen = open === section.id;
            return (
              <li
                key={section.id}
                className={cn(
                  "rounded-xl border border-border bg-card",
                  isOpen && "border-ai ring-4 ring-ai/10",
                  !section.on && "opacity-60",
                )}
              >
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <span className="cursor-grab text-muted-foreground" aria-hidden>
                    <GripVertical className="size-4" />
                  </span>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : section.id)}
                    aria-expanded={isOpen}
                    className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-sm font-semibold text-foreground">
                      {index + 1} · {section.title}
                    </span>
                    <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                      {section.tools.map((tool) => (
                        <code key={tool} className="font-mono text-ai">
                          {tool}
                        </code>
                      ))}
                      <span>· {section.binding}</span>
                      <StatusBadge tone={section.tools.includes("write_narrative") ? "ai" : "neutral"}>{section.viz}</StatusBadge>
                    </span>
                  </button>
                  <Switch
                    checked={section.on}
                    onCheckedChange={(on) => patch(section.id, { on })}
                    aria-label={`${section.title} on`}
                  />
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : section.id)}
                    aria-label={isOpen ? "Collapse section" : "Expand section"}
                    className="rounded-md p-1 text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronDown className={cn("size-4 transition-transform", isOpen && "rotate-180")} />
                  </button>
                </div>
                {isOpen ? (
                  <div className="flex flex-col gap-3 border-t border-border px-3 py-3">
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {section.params.map((param) => (
                        <div key={param.label} className={cn("flex flex-col gap-1", param.label.toLowerCase().startsWith("highlight when") && "sm:col-span-2")}>
                          <Label htmlFor={`${section.id}-${param.label}`} className={FIELD}>
                            {param.label}
                          </Label>
                          <Input
                            id={`${section.id}-${param.label}`}
                            value={param.value}
                            onChange={(e) =>
                              patch(section.id, {
                                params: section.params.map((p) => (p.label === param.label ? { ...p, value: e.target.value } : p)),
                              })
                            }
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                      <label className="flex items-center gap-2 text-xs text-foreground">
                        <Switch checked={section.narrative} onCheckedChange={(narrative) => patch(section.id, { narrative })} />
                        <GlispIcon className="size-3.5 text-ai" aria-hidden />
                        Two sentences from the FTE on this section
                      </label>
                      <label className="flex items-center gap-2 text-xs text-foreground">
                        <Switch checked={section.explainLinks} onCheckedChange={(explainLinks) => patch(section.id, { explainLinks })} />
                        ✦ Explain link per figure
                      </label>
                      <Button variant="ghost" size="sm" className="ml-auto text-destructive hover:text-destructive" onClick={() => remove(section.id)}>
                        Remove section
                      </Button>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
          <li>
            <label
              htmlFor="template-add-search"
              className="flex cursor-text items-center gap-2 rounded-xl border border-dashed border-border px-3 py-3 text-sm text-muted-foreground"
            >
              <Plus className="size-4" aria-hidden />
              Add a section — pick a tool on the right, or describe it (“returns by size for MIRAGE”)
            </label>
          </li>
        </ol>

        <div className="flex flex-col gap-4">
          <Card className="gap-3 p-4">
            <h3 className="text-sm font-semibold text-foreground">Report settings</h3>
            <Setting label="Runs" value={data.template.runs} />
            <Setting label="Recipients" value={data.template.recipients} />
            <Setting label="Formats" value={data.template.formats} />
            <Setting label="Scope" value={data.template.scope} />
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Switch
                checked={approval}
                onCheckedChange={(value) => {
                  setApproval(value);
                  setDirty(true);
                }}
              />
              Needs approval before each send
            </label>
            <label className="flex items-center gap-2 text-xs text-foreground">
              <Switch
                checked={auto}
                onCheckedChange={(value) => {
                  setAuto(value);
                  setDirty(true);
                }}
              />
              Send automatically (authority level 3)
            </label>
          </Card>
          <Card className="gap-3 p-4">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Add a section</h3>
              <p className="text-xs text-muted-foreground">Every tool the analyst already has. Search, pick, bind.</p>
            </div>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
              <Input
                id="template-add-search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="returns by size…"
                className="pl-8"
              />
            </div>
            <ul className="divide-y divide-border">
              {suggestions.length === 0 ? (
                <li className="py-3 text-xs text-muted-foreground">No tool matches. Describe the section instead — the FTE binds it.</li>
              ) : (
                suggestions.map((suggestion) => (
                  <li key={suggestion.tool} className="flex items-center justify-between gap-3 py-2">
                    <div className="min-w-0">
                      <p className={cn("truncate text-xs", suggestion.fromAsk ? "font-semibold text-foreground" : "font-mono text-foreground")}>
                        {suggestion.fromAsk ? "Describe it instead" : suggestion.tool}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{suggestion.description}</p>
                    </div>
                    <Button
                      size="sm"
                      variant={suggestion.fromAsk ? "default" : "outline"}
                      className={cn(suggestion.fromAsk && "bg-ai text-ai-foreground hover:bg-ai/90")}
                      onClick={() => add(suggestion)}
                    >
                      {suggestion.fromAsk ? "Ask" : "Add"}
                    </Button>
                  </li>
                ))
              )}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Setting({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className={FIELD}>{label}</span>
      <span className="rounded-md border border-border bg-card px-2.5 py-1.5 text-xs text-foreground">{value}</span>
    </div>
  );
}
