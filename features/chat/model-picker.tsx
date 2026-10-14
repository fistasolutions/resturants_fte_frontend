"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Lock, Search } from "lucide-react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useApiQuery } from "@/hooks/use-api-query";
import {
  chatPickerGroups,
  clampTemperature,
  modelLabel,
  temperatureMaxFor,
  type PickerOption,
  filterPickerGroups,
  pinnedPickerOption,
  UNAVAILABLE_LABEL,
} from "@/lib/ai-providers";
import { chatQueries } from "@/lib/queries/chat";
import { cn } from "@/lib/utils";
import type { ChatModelOverride } from "@/types/chat";
import { GlispIcon } from "@/components/shared/glisp-icon";

const TIER_TONE: Record<PickerOption["tier"], string> = {
  premium: "border-primary/30 text-primary",
  balanced: "border-success/30 text-success",
  economy: "border-border text-muted-foreground",
};

interface ModelPickerProps {
  override: ChatModelOverride | null;
  /** Saves the choice on the account (SPEC-266); rejects with the server's reason. */
  onChange: (override: ChatModelOverride | null) => Promise<void> | void;
  disabled?: boolean;
}

/**
 * The composer's model pill (SPEC-238 Patch, owner direction 2026-09-14): sits
 * bottom-left inside the chat input and opens a list of every model in the
 * catalog — grouped by provider, name + tier + one line on what it is for, a lock
 * on providers that have no key yet, a check on what Glisp runs on — with the
 * temperature tucked at the bottom. Since SPEC-266 the choice is the account's:
 * it sticks across chats, the panel and sign-ins until changed; the system
 * default is the first row and clears it.
 */
export function ModelPicker({
  override,
  onChange,
  disabled,
}: ModelPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const models = useApiQuery(chatQueries.models());
  const data = models.data;
  const effectiveModel = override?.model ?? data?.default ?? "";
  const ceiling = data
    ? temperatureMaxFor(effectiveModel, data.temperature_max)
    : 1;
  const temperature = override?.temperature;
  const overridden = Boolean(override?.model || temperature !== undefined);
  const pillLabel = data ? modelLabel(effectiveModel) : "Model";
  const groups = useMemo(() => (data ? chatPickerGroups(data) : []), [data]);
  const visible = useMemo(
    () => filterPickerGroups(groups, query),
    [groups, query],
  );
  const pinned = pinnedPickerOption(groups, override?.model);

  async function save(next: ChatModelOverride | null) {
    setError(null);
    try {
      await onChange(next);
    } catch (failure) {
      setError(
        failure instanceof Error ? failure.message : "Saving the model failed.",
      );
    }
  }

  function choose(id: string | null) {
    if (id === null) {
      void save(temperature === undefined ? null : { temperature });
    } else {
      const nextCeiling = data
        ? temperatureMaxFor(id, data.temperature_max)
        : 1;
      void save({
        model: id,
        ...(temperature !== undefined
          ? { temperature: clampTemperature(temperature, nextCeiling) }
          : {}),
      });
    }
    setOpen(false);
  }

  function setTemperature(value: number) {
    void save({
      ...(override?.model ? { model: override.model } : {}),
      temperature: value,
    });
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={disabled}
          aria-label="Your model"
          className={cn(
            "inline-flex h-7 max-w-full items-center gap-1.5 rounded-md border px-2 text-xs font-medium transition-colors outline-none",
            "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
            overridden
              ? "border-primary/40 bg-primary/5 text-foreground"
              : "border-transparent text-muted-foreground",
          )}
        >
          <GlispIcon className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{pillLabel}</span>
          {temperature !== undefined && (
            <span className="shrink-0 tabular-nums text-muted-foreground">
              · t {temperature}
            </span>
          )}
          <ChevronDown
            className="size-3 shrink-0 text-muted-foreground"
            aria-hidden
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        className="w-88 max-w-[calc(100vw-2rem)] p-0"
      >
        <p className="border-b px-3 py-2.5 text-[11px] leading-snug text-muted-foreground">
          Sets what Glisp runs on{" "}
          <span className="font-medium text-foreground">for you</span> — this
          chat, new chats and the panel — until you change it. Every other agent
          keeps the system default.
        </p>
        {error && (
          <p
            className="border-b bg-destructive/5 px-3 py-2 text-[11px] text-destructive"
            role="alert"
            data-model-error
          >
            {error}
          </p>
        )}

        <div className="border-b px-2 py-1.5">
          <div className="relative">
            <Search
              className="pointer-events-none absolute top-1/2 left-2 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search models — flash, pro, claude…"
              aria-label="Search models"
              className="h-7 w-full rounded-md border border-border bg-background pr-2 pl-7 text-xs outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        </div>

        <div className="scrollbar-subtle max-h-72 overflow-y-auto p-1">
          {models.isPending ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              Loading models…
            </p>
          ) : models.isError || !data ? (
            <p className="px-2 py-3 text-xs text-destructive">
              Couldn&apos;t load the models.
            </p>
          ) : (
            <>
              {pinned && !query ? (
                <div className="mb-1 border-b border-border pb-1">
                  <p className="px-2 pt-1 pb-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    Your choice
                  </p>
                  <Row
                    option={pinned.option}
                    selected
                    onChoose={() => choose(pinned.option.id)}
                  />
                </div>
              ) : null}

              {!query ? (
                <button
                  type="button"
                  role="option"
                  aria-selected={!override?.model}
                  onClick={() => choose(null)}
                  className={cn(
                    "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring outline-none",
                    !override?.model && "bg-accent/60",
                  )}
                >
                  <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center">
                    {!override?.model && (
                      <Check className="size-3 text-success" aria-hidden />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-medium">
                      System default
                      <span className="ml-1.5 text-[11px] font-normal text-muted-foreground">
                        {modelLabel(data.default)}
                      </span>
                    </span>
                    <span className="block text-[10px] leading-snug text-muted-foreground">
                      What every agent uses — set on Integrations.
                    </span>
                  </span>
                </button>
              ) : null}

              {visible.length === 0 ? (
                <p className="px-2 py-3 text-xs text-muted-foreground">
                  No model matches.
                </p>
              ) : null}
              {visible.map((group) => (
                <div key={group.provider} className="mt-1">
                  <p className="px-2 pt-1.5 pb-0.5 text-[10px] font-semibold tracking-widest text-muted-foreground uppercase">
                    {group.label}
                  </p>
                  {group.options.map((option) => (
                    <Row
                      key={option.id}
                      option={option}
                      selected={override?.model === option.id}
                      onChoose={() => choose(option.id)}
                    />
                  ))}
                </div>
              ))}
            </>
          )}
        </div>

        <div className="border-t px-3 py-2.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="chat-temperature"
              className="text-[11px] font-medium"
            >
              Temperature
            </label>
            <span className="text-[11px] tabular-nums text-muted-foreground">
              {temperature === undefined
                ? "provider default"
                : temperature.toFixed(1)}
            </span>
          </div>
          <input
            id="chat-temperature"
            type="range"
            min={0}
            max={ceiling}
            step={0.1}
            value={temperature ?? 0}
            disabled={!data}
            onChange={(event) =>
              setTemperature(
                clampTemperature(Number(event.target.value), ceiling),
              )
            }
            className="mt-1 w-full accent-primary"
            aria-valuetext={
              temperature === undefined
                ? "provider default"
                : String(temperature)
            }
          />
          <div className="mt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>0 · precise</span>
            {overridden ? (
              <button
                type="button"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                }}
                className="font-medium text-foreground underline-offset-2 hover:underline"
              >
                Reset to default
              </button>
            ) : (
              <span>{ceiling} · creative</span>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/** One model on the list — compact (SPEC-238 Patches): name, tier, a one-line blurb;
 * an unavailable one says why and where to fix it, and cannot be chosen. */
function Row({
  option,
  selected,
  onChoose,
}: {
  option: PickerOption;
  selected: boolean;
  onChoose: () => void;
}) {
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      disabled={!option.available}
      onClick={onChoose}
      title={option.available ? option.blurb : UNAVAILABLE_LABEL}
      className={cn(
        "flex w-full items-start gap-2 rounded-md px-2 py-1 text-left transition-colors outline-none",
        option.available
          ? "hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          : "cursor-not-allowed opacity-55",
        selected && "bg-accent/60",
      )}
    >
      <span className="mt-0.5 flex size-3.5 shrink-0 items-center justify-center">
        {selected && <Check className="size-3 text-success" aria-hidden />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-medium">{option.label}</span>
          <span
            className={cn(
              "rounded border px-1 py-px text-[9px] font-medium leading-3",
              TIER_TONE[option.tier],
            )}
          >
            {option.tierLabel}
          </span>
          {!option.available && (
            <span className="inline-flex items-center gap-1 rounded-sm bg-muted px-1 py-px text-[9px] font-medium text-muted-foreground">
              <Lock className="size-2.5" aria-hidden />
              {UNAVAILABLE_LABEL}
            </span>
          )}
        </span>
        <span className="block truncate text-[10px] leading-snug text-muted-foreground">
          {option.blurb}
        </span>
      </span>
    </button>
  );
}
