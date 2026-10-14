"use client";

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { addRecipient, recipientLabel, removeRecipient, toggleRecipient } from "@/lib/report-fte-delivery";
import { cn } from "@/lib/utils";
import type { RecipientOption } from "@/types/report-fte";

/**
 * Who a report goes to (SPEC-335): the chosen addresses as chips, a dropdown of every
 * address the store keeps in Settings (owner, members, shop and location managers, the
 * warehouse/support/returns addresses), and a box for any other address.
 */
export function RecipientPicker({
  id,
  value,
  onChange,
  options,
  loading,
}: {
  id: string;
  value: string[];
  onChange: (next: string[]) => void;
  options: RecipientOption[];
  loading: boolean;
}) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  function commit(text: string) {
    const { next, error: problem } = addRecipient(value, text);
    setError(problem);
    if (!problem) {
      onChange(next);
      setDraft("");
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {value.length > 0 ? (
        <ul className="flex flex-wrap gap-1.5" aria-label="Chosen recipients">
          {value.map((address) => {
            const label = recipientLabel(address, options);
            return (
              <li
                key={address}
                className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 py-0.5 pr-1 pl-2.5 text-xs"
              >
                <span className="truncate">
                  {label ? <span className="font-medium text-foreground">{label} · </span> : null}
                  <span className="text-muted-foreground">{address}</span>
                </span>
                <button
                  type="button"
                  onClick={() => onChange(removeRecipient(value, address))}
                  aria-label={`Remove ${address}`}
                  className="grid size-4 shrink-0 place-items-center rounded-full text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <X className="size-3" aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-xs text-muted-foreground">Nobody yet — choose from Settings or type an address.</p>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Popover>
          <PopoverTrigger asChild>
            <Button type="button" variant="outline" size="sm" className="justify-between sm:w-56" disabled={loading}>
              {loading ? "Loading addresses…" : "Choose from Settings"}
              <ChevronDown className="size-4 opacity-60" aria-hidden />
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-80 p-1">
            {options.length === 0 ? (
              <p className="px-3 py-4 text-sm text-muted-foreground">
                No addresses saved yet. Add managers in Settings → Manager notifications.
              </p>
            ) : (
              <ul className="max-h-72 overflow-y-auto scrollbar-subtle" role="listbox" aria-multiselectable="true">
                {options.map((option) => {
                  const chosen = value.some((a) => a.toLowerCase() === option.email.toLowerCase());
                  return (
                    <li key={option.email} role="option" aria-selected={chosen}>
                      <button
                        type="button"
                        onClick={() => onChange(toggleRecipient(value, option.email))}
                        className="flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm outline-none hover:bg-muted focus-visible:bg-muted"
                      >
                        <span
                          className={cn(
                            "grid size-4 shrink-0 place-items-center rounded border border-border",
                            chosen && "border-primary bg-primary text-primary-foreground",
                          )}
                          aria-hidden
                        >
                          {chosen ? <Check className="size-3" /> : null}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{option.label}</span>
                          <span className="block truncate text-xs text-muted-foreground">{option.email}</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </PopoverContent>
        </Popover>
        <Input
          id={id}
          type="email"
          value={draft}
          placeholder="Or type an address and press Enter"
          aria-invalid={error ? true : undefined}
          onChange={(event) => {
            setError(null);
            const text = event.target.value;
            if (/[,;]$/.test(text)) commit(text);
            else setDraft(text);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              commit(draft);
            }
          }}
          onBlur={() => {
            if (draft.trim()) commit(draft);
          }}
          className="h-8 text-sm"
        />
      </div>
      {error ? (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}
