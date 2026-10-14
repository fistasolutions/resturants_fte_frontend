"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export interface PickerOption {
  scope: string;
  label: string;
}

/** Searchable combobox over scope options (SPEC-034/035) — shared by the
 * report scope pickers and the history filters. */
export function SearchPicker({
  label,
  placeholder,
  options,
  selected,
  onSelect,
}: {
  label: string;
  placeholder: string;
  options: PickerOption[];
  selected: PickerOption | undefined;
  onSelect: (scope: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label={`${label}: ${selected?.label ?? "All"}`}
            className="min-w-40 justify-between font-normal"
          >
            <span className="truncate">{selected?.label ?? "All"}</span>
            <ChevronsUpDown className="size-3.5 shrink-0 opacity-50" aria-hidden />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-64 p-0">
          <Command>
            <CommandInput placeholder={placeholder} />
            <CommandList>
              <CommandEmpty>No match found.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.scope}
                    value={option.label}
                    onSelect={() => {
                      setOpen(false);
                      onSelect(option.scope);
                    }}
                  >
                    <Check
                      className={`size-4 ${
                        option.scope === (selected?.scope ?? "all")
                          ? "opacity-100"
                          : "opacity-0"
                      }`}
                      aria-hidden
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
